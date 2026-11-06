
(function(){'use strict';
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const escapeHTML=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer, prevFocus, pendingInterest='',lastRequest=null;
const header=$('#header'),menu=$('#main-nav'),menuToggle=$('#menu-toggle'),modal=$('#modal');
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4300)}
function closeMenu(){menu.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.textContent='☰';menuToggle.setAttribute('aria-label','Menüyü aç')}
menuToggle.addEventListener('click',()=>{const opened=menu.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(opened));menuToggle.textContent=opened?'×':'☰';menuToggle.setAttribute('aria-label',opened?'Menüyü kapat':'Menüyü aç')});
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',closeMenu));
$$('a[data-interest]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();closeMenu();selectInterest(a.dataset.interest);}));
window.addEventListener('scroll',()=>{const total=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(total>0?Math.max(0,Math.min(100,scrollY/total*100)):0)+'%';header.classList.toggle('scrolled',scrollY>30);$('#back-top').classList.toggle('show',scrollY>500)},{passive:true});
$('#back-top').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'})});
const about={hikaye:{title:'NOVA nasıl bir yer?',description:'NOVA, disiplinin motivasyonla, güçlü tasarımın etkili antrenman deneyimiyle buluştuğu bir spor kulübüdür. Antrenmanda ilerleme, güçlü bir amaç ve doğru alışkanlıklarla başlar.'},misyon:{title:'Misyonumuz & vizyonumuz',description:'Misyonumuz: her seviyeden insanın hareketi sürdürülebilir bir alışkanlığa dönüştürmesine destek olmak. Vizyonumuz: kaliteli antrenman alanları, anlaşılır programlar ve güçlü topluluk duygusunu bir araya getirmek.'},yaklasim:{title:'Gelişim odaklı yaklaşım',description:'Önce hedef ve mevcut seviye anlaşılır; sonra düzenli, kademeli ve güvenli bir antrenman planı düşünülür. Doğru hareket tekniği, dinlenme, erişilebilir iletişim ve kişisel ilerleme yaklaşımımızın temel ilkeleridir.'}};
$$('[data-about]').forEach(b=>b.addEventListener('click',()=>{$$('[data-about]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b))});const x=about[b.dataset.about];$('#about-panel').innerHTML='<h3>'+x.title+'</h3><p>'+x.description+'</p>'}));
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});const cat=b.dataset.filter;$$('.program-card').forEach(card=>{card.hidden=cat!=='all'&&card.dataset.category!==cat});toast(cat==='all'?'Tüm programlar gösteriliyor.':'Programlar seçtiğin kategoriye göre filtrelendi.')}));
const programs={strength:{title:'KUVVET ANTRENMANI',label:'GÜÇ / TEMEL TEKNİK',intro:'Kuvvetin temeline odaklanan, doğru hareket kalitesi ve kontrollü ilerlemeyi öne çıkaran antrenman programı.',bullets:['Squat, hinge, itiş ve çekiş gibi temel hareket örüntüleri','Uygun yoğunluk ve aşamalı yüklenme mantığı','Teknik odaklı ve hedefe göre uyarlanabilir çalışma'],who:'Antrenmana yeni başlayan veya kuvvetini geliştirmek isteyen kişiler için değerlendirilebilir.'},personal:{title:'KİŞİSEL ANTRENMAN',label:'BİREBİR KOÇLUK',intro:'Kişiye özel hedef konuşması, bireysel ilerleme planı ve antrenman süresince rehberlik ile ilerleyen program.',bullets:['Hedef ve başlangıç seviyesi değerlendirmesi','Bireyselleştirilmiş egzersiz seçimi','İlerlemeyi gözden geçirme ve programı uyarlama'],who:'Daha yakın rehberlik isteyen ya da belirli bir hedefe odaklananlar için.'},functional:{title:'FONKSİYONEL ANTRENMAN',label:'HAREKET / KOORDİNASYON',intro:'Çok yönlü hareket kapasitesi, denge ve koordinasyon için farklı egzersiz biçimlerinin buluştuğu format.',bullets:['Gövde kontrolü, kuvvet ve çeviklik','Çok düzlemli ve çok eklemli hareket çalışmaları','Seviyeye göre sadeleştirilebilir egzersizler'],who:'Günlük hayata taşınabilir performansa odaklanmak isteyenler için.'},group:{title:'GRUP DERSLERİ',label:'GRUP / MOTİVASYON',intro:'Birlikte hareket etme enerjisini farklı antrenman yapılarıyla birleştiren grup dersi deneyimi.',bullets:['Grup ortamında antrenman motivasyonu','Eğitmen yönlendirmeli istasyonlar veya sekanslar','Seviyeye göre hareket alternatifleri'],who:'Topluluk deneyimi ve grup temposunu sevenler için.'},cardio:{title:'KARDİYO VE KONDİSYON',label:'DAYANIKLILIK / TEMPO',intro:'Kondisyonu geliştirme, kontrollü yoğunluk ve hareket sürekliliği üzerine kurgulanan antrenman.',bullets:['Bireysel seviyeye uygun tempo yönetimi','Aralıklı veya sürekli kardiyo formatları','Kondisyon ve egzersiz toleransı üzerine çalışma'],who:'Genel dayanıklılığını ve aktif yaşam kapasitesini geliştirmek isteyenler için.'},mobility:{title:'ESNEKLİK VE YENİLENME',label:'ESNEKLİK / YENİLENME',intro:'Hareket açıklığı, nefes ve düşük yoğunluklu aktif toparlanma çalışmalarına ayrılan alan.',bullets:['Hareket aralığına yönelik egzersizler','Nefes ve farkındalık çalışmaları','Antrenman sonrası toparlanma rutinleri'],who:'Hareket kalitesi ve toparlanmasına özen göstermek isteyenler için.'}};
const facilities={pool:{title:'KAPALI HAVUZ',intro:'Günün temposunu geride bırakıp yenilenebileceğin kapalı havuz alanı; sakin atmosferi ve özenli detaylarıyla rahatlama odaklıdır.',bullets:['Modern kapalı havuz tasarımı','Dinlenme şezlongları ve sıcak aydınlatma','Antrenman sonrası gevşeme ve toparlanma için uygun ortam']},sauna:{title:'SAUNA',intro:'Ahşap dokular, sıcak ışık ve sade tasarımıyla rahatlatıcı bir sauna deneyimi sunar.',bullets:['Premium ahşap iç mekân tasarımı','Toparlanma ve gevşeme odaklı kullanım','Sessiz ve huzurlu dinlenme atmosferi']},hamam:{title:'TÜRK HAMAMI',intro:'Geleneksel hamam kültürünü modern mimari çizgilerle buluşturan özel bir yenilenme alanı.',bullets:['Mermer detaylı şık tasarım','Buhar ve sıcak taş konsepti','Rahatlama ve bakım deneyimine uygun atmosfer']},gym:{title:'ANA ANTRENMAN SALONU',intro:'Serbest ağırlık, makineler ve fonksiyonel ekipmanlarla donatılmış geniş ve profesyonel antrenman alanı.',bullets:['Kuvvet ve kondisyon ekipmanları','Ferahlık sağlayan geniş yerleşim düzeni','Bireysel ve fonksiyonel antrenmanlara uygun alan']},tour:{title:'NOVA TESİS TURU',intro:'NOVA tesisinde performans, konfor ve yenilenme bir arada düşünülür. Her alan üyelerin hem fiziksel hem zihinsel olarak iyi hissetmesi için planlanmıştır.',bullets:['01 / KAPALI HAVUZ: dinlenme ve toparlanma alanı','02 / SAUNA: sıcak ve rahatlatıcı yenilenme bölümü','03 / TÜRK HAMAMI: geleneksel dokunuşlu premium bakım alanı','04 / ANA ANTRENMAN SALONU: kapsamlı ekipman ve çalışma alanı'],who:''}};
const trainers={
strength:{title:'MERT YILMAZ',label:'KUVVET VE KONDİSYON ANTRENÖRÜ',intro:'Temel kuvvet hareketleri ve düzenli gelişim odaklı antrenmanlarla güçlü bir başlangıç yap.',bullets:['Kuvvet ve serbest ağırlık çalışmaları','Doğru teknik ve hareket kontrolü','Hedefe göre antrenman düzeni']},
performance:{title:'ZEYNEP DEMİR',label:'PİLATES VE GRUP DERSLERİ EĞİTMENİ',intro:'Esneklik, denge ve kontrollü hareket odaklı pilates çalışmalarını keşfet.',bullets:['Pilates ve esneme dersleri','Merkez bölge kuvveti ve denge','Her seviyeye uyarlanabilen grup hareketleri']},
mobility:{title:'KEREM KAYA',label:'FONKSİYONEL ANTRENMAN EĞİTMENİ',intro:'Dayanıklılığını, çevikliğini ve hareket kaliteni geliştirmeye yönelik çalışmalara katıl.',bullets:['Fonksiyonel kuvvet ve çeviklik','Kardiyo ve kondisyon','Hareket çeşitliliği ve gelişim takibi']},
personal:{title:'ELİF ARSLAN',label:'KİŞİSEL ANTRENMAN EĞİTMENİ',intro:'Kendi hedeflerine uygun egzersiz planlaması ve birebir çalışma yaklaşımını incele.',bullets:['Hedef ve ihtiyaç değerlendirmesi','Birebir antrenman yaklaşımı','İlerleme, hareket ve rutin takibi']},derya:{title:'DERYA AKIN',label:'FONKSİYONEL PERFORMANS KOÇU',intro:'Hareket kalitesi, denge ve kontrollü kuvvet gelişimi için fonksiyonel bir çalışma düzeni oluşturur.',bullets:['Fonksiyonel kuvvet ve dayanıklılık','Postür ve hareket kontrolü','Başlangıç ve orta seviye için uyarlanabilir planlama']},can:{title:'CAN ERSOY',label:'GÜÇ GELİŞİMİ UZMANI',intro:'Kas gelişimi, temel kuvvet artışı ve düzenli ilerleme takibiyle çalışan odaklı bir antrenman yaklaşımı sunar.',bullets:['Serbest ağırlık ve hipertrofi çalışmaları','Programlı yük artışı takibi','Hedefe göre salon rutini oluşturma']},ece:{title:'ECE TAN',label:'PİLATES VE DURUŞ EĞİTMENİ',intro:'Duruş farkındalığı, merkez bölge kuvveti ve mobiliteyi geliştiren sakin ama etkili dersler planlar.',bullets:['Reformer pilates yaklaşımı','Core aktivasyonu ve esneklik','Günlük yaşam duruşunu destekleyen egzersizler']},bora:{title:'BORA AKGÜN',label:'HIIT VE KONDİSYON KOÇU',intro:'Yüksek tempolu ama seviyeye göre uyarlanabilir kondisyon antrenmanlarıyla enerjik bir gelişim rotası oluşturur.',bullets:['HIIT ve kondisyon blokları','Yağ yakımına destekleyen tempo çalışmaları','Dayanıklılık ve genel form gelişimi']}};
const articles={routine:{title:'ANTRENMANDA SÜREKLİLİK NASIL KURULUR?',label:'NOVA SPOR GÜNLÜĞÜ / REHBER',intro:'Sürdürülebilir bir rutinin anahtarı, her gün en zorunu yapmak değil düzenli olarak harekete yer açmaktır.',paragraphs:['Önce haftana gerçekçi bir antrenman süresi koy. Bazen kısa bir çalışma, ulaşılması zor bir ideal programdan daha uygulanabilir olabilir.','Ölçebileceğin küçük hedefler belirle: örneğin haftalık seans sayısı ya da bir hareketin teknik kalitesi. İlerleme her zaman daha ağır kaldırmak anlamına gelmez.','Uyku, dinlenme ve günlük yaşam yoğunluğu antrenman sürdürülebilirliğinin parçasıdır. Planını değişen koşullara göre güncelle.']},strength:{title:'GÜÇ ÇALIŞMASINA BAŞLARKEN NELERE BAKMALI?',label:'NOVA SPOR GÜNLÜĞÜ / HAREKET',intro:'İyi bir başlangıç, temel hareketleri anlamak ve kontrollü bir ilerleme planı oluşturmaktır.',paragraphs:['Yük seçmeden önce hareketi nasıl yaptığını gözlemle. Kontrol ve rahat hareket açıklığı çoğu zaman hızdan daha değerlidir.','Büyük değişiklikler yerine kademeli uyarlamalar yap. Tekniği koruyabildiğin egzersizleri istikrarlı uygulamaya çalış.','Yeni başlayanlar için nitelikli eğitmen rehberliği ve bireysel ihtiyaçlara uygun program seçimi önemlidir.']},recovery:{title:'İYİ BİR TOPARLANMA RUTİNİ NELER İÇERİR?',label:'NOVA SPOR GÜNLÜĞÜ / SAĞLIKLI YAŞAM',intro:'Performans, antrenmanda olduğu kadar antrenmanlar arasındaki dengede de şekillenir.',paragraphs:['Dinlenme günlerini planın bir parçası olarak değerlendir. Her seansın aynı yoğunlukta olması gerekmez.','Yavaş tempolu yürüyüş, hafif mobilite çalışmaları ve günlük hareket alışkanlığı birçok kişi için toparlanma rutininin bir parçası olabilir.','Bireysel sağlık koşulları ve ağrı durumlarında nitelikli sağlık profesyoneline danışmak gerekir.']}};
const legal={
privacy:{title:'GİZLİLİK POLİTİKASI',label:'KİŞİSEL VERİLER',intro:'İletişim formuna girilen kişisel bilgiler, bilgi talebinizi yanıtlamak için işlenir ve site yöneticisine e-posta yoluyla iletilir.',paragraphs:['Başvuru sırasında adınız, e-posta adresiniz, isteğe bağlı telefonunuz, seçtiğiniz konu ve mesajınız e-posta ile iletilir. Bu form ayrıca WordPress veritabanında ayrı bir başvuru kaydı oluşturmaz.','Canlı kullanıma geçerken işletmenin resmi veri sorumlusu bilgileri, saklama süresi ve başvuru yolları kendi kurumsal belgelerine göre güncellenmelidir.']},
kvkk:{title:'KVKK AYDINLATMA BİLGİLERİ',label:'KİŞİSEL VERİLERİN KORUNMASI',intro:'İletişim ve üyelik süreçlerinde kişisel verilerin kullanımı, ilgili mevzuata uygun biçimde düzenlenmelidir.',paragraphs:['Form verileri başvuruyu yanıtlamak için e-posta altyapısına iletilir; e-postalar gönderen ve alıcı posta kutularında saklanabilir.','Canlı işletme, resmi KVKK aydınlatma metnini, veri sorumlusu iletişim bilgilerini ve başvuru yöntemini yayına almadan önce belirlemelidir.']},
cookies:{title:'ÇEREZ POLİTİKASI',label:'İNTERNET SİTESİ AYARLARI',intro:'NOVA WordPress teması, kendi başına reklam veya analiz amaçlı çerez eklemez.',paragraphs:['Kullanılan diğer WordPress eklentileri ve üçüncü taraf hizmetler ayrıca çerez kullanabilir.','Harita, analitik veya pazarlama hizmeti etkinleştirilirse çerez metni ve tercih yönetimi buna göre güncellenmelidir.']},
access:{title:'ERİŞİLEBİLİRLİK',label:'KULLANIM BİLGİLERİ',intro:'Menü, filtreler, içerik pencereleri ve form klavye ile kullanılacak şekilde hazırlanmıştır.',paragraphs:['Esc tuşuyla açılan pencereleri kapatabilir, Tab tuşuyla kontrol öğelerine geçebilirsin.','Telefon ekranlarında menü açılıp kapanır; azaltılmış hareket tercihi varsa hareketler azaltılır.']}};
function listMarkup(items){return '<ul>'+items.map(x=>'<li>'+escapeHTML(x)+'</li>').join('')+'</ul>'}
function openModal({title,label='NOVA / AYRINTILAR',intro='',bullets=[],paragraphs=[],who='',cta='',photo=''}){prevFocus=document.activeElement;$('#modal-tag').textContent=label;$('#modal-title').textContent=title;$('#modal-body').innerHTML=(photo?'<img class="modal-featured-photo" src="'+photo+'" alt=""/>':'')+(intro?'<p>'+escapeHTML(intro)+'</p>':'')+(bullets.length?'<h4>DETAYLAR</h4>'+listMarkup(bullets):'')+(paragraphs.length?paragraphs.map(p=>'<p>'+escapeHTML(p)+'</p>').join(''):'')+(who?'<p class="demo-only">'+escapeHTML(who)+'</p>':'');pendingInterest=cta;$('#modal-cta').textContent='BİLGİ AL';$('#modal-cta').hidden=!cta;$('#modal-actions').style.justifyContent=cta?'flex-start':'flex-end';modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');$('#modal-close').focus()}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(prevFocus?.focus)prevFocus.focus()}
$('#modal-close').addEventListener('click',closeModal);$('#modal-done').addEventListener('click',closeModal);modal.addEventListener('mousedown',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal.classList.contains('open'))closeModal();else closeMenu()}if(e.key==='Tab'&&modal.classList.contains('open')){const items=$$('button:not([hidden]),a[href],input,select,textarea',[...modal.children][0]).filter(x=>!x.disabled);const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
$('#modal-cta').addEventListener('click',()=>{const interest=pendingInterest;closeModal();selectInterest(interest);});
$$('[data-program]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.program,d=programs[k];openModal({title:d.title,label:d.label,intro:d.intro,bullets:d.bullets,who:d.who,cta:d.title,photo:b.closest('.program-card')?.querySelector('.program-photo')?.src||''})}));
$$('[data-facility]').forEach(b=>b.addEventListener('click',()=>{const d=facilities[b.dataset.facility];openModal({title:d.title,label:'NOVA / TESİS',intro:d.intro,bullets:d.bullets,who:d.who||'',cta:'Genel soru',photo:b.querySelector('.facility-art')?.src||''})}));
$$('[data-trainer]').forEach(b=>b.addEventListener('click',()=>{const d=trainers[b.dataset.trainer];const coachCard=b.closest('.trainer');const bio=coachCard?.querySelector('.nova-coach-bio')?.textContent?.trim();openModal({title:d.title,label:d.label,intro:d.intro,bullets:d.bullets,paragraphs:bio?[bio]:[],who:'Bu eğitmen profili temsili tasarım içeriğidir; doğrulanmış özgeçmiş veya sertifika belgesi henüz eklenmemiştir.',cta:'Kişisel Antrenman',photo:coachCard?.querySelector('.trainer-photo')?.src||''})}));
$$('[data-article]').forEach(b=>b.addEventListener('click',()=>{const cover=b.closest('.journal-card')?.querySelector('.journal-art img');openModal({...articles[b.dataset.article],photo:cover?.src||''})}));
$$('[data-legal]').forEach(b=>b.addEventListener('click',()=>openModal(legal[b.dataset.legal])));
let term='aylik';
const nvpData=window.novaConfig?.prices || {basic:{name:'BAŞLANGIÇ',month:1299,quarter:3499},performance:{name:'PERFORMANS',month:1899,quarter:5099},elite:{name:'ELİT',month:2799,quarter:7499}};
const nvpMoney=(value)=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(Math.round(value));
const nvpPeriods={aylik:{months:1,label:'Aylık',note:'1 aylık üyelik fiyatları gösteriliyor.'},donemlik:{months:3,label:'3 aylık',note:'3 aylık dönem fiyatları gösteriliyor.'},altiaylik:{months:6,label:'6 aylık',note:'6 aylık toplam fiyat: 3 aylık paketleri iki kez almaya göre ek %5 indirim.'},yillik:{months:12,label:'12 aylık',note:'12 aylık toplam fiyat: 3 aylık paketleri dört kez almaya göre ek %10 indirim.'}};
function nvpOffer(plan,selectedTerm=term){
  const months=nvpPeriods[selectedTerm].months;
  if(months===1)return {months,total:plan.month,extra:0,base:plan.month,discount:0};
  if(months===3)return {months,total:plan.quarter,extra:0,base:3*plan.month,discount:0};
  const base=plan.quarter*(months/3),discount=months===6?.05:.10;
  const total=Math.round(base*(1-discount));
  return {months,total,base,discount,extra:base-total};
}
function nvpRender(){
  $$('.nvp-card').forEach(card=>{
    const key=card.dataset.nvpCard,plan=nvpData[key],offer=nvpOffer(plan);
    $('.nvp-amount',card).textContent=nvpMoney(offer.total);
    $('.nvp-unit',card).textContent=offer.months===1?'/ ay':'/ '+offer.months+' ay';
    $('.nvp-month-equivalent',card).textContent=offer.months===1?'Aylık ödeme · Tek dönem':'Aylık karşılığı yaklaşık '+nvpMoney(offer.total/offer.months)+' ₺ · '+offer.months+' aylık toplam fiyat';
    const saving=$('.nvp-saving',card),head=$('.nvp-save-head',card),secondary=$('.nvp-save-secondary',card),badge=$('.nvp-duration-badge',card);
    saving.hidden=offer.months===1;badge.hidden=offer.months<6;
    if(offer.months===3){head.textContent='Aylık almaya göre '+nvpMoney(3*plan.month-offer.total)+' ₺ tasarruf';secondary.textContent='3 aylık paketin toplam fiyatı.';}
    if(offer.months>=6){
      head.textContent='%'+Math.round(offer.discount*100)+' EK İNDİRİM · '+nvpMoney(offer.extra)+' ₺ tasarruf';
      secondary.textContent='3 aylık paketleri ayrı ayrı almaya göre. Aylık fiyatla kıyaslandığında toplam tasarruf: '+nvpMoney(plan.month*offer.months-offer.total)+' ₺.';
      badge.textContent=offer.months===12?'EN YÜKSEK İNDİRİM · %10':'UZUN DÖNEM AVANTAJI · %5';
    }
  });
  Object.entries(nvpData).forEach(([key,p])=>{
    const el=$('[data-nvp-compare-price="'+key+'"]');if(el)el.textContent=nvpMoney(nvpOffer(p).total)+' ₺';
  });
  $('#nvp-compare-price-label').textContent=term==='aylik'?'Aylık ücret':nvpPeriods[term].months+' aylık toplam ücret';
  $('#term-note').textContent=nvpPeriods[term].note;
  $$('[data-term]').forEach(b=>{const active=b.dataset.term===term;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
$$('[data-term]').forEach(b=>b.addEventListener('click',()=>{term=b.dataset.term;nvpRender();toast(nvpPeriods[term].label+' paket ücretleri gösteriliyor.')}));
if ($('#uyelikler')) nvpRender();
$('#nvp-compare-toggle')?.addEventListener('click',()=>{
 const p=$('#nvp-comparison'),button=$('#nvp-compare-toggle'),show=p.hidden;p.hidden=!show;
 button.setAttribute('aria-expanded',String(show));button.innerHTML=show?'KARŞILAŞTIRMAYI GİZLE <span aria-hidden="true">↑</span>':'PAKETLERİ AYRINTILI KARŞILAŞTIR <span aria-hidden="true">↓</span>';
 if(show)p.scrollIntoView({behavior:'smooth',block:'nearest'});
});
const nvpGoals={basic:'Düzenli spor alışkanlığına ekonomik ve sade bir başlangıç yapmak için.',performance:'Grup dersleri ve salon kullanımını birleştirmek isteyenlere uygun.',elite:'Birebir antrenman ve özel planlama isteyenler için.'};
$$('[data-nvp-goal]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.nvpGoal,p=nvpData[key];
 $$('[data-nvp-goal]').forEach(b=>{const selected=b===button;b.classList.toggle('is-active',selected);b.setAttribute('aria-pressed',String(selected))});
 $('#nvp-recommend-title').textContent=p.name;
 $('#nvp-recommend-detail').textContent=nvpGoals[key];
 $('#nvp-recommend-cta').dataset.plan=p.name;
 $$('.nvp-card').forEach(card=>card.classList.toggle('is-recommended',card.dataset.nvpCard===key));
}));
function novaSetMessage(msg){const input=$('#message');if(input){input.value=msg}else{try{sessionStorage.setItem('nova_pending_message',msg)}catch(err){}}}
function selectInterest(value,shouldScroll=true){
 window.novaNavigatePreview?.('iletisim');
 const sel=$('#interest');
 if(!sel){
   try{sessionStorage.setItem('nova_pending_interest',value)}catch(err){}
   if(window.novaConfig?.contactUrl) window.location.assign(window.novaConfig.contactUrl);
   return;
 }
 let option=$$('option',sel).find(o=>o.value===value);
 if(!option){option=new Option(value,value);sel.add(option)}
 sel.value=value;
 if(shouldScroll){$('#iletisim').scrollIntoView({behavior:'smooth'});toast('“'+value+'” seçimi başvuru formuna eklendi.');setTimeout(()=>sel.focus({preventScroll:true}),420)}
}

$$('[data-plan]').forEach(b=>b.addEventListener('click',()=>{
 const plan=Object.values(nvpData).find(p=>p.name===b.dataset.plan),offer=plan?nvpOffer(plan):null;
 novaSetMessage(nvpPeriods[term].label+' '+b.dataset.plan+' üyelik seçenekleri hakkında bilgi almak istiyorum.'+(offer?' Toplam paket fiyatı: '+nvpMoney(offer.total)+' ₺. Aylık karşılığı yaklaşık '+nvpMoney(offer.total/offer.months)+' ₺.':''));
 selectInterest(b.dataset.plan+' / '+nvpPeriods[term].label+' üyelik');
}));
if ($('#schedule-list')) {
const dayNames=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
// Haftalık örnek program: bu veriler canlı rezervasyon veya kontenjan bilgisi değildir.
const rawSchedule=[
[['07.30–08.30','KUVVET ANTRENMANI','Mert Yılmaz'],['18.00–19.00','PİLATES VE ESNEKLİK','Zeynep Demir'],['19.30–20.30','FONKSİYONEL ANTRENMAN','Kerem Kaya']],
[['08.00–09.00','KARDİYO VE KONDİSYON','Kerem Kaya'],['17.30–18.30','GRUP DERSLERİ','Zeynep Demir'],['19.00–20.00','KİŞİSEL ANTRENMAN','Elif Arslan']],
[['07.30–08.30','KUVVET ANTRENMANI','Mert Yılmaz'],['18.00–19.00','FONKSİYONEL ANTRENMAN','Kerem Kaya'],['19.30–20.30','PİLATES VE ESNEKLİK','Zeynep Demir']],
[['08.00–09.00','KARDİYO VE KONDİSYON','Kerem Kaya'],['18.00–19.00','GRUP DERSLERİ','Zeynep Demir'],['19.30–20.30','KİŞİSEL ANTRENMAN','Elif Arslan']],
[['07.30–08.30','KUVVET ANTRENMANI','Mert Yılmaz'],['18.00–19.00','FONKSİYONEL ANTRENMAN','Kerem Kaya'],['19.30–20.30','ESNEKLİK VE YENİLENME','Elif Arslan']],
[['10.00–11.00','GRUP DERSLERİ','Zeynep Demir'],['11.30–12.30','KARDİYO VE KONDİSYON','Kerem Kaya'],['13.00–14.00','KİŞİSEL ANTRENMAN','Elif Arslan']]
];
const classCatalog={
'KUVVET ANTRENMANI':{type:'strength',category:'Kuvvet',level:'Orta',room:'Güç Stüdyosu',desc:'Serbest ağırlıklarla temel kuvvet, doğru hareket tekniği ve sürdürülebilir gelişim üzerine yoğunlaşan antrenman.'},
'PİLATES VE ESNEKLİK':{type:'pilates',category:'Pilates ve Esneklik',level:'Her seviye',room:'Hareket Stüdyosu',desc:'Kontrollü nefes, core kuvveti ve hareket açıklığına odaklanan düşük etkili çalışma.'},
'FONKSİYONEL ANTRENMAN':{type:'functional',category:'Fonksiyonel',level:'Orta',room:'Fonksiyonel Alan',desc:'Günlük yaşam hareketlerini destekleyen dinamik kuvvet, çeviklik ve dayanıklılık egzersizleri.'},
'KARDİYO VE KONDİSYON':{type:'cardio',category:'Kardiyo',level:'Başlangıç',room:'Kardiyo Bölümü',desc:'Tempolu, kademeli çalışmayla kondisyon ve genel dayanıklılık gelişimine odaklanır.'},
'GRUP DERSLERİ':{type:'group',category:'Grup',level:'Her seviye',room:'Grup Dersleri Stüdyosu',desc:'Ekip enerjisi ve müzikle hareket, motivasyon ve birlikte ilerleme.'},
'KİŞİSEL ANTRENMAN':{type:'personal',category:'Kişisel',level:'Her seviye',room:'Birebir Antrenman Alanı',desc:'Hedefe uygun hareket planı ve uzman eğitmen eşliğinde bireysel çalışma.'},
'ESNEKLİK VE YENİLENME':{type:'pilates',category:'Pilates ve Esneklik',level:'Başlangıç',room:'Yenilenme Stüdyosu',desc:'Mobilite, nefes ve esneme çalışmalarıyla kontrollü hareket ve toparlanma.'}
};
const classPhotoKeys={strength:'strength',cardio:'cardio',functional:'functional',pilates:'mobility',group:'group',personal:'personal'};
const classPhotos={...window.novaConfig?.programPhotos};
for(const [type,program] of Object.entries(classPhotoKeys)){
 const b=$('[data-program="'+program+'"]');
 const card=b?.closest('.program-card');
 const img=card?.querySelector('.program-photo');
 classPhotos[type]=img?img.src:'';
}
const scheduleEntries=rawSchedule.flatMap((entries,day)=>entries.map(([time,title,coach],index)=>({id:'novaders-'+day+'-'+index,day,time,title,coach,...classCatalog[title]})));
let chosenDay=0,scheduleView='day',onlySaved=false;
let savedLessons=[];
try{const x=JSON.parse(localStorage.getItem('nova_saved_lessons')||'[]');savedLessons=Array.isArray(x)?x.filter(i=>typeof i==='string'):[]}catch(e){savedLessons=[]}
function keepLesson(id){const exists=savedLessons.includes(id);savedLessons=exists?savedLessons.filter(x=>x!==id):[...savedLessons,id];try{localStorage.setItem('nova_saved_lessons',JSON.stringify(savedLessons))}catch(e){}drawSchedule();toast(exists?'Ders kaydedilenlerden çıkarıldı.':'Ders kaydedildi. Kaydettiklerimden görebilirsin.')}
function sameText(s,q){return String(s||'').toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR'))}
function isShownLesson(c){const q=$('#schedule-search').value.trim(),type=$('#schedule-type').value,level=$('#schedule-level').value,time=$('#schedule-time').value;
 if(onlySaved&&!savedLessons.includes(c.id))return false;
 if(q&&!sameText([c.title,c.coach,c.room,c.category].join(' '),q))return false;
 if(type!=='all'&&c.type!==type)return false;
 if(level!=='all'&&c.level!==level)return false;
 const hour=parseInt(c.time.split(/[.–]/)[0].split('.')[0],10);
 if(time==='morning'&&!(hour>=7&&hour<12))return false;
 if(time==='afternoon'&&!(hour>=12&&hour<17))return false;
 if(time==='evening'&&!(hour>=17&&hour<22))return false;
 return true;
}
function scheduleCard(c){const photo=classPhotos[c.type]||'';const begin=c.time.split('–')[0];return '<article class="class-row" aria-label="'+escapeHTML(c.title)+' '+escapeHTML(dayNames[c.day])+' '+escapeHTML(c.time)+'">'+
 '<div class="class-thumb">'+(photo?'<img alt="'+escapeHTML(c.title)+'" src="'+photo+'" loading="lazy"/>':'')+'</div>'+ 
 '<div class="class-info"><div class="class-info-tags"><span class="class-category">'+escapeHTML(c.category)+'</span><span class="class-level">'+escapeHTML(c.level)+'</span></div><strong>'+escapeHTML(c.title)+'</strong><div class="class-secondary"><span>'+escapeHTML(c.coach)+'</span><span>'+escapeHTML(c.room)+'</span></div></div>'+ 
 '<div class="class-actions"><div class="class-hours">'+escapeHTML(c.time)+'</div><div class="class-duration">60 DAKİKA · '+escapeHTML(dayNames[c.day].toLocaleUpperCase('tr-TR'))+'</div><div class="class-buttons"><button type="button" data-class-action="detail" data-class-id="'+c.id+'">AYRINTILAR ↗</button><button type="button" class="class-enquire" data-class-action="enquire" data-class-id="'+c.id+'">BİLGİ AL ↗</button></div></div>'+ 
 '<button class="class-bookmark" type="button" data-class-action="save" data-class-id="'+c.id+'" aria-label="'+(savedLessons.includes(c.id)?'Kaydedilenlerden çıkar':'Dersi kaydet')+'" aria-pressed="'+String(savedLessons.includes(c.id))+'" title="'+(savedLessons.includes(c.id)?'Kaydı kaldır':'Dersi kaydet')+'">'+(savedLessons.includes(c.id)?'★':'☆')+'</button></article>'}
function scheduleEmpty(){return '<div class="schedule-empty"><strong>BU FİLTREDE DERS BULUNAMADI.</strong><p>Başka bir gün, seviye veya saat aralığı seçebilirsin.</p><button type="button" id="schedule-empty-reset">FİLTRELERİ TEMİZLE ↗</button></div>'}
function drawSchedule(){
 const filtered=scheduleEntries.filter(isShownLesson);
 const visible=scheduleView==='week'?filtered:filtered.filter(c=>c.day===chosenDay);
 $('#schedule-summary').textContent=dayNames.length+' gün · '+scheduleEntries.length+' ders · '+new Set(scheduleEntries.map(c=>c.coach)).size+' eğitmen';
 $('#schedule-results-heading').textContent=scheduleView==='week'?'HAFTALIK DERS AKIŞI':dayNames[chosenDay].toLocaleUpperCase('tr-TR')+' DERSLERİ';
 $('#schedule-results-sub').textContent=visible.length+' ders gösteriliyor · Seçim yaparak ayrıntıları inceleyebilirsin.';
 $('#schedule-saved-only').textContent='☆ KAYDETTİKLERİM ('+savedLessons.length+')';
 $('#schedule-saved-only').setAttribute('aria-pressed',String(onlySaved));
 $$('[data-day]').forEach(b=>{const d=Number(b.dataset.day),active=d===chosenDay;
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.querySelector('span').textContent=filtered.filter(c=>c.day===d).length+' ders';
  b.style.opacity=scheduleView==='week'?'0.75':'1';});
 let html='';
 if(scheduleView==='week'){
  html=dayNames.map((day,index)=>{const rows=visible.filter(c=>c.day===index);return rows.length?'<div class="week-schedule-group"><div class="week-group-heading">'+day.toLocaleUpperCase('tr-TR')+' <small>'+rows.length+' DERS</small></div><div class="schedule-list">'+rows.map(scheduleCard).join('')+'</div></div>':''}).join('');
 }else html=visible.map(scheduleCard).join('');
 $('#schedule-list').innerHTML=html||scheduleEmpty();
}
function resetSchedule(){chosenDay=0;scheduleView='day';onlySaved=false;$('#schedule-search').value='';$('#schedule-type').value='all';$('#schedule-level').value='all';$('#schedule-time').value='all';$$('[data-schedule-view]').forEach(b=>{let active=b.dataset.scheduleView==='day';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});drawSchedule();}
$$('[data-day]').forEach(b=>b.addEventListener('click',()=>{chosenDay=Number(b.dataset.day);if(scheduleView==='week'){scheduleView='day';$$('[data-schedule-view]').forEach(x=>{let a=x.dataset.scheduleView==='day';x.classList.toggle('active',a);x.setAttribute('aria-pressed',String(a))})}drawSchedule()}));
$$('[data-schedule-view]').forEach(b=>b.addEventListener('click',()=>{scheduleView=b.dataset.scheduleView;$$('[data-schedule-view]').forEach(x=>{const a=x===b;x.classList.toggle('active',a);x.setAttribute('aria-pressed',String(a))});drawSchedule()}));
['#schedule-search','#schedule-type','#schedule-level','#schedule-time'].forEach(selector=>{$(selector).addEventListener(selector==='#schedule-search'?'input':'change',drawSchedule)});
$('#schedule-reset').addEventListener('click',resetSchedule);
$('#schedule-saved-only').addEventListener('click',()=>{onlySaved=!onlySaved;drawSchedule()});
function scheduleEnquire(c){novaSetMessage(dayNames[c.day]+' '+c.time+' saatlerindeki '+c.title+' dersi için bilgi almak istiyorum. Eğitmen: '+c.coach+'.');selectInterest(c.title+' dersi');}
function nextLessonDate(c){const now=new Date(),target=(c.day+1)%7;let add=(target-now.getDay()+7)%7;const [hh,mm]=c.time.split('–')[0].split('.').map(Number);const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+add,hh,mm,0);if(d<=now)d.setDate(d.getDate()+7);return d}
function calStamp(d){return String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00'}
function escapeIcs(str){return String(str).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')}
function saveIcs(c){const start=nextLessonDate(c),end=new Date(start.getTime()+60*60000);const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NOVA Spor Kompleksi//Ders Hatirlatici//TR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+c.id+'-'+calStamp(start)+'@nova-ornek.local','DTSTAMP:'+stamp,'DTSTART;TZID=Europe/Istanbul:'+calStamp(start),'DTEND;TZID=Europe/Istanbul:'+calStamp(end),'SUMMARY:'+escapeIcs('NOVA | '+c.title),'DESCRIPTION:'+escapeIcs('Eğitmen: '+c.coach+' | Saat: '+c.time+' | Bu kayıt hatırlatıcıdır; rezervasyon değildir.'),'LOCATION:'+escapeIcs('NOVA Spor Kompleksi'), 'END:VEVENT','END:VCALENDAR'].join('\r\n');const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='NOVA_'+c.id+'.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Takvim hatırlatıcısı indirildi. Bu bir rezervasyon değildir.')}
function scheduleDetails(c){openModal({title:c.title,label:dayNames[c.day].toLocaleUpperCase('tr-TR')+' / '+c.time,intro:c.desc,bullets:['Eğitmen: '+c.coach,'Süre: 60 dakika','Seviye: '+c.level,'Salon: '+c.room],cta:c.title+' dersi',photo:classPhotos[c.type]||''});const btn=document.createElement('button');btn.type='button';btn.className='schedule-calendar-btn';btn.textContent='TAKVİMİME EKLE ↓ (HATIRLATICI)';btn.addEventListener('click',()=>saveIcs(c));$('#modal-body').appendChild(btn);$('#modal-cta').textContent='DERS HAKKINDA BİLGİ AL';novaSetMessage(dayNames[c.day]+' '+c.time+' saatlerindeki '+c.title+' dersi için bilgi almak istiyorum. Eğitmen: '+c.coach+'.');}
$('#schedule-list').addEventListener('click',e=>{const btn=e.target.closest('[data-class-action]');if(!btn)return;const c=scheduleEntries.find(x=>x.id===btn.dataset.classId);if(!c)return;switch(btn.dataset.classAction){case 'save':keepLesson(c.id);break;case 'enquire':scheduleEnquire(c);break;case 'detail':scheduleDetails(c);break;}});
$('#schedule-list').addEventListener('click',e=>{if(e.target.closest('#schedule-empty-reset'))resetSchedule()});
resetSchedule();
}
$('#whatsapp-demo')?.addEventListener('click',()=>openModal({title:'WHATSAPP İLE İLETİŞİM',label:'NOVA / İLETİŞİM',intro:'WhatsApp üzerinden görüşmek için bir iletişim talebi oluşturabilirsin. İlgilendiğin üyelik veya programı mesajına ekle.',bullets:['İletişim formunda konunu ve mesajını belirt.','WhatsApp numarası eklendiğinde doğrudan sohbet bağlantısı da kullanılabilecek.'],cta:'Genel soru'}));
$('#location-demo')?.addEventListener('click',()=>openModal({title:'ZİYARET PLANLA',label:'NOVA / ZİYARET',intro:'Tesisi yerinde görmek ve çalışma saatleri hakkında bilgi almak için ziyaret talebi hazırlayabilirsin.',bullets:['Formda ziyaret talebini belirt.','Adres ve saat bilgileri paylaşılınca yol tarifi de bu alana eklenecek.'],cta:'Genel soru'}));
// WordPress mail integration. WP Mail SMTP takes over wp_mail() for actual delivery.
const novaForm=$('#contact-form');
if(novaForm){
 const status=$('#form-status');
 const button=novaForm.querySelector('button[type="submit"]');
 const originalText=button?.textContent||'BİLGİ TALEBİ GÖNDER';
 novaForm.addEventListener('submit',async e=>{
  e.preventDefault(); if(!novaForm.reportValidity())return;
  if(!window.novaConfig?.ajaxUrl||!window.novaConfig?.nonce){status.classList.add('show');status.textContent='Sunucu e-posta ayarları yüklenemedi. Sayfayı yenileyip tekrar dene.';return;}
  const formData=new FormData(novaForm);
  formData.set('action','nova_send_info_request');formData.set('nonce',window.novaConfig.nonce);formData.set('consent',$('#consent')?.checked?'1':'0');
  status.classList.add('show');status.textContent='Bilgi talebin WordPress üzerinden gönderiliyor…';
  button.disabled=true;button.textContent='GÖNDERİLİYOR…';
  try{
    const res=await fetch(window.novaConfig.ajaxUrl,{method:'POST',credentials:'same-origin',body:formData,headers:{'Accept':'application/json'}});
    const json=await res.json();
    if(!res.ok||!json.success)throw new Error(json?.data?.message||'E-posta gönderilemedi. Lütfen tekrar dene.');
    const successText=json.data?.message||'Bilgi talebin ekibimize iletildi.';
    if(!json.data?.partial)novaForm.reset();
    status.classList.add('show');status.textContent=successText;
  }catch(err){status.textContent=err?.message||'Gönderim sırasında bir sorun oluştu. Lütfen yeniden dene.'}
  finally{button.disabled=false;button.textContent=originalText;status.scrollIntoView({behavior:'smooth',block:'nearest'})}
 });
 novaForm.addEventListener('reset',()=>{status.classList.remove('show');status.textContent=''});
}
$('#year').textContent=new Date().getFullYear();
// Active navigation is now set in the WordPress header for each real page.
})();

