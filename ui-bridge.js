(function(){'use strict';
// Make existing 'ÜYELİĞE BAŞLA' links open the actual WordPress login/registration panel.
function focusPortal(register=false){setTimeout(function(){const box=document.getElementById('nova-portal');if(box){box.scrollIntoView({behavior:'smooth',block:'start'});if(register){box.querySelector('[data-nova-portal-tab="register"]')?.click();}}},180)}
document.addEventListener('click',function(event){
 const a=event.target.closest('#nova-go-portal, .header-cta, [data-nova-account-link], .nova-account-shortcut');
 if(!a)return;
 if(a.id==='nova-go-portal'){event.preventDefault();if(typeof window.novaNavigatePreview==='function')window.novaNavigatePreview('uyelikler');focusPortal(true);return;}
 if(a.getAttribute('href')?.startsWith('#/') || a.matches('[data-nova-account-link], .nova-account-shortcut,.header-cta'))focusPortal(a.classList.contains('header-cta') || a.dataset.novaPortalOpen==='register');
});
document.addEventListener('click',function(event){const link=event.target.closest('a[href="#nova-wp-map-stage"]');if(!link)return;event.preventDefault();document.getElementById('nova-wp-map-stage')?.scrollIntoView({behavior:'smooth',block:'center'});});
// Some map providers need a resize after the hidden homepage becomes visible.
document.addEventListener('click',function(event){if(event.target.closest('a[href="#/anasayfa"]'))setTimeout(()=>window.dispatchEvent(new Event('resize')),250)});
window.addEventListener('load',()=>setTimeout(()=>window.dispatchEvent(new Event('resize')),400));
})();
