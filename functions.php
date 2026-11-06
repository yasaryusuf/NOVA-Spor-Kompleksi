<?php
/** NOVA Spor Kompleksi theme support and AJAX contact mail. */
if (!defined('ABSPATH')) { exit; }


/** WordPress native pages for individual NOVA sections. Existing pages are never overwritten. */
function nova_section_slugs() {
    return array('hakkimizda'=>'Hakkımızda','programlar'=>'Programlar','tesis'=>'Tesis','antrenorler'=>'Antrenörler','uyelikler'=>'Üyelikler','dersler'=>'Dersler','rotani-bul'=>'Rotanı Bul','beslenme'=>'Beslenme Rotası','blog'=>'Spor Günlüğü','sss'=>'Sık Sorulan Sorular','iletisim'=>'İletişim','envato'=>'Tema Satışı');
}
function nova_section_url($id) {
    $id = (string) $id;
    if ($id === 'anasayfa' || $id === '') return home_url('/');
    if ($id === 'ders-programi') $id = 'dersler';
    if (!array_key_exists($id, nova_section_slugs())) return home_url('/');
    $page = get_page_by_path($id, OBJECT, 'page');
    if ($page && $page->post_status === 'publish') return get_permalink($page);
    return add_query_arg('pagename',$id,home_url('/'));
}
function nova_is_current_section($id) {
    if ($id === 'anasayfa') return is_front_page();
    if ($id === 'ders-programi') $id='dersler';
    return is_page($id);
}
function nova_install_pages() {
    if (!current_user_can('manage_options')) return;
    if (get_option('nova_installed_pages_v6') === '1') return;
    foreach (nova_section_slugs() as $slug => $title) {
        if (!get_page_by_path($slug, OBJECT, 'page')) {
            wp_insert_post(array('post_type'=>'page','post_status'=>'publish','post_name'=>$slug,'post_title'=>$title,'post_content'=>''), true);
        }
    }
    update_option('nova_installed_pages_v6','1');
}
add_action('admin_init','nova_install_pages');
add_action('after_switch_theme','nova_install_pages');

add_action('after_setup_theme', function() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('custom-logo');
    add_theme_support('editor-styles');
    add_theme_support('wp-block-styles');
    add_theme_support('html5', array('comment-list','comment-form','search-form','gallery','caption','style','script'));
});

function nova_theme_assets() {
    $ver = '5.0.0';
    wp_enqueue_style('nova-spor-theme', get_stylesheet_uri(), array(), $ver);
    $sections = nova_section_slugs();
    $slug = is_front_page() ? 'anasayfa' : (is_page() ? get_post_field('post_name',get_queried_object_id()) : 'anasayfa');
    if (!array_key_exists($slug,$sections) && $slug!=='anasayfa') $slug='anasayfa';
    $paths=array('anasayfa'=>home_url('/'));
    foreach($sections as $id=>$title) $paths[$id]=nova_section_url($id);
    $images=get_template_directory_uri().'/assets/img/';
    $config=array(
        'ajaxUrl'=>admin_url('admin-ajax.php'),
        'nonce'=>wp_create_nonce('nova_mail_info_nonce'),
        'contactUrl'=>nova_section_url('iletisim'),
        'requestNonce'=>wp_create_nonce('nova_submit_request_nonce'),
        'programPhotos'=>array(),
        'prices'=>array(
            'basic'=>array('name'=>'BAŞLANGIÇ','month'=>(int)get_theme_mod('nova_price_basic_month',1299),'quarter'=>(int)get_theme_mod('nova_price_basic_quarter',3499)),
            'performance'=>array('name'=>'PERFORMANS','month'=>(int)get_theme_mod('nova_price_performance_month',1899),'quarter'=>(int)get_theme_mod('nova_price_performance_quarter',5099)),
            'elite'=>array('name'=>'ELİT','month'=>(int)get_theme_mod('nova_price_elite_month',2799),'quarter'=>(int)get_theme_mod('nova_price_elite_quarter',7499)),
        ),
    );
    wp_enqueue_script('nova-router',get_template_directory_uri().'/assets/js/router.js',array(),$ver,true);
    wp_add_inline_script('nova-router','window.novaConfig = '.wp_json_encode($config).'; window.novaWp = '.wp_json_encode(array('current'=>$slug,'paths'=>$paths)).';','before');
    wp_enqueue_script('nova-app',get_template_directory_uri().'/assets/js/app.js',array('nova-router'),$ver,true);
    wp_enqueue_script('nova-route',get_template_directory_uri().'/assets/js/rotani-bul.js',array('nova-app'),$ver,true);
    wp_enqueue_script('nova-nutrition',get_template_directory_uri().'/assets/js/beslenme.js',array('nova-route'),$ver,true);
    wp_enqueue_script('nova-requests',get_template_directory_uri().'/assets/js/nova-requests.js',array('nova-nutrition'),$ver,true);
    wp_enqueue_script('nova-accessibility',get_template_directory_uri().'/assets/js/accessibility.js',array('nova-requests'),$ver,true);
    wp_enqueue_script('nova-envato',get_template_directory_uri().'/assets/js/envato.js',array('nova-accessibility'),$ver,true);
    wp_enqueue_script('nova-ui-bridge',get_template_directory_uri().'/assets/js/ui-bridge.js',array('nova-envato'),$ver,true);
}
add_action('wp_enqueue_scripts','nova_theme_assets');

function nova_theme_customizer($wp_customize) {
    $wp_customize->add_section('nova_settings',array('title'=>'NOVA Site ve E-posta Ayarları','priority'=>35));
    $fields = array(
        'nova_hero_lead' => array('type'=>'textarea','label'=>'Ana sayfa giriş açıklaması','default'=>'Gücünü keşfet, rutinini kur, kendine yeni bir hedef belirle. Modern antrenman alanları ve farklı seviyelere uygun programlarla harekete geç.'),
        'nova_about_lead' => array('type'=>'textarea','label'=>'Hakkımızda giriş açıklaması','default'=>'NOVA, gelişimi tesadüfe bırakmayanlar için tasarlanan çağdaş bir antrenman kültürünün adıdır.'),
        'nova_contact_lead' => array('type'=>'textarea','label'=>'İletişim giriş açıklaması','default'=>'Bir program seçmek, üyelikleri öğrenmek ya da bir deneme dersi hakkında bilgi almak mı istiyorsun? İlk adım bir konuşmayla başlar.'),
        'nova_contact_recipient' => array('type'=>'email','label'=>'Başvuruların gönderileceği e-posta','default'=>'','description'=>'Boş bırakılırsa Ayarlar → Genel altındaki WordPress yönetici e-postası kullanılır.'),
    );
    foreach ($fields as $id=>$f) {
        $wp_customize->add_setting($id,array('default'=>$f['default'],'sanitize_callback'=>$f['type']==='email'?'sanitize_email':'sanitize_textarea_field'));
        $wp_customize->add_control($id,array('type'=>$f['type'],'section'=>'nova_settings','label'=>$f['label'],'description'=>$f['description']??''));
    }
    foreach(array(
        'basic'=>array('BAŞLANGIÇ',1299,3499),
        'performance'=>array('PERFORMANS',1899,5099),
        'elite'=>array('ELİT',2799,7499)
    ) as $key=>$spec) {
        foreach(array('month'=>array('Aylık fiyat',$spec[1]),'quarter'=>array('3 aylık toplam fiyat',$spec[2])) as $suffix=>$pair) {
            $id='nova_price_'.$key.'_'.$suffix;
            $wp_customize->add_setting($id,array('default'=>$pair[1],'sanitize_callback'=>'absint'));
            $wp_customize->add_control($id,array('type'=>'number','section'=>'nova_settings','label'=>$spec[0].' — '.$pair[0],'input_attrs'=>array('min'=>0,'step'=>1)));
        }
    }
}
add_action('customize_register','nova_theme_customizer');

/** AJAX action for guests and logged-in users. Never call email on raw typing. */
add_action('wp_ajax_nopriv_nova_send_info_request','nova_handle_info_request');
add_action('wp_ajax_nova_send_info_request','nova_handle_info_request');

function nova_handle_info_request() {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        wp_send_json_error(array('message'=>'Geçersiz istek.'),405);
    }
    if (!check_ajax_referer('nova_mail_info_nonce','nonce',false)) {
        wp_send_json_error(array('message'=>'Güvenlik kontrolünün süresi doldu. Sayfayı yenileyip tekrar dene.'),403);
    }
    if (!empty($_POST['website'])) {
        wp_send_json_error(array('message'=>'Başvuru alınamadı.'),400);
    }
    $consent=isset($_POST['consent']) ? sanitize_text_field(wp_unslash($_POST['consent'])) : '';
    if ($consent !== '1') {
        wp_send_json_error(array('message'=>'Bilgilendirme ve veri işleme onayını işaretlemelisin.'),400);
    }
    $name=isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
    $email=isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    $phone=isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
    $interest=isset($_POST['interest']) ? sanitize_text_field(wp_unslash($_POST['interest'])) : '';
    $message=isset($_POST['message']) ? sanitize_textarea_field(wp_unslash($_POST['message'])) : '';
    if (strlen($name) < 3 || strlen($name) > 200 || !is_email($email) || strlen($email) > 190 || strlen($interest) < 2 || strlen($interest) > 200 || strlen($phone) > 50 || strlen($message) > 6000) {
        wp_send_json_error(array('message'=>'Lütfen adını, geçerli e-posta adresini ve başvuru konusunu kontrol et.'),400);
    }

    // Conservative throttling. Only use REMOTE_ADDR, never untrusted forwarding headers.
    $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : 'unknown';
    $key_ip = 'nova_mail_ip_' . md5($ip);
    $key_email = 'nova_mail_to_' . md5(strtolower($email));
    if (get_transient($key_ip) || get_transient($key_email)) {
        wp_send_json_error(array('message'=>'Kısa süre önce bir talep gönderildi. Lütfen birkaç dakika sonra tekrar dene.'),429);
    }

    $recipient=sanitize_email(get_theme_mod('nova_contact_recipient',''));
    if (!is_email($recipient)) { $recipient=sanitize_email(get_option('admin_email')); }
    if (!is_email($recipient)) {
        wp_send_json_error(array('message'=>'Site yöneticisinin e-posta ayarı eksik. Lütfen yöneticiyle iletişime geç.'),500);
    }
    $site=wp_specialchars_decode(get_bloginfo('name'),ENT_QUOTES);
    if (!$site) { $site='NOVA Spor Kompleksi'; }
    $now=wp_date('d.m.Y H:i');
    $subject_admin='Yeni NOVA bilgi talebi: '.$interest;
    $admin_body="NOVA SPOR KOMPLEKSİ — YENİ BİLGİ TALEBİ\n\n".
        "Tarih: {$now}\nAd Soyad: {$name}\nE-posta: {$email}\nTelefon: ".($phone?:'Belirtilmedi')."\nİlgilenilen konu: {$interest}\n\nMesaj:\n".($message?:'Mesaj eklenmedi')."\n\n".
        "Bu mesaj NOVA internet sitesi bilgi formundan gönderilmiştir.";
    $admin_headers=array('Content-Type: text/plain; charset=UTF-8', 'Reply-To: '.$email);
    $admin_sent=wp_mail($recipient,$subject_admin,$admin_body,$admin_headers);
    if (!$admin_sent) {
        wp_send_json_error(array('message'=>'E-posta gönderimi başlatılamadı. Yönetici SMTP ayarlarını kontrol etmelidir.'),503);
    }
    set_transient($key_ip,1,2*MINUTE_IN_SECONDS);
    set_transient($key_email,1,10*MINUTE_IN_SECONDS);

    // Confirmation to visitor; contains no false claims about a booked lesson or paid membership.
    $subject_user='NOVA bilgi talebini aldık';
    $user_body="Merhaba {$name},\n\n".
        "NOVA Spor Kompleksi ile ilgilendiğin için teşekkür ederiz.\n".
        "Bilgi talebin ekibimize iletildi. Müsait olduklarında sana dönüş yapabilecekler.\n\n".
        "İlgilendiğin konu: {$interest}\n".
        ($message ? "Mesajın: {$message}\n" : '').
        "\nBu e-posta otomatik olarak hazırlanmıştır. Üyelik oluşturmaz, ödeme veya ders rezervasyonu gerçekleştirmez.\n\n".
        "NOVA Spor Kompleksi\n" . home_url('/');
    $user_sent=wp_mail($email,$subject_user,$user_body,array('Content-Type: text/plain; charset=UTF-8'));
    if ($user_sent) {
        wp_send_json_success(array('message'=>'Bilgi talebin işleme alındı. E-posta adresine bir bilgilendirme mesajı gönderimi başlatıldı; gelen ve gereksiz posta kutularını kontrol et.'));
    }
    wp_send_json_success(array('message'=>'Talebin ekibimize iletildi. Ancak sana otomatik e-posta gönderimi başlatılamadı. İletişim ekibimiz başvurunu değerlendirebilir.','partial'=>true));
}

require_once get_template_directory() . '/inc/requests.php';


/** WP Go Maps integration: real interactive street map inside the NOVA homepage. */
function nova_render_wordpress_map(){
    $id=(int)get_theme_mod('nova_map_id',1);
    if ($id<1) $id=1;
    if (shortcode_exists('wpgmza')) {
        return do_shortcode('[wpgmza id="'.esc_attr($id).'"]');
    }
    $help='Haritayı görüntülemek için WordPress panelinden WP Go Maps eklentisini etkinleştirip '.
          'Haritalar bölümünde bir harita oluştur. Harita numarasını Görünüm → Özelleştir → NOVA Site ve E-posta Ayarları alanından seç.';
    return '<div class="nova-wp-map-empty" role="status"><strong>BURSA / NİLÜFER</strong><p>'.esc_html($help).'</p></div>';
}
add_action('customize_register',function($customizer){
    $customizer->add_setting('nova_map_id',array('default'=>1,'sanitize_callback'=>'absint'));
    $customizer->add_control('nova_map_id',array('label'=>'Ana sayfa harita numarası (WP Go Maps)',
        'description'=>'Haritalar → haritanın kısa kodundaki id değeri. Örnek: [wpgmza id="1"] için 1 gir.',
        'type'=>'number','section'=>'nova_settings','input_attrs'=>array('min'=>1,'step'=>1)));
},50);
/** Built-in SQL-backed accounts. If earlier NOVA account plugin is already active, avoid duplicate functions. */
if (!function_exists('nova_portal_shortcode')) {
    require_once get_template_directory().'/inc/accounts.php';
}
