<?php
/**
 * NOVA request management. A request is NOT a confirmed booking or a payment.
 * This code intentionally does not expose any member's personal data publicly.
 */
if (!defined('ABSPATH')) { exit; }

function nova_register_request_post_type() {
    register_post_type('nova_request', array(
        'labels' => array(
            'name' => 'NOVA Başvuruları',
            'singular_name' => 'NOVA Başvurusu',
            'menu_name' => 'NOVA Başvuruları',
            'all_items' => 'Tüm Başvurular',
            'edit_item' => 'Başvuruyu İncele',
            'search_items' => 'Başvuru Ara',
            'not_found' => 'Henüz başvuru yok',
        ),
        'public' => false,
        'publicly_queryable' => false,
        'exclude_from_search' => true,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => false,
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => array('title'),
        'capability_type' => 'post',
        'map_meta_cap' => true,
    ));
}
add_action('init', 'nova_register_request_post_type');

function nova_request_text($field) {
    if (!isset($_POST[$field]) || !is_scalar($_POST[$field])) { return ''; }
    return sanitize_text_field(wp_unslash((string) $_POST[$field]));
}

function nova_request_catalog() {
    return array(
        'coaches' => array('strength'=>'Mert Yılmaz','performance'=>'Zeynep Demir','mobility'=>'Kerem Kaya','personal'=>'Elif Arslan','derya'=>'Derya Akın','can'=>'Can Ersoy','ece'=>'Ece Tan','bora'=>'Bora Akgün'),
        'packages' => array('1'=>1000,'4'=>3800,'8'=>7200,'12'=>10200),
        'rooms' => array('studio'=>array('name'=>'Hareket Stüdyosu','price'=>650),'group'=>array('name'=>'Grup Antrenman Salonu','price'=>900),'performance'=>array('name'=>'Performans Alanı','price'=>1200)),
        'lessons' => array(
            array('Pazartesi','07:30','Kuvvet Antrenmanı'),array('Pazartesi','18:00','Pilates ve Esneklik'),array('Pazartesi','19:30','Fonksiyonel Antrenman'),
            array('Salı','08:00','Kardiyo ve Kondisyon'),array('Salı','17:30','Grup Dersleri'),array('Salı','19:00','Kişisel Antrenman'),
            array('Çarşamba','07:30','Kuvvet Antrenmanı'),array('Çarşamba','18:00','Fonksiyonel Antrenman'),array('Çarşamba','19:30','Pilates ve Esneklik'),
            array('Perşembe','08:00','Kardiyo ve Kondisyon'),array('Perşembe','18:00','Grup Dersleri'),array('Perşembe','19:30','Kişisel Antrenman'),
            array('Cuma','07:30','Kuvvet Antrenmanı'),array('Cuma','18:00','Fonksiyonel Antrenman'),array('Cuma','19:30','Esneklik ve Yenilenme'),
            array('Cumartesi','10:00','Grup Dersleri'),array('Cumartesi','11:30','Kardiyo ve Kondisyon'),array('Cumartesi','13:00','Kişisel Antrenman'),
        ),
        'member_actions' => array('Yeni ön başvuru','Yenileme talebi','Paket değişikliği'),
    );
}

function nova_validate_future_request_date($date) {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) { return false; }
    $zone = wp_timezone();
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date, $zone);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) { return false; }
    $today = new DateTimeImmutable('today', $zone);
    return $parsed >= $today && $parsed <= $today->modify('+365 days');
}

add_action('wp_ajax_nopriv_nova_submit_request','nova_handle_request_submission');
add_action('wp_ajax_nova_submit_request','nova_handle_request_submission');
function nova_handle_request_submission() {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_send_json_error(array('message'=>'Geçersiz istek yöntemi.'),405);
    }
    if (!check_ajax_referer('nova_submit_request_nonce','nonce',false)) {
        wp_send_json_error(array('message'=>'Güvenlik süresi doldu. Sayfayı yenileyip tekrar dene.'),403);
    }
    if (nova_request_text('website') !== '') {
        wp_send_json_error(array('message'=>'Başvuru işlenemedi.'),400);
    }
    if (nova_request_text('consent') !== '1') {
        wp_send_json_error(array('message'=>'Veri işleme onayını işaretlemelisin.'),400);
    }

    $type = nova_request_text('request_type');
    $type_labels = array('pt'=>'PT randevu talebi','room'=>'Salon kiralama talebi','member'=>'Üyelik ön başvurusu','lesson'=>'Grup dersi talebi');
    if (!array_key_exists($type,$type_labels)) {
        wp_send_json_error(array('message'=>'Geçersiz başvuru türü.'),400);
    }
    $name = nova_request_text('name');
    $email = sanitize_email(nova_request_text('email'));
    if (strlen($name)<3 || strlen($name)>200 || !is_email($email) || strlen($email)>190) {
        wp_send_json_error(array('message'=>'Ad soyad ve geçerli e-posta adresi zorunludur.'),400);
    }

    $catalog=nova_request_catalog();
    $details=array();
    $resource='';
    $date='';
    $time='';
    if ($type==='pt') {
        $coach=nova_request_text('coach');
        $package=nova_request_text('package');
        $date=nova_request_text('date');
        $time=nova_request_text('time');
        $slots=array('08:00','10:00','12:00','14:00','16:00','18:00','20:00');
        if (!isset($catalog['coaches'][$coach]) || !isset($catalog['packages'][$package]) || !nova_validate_future_request_date($date) || !in_array($time,$slots,true)) {
            wp_send_json_error(array('message'=>'Antrenör, paket, tarih veya saat seçimini kontrol et.'),400);
        }
        $resource=$coach;
        $details=array('Antrenör'=>$catalog['coaches'][$coach], 'PT paketi'=>$package.' seans', 'Örnek fiyat'=>number_format_i18n($catalog['packages'][$package]).' ₺', 'Tarih'=>$date, 'Saat'=>$time);
    } elseif ($type==='room') {
        $room=nova_request_text('room');
        $date=nova_request_text('date');
        $time=nova_request_text('time');
        $slots=array('09:00','11:00','13:00','15:00','17:00','19:00');
        if (!isset($catalog['rooms'][$room]) || !nova_validate_future_request_date($date) || !in_array($time,$slots,true)) {
            wp_send_json_error(array('message'=>'Salon, tarih ve saat bilgilerini kontrol et.'),400);
        }
        $resource=$room;
        $details=array('Salon'=>$catalog['rooms'][$room]['name'], 'Örnek saatlik fiyat'=>number_format_i18n($catalog['rooms'][$room]['price']).' ₺', 'Tarih'=>$date, 'Saat'=>$time);
    } elseif ($type==='member') {
        $tier=nova_request_text('tier');
        $term=nova_request_text('term');
        $operation=nova_request_text('operation');
        $members=array('basic'=>array('BAŞLANGIÇ',1299,3499),'performance'=>array('PERFORMANS',1899,5099),'elite'=>array('ELİT',2799,7499));
        if (!isset($members[$tier]) || !in_array($term,array('1','3','6','12'),true) || !in_array($operation,$catalog['member_actions'],true)) {
            wp_send_json_error(array('message'=>'Üyelik paketi, süre veya başvuru türünü kontrol et.'),400);
        }
        $monthly=(int)get_theme_mod('nova_price_'.$tier.'_month',$members[$tier][1]);
        $quarter=(int)get_theme_mod('nova_price_'.$tier.'_quarter',$members[$tier][2]);
        $total=$term==='1'?$monthly:($term==='3'?$quarter:($term==='6'?round($quarter*2*.95):round($quarter*4*.9)));
        $resource=$tier;
        $details=array('Üyelik'=>$members[$tier][0],'Süre'=>$term.' ay','İşlem'=>$operation,'Örnek toplam fiyat'=>number_format_i18n($total).' ₺');
    } else {
        $index=nova_request_text('lesson');
        if (!preg_match('/^(?:[0-9]|1[0-7])$/',$index) || !isset($catalog['lessons'][(int)$index])) {
            wp_send_json_error(array('message'=>'Geçerli bir grup dersi seç.'),400);
        }
        $lesson=$catalog['lessons'][(int)$index];
        $resource=$index;
        $details=array('Ders'=>$lesson[2],'Gün'=>$lesson[0],'Saat'=>$lesson[1]);
    }

    // Rate limit an identical request to reduce accidental duplicate submissions.
    $unique_key='nova_req_dup_'.md5(strtolower($email).'|'.$type.'|'.$resource.'|'.$date.'|'.$time);
    if (get_transient($unique_key)) {
        wp_send_json_error(array('message'=>'Bu bilgileri içeren bir başvuruyu kısa süre önce aldık. Lütfen kontrol ederek tekrar dene.'),429);
    }
    $ip=(string)($_SERVER['REMOTE_ADDR']??'unknown');
    $rate_key='nova_req_hour_'.md5($ip);
    if ((int)get_transient($rate_key)>=25) {
        wp_send_json_error(array('message'=>'Bu bağlantıdan çok fazla talep alındı. Daha sonra tekrar dene.'),429);
    }

    $title=wp_strip_all_tags($type_labels[$type].' — '.$name.' — '.wp_date('d.m.Y H:i'));
    $post_id=wp_insert_post(array(
        'post_type'=>'nova_request',
        'post_status'=>'private',
        'post_title'=>$title,
        'post_author'=>0,
    ), true);
    if (is_wp_error($post_id) || !$post_id) {
        wp_send_json_error(array('message'=>'Başvuru kaydedilemedi. Lütfen tekrar dene.'),500);
    }

    update_post_meta($post_id,'_nova_request_status','pending');
    update_post_meta($post_id,'_nova_request_type',$type);
    update_post_meta($post_id,'_nova_request_name',$name);
    update_post_meta($post_id,'_nova_request_email',$email);
    update_post_meta($post_id,'_nova_request_details',$details);
    update_post_meta($post_id,'_nova_request_received',wp_date('d.m.Y H:i'));

    set_transient($unique_key,1,3*MINUTE_IN_SECONDS);
    $rate=(int)get_transient($rate_key);
    set_transient($rate_key,$rate+1,HOUR_IN_SECONDS);
    $recipient=sanitize_email(get_theme_mod('nova_contact_recipient',''));
    if (!is_email($recipient)) { $recipient=sanitize_email(get_option('admin_email')); }
    $mail_ok=false;
    if (is_email($recipient)) {
        $lines=array('NOVA SPOR KOMPLEKSİ — YENİ ONAY BEKLEYEN BAŞVURU','Başvuru numarası: '.$post_id,'Tür: '.$type_labels[$type],'Ad Soyad: '.$name,'E-posta: '.$email);
        foreach ($details as $key=>$value) { $lines[]=$key.': '.$value; }
        $lines[]='';
        $lines[]='Bu bir ön başvurudur; randevu/ödeme/üyelik otomatik olarak onaylanmamıştır.';
        $mail_ok=wp_mail($recipient,'NOVA: Yeni '.$type_labels[$type].' #'.$post_id,implode("\n",$lines),array('Content-Type: text/plain; charset=UTF-8','Reply-To: '.$email));
    }
    $msg='Talebin sisteme kaydedildi (başvuru #'.$post_id.'). Yönetici incelemesini bekliyor; kesin rezervasyon veya ödeme yapılmadı.';
    if (!$mail_ok) { $msg.=' Yönetici e-posta bildirimi gönderilemedi; kayıt WordPress panelinde duruyor.'; }
    wp_send_json_success(array('message'=>$msg,'requestId'=>$post_id,'mailAttempted'=>$mail_ok));
}

function nova_request_detail_metabox() {
    add_meta_box('nova_req_details','Başvuru Detayları','nova_render_request_metabox','nova_request','normal','high');
}
add_action('add_meta_boxes','nova_request_detail_metabox');

function nova_render_request_metabox($post) {
    $type=get_post_meta($post->ID,'_nova_request_type',true);
    $name=get_post_meta($post->ID,'_nova_request_name',true);
    $email=get_post_meta($post->ID,'_nova_request_email',true);
    $details=get_post_meta($post->ID,'_nova_request_details',true);
    $status=get_post_meta($post->ID,'_nova_request_status',true);
    $types=array('pt'=>'PT randevu','room'=>'Salon kiralama','member'=>'Üyelik','lesson'=>'Grup dersi');
    $statuses=array('pending'=>'Onay bekliyor','contacted'=>'İletişime geçildi','approved'=>'İşletme tarafından onaylandı','cancelled'=>'İptal edildi');
    wp_nonce_field('nova_request_status_save','nova_request_status_nonce');
    echo '<p><strong>Başvuru tipi:</strong> '.esc_html($types[$type]??$type).'</p>';
    echo '<p><strong>Ad Soyad:</strong> '.esc_html($name).'</p>';
    echo '<p><strong>E-posta:</strong> <a href="mailto:'.esc_attr($email).'">'.esc_html($email).'</a></p>';
    echo '<table class="widefat striped"><tbody>';
    if (is_array($details)) {
        foreach ($details as $key=>$value) {
            echo '<tr><th>'.esc_html($key).'</th><td>'.esc_html((string)$value).'</td></tr>';
        }
    }
    echo '</tbody></table>';
    echo '<p><label for="nova_request_status"><strong>İşlem Durumu: </strong></label> <select id="nova_request_status" name="nova_request_status">';
    foreach ($statuses as $key=>$label) {
        echo '<option value="'.esc_attr($key).'" '.selected($status,$key,false).'>'.esc_html($label).'</option>';
    }
    echo '</select></p>';
    echo '<p class="description">Bu durum yönetici tarafından manuel değiştirilir. Ziyaretçiye otomatik rezervasyon onayı veya ödeme mesajı gönderilmez.</p>';
}

function nova_save_request_metabox($post_id) {
    if (!isset($_POST['nova_request_status_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nova_request_status_nonce'])),'nova_request_status_save')) {return;}
    if ((defined('DOING_AUTOSAVE')&&DOING_AUTOSAVE) || !current_user_can('edit_post',$post_id)) {return;}
    $status=isset($_POST['nova_request_status'])?sanitize_key(wp_unslash($_POST['nova_request_status'])):'';
    if (in_array($status,array('pending','contacted','approved','cancelled'),true)) {
        update_post_meta($post_id,'_nova_request_status',$status);
    }
}
add_action('save_post_nova_request','nova_save_request_metabox');

function nova_request_admin_columns($columns) {
    return array('cb'=>'<input type="checkbox" />','title'=>'Başvuru','nova_type'=>'Tür','nova_status'=>'Durum','nova_email'=>'E-posta','date'=>'Tarih');
}
add_filter('manage_nova_request_posts_columns','nova_request_admin_columns');
function nova_request_admin_column($column,$post_id) {
    if ($column==='nova_type') {echo esc_html(get_post_meta($post_id,'_nova_request_type',true));}
    if ($column==='nova_status') {
        $status=get_post_meta($post_id,'_nova_request_status',true);
        $labels=array('pending'=>'Onay bekliyor','contacted'=>'İletişime geçildi','approved'=>'Onaylandı','cancelled'=>'İptal edildi');
        echo esc_html($labels[$status]??$status);
    }
    if ($column==='nova_email') {echo esc_html(get_post_meta($post_id,'_nova_request_email',true));}
}
add_action('manage_nova_request_posts_custom_column','nova_request_admin_column',10,2);
