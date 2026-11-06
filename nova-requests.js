(function(){
'use strict';
// WordPress-backed request intake. These are onay bekleyen başvurular, not bookings or payments.
const $=(s)=>document.querySelector(s);
const $$=(s)=>Array.from(document.querySelectorAll(s));
const safe=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const coaches={strength:'Mert Yılmaz',performance:'Zeynep Demir',mobility:'Kerem Kaya',personal:'Elif Arslan',derya:'Derya Akın',can:'Can Ersoy',ece:'Ece Tan',bora:'Bora Akgün'};
const ptPrices={1:1000,4:3800,8:7200,12:10200};
const rooms={studio:{name:'Hareket Stüdyosu',price:650},group:{name:'Grup Antrenman Salonu',price:900},performance:{name:'Performans Alanı',price:1200}};
const tiers={basic:{name:'BAŞLANGIÇ',month:1299,quarter:3499},performance:{name:'PERFORMANS',month:1899,quarter:5099},elite:{name:'ELİT',month:2799,quarter:7499}};
const sessions=[["Pazartesi", "07:30", "Kuvvet Antrenmanı"], ["Pazartesi", "18:00", "Pilates ve Esneklik"], ["Pazartesi", "19:30", "Fonksiyonel Antrenman"], ["Salı", "08:00", "Kardiyo ve Kondisyon"], ["Salı", "17:30", "Grup Dersleri"], ["Salı", "19:00", "Kişisel Antrenman"], ["Çarşamba", "07:30", "Kuvvet Antrenmanı"], ["Çarşamba", "18:00", "Fonksiyonel Antrenman"], ["Çarşamba", "19:30", "Pilates ve Esneklik"], ["Perşembe", "08:00", "Kardiyo ve Kondisyon"], ["Perşembe", "18:00", "Grup Dersleri"], ["Perşembe", "19:30", "Kişisel Antrenman"], ["Cuma", "07:30", "Kuvvet Antrenmanı"], ["Cuma", "18:00", "Fonksiyonel Antrenman"], ["Cuma", "19:30", "Esneklik ve Yenilenme"], ["Cumartesi", "10:00", "Grup Dersleri"], ["Cumartesi", "11:30", "Kardiyo ve Kondisyon"], ["Cumartesi", "13:00", "Kişisel Antrenman"]];
const pad=n=>String(n).padStart(2,'0');
const d=new Date();const today=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
['#nova-pt-date','#nova-room-date'].forEach(s=>{const a=$(s);if(a){a.min=today;}});
const fmt=n=>new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(n);
const dataFallback={};
function load(type){try{const raw=localStorage.getItem('nova_wp_pending_v1_'+type);if(raw){const x=JSON.parse(raw);return Array.isArray(x)?x:[];}}catch(_){}return dataFallback[type]||[];}
function save(type,arr){dataFallback[type]=arr;try{localStorage.setItem('nova_wp_pending_v1_'+type,JSON.stringify(arr))}catch(_){}}
function feedback(id,msg,state='ok'){const el=$(id);if(el){el.textContent=msg;el.dataset.status=state;}}
function record(type,value){const arr=load(type);value.id=value.id||Date.now().toString(36)+'-'+Math.floor(Math.random()*1e8).toString(36);value.status=value.status||'Bekliyor';value.createdAt=new Date().toLocaleString('tr-TR');arr.unshift(value);save(type,arr);render(type);window.dispatchEvent(new CustomEvent('nova:requests-changed'));}
const mappings={pt:'#nova-pt-records',room:'#nova-room-records',member:'#nova-member-records',lesson:'#nova-lesson-records'};
function render(type){const target=$(mappings[type]);if(!target)return;const arr=load(type);target.innerHTML=arr.length?arr.map(x=>'<div class="nova-record"><strong>'+safe(x.head)+'</strong><small>'+safe(x.sub)+'</small><button type="button" data-nova-remove="'+safe(type)+'" data-nova-id="'+safe(x.id)+'">BU CİHAZDA GİZLE ×</button></div>').join(''):'<p class="nova-demo-small">Henüz bu cihazdan gönderilen talep yok.</p>';}
Object.keys(mappings).forEach(render);
document.addEventListener('click',e=>{const btn=e.target.closest('[data-nova-remove]');if(!btn)return;const type=btn.dataset.novaRemove; if(!mappings[type])return;save(type,load(type).filter(x=>x.id!==btn.dataset.novaId));render(type);});
function goView(view,id){
 // Keep existing WordPress theme menu/section order and router.
 if(typeof window.novaNavigatePreview==='function')window.novaNavigatePreview(view);else location.hash='#/'+view;
 window.setTimeout(()=>$(id)?.scrollIntoView({behavior:'auto',block:'start'}),60);
}
function validDate(v){return !!v && v>=today;}
function checkConflict(type,resource,date,time){return load(type).some(x=>x.resource===resource&&x.date===date&&x.time===time);}
async function sendWpRequest(type, payload, form){
 const config=window.novaConfig||{};
 if(!config.ajaxUrl||!config.requestNonce){throw new Error('WordPress bağlantısı bulunamadı. Sayfayı yenileyip tekrar dene.');}
 const data=new FormData();
 data.set('action','nova_submit_request');data.set('nonce',config.requestNonce);
 data.set('request_type',type);data.set('consent','1');data.set('website','');
 for(const [key,value] of Object.entries(payload)){data.set(key,String(value??''));}
 const button=form?.querySelector('[type="submit"]');
 if(button)button.disabled=true;
 try{
  const response=await fetch(config.ajaxUrl,{method:'POST',credentials:'same-origin',headers:{Accept:'application/json'},body:data});
  const body=await response.json().catch(()=>null);
  if(!response.ok||!body||!body.success){throw new Error(body?.data?.message||'Sunucu başvuruyu kaydedemedi. Tekrar dene.');}
  return body.data||{};
 }finally{if(button)button.disabled=false;}
}
const ptForm=$('#nova-pt-form');
function updatePtSummary(){if(!ptForm)return;const coach=$('#nova-pt-coach').value,pkg=$('#nova-pt-package').value,date=$('#nova-pt-date').value,time=$('#nova-pt-time').value;$('#nova-pt-summary').textContent=(coach?coaches[coach]:'Hoca seçilmedi')+' · '+(pkg?pkg+' seans / '+fmt(ptPrices[pkg])+' ₺ (örnek)':'Paket seçilmedi')+' · '+(date||'Tarih seçilmedi')+' · '+(time||'Saat seçilmedi');}
ptForm?.addEventListener('input',updatePtSummary);ptForm?.addEventListener('change',updatePtSummary);
document.addEventListener('click',e=>{
 const coachBtn=e.target.closest('[data-pt-coach]');if(coachBtn){const id=coachBtn.dataset.ptCoach;$('#nova-pt-coach').value=id;updatePtSummary();goView('antrenorler','#nova-pt-randevu');}
 const pack=e.target.closest('[data-pt-package]');if(pack){$('#nova-pt-package').value=pack.dataset.ptPackage;updatePtSummary();goView('antrenorler','#nova-pt-randevu');}
 const room=e.target.closest('[data-room-pick]');if(room){$('#nova-room-select').value=room.dataset.roomPick;goView('tesis','#nova-room-form');}
});
ptForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!ptForm.reportValidity())return;
 const coach=$('#nova-pt-coach').value,pkg=$('#nova-pt-package').value,date=$('#nova-pt-date').value,time=$('#nova-pt-time').value,name=$('#nova-pt-name').value.trim(),email=$('#nova-pt-email').value.trim();
 if(!coaches[coach]||!ptPrices[pkg]||!validDate(date)){feedback('#nova-pt-feedback','Lütfen geçerli hoca, paket ve ileri tarih seç.','error');return;}
 if(checkConflict('pt',coach,date,time)){feedback('#nova-pt-feedback','Bu cihazda aynı hoca, tarih ve saat için daha önce gönderilmiş bir talep görünüyor.','error');return;}
 try{
  feedback('#nova-pt-feedback','Başvurun HTML demosuna kaydediliyor…');
  const result=await sendWpRequest('pt',{coach,package:pkg,date,time,name,email},ptForm);
  record('pt',{id:String(result.requestId||''),name,email,resource:coach,date,time,head:coaches[coach]+' · '+pkg+' seans',sub:date+' / '+time+' · #'+result.requestId+' · '+fmt(ptPrices[pkg])+' ₺ (örnek)'});
  feedback('#nova-pt-feedback',result.message);
 }catch(error){feedback('#nova-pt-feedback',error.message||'İstek gönderilemedi.','error');}
});
const roomForm=$('#nova-room-form');
roomForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!roomForm.reportValidity())return;
 const key=$('#nova-room-select').value,date=$('#nova-room-date').value,time=$('#nova-room-time').value,name=$('#nova-room-name').value.trim(),email=$('#nova-room-email').value.trim();
 if(!rooms[key]||!validDate(date)){feedback('#nova-room-feedback','Lütfen geçerli salon ve tarih seç.','error');return;}
 if(checkConflict('room',key,date,time)){feedback('#nova-room-feedback','Bu cihazdan aynı salon ve saat için başka bir talep gönderilmiş.','error');return;}
 try{
  feedback('#nova-room-feedback','Salon talebin HTML demosuna kaydediliyor…');
  const result=await sendWpRequest('room',{room:key,date,time,name,email},roomForm);
  record('room',{id:String(result.requestId||''),name,email,resource:key,date,time,head:rooms[key].name+' · '+fmt(rooms[key].price)+' ₺/saat (örnek)',sub:date+' / '+time+' · #'+result.requestId});
  feedback('#nova-room-feedback',result.message);
 }catch(error){feedback('#nova-room-feedback',error.message||'İstek gönderilemedi.','error');}
});
const membershipForm=$('#nova-member-form');
function offer(tier,term){const m=Number(term);if(m===1)return tier.month;if(m===3)return tier.quarter;if(m===6)return Math.round(tier.quarter*2*.95);if(m===12)return Math.round(tier.quarter*4*.90);return 0;}
function updateMemberSummary(){const tier=tiers[$('#nova-member-tier')?.value],term=$('#nova-member-term')?.value;if($('#nova-member-summary'))$('#nova-member-summary').textContent=tier?(tier.name+' · '+term+' ay · toplam '+fmt(offer(tier,term))+' ₺ (örnek hesap)'):'Paket seçtiğinde tahmini toplam burada gösterilecek.';}
memberFormInit();
function memberFormInit(){if(!membershipForm)return; membershipForm.addEventListener('change',updateMemberSummary);membershipForm.addEventListener('input',updateMemberSummary);}
// Existing plan cards use data-plan and originally redirected to contact. In the HTML preview they now open the new membership form.
document.addEventListener('click',e=>{
 const pick=e.target.closest('[data-plan]');if(!pick)return;
 const id={BAŞLANGIÇ:'basic',PERFORMANS:'performance',ELİT:'elite'}[pick.dataset.plan];if(!id)return;
 e.preventDefault();e.stopImmediatePropagation();
 $('#nova-member-tier').value=id;
 const active=$('[data-term].active')?.dataset.term;$('#nova-member-term').value=({aylik:'1',donemlik:'3',altiaylik:'6',yillik:'12'})[active]||'1';updateMemberSummary();
 goView('uyelikler','#nova-uyelik-islemleri');
},true);
membershipForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!membershipForm.reportValidity())return;
 const key=$('#nova-member-tier').value,tier=tiers[key],months=$('#nova-member-term').value,name=$('#nova-member-name').value.trim(),email=$('#nova-member-email').value.trim(),action=$('#nova-member-action').value;
 if(!tier){feedback('#nova-member-feedback','Önce üyelik paketi seç.','error');return;}
 try{
  feedback('#nova-member-feedback','Üyelik talebin HTML demosuna kaydediliyor…');
  const result=await sendWpRequest('member',{tier:key,term:months,operation:action,name,email},membershipForm);
  record('member',{id:String(result.requestId||''),name,email,resource:key,head:action+' · '+tier.name,sub:months+' ay · #'+result.requestId+' · '+fmt(offer(tier,months))+' ₺ (örnek)'});
  feedback('#nova-member-feedback',result.message);
 }catch(error){feedback('#nova-member-feedback',error.message||'İstek gönderilemedi.','error');}
});
const lessonForm=$('#nova-lesson-form');
lessonForm?.addEventListener('submit',async e=>{
 e.preventDefault();if(!lessonForm.reportValidity())return;
 const idx=Number($('#nova-lesson-select').value),x=sessions[idx];
 if(!x){feedback('#nova-lesson-feedback','Lütfen bir ders seç.','error');return;}
 const [day,time,title]=x,name=$('#nova-lesson-name').value.trim(),email=$('#nova-lesson-email').value.trim();
 try{
  feedback('#nova-lesson-feedback','Ders talebin HTML demosuna kaydediliyor…');
  const result=await sendWpRequest('lesson',{lesson:String(idx),name,email},lessonForm);
  record('lesson',{id:String(result.requestId||''),name,email,resource:String(idx),head:title,sub:day+' '+time+' · #'+result.requestId});
  feedback('#nova-lesson-feedback',result.message);
 }catch(error){feedback('#nova-lesson-feedback',error.message||'İstek gönderilemedi.','error');}
});
window.novaDemoStore={load,save,render,types:['pt','room','member','lesson']};
})();
