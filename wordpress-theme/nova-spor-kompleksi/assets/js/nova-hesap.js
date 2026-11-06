(function(){'use strict';
function start(){
 const mount=document.getElementById('nova-portal-mount');
 const section=document.getElementById('nova-portal');
 if(!section)return;
 const target=document.querySelector('main[data-nova-view="uyelikler"]');
 if(target&&mount){target.appendChild(section);mount.remove();
  const pricing=target.querySelector('.nvp-pricing .container')||target.querySelector('.nvp-pricing');
  if(pricing&&!pricing.querySelector('.nova-portal-quick')){
   const quick=document.createElement('button');quick.type='button';quick.className='nova-portal-quick';
   quick.textContent='ÜYE GİRİŞİ / YENİ HESAP OLUŞTUR ↗';
   quick.addEventListener('click',()=>section.scrollIntoView({behavior:'smooth',block:'start'}));
   const heading=pricing.querySelector('h1,h2');if(heading)heading.insertAdjacentElement('afterend',quick);else pricing.prepend(quick);
  }
 }
 try{if(sessionStorage.getItem('nova-portal-after-auth')==='1'){
  sessionStorage.removeItem('nova-portal-after-auth');
  if(typeof window.novaNavigatePreview==='function')window.novaNavigatePreview('uyelikler');
  setTimeout(()=>section.scrollIntoView({block:'start',behavior:'smooth'}),120);
 }}catch(_){/* Private mode */}
 const byId=id=>section.querySelector('#'+id);
 const guest=byId('nova-portal-login'),register=byId('nova-portal-register');
 const tabs=Array.from(section.querySelectorAll('[data-nova-portal-tab]'));
 function tab(mode){if(!guest||!register)return;guest.hidden=mode!=='login';register.hidden=mode!=='register';
  for(const t of tabs){const selected=t.dataset.novaPortalTab===mode;t.classList.toggle('active',selected);t.setAttribute('aria-selected',String(selected));}
 }
 tabs.forEach(t=>t.addEventListener('click',()=>tab(t.dataset.novaPortalTab)));
 section.querySelectorAll('[data-nova-show-pass]').forEach(btn=>btn.addEventListener('click',()=>{
  const input=btn.parentElement?.querySelector('input');if(!input)return;
  const hidden=input.type==='password';input.type=hidden?'text':'password';btn.textContent=hidden?'GİZLE':'GÖSTER';
  btn.setAttribute('aria-label',hidden?'Parolayı gizle':'Parolayı göster');
 }));
 const typeInputs=Array.from(section.querySelectorAll('input[name="account_type"]'));
 const coachField=section.querySelector('.nova-portal-coach-field');
 function typeChange(){if(!coachField)return;const pt=typeInputs.some(r=>r.checked&&r.value==='pt');coachField.hidden=!pt;const sel=coachField.querySelector('select');if(sel){sel.required=pt;if(!pt)sel.value='';}}
 typeInputs.forEach(r=>r.addEventListener('change',typeChange));typeChange();
 const alert=byId('nova-portal-alert');
 function tell(message,error){if(!alert)return;alert.hidden=false;alert.dataset.error=error?'1':'0';alert.textContent=message;alert.scrollIntoView({behavior:'smooth',block:'nearest'});}
 async function send(action,form,extra){
  if(!window.NOVA_PORTAL?.ajax){tell('WordPress bağlantısı bulunamadı. Bu işlem yalnızca kurulu WordPress üzerinden yapılabilir.',true);return;}
  const body=new FormData(form||undefined);body.set('action',action);body.set('nonce',window.NOVA_PORTAL.nonce);
  if(extra)for(const [k,v] of Object.entries(extra))body.set(k,v);
  const buttons=Array.from((form||section).querySelectorAll('button[type="submit"]'));
  buttons.forEach(b=>b.disabled=true);
  try{
    const res=await fetch(window.NOVA_PORTAL.ajax,{method:'POST',body,credentials:'same-origin'});
    const data=await res.json();
    if(!res.ok||!data.success){tell(data?.data?.message||'İşlem tamamlanamadı. Tekrar dene.',true);return;}
    tell(data?.data?.message||'İşlem başarılı.',false);
    if(data?.data?.reload){try{sessionStorage.setItem('nova-portal-after-auth','1')}catch(_){};window.location.reload();}
  }catch(_){tell('Sunucu yanıt vermiyor. XAMPP, Apache, MySQL ve WordPress bağlantısını kontrol et.',true)}
  finally{buttons.forEach(b=>b.disabled=false)}
 }
 guest?.addEventListener('submit',e=>{e.preventDefault();if(guest.reportValidity())send('nova_portal_login',guest);});
 register?.addEventListener('submit',e=>{e.preventDefault();if(register.reportValidity()){
  const a=register.querySelector('[name="password"]')?.value,b=register.querySelector('[name="confirm"]')?.value;
  if(a!==b){tell('Parolalar eşleşmiyor.',true);return;}
  send('nova_portal_register',register);
 }});
 byId('nova-portal-profile')?.addEventListener('submit',e=>{e.preventDefault();if(e.currentTarget.reportValidity())send('nova_portal_profile',e.currentTarget);});
 section.querySelector('[data-nova-logout]')?.addEventListener('click',()=>send('nova_portal_logout',null));
 section.querySelectorAll('[data-nova-pt-contact]').forEach(btn=>btn.addEventListener('click',()=>send('nova_portal_pt_contact',null,{request_id:btn.dataset.novaPtContact})));
 section.querySelector('[data-nova-go-prices]')?.addEventListener('click',e=>{
   e.preventDefault();document.querySelector('#uyelikler')?.scrollIntoView({block:'start',behavior:'smooth'});
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
