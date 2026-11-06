(function(){'use strict';
const $ = id => document.getElementById(id);
const ACCESS = 'nova_access_prefs_wp_v5';
function load(){try{return JSON.parse(localStorage.getItem(ACCESS)||'{}')}catch(_){return {}}}
function save(value){try{localStorage.setItem(ACCESS,JSON.stringify(value))}catch(_){}}
 // Accessibility center: all controls use persisted state; this is not a WCAG certification.
 const defaultPrefs={font:0,contrast:false,readable:false,motion:false,focus:false};
 let prefs={...defaultPrefs,...load()};
 const trigger=$('nova-access-open'),panel=$('nova-access-panel');
 function applyPrefs(){const root=document.documentElement;
  root.dataset.novaTextSize=String(prefs.font);
  root.classList.toggle('nova-high-contrast',!!prefs.contrast);root.classList.toggle('nova-readable',!!prefs.readable);
  root.classList.toggle('nova-reduce-motion',!!prefs.motion);root.classList.toggle('nova-strong-focus',!!prefs.focus);
  document.querySelectorAll('[data-nova-access]').forEach(btn=>{const k=btn.dataset.novaAccess;if(['contrast','readable','motion','focus'].includes(k))btn.setAttribute('aria-pressed',String(!!prefs[k]))});
  if($('nova-access-status'))$('nova-access-status').textContent='Yazı ölçeği: %'+([100,115,130][prefs.font]||100)+' · '+(prefs.contrast?'Yüksek kontrast açık':'Standart kontrast')+' · '+(prefs.motion?'Hareket azaltıldı':'Standart hareket');
  save(prefs);
 }
 function toggleAccess(open){if(!trigger||!panel)return;panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)panel.querySelector('button')?.focus();else trigger.focus()}
 trigger?.addEventListener('click',()=>toggleAccess(panel.hidden));
 function focusContent(){const main=[...document.querySelectorAll('main[data-nova-view]')].find(x=>!x.hidden);if(main){const h=main.querySelector('h1,h2')||main;h.setAttribute('tabindex','-1');h.focus({preventScroll:true});h.scrollIntoView({behavior:'auto',block:'start'});}toggleAccess(false)}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden){toggleAccess(false)}if(e.altKey&&e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();toggleAccess(panel.hidden)}});
 $('nova-skip')?.addEventListener('click',e=>{e.preventDefault();focusContent()});
 function speak(){if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)){if($('nova-access-status'))$('nova-access-status').textContent='Bu tarayıcı sesli okumayı desteklemiyor.';return}
  const current=[...document.querySelectorAll('main[data-nova-view]')].find(x=>!x.hidden);if(!current)return;
  speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance((current.innerText||'').slice(0,5500));speech.lang='tr-TR';speech.rate=.93;
  speechSynthesis.speak(speech);if($('nova-access-status'))$('nova-access-status').textContent='Sayfa sesli okunuyor. Durdurmak için Sesli okumayı durdur düğmesini kullan.';
 }
 document.querySelectorAll('[data-nova-access]').forEach(btn=>btn.addEventListener('click',()=>{
  const k=btn.dataset.novaAccess;
  if(k==='font-up')prefs.font=Math.min(2,prefs.font+1);
  else if(k==='font-down')prefs.font=Math.max(0,prefs.font-1);
  else if(['contrast','readable','motion','focus'].includes(k))prefs[k]=!prefs[k];
  else if(k==='reset'){prefs={...defaultPrefs};if('speechSynthesis'in window)speechSynthesis.cancel()}
  else if(k==='read'){speak();return}
  else if(k==='stop'){if('speechSynthesis'in window)speechSynthesis.cancel();if($('nova-access-status'))$('nova-access-status').textContent='Sesli okuma durduruldu.';return}
  else if(k==='skip'){focusContent();return}
  applyPrefs();
 }));
 applyPrefs();
})();
