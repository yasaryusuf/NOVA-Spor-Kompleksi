(function(){
'use strict';
const allowed=['anasayfa','rotani-bul','beslenme','hakkimizda','programlar','tesis','antrenorler','uyelikler','dersler','blog','sss','iletisim','envato'];
const paths=window.novaWp?.paths||{};
function navigate(slug,scroll=true){
 if(!allowed.includes(slug))slug='anasayfa';
 document.querySelectorAll('[data-nova-view]').forEach(el=>{const on=el.dataset.novaView===slug;el.hidden=!on;el.classList.toggle('is-active',on)});
 document.querySelectorAll('.nav a').forEach(a=>{const on=a.getAttribute('href')==='#/'+slug;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 document.title=slug==='anasayfa'?'NOVA Spor Kompleksi':({'rotani-bul':'Rotanı Bul','beslenme':'Beslenme Rotası','hakkimizda':'Hakkımızda','programlar':'Programlar','tesis':'Tesis','antrenorler':'Antrenörler','uyelikler':'Üyelikler','dersler':'Dersler','blog':'Spor Günlüğü','sss':'Sık Sorulan Sorular','iletisim':'İletişim','envato':'Envato Market / Tema Satışı'}[slug]+' — NOVA Spor Kompleksi');
 if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function slugFromPath(){const pathname=location.pathname.replace(/\/+$/,'/')||'/';for(const [s,url] of Object.entries(paths)){try{if(new URL(url,location.origin).pathname.replace(/\/+$/,'/')===pathname)return s}catch(_){}}return window.novaWp?.current||'anasayfa'}
function go(slug,scroll=true,record=true){if(!allowed.includes(slug))slug='anasayfa';navigate(slug,scroll);const url=paths[slug];if(record&&url){history.pushState({novaSlug:slug},'',url);}else if(location.hash.startsWith('#/')){history.replaceState({novaSlug:slug},'',url||location.pathname)}}
window.novaNavigatePreview=function(slug){go(slug,true,true)};
function fromHash(){const m=location.hash.match(/^#\/([^/?]+)/);if(m)go(m[1],true,true);}
// Existing site links remain #/slug for portability, but WordPress URL is recorded in the address bar.
document.addEventListener('click',function(e){const a=e.target.closest('a[href^="#/"]');if(!a||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const m=a.getAttribute('href').match(/^#\/([^/?]+)/);if(m){e.preventDefault();go(m[1],true,true)}},true);
window.addEventListener('hashchange',fromHash);
window.addEventListener('popstate',()=>go(slugFromPath(),false,false));
const initial=location.hash.match(/^#\/([^/?]+)/);
if(initial)go(initial[1],false,true);else go(slugFromPath(),false,false);
})();

