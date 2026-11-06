(function(){
 'use strict';
 const root=document.querySelector('#nova-rota');
 if(!root)return;
 const qs=s=>root.querySelector(s);
 const qsa=s=>Array.from(root.querySelectorAll(s));
 const goals={
  strength:{name:'Kas ve güç kazanmak',program:'KUVVET ANTRENMANI',key:'strength',trainer:'MERT YILMAZ',trainerInfo:'Kuvvet ve kondisyon',why:'Kademeli kuvvet çalışması ve temel hareket tekniği ile güçlü bir rutin oluşturabilirsin.',levelPlan:{2:['Tüm vücut kuvvet','Aktif toparlanma ve esneme'],3:['Tüm vücut kuvvet','Kuvvet + temel teknik','Esneklik ve toparlanma'],4:['Üst vücut kuvvet','Alt vücut kuvvet','Kardiyo ve kondisyon','Esneklik ve toparlanma'],5:['Üst vücut kuvvet','Kardiyo ve kondisyon','Alt vücut kuvvet','Hafif hareket ve esneme','Tüm vücut kuvvet']},category:'strength'},
  cardio:{name:'Kondisyonumu geliştirmek',program:'KARDİYO VE KONDİSYON',key:'cardio',trainer:'KEREM KAYA',trainerInfo:'Fonksiyonel antrenman ve kondisyon',why:'Kardiyo ve dayanıklılık çalışmalarını kuvvet egzersizleriyle dengeleyen bir rota iyi bir başlangıç olabilir.',levelPlan:{2:['Kardiyo ve kondisyon','Temel kuvvet'],3:['Kardiyo ve kondisyon','Temel kuvvet','Hafif kardiyo ve hareketlilik'],4:['Kardiyo ve kondisyon','Fonksiyonel antrenman','Kuvvet çalışması','Hafif kardiyo ve esneme'],5:['Kardiyo ve kondisyon','Temel kuvvet','Aktif toparlanma','Fonksiyonel antrenman','Kardiyo ve esneme']},category:'cardio'},
  functional:{name:'Daha çevik ve aktif olmak',program:'FONKSİYONEL ANTRENMAN',key:'functional',trainer:'KEREM KAYA',trainerInfo:'Fonksiyonel antrenman ve kondisyon',why:'Denge, koordinasyon ve kondisyonu bir arada geliştiren fonksiyonel çalışmalar hedefinle örtüşüyor.',levelPlan:{2:['Fonksiyonel antrenman','Esneklik ve toparlanma'],3:['Fonksiyonel antrenman','Kuvvet çalışması','Kardiyo ve kondisyon'],4:['Fonksiyonel antrenman','Kuvvet çalışması','Hafif hareket ve esneme','Kardiyo ve kondisyon'],5:['Fonksiyonel antrenman','Kuvvet çalışması','Aktif toparlanma','Kardiyo ve kondisyon','Fonksiyonel teknik']},category:'functional'},
  mobility:{name:'Esnekliğimi ve dengemi artırmak',program:'ESNEKLİK VE YENİLENME',key:'mobility',trainer:'ZEYNEP DEMİR',trainerInfo:'Pilates ve grup dersleri',why:'Pilates, kontrollü hareket ve esneme çalışmaları daha dengeli bir hareket rutini kurmana yardımcı olabilir.',levelPlan:{2:['Pilates ve esneklik','Hareketlilik ve denge'],3:['Pilates ve esneklik','Temel kuvvet ve duruş','Esneklik ve toparlanma'],4:['Pilates ve esneklik','Temel kuvvet','Hareketlilik ve denge','Hafif kardiyo'],5:['Pilates ve esneklik','Temel kuvvet','Aktif toparlanma','Hareketlilik ve denge','Hafif kardiyo ve esneme']},category:'pilates'}
 };
 const levels={beginner:{name:'Yeni başlıyorum',tag:'BAŞLANGIÇ',note:'İlk haftalarda kontrollü tempo, hareket tekniği ve düzenli alışkanlık ön planda.'},intermediate:{name:'Ara sıra spor yapıyorum',tag:'ORTA',note:'Kademeli ilerleme ve dengeli antrenman dağılımı ile rutinini güçlendirebilirsin.'},advanced:{name:'Düzenli çalışıyorum',tag:'DENEYİMLİ',note:'Antrenman yoğunluğu, toparlanma ve hedefe uygun ilerleme dengesini koruyabilirsin.'}};
 const qsConfig=[
  {key:'goal',eyebrow:'01 / HEDEF',title:'SENİ NE HAREKETE GEÇİRİYOR?',subtitle:'Sana en yakın hedefi seç. Daha sonra değiştirebilirsin.',options:[
    ['strength','↗','GÜÇ KAZANMAK','Kas ve kuvvet odaklı çalışmak istiyorum.'],
    ['cardio','⌁','KONDİSYON','Enerjimi ve dayanıklılığımı artırmak istiyorum.'],
    ['functional','✦','DAHA AKTİF OLMAK','Çeviklik, koordinasyon ve hareket kalitesi istiyorum.'],
    ['mobility','◌','ESNEKLİK VE DENGE','Hareket açıklığı ve beden farkındalığı istiyorum.']
  ]},
  {key:'level',eyebrow:'02 / DENEYİM',title:'ŞU ANDA HANGİ SEVİYEDESİN?',subtitle:'Antrenman geçmişin, önerilen rutinin temposunu belirler.',options:[
    ['beginner','01','YENİ BAŞLIYORUM','Düzenli spor rutinim henüz yok.'],
    ['intermediate','02','ARA SIRA YAPIYORUM','Temel hareketlere ve spor ortamına aşinayım.'],
    ['advanced','03','DÜZENLİ ÇALIŞIYORUM','Uzun süredir belirli bir rutini sürdürüyorum.']
  ]},
  {key:'days',eyebrow:'03 / RİTİM',title:'HAFTADA KAÇ GÜN AYIRABİLİRSİN?',subtitle:'Gerçekçi bir plan, sürdürülebilir ilerlemenin başlangıcıdır.',options:[
    ['2','02','2 GÜN','Az ama düzenli; hayatıma uyumlu bir başlangıç.'],
    ['3','03','3 GÜN','Dengeli bir haftalık spor rutini.'],
    ['4','04','4 GÜN','Daha aktif ve çeşitli antrenman haftası.'],
    ['5','05','5 GÜN','Toparlanmayı da içeren yoğun bir hafta.']
  ]}
 ];
 const state={step:0,answers:{goal:null,level:null,days:null},result:null};
 const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 function renderStep(){
   const q=qsConfig[state.step];
   qs('#nova-route-question').classList.remove('nova-route-hidden');
   qs('#nova-route-result').classList.remove('active');
   qs('#nova-route-progress').textContent=`ADIM 0${state.step+1} / 03`;
   qsa('.nova-route-dots span').forEach((el,i)=>el.classList.toggle('active',i<=state.step));
   qs('#nova-route-step-eyebrow').textContent=q.eyebrow;
   qs('#nova-route-step-title').textContent=q.title;
   qs('#nova-route-step-desc').textContent=q.subtitle;
   const selected=state.answers[q.key];
   qs('#nova-route-options').innerHTML=q.options.map(([v,ico,title,description])=>`<button class="nova-route-choice" type="button" data-choice="${escape(v)}" aria-pressed="${v===selected}"><span class="route-check" aria-hidden="true">${v===selected?'✓':'+'}</span><span aria-hidden="true" class="route-choice-icon">${escape(ico)}</span><strong>${escape(title)}</strong><small>${escape(description)}</small></button>`).join('');
   qs('#nova-route-prev').disabled=state.step===0;
   qs('#nova-route-prev').style.visibility=state.step===0?'hidden':'visible';
   qs('#nova-route-next').disabled=!selected;
   qs('#nova-route-next').textContent=state.step===2?'ROTAMI OLUŞTUR ↗':'DEVAM ET →';
   qs('#nova-route-announce').textContent=`${q.eyebrow}. ${q.title}`;
 }
 function choose(v){
   state.answers[qsConfig[state.step].key]=v;
   qsa('.nova-route-choice').forEach(b=>{const active=b.dataset.choice===v;b.setAttribute('aria-pressed',String(active));b.querySelector('.route-check').textContent=active?'✓':'+'});
   qs('#nova-route-next').disabled=false;
 }
 function recommendation(){
   const goal=goals[state.answers.goal], level=levels[state.answers.level],days=+state.answers.days;
   let tier='performance';
   if(state.answers.goal==='strength'&&state.answers.level==='beginner'&&days<=2)tier='basic';
   else if(state.answers.level==='advanced'&&days>=4)tier='elite';
   const pricing=window.novaConfig?.prices||{};
   const tierInfo={basic:{name:'BAŞLANGIÇ',price:1299,why:'Temel salon kullanımıyla kontrollü bir başlangıç.'},performance:{name:'PERFORMANS',price:1899,why:'Salon kullanımına ek grup dersleriyle daha çeşitli antrenman.'},elite:{name:'ELİT',price:2799,why:'Birebir destek içeren kapsamlı üyelik.'}}[tier];
   const month=pricing[tier]?.month||tierInfo.price;
   const week=['PAZARTESİ','SALI','ÇARŞAMBA','PERŞEMBE','CUMA','CUMARTESİ'];
   const layout={2:[0,3],3:[0,2,4],4:[0,1,3,5],5:[0,1,2,4,5]}[days];
   const activities=goal.levelPlan[days].slice();
   const detail=level.tag==='BAŞLANGIÇ'?'İlk seanslarda düşük-orta yoğunluk ve tekniğe odaklan.':level.tag==='ORTA'?'Hareketleri kontrollü biçimde kademeli ilerlet.':'Yoğunluğu ve dinlenme günlerini ihtiyaçlarına göre ayarla.';
   const daysResult=layout.map((weekday,i)=>({name:week[weekday],activity:activities[i],detail:i===layout.length-1?'Haftayı zorlamadan tamamla; toparlanmana zaman ayır.':detail}));
   return {goal,level,days,tier,tierInfo,month,daysResult};
 }
 function showResult(){
   state.result=recommendation();
   const r=state.result;
   qs('#nova-route-question').classList.add('nova-route-hidden');
   qs('#nova-route-result').classList.add('active');
   qs('#nova-route-progress').textContent='ROTAN HAZIR / 03 ADIM';
   qsa('.nova-route-dots span').forEach(el=>el.classList.add('active'));
   qs('#nova-result-goal').textContent=r.goal.name;
   qs('#nova-result-intro').textContent=`${r.level.name} ve haftada ${r.days} gün ayırabiliyorsun. Aşağıdaki öneri, NOVA'daki mevcut programlardan yola çıkarak hazırlandı.`;
   qs('#nova-result-match').textContent=r.goal.why;
   qs('#nova-result-program').textContent=r.goal.program;
   qs('#nova-result-trainer').textContent=r.goal.trainer;
   qs('#nova-result-trainer-desc').textContent=r.goal.trainerInfo;
   qs('#nova-result-package').textContent=r.tierInfo.name;
   qs('#nova-result-package-desc').textContent=`${new Intl.NumberFormat('tr-TR').format(r.month)} TL/ay · ${r.tierInfo.why}`;
   qs('#nova-result-plan').innerHTML=r.daysResult.map((d,i)=>`<article class="nova-route-day"><div class="route-day-name"><span>${escape(d.name)}</span><span>${String(i+1).padStart(2,'0')} / ${String(r.days).padStart(2,'0')}</span></div><h4>${escape(d.activity)}</h4><p>${escape(d.detail)}</p></article>`).join('');
   qs('#nova-route-announce').textContent='Rotan hazır! Program, antrenör, üyelik ve haftalık planın oluşturuldu.';
   qs('#nova-route-result').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function changePage(slug,cb){
   window.novaNavigatePreview?.(slug);setTimeout(cb||(()=>{}),90)
 }
 function goToContact(){
   const r=state.result;if(!r)return;
   const text=`NOVA Rotanı Bul sonucum:\nHedef: ${r.goal.name}\nSeviye: ${r.level.name}\nHaftalık gün: ${r.days}\nÖnerilen program: ${r.goal.program}\nÖnerilen antrenör: ${r.goal.trainer}\nÖnerilen üyelik: ${r.tierInfo.name}\nBu rota hakkında bilgi almak istiyorum.`;
   changePage('iletisim',()=>{
      const message=document.querySelector('#contact-form #message'),sel=document.querySelector('#contact-form #interest');
      if(sel){let o=Array.from(sel.options).find(opt=>opt.value===`${r.tierInfo.name} üyelik`);if(!o){o=new Option(`${r.tierInfo.name} üyelik`,`${r.tierInfo.name} üyelik`);sel.add(o)}sel.value=o.value}
      if(message)message.value=text;
      document.querySelector('#contact-form')?.scrollIntoView({behavior:'smooth',block:'center'});
   });
 }
 function toText(){const r=state.result;
  if(!r)return '';
  return ['NOVA SPOR KOMPLEKSİ — KİŞİSEL ROTA ÖNERİSİ',`Hedef: ${r.goal.name}`,`Seviye: ${r.level.name}`,`Haftada: ${r.days} gün`,`Program: ${r.goal.program}`,`Antrenör: ${r.goal.trainer}`,`Üyelik: ${r.tierInfo.name} (${new Intl.NumberFormat('tr-TR').format(r.month)} TL/ay)`,...r.daysResult.map(x=>x.name+': '+x.activity),'Not: Bu bir örnek antrenman rotasıdır. Ders saatleri ve uygunluk ayrıca doğrulanmalıdır.'].join('\n');
 }
 async function copyPlan(){
   const t=toText();let copied=false;
   try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(t);copied=true}}catch(err){}
   if(!copied){const area=document.createElement('textarea');area.value=t;area.style.position='fixed';area.style.left='-9999px';document.body.append(area);area.select();try{copied=document.execCommand('copy')}catch(err){}area.remove()}
   const btn=qs('#nova-route-copy');btn.textContent=copied?'KOPYALANDI ✓':'KOPYALANAMADI';setTimeout(()=>btn.textContent='ROTAMI KOPYALA',2300);
 }
 root.addEventListener('click',e=>{
  const choice=e.target.closest('[data-choice]');if(choice){choose(choice.dataset.choice);return}
  const action=e.target.closest('[data-route-action]');if(!action)return;
  switch(action.dataset.routeAction){
   case 'next':if(!state.answers[qsConfig[state.step].key])return;if(state.step===2)showResult();else{state.step++;renderStep();qs('#nova-route-question').scrollIntoView({behavior:'smooth',block:'start'})}break;
   case 'prev':if(state.step>0){state.step--;renderStep()}break;
   case 'restart':state.step=0;state.result=null;state.answers={goal:null,level:null,days:null};renderStep();qs('#nova-rota').scrollIntoView({behavior:'smooth',block:'start'});break;
   case 'contact':goToContact();break;
   case 'program':if(!state.result)return;changePage('programlar',()=>{const b=document.querySelector(`[data-program="${state.result.goal.key}"]`);b?.click()});break;
   case 'lessons':if(!state.result)return;changePage('dersler',()=>{const filter=document.querySelector('#schedule-type');if(filter){filter.value=state.result.goal.category;filter.dispatchEvent(new Event('change',{bubbles:true}))}document.querySelector('#schedule-list')?.scrollIntoView({behavior:'smooth',block:'start'})});break;
   case 'membership':if(!state.result)return;changePage('uyelikler',()=>{const card=document.querySelector(`[data-nvp-card="${state.result.tier}"]`);if(card){card.classList.add('nova-recommended');card.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>card.classList.remove('nova-recommended'),4200)}});break;
   case 'copy':void copyPlan();break;
   case 'print':window.print();break;
  }
 });
 renderStep();
})();

