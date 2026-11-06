<?php
/**
 * Plugin Name: NOVA Hesap ve Giriş Sistemi
 * Description: NOVA Spor Kompleksi için WordPress/MySQL tabanlı üye ve PT kayıt/giriş sistemi. PT hesapları yönetici onayına bağlıdır.
 * Version: 1.0.0
 * Author: NOVA Spor Kompleksi
 * Text Domain: nova-hesap
 */
if (!defined('ABSPATH')) { exit; }

const NOVA_PORTAL_VERSION = '1.0.0';

function nova_portal_coaches() {
    return array(
        'strength'=>'Mert Yılmaz', 'performance'=>'Zeynep Demir',
        'mobility'=>'Kerem Kaya', 'personal'=>'Elif Arslan',
        'derya'=>'Derya Akın', 'can'=>'Can Ersoy',
        'ece'=>'Ece Tan', 'bora'=>'Bora Akgün',
    );
}
function nova_portal_roles() {
    if (!get_role('nova_pt')) {
        add_role('nova_pt', 'NOVA PT Eğitmeni', array('read'=>true));
    }
}
// Theme integration: role is registered on init; no plugin activation hook.
add_action('init', 'nova_portal_roles');

function nova_portal_is_pt($user = null) {
    if (!$user) { $user = wp_get_current_user(); }
    return ($user instanceof WP_User) && in_array('nova_pt', (array)$user->roles, true)
        && get_user_meta($user->ID, 'nova_pt_status', true) === 'approved';
}
function nova_portal_rate_limit($action, $max, $period) {
    // Fail closed for abusive requests; limit only on server-controlled address.
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string)$_SERVER['REMOTE_ADDR'] : 'unknown';
    $key = 'nova_portal_' . md5($action . '|' . $ip);
    $count = (int)get_transient($key);
    if ($count >= $max) { return false; }
    set_transient($key, $count+1, $period);
    return true;
}
function nova_portal_require_ajax() {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_send_json_error(array('message'=>'İstek yöntemi geçersiz.'), 405);
    }
    if (!check_ajax_referer('nova_portal_action', 'nonce', false)) {
        wp_send_json_error(array('message'=>'Oturum güvenlik süresi doldu. Sayfayı yenileyip tekrar dene.'), 403);
    }
}
function nova_portal_field($name) {
    return (isset($_POST[$name]) && is_string($_POST[$name])) ? wp_unslash($_POST[$name]) : '';
}

add_action('wp_ajax_nopriv_nova_portal_register', 'nova_portal_register');
function nova_portal_register() {
    nova_portal_require_ajax();
    if (is_user_logged_in()) { wp_send_json_error(array('message'=>'Önce mevcut oturumdan çıkış yap.'), 400); }
    if (!nova_portal_rate_limit('register', 5, HOUR_IN_SECONDS)) {
        wp_send_json_error(array('message'=>'Çok fazla kayıt denemesi. Daha sonra tekrar dene.'), 429);
    }
    if (nova_portal_field('website') !== '') { wp_send_json_error(array('message'=>'İstek reddedildi.'),400); }
    if (nova_portal_field('consent') !== '1') {
        wp_send_json_error(array('message'=>'Aydınlatma ve veri işleme onayını işaretle.'),400);
    }
    $name = sanitize_text_field(nova_portal_field('name'));
    $email = sanitize_email(nova_portal_field('email'));
    $password = nova_portal_field('password');
    $confirm = nova_portal_field('confirm');
    $requested = sanitize_key(nova_portal_field('account_type'));
    $coach = sanitize_key(nova_portal_field('coach'));
    if ((function_exists('mb_strlen')?mb_strlen($name):strlen($name))<3 || (function_exists('mb_strlen')?mb_strlen($name):strlen($name))>90 || !is_email($email) || strlen($email)>190) {
        wp_send_json_error(array('message'=>'Geçerli ad soyad ve e-posta adresi gir.'),400);
    }
    if (!in_array($requested, array('member','pt'),true)) {
        wp_send_json_error(array('message'=>'Üye veya PT başvurusu seç.'),400);
    }
    if ($requested==='pt' && !isset(nova_portal_coaches()[$coach])) {
        wp_send_json_error(array('message'=>'PT başvurusu için ilgili antrenör profilini seç.'),400);
    }
    if (strlen($password)<10 || strlen($password)>256 || $password!==$confirm) {
        wp_send_json_error(array('message'=>'En az 10 karakterli ve doğrulaması eşleşen parola gir.'),400);
    }
    if (email_exists($email)) {
        wp_send_json_error(array('message'=>'Bu e-posta zaten kayıtlı. Giriş yapmayı veya şifre sıfırlamayı dene.'),409);
    }
    $prefix = sanitize_user(strstr($email, '@', true), true);
    if (!$prefix) { $prefix = 'nova-uye'; }
    $prefix = substr($prefix,0,32);
    $login = $prefix;
    for ($i=0; username_exists($login) && $i<15; $i++) {
        $login=substr($prefix,0,28).'-'.wp_rand(1000,9999);
    }
    if (username_exists($login)) { wp_send_json_error(array('message'=>'Kullanıcı adı oluşturulamadı. Tekrar dene.'),500); }
    $id = wp_insert_user(array(
        'user_login'=>$login, 'user_email'=>$email, 'user_pass'=>$password,
        'display_name'=>$name, 'first_name'=>$name,
        'role'=>'subscriber', 'show_admin_bar_front'=>'false',
    ));
    if (is_wp_error($id)) {
        wp_send_json_error(array('message'=>'Kayıt oluşturulamadı: '. $id->get_error_message()),400);
    }
    update_user_meta($id,'nova_account_kind',$requested);
    if ($requested==='pt') {
        update_user_meta($id,'nova_pt_status','pending');
        update_user_meta($id,'nova_pt_requested_coach',$coach);
        $admin = sanitize_email(get_option('admin_email'));
        if (is_email($admin)) {
            wp_mail($admin, 'NOVA: Yeni PT eğitmeni başvurusu',
                "Yeni PT başvurusu: {$name}\nE-posta: {$email}\nTalep edilen profil: ".nova_portal_coaches()[$coach]."\n\nOnay için WordPress > NOVA PT Onayları sayfasını açın.");
        }
    }
    // Only a subscriber session is issued, even for PT applications. No role escalation.
    wp_set_current_user($id);
    wp_set_auth_cookie($id, true, is_ssl());
    do_action('wp_login',$login,get_user_by('id',$id));
    wp_send_json_success(array('message'=>$requested==='pt'
        ? 'PT başvurun kaydedildi. Yönetici onayından sonra PT panelini kullanabileceksin.'
        : 'Üyeliğin oluşturuldu. Hoş geldin!', 'reload'=>true));
}

add_action('wp_ajax_nopriv_nova_portal_login','nova_portal_login');
function nova_portal_login() {
    nova_portal_require_ajax();
    if (!nova_portal_rate_limit('login', 10, 15*MINUTE_IN_SECONDS)) {
        wp_send_json_error(array('message'=>'Çok sayıda giriş denemesi. 15 dakika sonra tekrar dene.'),429);
    }
    $identifier=trim(nova_portal_field('identifier'));
    $password=nova_portal_field('password');
    if (!$identifier || !$password || strlen($identifier)>190 || strlen($password)>256) {
        wp_send_json_error(array('message'=>'E-posta/kullanıcı adı ve parolanı gir.'),400);
    }
    $login=$identifier;
    if (is_email($identifier)) {
        $u=get_user_by('email',sanitize_email($identifier));
        if ($u) { $login=$u->user_login; }
    }
    $user=wp_signon(array('user_login'=>$login,'user_password'=>$password,'remember'=>nova_portal_field('remember')==='1'),is_ssl());
    if (is_wp_error($user)) { wp_send_json_error(array('message'=>'E-posta/kullanıcı adı veya parola hatalı.'),401); }
    wp_set_current_user($user->ID);
    wp_send_json_success(array('message'=>'Giriş başarılı. Panelin açılıyor.','reload'=>true));
}
add_action('wp_ajax_nova_portal_logout','nova_portal_logout');
function nova_portal_logout() {
    nova_portal_require_ajax();
    wp_logout();
    wp_send_json_success(array('message'=>'Çıkış yapıldı.','reload'=>true));
}
add_action('wp_ajax_nova_portal_profile','nova_portal_profile');
function nova_portal_profile() {
    nova_portal_require_ajax();
    if (!is_user_logged_in()) { wp_send_json_error(array('message'=>'Giriş gerekli.'),401); }
    $name=sanitize_text_field(nova_portal_field('name'));
    if ((function_exists('mb_strlen')?mb_strlen($name):strlen($name))<3 || (function_exists('mb_strlen')?mb_strlen($name):strlen($name))>90) {
        wp_send_json_error(array('message'=>'Ad soyad 3–90 karakter olmalı.'),400);
    }
    $r=wp_update_user(array('ID'=>get_current_user_id(),'display_name'=>$name));
    if (is_wp_error($r)) { wp_send_json_error(array('message'=>'Profil güncellenemedi.'),500); }
    wp_send_json_success(array('message'=>'Ad soyad güncellendi.','reload'=>true));
}

// Link new WordPress-backed requests to the currently signed-in member's ID.
// The existing NOVA request handler passes author=0, so this filter sets its author.
add_filter('wp_insert_post_data',function($data,$postarr){
    if (($data['post_type']??'')==='nova_request' &&
        isset($_REQUEST['action']) && $_REQUEST['action']==='nova_submit_request' && is_user_logged_in()) {
        $data['post_author']=(int)get_current_user_id();
    }
    return $data;
},20,2);

function nova_portal_my_requests($uid) {
    if (!post_type_exists('nova_request')) { return array(); }
    return get_posts(array('post_type'=>'nova_request','post_status'=>'private',
        'numberposts'=>20,'author'=>(int)$uid,'orderby'=>'date','order'=>'DESC'));
}
function nova_portal_assigned_requests($coach_key) {
    if (!post_type_exists('nova_request') || !isset(nova_portal_coaches()[$coach_key])) { return array(); }
    $all=get_posts(array('post_type'=>'nova_request','post_status'=>'private',
        'numberposts'=>100,'meta_key'=>'_nova_request_type','meta_value'=>'pt','orderby'=>'date','order'=>'DESC'));
    $name=nova_portal_coaches()[$coach_key];
    return array_values(array_filter($all, function($post) use ($name) {
        $d=get_post_meta($post->ID,'_nova_request_details',true);
        return is_array($d) && ($d['Antrenör']??'')===$name;
    }));
}
function nova_portal_request_list($requests,$coach=false) {
    if (!$requests) { return '<p class="nova-portal-muted">Henüz kayıtlı başvuru bulunmuyor. Giriş yaptıktan sonra yeni talep oluşturabilirsin.</p>'; }
    $status_names=array('pending'=>'İnceleniyor','contacted'=>'İletişime geçildi','approved'=>'Yönetici onayladı','cancelled'=>'İptal edildi');
    $html='<div class="nova-portal-requests">';
    foreach ($requests as $r) {
        $type=get_post_meta($r->ID,'_nova_request_type',true);
        $details=get_post_meta($r->ID,'_nova_request_details',true);
        $status=get_post_meta($r->ID,'_nova_request_status',true);
        $labels=array('pt'=>'PT Randevu Talebi','member'=>'Üyelik Başvurusu','room'=>'Salon Kiralama','lesson'=>'Grup Dersi');
        $desc=is_array($details) ? implode(' · ',array_map('strval',array_slice($details,0,4,true))) : '';
        $html.='<article class="nova-portal-request"><div class="nova-portal-request-top"><strong>'.esc_html($labels[$type]??'Başvuru').' #'.esc_html($r->ID).'</strong><span>'.esc_html($status_names[$status]??'İnceleniyor').'</span></div>';
        $html.='<small>'.esc_html($desc).'</small>';
        if ($coach && in_array($status,array('pending','contacted'),true)) {
            $html.='<button type="button" class="nova-portal-mini" data-nova-pt-contact="'.esc_attr($r->ID).'">İLETİŞİME GEÇİLDİ OLARAK İŞARETLE</button>';
        }
        $html.='</article>';
    }
    return $html.'</div>';
}
add_action('wp_ajax_nova_portal_pt_contact','nova_portal_pt_contact');
function nova_portal_pt_contact(){
    nova_portal_require_ajax();
    $user=wp_get_current_user();
    if (!nova_portal_is_pt($user)) { wp_send_json_error(array('message'=>'PT eğitmeni yetkisi gerekli.'),403); }
    $coach=get_user_meta($user->ID,'nova_pt_coach_key',true);
    $id=absint(nova_portal_field('request_id'));
    $post=get_post($id);
    if (!$post || $post->post_type!=='nova_request' || $post->post_status!=='private'
        || get_post_meta($id,'_nova_request_type',true)!=='pt') {
        wp_send_json_error(array('message'=>'Başvuru bulunamadı.'),404);
    }
    $details=get_post_meta($id,'_nova_request_details',true);
    if (!isset(nova_portal_coaches()[$coach]) || !is_array($details) ||
        ($details['Antrenör']??'')!==nova_portal_coaches()[$coach]) {
        wp_send_json_error(array('message'=>'Bu başvuru sana atanmadı.'),403);
    }
    $status=get_post_meta($id,'_nova_request_status',true);
    if (!in_array($status,array('pending','contacted'),true)) {
        wp_send_json_error(array('message'=>'Bu başvurunun durumu PT tarafından değiştirilemez.'),409);
    }
    update_post_meta($id,'_nova_request_status','contacted');
    wp_send_json_success(array('message'=>'İletişime geçildi olarak işaretlendi. Randevu henüz kesin olarak onaylanmadı.','reload'=>true));
}

function nova_portal_admin_url(){ return admin_url('users.php?page=nova-pt-onay'); }
add_action('admin_menu',function(){
    add_users_page('NOVA PT Onayları','NOVA PT Onayları','promote_users','nova-pt-onay','nova_portal_admin_screen');
});
function nova_portal_admin_screen(){
    if (!current_user_can('promote_users')) { wp_die('Yetkisiz işlem.'); }
    $users=get_users(array('number'=>200,'meta_key'=>'nova_account_kind','meta_value'=>'pt','orderby'=>'registered','order'=>'DESC'));
    echo '<div class="wrap"><h1>NOVA — PT Eğitmeni Başvuruları</h1><p>PT yetkisi yalnızca yönetici tarafından onaylanır. Rol atamadan önce kişinin kimliğini ve eğitim/sertifika belgelerini kontrol edin.</p>';
    if (isset($_GET['nova_status'])) { echo '<div class="notice notice-success"><p>PT başvurusu güncellendi.</p></div>'; }
    echo '<table class="widefat striped"><thead><tr><th>Başvuran</th><th>E-posta</th><th>İstenen antrenör</th><th>Durum</th><th>Karar</th></tr></thead><tbody>';
    foreach ($users as $u){
        $status=get_user_meta($u->ID,'nova_pt_status',true);
        $requested=get_user_meta($u->ID,'nova_pt_requested_coach',true);
        $approved=get_user_meta($u->ID,'nova_pt_coach_key',true);
        echo '<tr><td>'.esc_html($u->display_name).'</td><td>'.esc_html($u->user_email).'</td><td>'.esc_html(nova_portal_coaches()[$requested]??'—').'</td><td>'.esc_html($status?:'—').'</td><td>';
        echo '<form method="post" action="'.esc_url(admin_url('admin-post.php')).'">';
        echo '<input type="hidden" name="action" value="nova_portal_review_pt"><input type="hidden" name="user_id" value="'.esc_attr($u->ID).'">';
        wp_nonce_field('nova_portal_review_'.$u->ID,'nova_review_nonce');
        echo '<label for="nova-coach-'.esc_attr($u->ID).'">Bağlanacak profil </label><select id="nova-coach-'.esc_attr($u->ID).'" name="coach">';
        foreach(nova_portal_coaches() as $key=>$name) echo '<option value="'.esc_attr($key).'" '.selected(($approved?:$requested),$key,false).'>'.esc_html($name).'</option>';
        echo '</select> <button class="button button-primary" type="submit" name="decision" value="approve">Onayla</button> <button class="button" type="submit" name="decision" value="reject">Reddet</button></form>';
        echo '</td></tr>';
    }
    if(!$users) echo '<tr><td colspan="5">Henüz PT başvurusu yok.</td></tr>';
    echo '</tbody></table></div>';
}
add_action('admin_post_nova_portal_review_pt',function(){
    if (!current_user_can('promote_users')) { wp_die('Bu işlem için yetkiniz yok.',403); }
    $id=isset($_POST['user_id'])?absint($_POST['user_id']):0;
    check_admin_referer('nova_portal_review_'.$id,'nova_review_nonce');
    $u=get_user_by('id',$id);
    if(!$u || get_user_meta($id,'nova_account_kind',true)!=='pt' || in_array('administrator',(array)$u->roles,true)) {
        wp_die('Başvuru bulunamadı.',400);
    }
    $decision=isset($_POST['decision'])?sanitize_key(wp_unslash($_POST['decision'])):'';
    $coach=isset($_POST['coach'])?sanitize_key(wp_unslash($_POST['coach'])):'';
    if($decision==='approve'){
        if (!isset(nova_portal_coaches()[$coach])) { wp_die('Geçersiz profil.',400); }
        $already=get_users(array('role'=>'nova_pt','meta_key'=>'nova_pt_coach_key','meta_value'=>$coach,'exclude'=>array($id),'fields'=>'ID','number'=>1));
        if($already) { wp_die('Bu antrenör profili zaten onaylı bir PT hesabına bağlı. Önce eski hesabı düzenleyin.',409); }
        $u->set_role('nova_pt');
        update_user_meta($id,'nova_pt_status','approved');
        update_user_meta($id,'nova_pt_coach_key',$coach);
    } elseif($decision==='reject'){
        $u->set_role('subscriber');
        update_user_meta($id,'nova_pt_status','rejected');
        delete_user_meta($id,'nova_pt_coach_key');
    } else wp_die('Geçersiz karar.',400);
    wp_safe_redirect(add_query_arg('nova_status','ok',nova_portal_admin_url()));exit;
});

function nova_portal_dashboard(){
    $u=wp_get_current_user();
    $is_admin=current_user_can('manage_options');
    $is_pt=nova_portal_is_pt($u);
    $requested_pt=get_user_meta($u->ID,'nova_account_kind',true)==='pt';
    $pt_status=get_user_meta($u->ID,'nova_pt_status',true);
    $type=$is_admin?'YÖNETİCİ':($is_pt?'PT EĞİTMENİ':($requested_pt?'PT BAŞVURUSU':'ÜYE'));
    $out='<div class="nova-portal-dashhead"><div><span class="nova-portal-overline">'.esc_html($type).' / HESAP PANELİ</span><h3>Merhaba, '.esc_html($u->display_name).'</h3><p>'.esc_html($u->user_email).'</p></div><button type="button" data-nova-logout class="nova-portal-outline">ÇIKIŞ YAP ↗</button></div>';
    if ($is_admin){
        $pending=get_users(array('meta_key'=>'nova_pt_status','meta_value'=>'pending','fields'=>'ID','number'=>999));
        $out.='<div class="nova-portal-stat-row"><div><strong>'.count($pending).'</strong><span>PT ONAYI BEKLİYOR</span></div><div><strong>'.count_users()['total_users'].'</strong><span>WORDPRESS HESABI</span></div></div>';
        $out.='<p>Yönetici hesabınla başvuru, PT onayı ve üye kayıtlarını WordPress panelinden yönetebilirsin.</p><div class="nova-portal-links"><a href="'.esc_url(nova_portal_admin_url()).'">PT BAŞVURULARINI YÖNET ↗</a><a href="'.esc_url(admin_url('users.php')).'">ÜYELERİ GÖR ↗</a><a href="'.esc_url(admin_url('edit.php?post_type=nova_request')).'">RANDEVU / ÜYELİK TALEPLERİ ↗</a></div>';
    }elseif($is_pt){
        $key=get_user_meta($u->ID,'nova_pt_coach_key',true);
        $out.='<p><strong>Bağlı antrenör profili:</strong> '.esc_html(nova_portal_coaches()[$key]??'Atanmadı').'</p><p class="nova-portal-muted">İşaretleyeceğin talepler yönetici onayı olmadan kesin rezervasyon sayılmaz.</p>';
        $out.=nova_portal_request_list(nova_portal_assigned_requests($key),true);
    }else{
        if($requested_pt){$out.='<p class="nova-portal-pt-state">PT başvuru durumun: <strong>'.esc_html($pt_status==='rejected'?'İnceleme olumsuz':($pt_status==='pending'?'Yönetici onayı bekleniyor':'Üye hesabı')).'</strong>. Onaylanmadan PT yetkileri açılmaz.</p>';}
        $out.='<div class="nova-portal-links"><a href="#/antrenorler">PT RANDEVUSU AL ↗</a><a href="#/dersler">GRUP DERSLERİNİ GÖR ↗</a><a href="#/uyelikler" data-nova-go-prices>ÜYELİK PAKETLERİ ↗</a></div>';
        $out.='<h4>BAŞVURULARIM</h4>'.nova_portal_request_list(nova_portal_my_requests($u->ID));
        $out.='<form id="nova-portal-profile" class="nova-portal-profile"><label for="nova-portal-profile-name">Ad soyad</label><div><input id="nova-portal-profile-name" name="name" value="'.esc_attr($u->display_name).'" minlength="3" maxlength="90" required><button type="submit">PROFİLİ GÜNCELLE</button></div></form>';
    }
    return $out;
}

function nova_portal_shortcode(){
    static $rendered=false;
    $rendered=true;
    ob_start();
    ?>
    <section class="nova-portal" id="nova-portal" aria-labelledby="nova-portal-title">
      <div class="nova-portal-hero"><span class="nova-portal-overline">NOVA / ÜYELİK & HESAP</span><h2 id="nova-portal-title">HEDEFİN SENİN.<br><em>HESABIN DA ÖYLE.</em></h2><p>Tek giriş ekranı, üç ayrı deneyim. Müşteri, PT eğitmeni veya yönetici olarak hesabına güvenle ulaş.</p><div class="nova-portal-chiprow"><span>WORDPRESS KULLANICI HESABI</span><span>ROL BAZLI PANEL</span><span>GÜVENLİ OTURUM</span></div></div>
      <div class="nova-portal-content">
        <?php if(!is_user_logged_in()): ?>
        <div class="nova-portal-grid">
          <div class="nova-portal-intro"><div class="nova-portal-symbol">N</div><h3>NOVA'YA<br>HOŞ GELDİN.</h3><p>İster yeni üye ol, ister PT eğitmenliği için başvur. Yönetici hesabın varsa aynı giriş ekranını kullan.</p><div class="nova-portal-benefit">✓ Üyelik ve randevu taleplerini takip et</div><div class="nova-portal-benefit">✓ PT başvurusu için yönetici onayı</div><div class="nova-portal-benefit">✓ Hesaplar WordPress veritabanında tutulur</div></div>
          <div class="nova-portal-formbox">
            <div class="nova-portal-tabs" role="tablist" aria-label="Hesap işlemi"><button type="button" data-nova-portal-tab="login" role="tab" aria-selected="true" class="active">GİRİŞ YAP</button><button type="button" data-nova-portal-tab="register" role="tab" aria-selected="false">ÜYE OL</button></div>
            <form id="nova-portal-login" class="nova-portal-form" autocomplete="on">
              <h3>TEKRAR HOŞ GELDİN.</h3><p>Üye, PT ve yönetici aynı ekrandan giriş yapar.</p>
              <label>E-posta veya kullanıcı adı<input name="identifier" autocomplete="username" maxlength="190" required placeholder="E-posta adresin"></label>
              <label>Parola<span class="nova-portal-password"><input name="password" type="password" autocomplete="current-password" required placeholder="Parolan"><button type="button" data-nova-show-pass aria-label="Parolayı göster">GÖSTER</button></span></label>
              <label class="nova-portal-inline"><input type="checkbox" name="remember" value="1"> Beni hatırla</label>
              <button type="submit" class="nova-portal-submit">GİRİŞ YAP <span>↗</span></button>
              <a class="nova-portal-forgot" href="<?php echo esc_url(wp_lostpassword_url()); ?>">Şifremi unuttum</a>
            </form>
            <form id="nova-portal-register" class="nova-portal-form" autocomplete="on" hidden>
              <h3>YENİ HESABINI AÇ.</h3><p>Bilgilerini doldur. PT başvuruları yönetici onayına gönderilir.</p>
              <label>Ad soyad<input name="name" autocomplete="name" minlength="3" maxlength="90" required placeholder="Adın Soyadın"></label>
              <label>E-posta<input name="email" type="email" autocomplete="email" maxlength="190" required placeholder="ornek@eposta.com"></label>
              <fieldset class="nova-portal-type"><legend>Hesap türün</legend><label><input type="radio" name="account_type" value="member" checked> <span>ÜYE / MÜŞTERİ</span></label><label><input type="radio" name="account_type" value="pt"> <span>PT EĞİTMENİ BAŞVURUSU</span></label></fieldset>
              <label class="nova-portal-coach-field" hidden>Başvurduğun eğitmen profili<select name="coach"><option value="">Profil seç</option><?php foreach(nova_portal_coaches() as $key=>$name): ?><option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($name); ?></option><?php endforeach; ?></select></label>
              <label>Parola (en az 10 karakter)<span class="nova-portal-password"><input name="password" type="password" autocomplete="new-password" minlength="10" required placeholder="Güçlü bir parola"><button type="button" data-nova-show-pass aria-label="Parolayı göster">GÖSTER</button></span></label>
              <label>Parola tekrar<input name="confirm" type="password" autocomplete="new-password" minlength="10" required placeholder="Parolayı tekrar yaz"></label>
              <label class="nova-portal-inline"><input type="checkbox" name="consent" value="1" required> Kayıt ve iletişim amacıyla verilerimin işlenmesini kabul ediyorum.</label>
              <input type="text" name="website" tabindex="-1" autocomplete="off" class="nova-portal-hp" aria-hidden="true">
              <button type="submit" class="nova-portal-submit">HESAP OLUŞTUR <span>↗</span></button>
              <p class="nova-portal-small">PT başvurusu doğrudan eğitmen yetkisi vermez. Yönetici değerlendirmesinden sonra etkinleşir.</p>
            </form>
          </div>
        </div>
        <?php else: ?>
        <div class="nova-portal-dashboard"><?php echo nova_portal_dashboard(); // Escaped by renderer. ?></div>
        <?php endif; ?>
        <p class="nova-portal-alert" id="nova-portal-alert" role="status" aria-live="polite" hidden></p>
      </div>
    </section>
    <?php
    return ob_get_clean();
}
add_shortcode('nova_hesap_sistemi','nova_portal_shortcode');

// Plug-and-play integration with the existing NOVA theme. No menu-order or layout edits.
add_action('wp_footer',function(){
    if (is_admin() || strpos(wp_get_theme()->get('Name'),'NOVA')===false) { return; }
    echo '<div id="nova-portal-mount">'.do_shortcode('[nova_hesap_sistemi]').'</div>';
},8);
add_action('wp_enqueue_scripts',function(){
    wp_enqueue_style('nova-hesap',get_template_directory_uri().'/assets/nova-hesap.css',array(),NOVA_PORTAL_VERSION);
    wp_enqueue_script('nova-hesap',get_template_directory_uri().'/assets/js/nova-hesap.js',array(),NOVA_PORTAL_VERSION,true);
    wp_add_inline_script('nova-hesap', 'window.NOVA_PORTAL = '.wp_json_encode(array(
        'ajax'=>admin_url('admin-ajax.php'), 'nonce'=>wp_create_nonce('nova_portal_action'),
    )).';','before');
});
