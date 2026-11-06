
/* NOVA Envato Market satış taslağı: yalnızca gerçek ürün URL'si ile yayın bağlantısı */
(function(){'use strict';
 const get=id=>document.getElementById(id);
 const key='nova_envato_real_item_url_demo_v1';
 let cache='';
 function read(){try{return localStorage.getItem(key)||cache}catch(_){return cache}}
 function save(value){cache=value;try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}catch(_){}}
 function normalize(input){
  try{
   const u=new URL(input.trim());
   if(u.protocol!=='https:'||!['themeforest.net','www.themeforest.net'].includes(u.hostname))return null;
   if(!/^\/item\/[^/]+\/\d+\/?$/.test(u.pathname))return null;
   u.hash='';return u.href;
  }catch(_){return null}
 }
 function render(url){
  const linked=!!url;const target=url||'https://themeforest.net/';
  const main=get('nova-envato-buy-link'),sales=get('nova-market-sales-action');
  [main,sales].forEach(a=>{a.href=target;a.target='_blank';a.rel='noopener noreferrer'});
  main.textContent=linked?'THEMEFOREST’TE ÜRÜNÜ GÖR ↗':'THEMEFOREST’İ ZİYARET ET ↗';
  sales.textContent=linked?'ÜRÜN SATIŞ SAYFASINA GİT ↗':'RESMÎ THEMEFOREST SİTESİNİ AÇ ↗';
  get('nova-market-visible-url').textContent=target;
  get('nova-market-url-caption').textContent=linked?'Bu tarayıcıya kaydedilmiş ürün adresi; gerçek yayını Envato üzerinden kontrol et.':'Resmî pazar yeri adresi; NOVA ürün bağlantısı değildir.';
  get('nova-market-listing-status').textContent=linked?'Ürün adresi girildi (demo)':'Henüz yayımlanmadı';
  get('nova-envato-publish-state').textContent=linked?'Bu tarayıcıda bir ThemeForest ürün bağlantısı kaydedildi. Bu işlem yayını veya satış onayını doğrulamaz.':'NOVA teması şu anda ThemeForest üzerinde yayımlanmış bir ürün olarak doğrulanmamıştır. Mağaza bağlantısı gerçek NOVA satış sayfasına değil, resmî ThemeForest ana sayfasına gider.';
  get('nova-envato-url-input').value=url||'';
 }
 get('nova-envato-config-form')?.addEventListener('submit',e=>{
  e.preventDefault();const value=normalize(get('nova-envato-url-input').value);const notice=get('nova-envato-config-message');
  if(!value){notice.dataset.state='error';notice.textContent='Geçerli bir ThemeForest ürün adresi gir: https://themeforest.net/item/tema-adi/12345678';return}
  save(value);render(value);notice.dataset.state='success';notice.textContent='Bağlantı bu tarayıcıda kaydedildi. Bu, Envato yayın onayı anlamına gelmez.';
 });
 get('nova-envato-clear')?.addEventListener('click',()=>{
  save('');render('');const notice=get('nova-envato-config-message');notice.dataset.state='success';notice.textContent='Demo bağlantısı temizlendi. Resmî ThemeForest ana sayfası gösteriliyor.';
 });
 render(normalize(read())||'');
})();
