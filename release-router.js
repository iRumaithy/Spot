/* THAWAQ release router: never pick a candidate from public assets until owner approves.
   Device upgrades only after explicit user choice, never via Refresh. */
(()=>{'use strict';
 const STABLE='3.1.2',NEXT='3.2.0',DEVICE_KEY='thawaq-user-approved-version',SURL=window.APP_CONFIG?.SUPABASE_URL,KEY=window.APP_CONFIG?.SUPABASE_PUBLISHABLE_KEY;
 let shown=false,seenPublished='';
 const cmp=(a,b)=>{const aa=(a||'').split('.').map(Number),bb=(b||'').split('.').map(Number);for(let i=0;i<Math.max(aa.length,bb.length);i++){const d=(aa[i]||0)-(bb[i]||0);if(d)return d}return 0};
 async function published(){
  if(!SURL||!KEY)return STABLE;
  try{const response=await fetch(`${SURL}/rest/v1/app_release?id=eq.main&select=stable_version`,{headers:{apikey:KEY},cache:'no-store'});
   if(!response.ok)throw Error('release unavailable');const data=await response.json();return data?.[0]?.stable_version||STABLE;
  }catch(e){console.warn('Release check unavailable, keeping installed app.',e);return STABLE}
 }
 const dismissed=()=>sessionStorage.getItem('thawaq-update-dismissed')==='1';
 function promptUpdate(version){
  if(document.getElementById('thawaq-update-banner')||dismissed())return;
  const panel=document.createElement('section');panel.id='thawaq-update-banner';panel.setAttribute('role','status');panel.dir='rtl';
  panel.style.cssText='position:fixed;z-index:2147483000;bottom:calc(78px + env(safe-area-inset-bottom, 0px));left:12px;right:12px;max-width:520px;margin:0 auto;background:#fffdf8;color:#163c31;border:2px solid #bca782;border-radius:18px;padding:16px;box-shadow:0 14px 40px rgba(0,0,0,.22);font:500 14px system-ui,Tahoma,sans-serif;';
  panel.innerHTML=`<strong style="display:block;font-size:16px;margin-bottom:7px">تحديث Spot v${version} متاح</strong><div style="margin-bottom:12px">خذ نسخة احتياطية قبل تثبيت التحديث. لن يتم التثبيت إلا بموافقتك.</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-update-action="backup" style="flex:1;border:1px solid #ccd3c8;padding:10px;border-radius:10px;background:#fff">نسخة احتياطية</button><button type="button" data-update-action="install" style="flex:1;padding:10px;border:none;border-radius:10px;background:#205541;color:white">تحديث الآن</button><button type="button" data-update-action="later" style="padding:10px;border:1px solid #ddd;border-radius:10px;background:#fff">لاحقًا</button></div>`;
  panel.addEventListener('click',event=>{const act=event.target.closest('[data-update-action]')?.dataset.updateAction;
   if(act==='later'){sessionStorage.setItem('thawaq-update-dismissed','1');panel.remove()}
   if(act==='backup'){const tab=document.querySelector('[data-tab="account"]');tab?.click();setTimeout(()=>document.querySelector('[data-action="backup"]')?.click(),120)}
   if(act==='install'){if(!confirm(`هل تريد تثبيت Spot v${version} الآن؟`))return;localStorage.setItem(DEVICE_KEY,version);location.reload()}
  });document.body.appendChild(panel);
 }
 async function checkUpgrade(){
  const stable=await published();seenPublished=stable;
  const accepted=localStorage.getItem(DEVICE_KEY);
  if(cmp(stable,NEXT)>=0&&accepted!==NEXT)promptUpdate(NEXT);
 }
 async function init(){
  const live=await published();seenPublished=live;
  const accepted=localStorage.getItem(DEVICE_KEY);
  const useCandidate=cmp(live,NEXT)>=0&&accepted===NEXT;
  const script=document.createElement('script');
  script.src=useCandidate?'./spot-v3.2.js?v=3200':'./thawaq-v3.1.2.js?v=3112stable';script.defer=true;
  if(useCandidate){
   document.querySelector('link[rel="manifest"]')?.setAttribute('href','./spot.webmanifest?v=3200');
   document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content','Spot');
   document.querySelector('meta[name="application-name"]')?.setAttribute('content','Spot');
   document.title='Spot | Your food community';
   document.querySelectorAll('.header-identity strong,.rail-logo strong').forEach(n=>n.textContent='Spot');
   document.querySelectorAll('.rail-logo small,.latin').forEach(n=>n.textContent='SPOT');
   const style=document.createElement('link');style.rel='stylesheet';style.href='./spot-v3.2.css?v=3200';document.head.appendChild(style);
   await new Promise(resolve=>{const i18n=document.createElement('script');i18n.src='./spot-i18n.js?v=3200';i18n.onload=resolve;i18n.onerror=resolve;document.head.appendChild(i18n)});
  }
  script.onerror=()=>{if(useCandidate){localStorage.removeItem(DEVICE_KEY);location.reload()}else console.error('تعذر تحميل ملفات ذواق')};
  document.body.appendChild(script);
  if(cmp(live,NEXT)>=0&&!useCandidate)setTimeout(()=>promptUpdate(NEXT),1800);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpgrade()});
  setInterval(checkUpgrade,60000);
  try{if(window.supabase&&SURL&&KEY){const observer=window.supabase.createClient(SURL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   observer.channel('thawaq-release-announcements').on('postgres_changes',{event:'UPDATE',schema:'public',table:'app_release',filter:'id=eq.main'},()=>{checkUpgrade()}).subscribe();}
  }catch(e){console.debug('Realtime release prompt delayed',e)}
 }
 init();
})();