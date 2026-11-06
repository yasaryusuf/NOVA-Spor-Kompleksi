
(function(){'use strict';
 const root=document.querySelector('#nova-beslenme');if(!root)return;
 const el=id=>root.querySelector('#'+id);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Approximately kcal per 100 g of food as served; values vary by preparation.
 const foods={
  egg:['Yumurta',143],bread:['Tam buğday ekmeği',245],cheese:['Beyaz peynir',265],tomato:['Domates',18],cucumber:['Salatalık',15],olive:['Zeytin',115],oats:['Yulaf ezmesi',389],milk:['Süt',61],banana:['Muz',89],walnuts:['Ceviz',654],yogurt:['Yoğurt',61],apple:['Elma',52],almond:['Badem',579],chicken:['Pişmiş tavuk göğsü',165],bulgur:['Pişmiş bulgur',83],rice:['Pişmiş pirinç pilavı',145],salad:['Mevsim salatası',25],oil:['Zeytinyağı',884],soup:['Mercimek çorbası',85],beans:['Pişmiş kuru fasulye',115],potato:['Haşlanmış patates',86],fish:['Fırında balık',175],lentil:['Pişmiş yeşil mercimek',116],pasta:['Pişmiş tam buğday makarna',155],beef:['Pişmiş yağsız et',210],hummus:['Humus',165],carrot:['Havuç',41],orange:['Portakal',47],pear:['Armut',57],strawberry:['Çilek',32],tuna:['Suda ton balığı',116],chickpea:['Pişmiş nohut',164],spinach:['Ispanak yemeği',80],kefir:['Kefir',60],pepper:['Biber',25],labneh:['Lor peyniri',110],tahini:['Tahin',595],couscous:['Pişmiş kuskus',112],avocado:['Avokado',160],turkey:['Pişmiş hindi eti',145]
 };
 const row=(title,ingredients)=>({title,ingredients});
 const plan=[
  [row('Klasik Türk kahvaltısı',[['egg',100],['bread',85],['cheese',60],['tomato',100],['olive',35]]),row('Tavuklu bulgur tabağı',[['chicken',160],['bulgur',250],['salad',160],['oil',12],['yogurt',150]]),row('Mercimek çorbası ve sebze',[['soup',320],['bread',70],['cheese',60],['salad',170],['oil',12]]),row('Meyve ve ceviz',[['apple',180],['walnuts',25],['kefir',200]])],
  [row('Muzlu yulaf kâsesi',[['oats',75],['milk',250],['banana',130],['walnuts',20]]),row('Kuru fasulye ve pilav',[['beans',280],['rice',180],['salad',160],['oil',10],['yogurt',120]]),row('Fırında balık ve patates',[['fish',180],['potato',260],['salad',160],['oil',15]]),row('Yoğurt ve meyve',[['yogurt',220],['orange',200],['almond',22]])],
  [row('Yumurtalı tam buğday tost',[['egg',100],['bread',100],['cheese',55],['cucumber',150]]),row('Etli bulgur ve cacık',[['beef',140],['bulgur',280],['yogurt',170],['salad',130],['oil',8]]),row('Yeşil mercimek salatası',[['lentil',240],['bread',70],['salad',180],['oil',15],['cheese',45]]),row('Armut ve badem',[['pear',200],['almond',30],['milk',200]])],
  [row('Peynirli kahvaltı tabağı',[['cheese',80],['bread',105],['egg',50],['tomato',130],['olive',30]]),row('Ton balıklı makarna',[['tuna',150],['pasta',260],['salad',160],['oil',12]]),row('Nohutlu sebze tabağı',[['chickpea',220],['bulgur',210],['salad',140],['yogurt',130]]),row('Kefir, muz ve ceviz',[['kefir',250],['banana',120],['walnuts',25]])],
  [row('Yoğurtlu yulaf',[['oats',85],['yogurt',230],['strawberry',180],['almond',25]]),row('Hindi ve pilav',[['turkey',170],['rice',220],['salad',140],['oil',14],['yogurt',120]]),row('Ispanak ve yumurta',[['spinach',250],['egg',100],['bread',90],['yogurt',150]]),row('Meyve ve fındık yerine badem',[['apple',200],['almond',30],['milk',200]])],
  [row('Menemen kahvaltısı',[['egg',125],['tomato',190],['pepper',100],['oil',12],['bread',100],['cheese',35]]),row('Tavuklu makarna',[['chicken',155],['pasta',235],['salad',150],['oil',12]]),row('Nohutlu bulgur kâsesi',[['chickpea',210],['bulgur',215],['salad',160],['yogurt',110]]),row('Portakal ve ceviz',[['orange',230],['walnuts',28],['kefir',180]])],
  [row('Lor peynirli tost',[['labneh',125],['bread',120],['tomato',130],['egg',50],['olive',20]]),row('Fırında balık ve bulgur',[['fish',185],['bulgur',245],['salad',170],['oil',12]]),row('Mercimek ve cacık',[['lentil',230],['bread',95],['yogurt',200],['salad',150],['oil',10]]),row('Muz ve badem',[['banana',150],['almond',30],['milk',180]])]
 ];
 const days=['PAZARTESİ','SALI','ÇARŞAMBA','PERŞEMBE','CUMA','CUMARTESİ','PAZAR'];
 const daysShort=['PZT','SAL','ÇAR','PER','CUM','CMT','PAZ'];
 const mealLabels=['KAHVALTI','ÖĞLE YEMEĞİ','AKŞAM YEMEĞİ','ARA ÖĞÜNLER'];
 const goalNames={lose:'KİLO VERME',maintain:'KORUMA',gain:'KİLO ALMA'};
 let current=null,day=0;
 function foodSwap(key,diet){if(diet!=='vegetarian')return key;return ({chicken:'chickpea',fish:'chickpea',beef:'lentil',tuna:'chickpea',turkey:'chickpea'})[key]||key}
 function planFor(dayIndex,target,diet){const vegTitles={'Tavuklu bulgur tabağı':'Nohutlu bulgur tabağı','Fırında balık ve patates':'Nohutlu patates tabağı','Etli bulgur ve cacık':'Mercimekli bulgur ve cacık','Ton balıklı makarna':'Nohutlu makarna','Hindi ve pilav':'Nohutlu pilav','Tavuklu makarna':'Nohutlu makarna','Fırında balık ve bulgur':'Nohutlu bulgur tabağı'};const base=plan[dayIndex].map(r=>({...r,title:diet==='vegetarian'?(vegTitles[r.title]||r.title):r.title,ingredients:r.ingredients.map(([id,grams])=>[foodSwap(id,diet),grams])}));
  const total=base.reduce((sum,meal)=>sum+meal.ingredients.reduce((sub,[id,g])=>sub+foods[id][1]*g/100,0),0);
  const factor=target/total;
  return base.map(meal=>{const entries=meal.ingredients.map(([id,g])=>{const grams=Math.max(5,Math.round(g*factor/5)*5);return {id,label:foods[id][0],grams,kcal:Math.round(foods[id][1]*grams/100)}});return {title:meal.title,entries,total:entries.reduce((sum,x)=>sum+x.kcal,0)}});
 }
 function setActionStatus(message,state){const x=el('nut-action-status');if(x){x.textContent=message;x.dataset.state=state||'info';}}
 function showError(message){const box=el('nut-error');box.textContent=message;box.classList.add('active');setActionStatus('Bilgilerini kontrol et: '+message,'error');box.scrollIntoView({behavior:'auto',block:'center'})}
 function clearError(){el('nut-error').classList.remove('active');el('nut-error').textContent=''}
 function format(n){return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:0}).format(n)}
 function drawDay(){if(!current)return;
  const meals=current.week[day];el('nut-day-count').textContent=String(day+1).padStart(2,'0')+' / 07';
  el('nut-tabs').innerHTML=days.map((d,i)=>'<button type="button" data-nut-day="'+i+'" class="'+(i===day?'active':'')+'" aria-pressed="'+(i===day?'true':'false')+'" title="'+d+'">'+daysShort[i]+'</button>').join('');
  el('nut-meals').innerHTML=meals.map((m,i)=>'<article class="nut-meal"><div class="nut-meal-head"><span>'+mealLabels[i]+'</span><strong>≈ '+format(m.total)+' kcal</strong></div><h4>'+esc(m.title)+'</h4><ul>'+m.entries.map(x=>'<li><span>'+esc(x.label)+'</span><strong>'+format(x.grams)+' g</strong></li>').join('')+'</ul></article>').join('');
  el('nut-total-day').textContent='≈ '+format(meals.reduce((sum,m)=>sum+m.total,0))+' kcal';
 }
 function shopping(){const sum={};for(const meals of current.week)for(const meal of meals)for(const x of meal.entries)sum[x.id]=(sum[x.id]||0)+x.grams;
  el('nut-shopping-list').innerHTML=Object.entries(sum).sort((a,b)=>foods[a[0]][0].localeCompare(foods[b[0]][0],'tr')).map(([id,g])=>'<li>'+esc(foods[id][0])+' — <strong>'+format(g)+' g</strong></li>').join('');
 }
 function createPlan(e){
  if(e&&typeof e.preventDefault==='function')e.preventDefault();clearError();setActionStatus('Bilgiler kontrol ediliyor ve haftalık menü hazırlanıyor…','info');
  const f=el('nut-form');
  // An empty form produces the same illustrative result previously generated by the sample button.
  const demoInput=['nut-age','nut-weight','nut-height'].every(id=>el(id).value.trim()==='') && !el('nut-sex').value;
  if(demoInput){
    el('nut-age').value='28';el('nut-weight').value='74';el('nut-height').value='176';
    el('nut-sex').value='male';el('nut-activity').value='1.55';el('nut-diet').value='mixed';
    const demoGoal=f.querySelector('input[name="goal"][value="maintain"]');if(demoGoal)demoGoal.checked=true;
  }
  const age=Number(el('nut-age').value),kg=Number(el('nut-weight').value),cm=Number(el('nut-height').value);
  const sex=el('nut-sex').value,activity=Number(el('nut-activity').value),goal=f.elements.goal.value,diet=el('nut-diet').value;
  if(!Number.isFinite(age)||age<18||age>80||!Number.isFinite(kg)||kg<35||kg>250||!Number.isFinite(cm)||cm<130||cm>220||!sex||!goal||!Number.isFinite(activity)||activity<1){
    showError('Lütfen yaşını (18–80), kilonu (kg), boyunu (cm), cinsiyet seçimini ve hedefini kontrol et. Kutulara yalnızca sayı yaz; boy için örneğin 175 gir.');return;
  }
  if(el('nut-special').checked){
    showError('Gıda alerjisi, gebelik/emzirme veya özel sağlık gereksiniminde otomatik öğün listesi uygun olmayabilir. Bu durumda kişisel plan için diyetisyen veya hekime danışılmalıdır.');return;
  }
  const bmi=kg/((cm/100)**2);
  if(goal==='lose'&&bmi<18.5){
    showError('Girilen boy ve kilo ile düşük kilolu aralıkta görünüyorsun. Bu nedenle kilo vermeye yönelik otomatik kalori azaltımı oluşturulmuyor; kişisel değerlendirme için bir uzmana danışabilirsin.');return;
  }
  const adj={female:-161,male:5,average:-78}[sex];
  const bmr=10*kg+6.25*cm-5*age+adj;
  const maintenance=Math.max(0,Math.round((bmr*activity)/10)*10);
  const requested=Math.round((maintenance+({lose:-250,maintain:0,gain:250}[goal]))/10)*10;
  let target=requested,advisoryExtra='',generic=false;
  if(target<1500||target>3400){
    // Do not suggest unusually low/high individualized calorie targets.
    // Show an illustrative maintenance-oriented menu instead of leaving the screen blank.
    target=Math.min(3400,Math.max(1600,maintenance));
    generic=true;
    advisoryExtra=' Girilen bilgiler için hedef kalori, otomatik menümüzün uygun örnek aralığının dışında kaldı. Bu nedenle kilo alma/verme amaçlı özel bir kalori değişimi uygulanmadı; aşağıda yalnızca genel bir örnek menü gösteriliyor. Bunu kişisel kalori sınırı olarak kullanma.';
  }
  if(!Number.isFinite(target)||target<=0){showError('Bu bilgilerle hesaplama yapılamadı. Lütfen değerlerini kontrol et.');return;}
  current={age,kg,cm,sex,activity,goal,diet,maintenance,target,generic,week:Array.from({length:7},(_,i)=>planFor(i,target,diet))};day=0;
  el('nut-maint').textContent=format(maintenance);
  el('nut-target').textContent=format(target);
  el('nut-target-label').textContent=generic?'GENEL ÖRNEK MENÜ':'ÖRNEK GÜNLÜK HEDEF';
  el('nut-goal-name').textContent=goalNames[goal];
  el('nut-profile-summary').textContent=age+' yaş · '+format(kg)+' kg';
  const normalNote=goal==='lose'?'Yaklaşık 250 kcal/günlük küçük bir azaltma örneği kullanıldı. Bu, kişisel kilo değişimi garantisi değildir.':goal==='gain'?'Yaklaşık 250 kcal/günlük küçük bir ekleme örneği kullanıldı. Değişim kişiye göre farklılaşır.':'Kilo korumaya yönelik yaklaşık enerji düzeyi kullanıldı. Günlük ihtiyaç ve öğünler kişiden kişiye değişebilir.';
  el('nut-advisory').textContent=(demoInput?'Bu plan örnek olarak 28 yaş, 74 kg, 176 cm bilgileriyle hazırlanmıştır. Kendi değerlerini girerek yeniden hesaplayabilirsin. ':'')+(generic?'Bu değer kişiye özel bir kilo değişim hedefi değildir.':normalNote)+advisoryExtra;
  el('nut-empty').hidden=true;el('nut-result').hidden=false;
  drawDay();shopping();
  el('nut-submit-btn').textContent='PLANIMI YENİDEN OLUŞTUR ↗';
  setActionStatus('✓ 7 günlük plan hazır! Aşağıdaki sonuç alanında öğünleri ve alışveriş listesini görebilirsin.','success');
  el('nut-output').scrollIntoView({behavior:'auto',block:'start'});
 }

 function plainText(){if(!current)return '';
  return 'NOVA SPOR KOMPLEKSİ — 7 GÜNLÜK ÖRNEK BESLENME ROTASI\nKişisel tahmini koruma enerjisi: '+format(current.maintenance)+' kcal/gün\nÖrnek günlük hedef: '+format(current.target)+' kcal/gün\nHedef: '+goalNames[current.goal]+'\n\n'+current.week.map((meals,i)=>days[i]+'\n'+meals.map((m,k)=>mealLabels[k]+' — '+m.title+' (≈'+m.total+' kcal)\n'+m.entries.map(x=>'  · '+x.label+': '+x.grams+' g').join('\n')).join('\n')+'\nGünlük toplam: ≈'+meals.reduce((sum,m)=>sum+m.total,0)+' kcal').join('\n\n')+'\n\nNot: Porsiyonlar, enerji değerleri ve örnek öğünler yaklaşık olup tıbbi beslenme planı değildir.';
 }
 function safeCreatePlan(evt){
  try{
   const age=el('nut-age'),weight=el('nut-weight'),height=el('nut-height');
   const missing=[age,weight,height].filter(x=>!String(x.value).trim());
   if(missing.length===3){
    age.value='28';weight.value='74';height.value='176';
    el('nut-sex').value='male';el('nut-activity').value='1.55';
    el('nut-diet').value='mixed';
    const goal=el('nut-form').querySelector('input[name="goal"][value="maintain"]');
    if(goal)goal.checked=true;
    setActionStatus('Örnek bilgilerle 7 günlük plan hazırlanıyor. Kendi bilgilerini girerek değiştirebilirsin.','info');
   }
   createPlan(evt)
  }catch(error){
   if(evt&&typeof evt.preventDefault==='function')evt.preventDefault();
   console.error('NOVA Beslenme Rotası hesaplama sorunu:',error);
   showError('Plan hazırlanırken bir sorun oluştu. Sayfayı yeniden açarak tekrar deneyebilirsin.');
  }
 }
 el('nut-form').addEventListener('submit',safeCreatePlan);
 el('nut-submit-btn').addEventListener('click',safeCreatePlan);
 el('nut-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-nut-day]');if(!b)return;day=Number(b.dataset.nutDay);drawDay()});
 el('nut-download').addEventListener('click',()=>{const blob=new Blob(['\ufeff',plainText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='NOVA_7_Gunluk_Beslenme_Rotasi.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)});
 el('nut-print').addEventListener('click',()=>window.print());
 el('nut-reset').addEventListener('click',()=>{el('nut-result').hidden=true;el('nut-empty').hidden=false;el('nut-form').scrollIntoView({behavior:'smooth',block:'center'})});
})();

