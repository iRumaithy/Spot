// Bounded, account-scoped memory cache. No story media is persisted to disk.
const spotStoryMediaCache=new Map();
let spotStoryCacheUser='',spotStorySyncUser='',spotStorySyncAt=0,spotStorySyncPromise=null;
function spotTrimStoryCache(keep=''){let videos=[...spotStoryMediaCache.values()].filter(e=>e.media?.tagName==='VIDEO').length;for(const [key,e] of [...spotStoryMediaCache].sort((a,b)=>a[1].usedAt-b[1].usedAt)){const video=e.media?.tagName==='VIDEO';if(spotStoryMediaCache.size<=8&&videos<=2)break;if(key===keep||e.media?.isConnected||e.promise)continue;if(video){e.media.pause();e.media.removeAttribute('src');e.media.load();videos--}spotStoryMediaCache.delete(key)}}
function spotResetStoryCache(resetSync=true){for(const entry of spotStoryMediaCache.values()){if(entry.media?.tagName==='VIDEO'){entry.media.pause();entry.media.removeAttribute('src');entry.media.load()}}spotStoryMediaCache.clear();spotStoryCacheUser=state.me?.id||'';if(resetSync)spotStorySyncAt=0}
function spotStoryCacheEntry(story){
 if(spotStoryCacheUser!==(state.me?.id||''))spotResetStoryCache(false);
 const key=story.id+':'+story.media_path,now=Date.now();let entry=spotStoryMediaCache.get(key);
 if(entry&&entry.validUntil>now+4000){entry.usedAt=now;return entry}
 if(entry)spotStoryMediaCache.delete(key);
 entry={key,story,user:spotStoryCacheUser,usedAt:now,validUntil:Math.min(Date.parse(story.expires_at),now+90000),url:null,promise:null,media:null,ready:false};spotStoryMediaCache.set(key,entry);
 spotTrimStoryCache(key);
 return entry;
}
async function spotLoadStories(force=true){
 if(!state.me){state.stories=[];state.storySeen.clear();state.followRequests=[];spotResetStoryCache();return}
 if(spotStorySyncUser!==state.me.id){spotResetStoryCache();spotStorySyncUser=state.me.id;spotStorySyncPromise=null;state.storySeen.clear()}
 if(spotStorySyncPromise)return spotStorySyncPromise;
 if(!force&&Date.now()-spotStorySyncAt<15000)return;
 const account=state.me.id;
 const task=(async()=>{try{const [s,v,r]=await Promise.all([sup.from('spot_stories').select('*').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:true}).limit(500),sup.from('spot_story_views').select('story_id').eq('viewer_id',account).limit(3000),sup.from('spot_follow_requests').select('*').order('created_at',{ascending:false}).limit(1000)]);if(state.me?.id!==account)return;if(s.error||v.error||r.error)throw s.error||v.error||r.error;state.storyError=false;state.stories=s.data||[];state.storySeen=new Set([...state.storySeen,...(v.data||[]).map(x=>x.story_id)]);state.followRequests=r.data||[];spotStorySyncAt=Date.now();for(const [key,e] of spotStoryMediaCache)if(!state.stories.some(x=>x.id===e.story.id&&x.media_path===e.story.media_path)||!spotCanView(e.story.owner_id))spotStoryMediaCache.delete(key);const current=spotStorySession?.rows[spotStorySession.index];if(current&&(!state.stories.some(s=>s.id===current.id)||!spotCanView(current.owner_id)))spotCloseStory();spotPrewarmTray()}catch(e){if(state.me?.id===account)state.storyError=true;console.warn('Stories sync unavailable',e)}})();
 spotStorySyncPromise=task;try{await task}finally{if(spotStorySyncPromise===task)spotStorySyncPromise=null}
}
async function spotPrimeStoryURLs(stories){
 const rows=stories.filter(s=>Date.parse(s.expires_at)>Date.now()&&spotCanView(s.owner_id));
 const pending=rows.map(spotStoryCacheEntry).filter(e=>!e.url&&!e.promise);if(!pending.length)return;
 const user=state.me?.id,seconds=Math.max(1,Math.min(90,...pending.map(e=>Math.floor((Date.parse(e.story.expires_at)-Date.now())/1000))));
 const task=(async()=>{const {data,error}=await sup.storage.from('spot-stories').createSignedUrls(pending.map(e=>e.story.media_path),seconds);if(error)throw error;if(state.me?.id!==user)throw Error('Account changed');for(const entry of pending){const signed=data?.find(x=>x.path===entry.story.media_path);if(signed?.signedUrl){entry.url=signed.signedUrl;entry.validUntil=Math.min(Date.parse(entry.story.expires_at),Date.now()+seconds*1000)}}})();
 pending.forEach(e=>e.promise=task);
 try{await task}finally{pending.forEach(e=>{if(e.promise===task)e.promise=null});spotTrimStoryCache()}
}
async function spotStorySignedURL(story){
 if(!spotCanView(story.owner_id)||Date.parse(story.expires_at)<=Date.now())throw Error('Story expired or unavailable');
 const entry=spotStoryCacheEntry(story);if(entry.url)return entry.url;if(entry.promise)await entry.promise;if(entry.url)return entry.url;
 await spotPrimeStoryURLs([story]);if(!entry.url)throw Error('الستوري غير متاح');return entry.url;
}
async function spotStoryResource(story,preload=false){
 const entry=spotStoryCacheEntry(story);await spotStorySignedURL(story);
 if(entry.user!==state.me?.id||!spotCanView(story.owner_id))throw Error('Story unavailable');
 if(!entry.media){const media=document.createElement(story.media_type==='video'?'video':'img');entry.media=media;
  entry.readyPromise=new Promise((resolve,reject)=>{const event=story.media_type==='video'?'loadeddata':'load';const ready=()=>{cleanup();entry.ready=true;resolve(media)};const fail=()=>{cleanup();entry.ready=false;entry.media=null;reject(Error('تعذر تحميل الوسائط'))};const cleanup=()=>{clearTimeout(timer);media.removeEventListener(event,ready);media.removeEventListener('error',fail)};const timer=setTimeout(fail,20000);media.addEventListener(event,ready,{once:true});media.addEventListener('error',fail,{once:true})});entry.readyPromise.catch(()=>{});
  if(story.media_type==='video'){media.muted=true;media.playsInline=true;media.preload='auto';media.setAttribute('webkit-playsinline','')}else{media.decoding='async';media.fetchPriority=preload?'low':'high'}media.src=entry.url;
 }
 if(!preload&&entry.media.tagName==='IMG')entry.media.fetchPriority='high';spotTrimStoryCache(entry.key);return entry;
}
function spotBuildStoryQueue(owner){
 const follows=followingIds(),groups=new Map();for(const s of state.stories){if(Date.parse(s.expires_at)<=Date.now()||!spotCanView(s.owner_id)||!(s.owner_id===owner||s.owner_id===state.me?.id||follows.has(s.owner_id)))continue;if(!groups.has(s.owner_id))groups.set(s.owner_id,[]);groups.get(s.owner_id).push(s)}
 return [...groups].sort((a,b)=>{if(a[0]===state.me?.id)return -1;if(b[0]===state.me?.id)return 1;return Number(b[1].some(x=>!state.storySeen.has(x.id)))-Number(a[1].some(x=>!state.storySeen.has(x.id)))||Math.max(...b[1].map(x=>Date.parse(x.created_at)))-Math.max(...a[1].map(x=>Date.parse(x.created_at)))}).map(([id])=>id);
}
function spotWarmStories(rows){
 const slow=/2g|3g/.test(navigator.connection?.effectiveType||'');
 const unique=[...new Map(rows.filter(Boolean).filter(s=>spotCanView(s.owner_id)&&Date.parse(s.expires_at)>Date.now()).map(s=>[s.id,s])).values()].slice(0,slow?2:5);
 if(!unique.length||navigator.connection?.saveData)return;
 spotPrimeStoryURLs(unique).then(()=>{let videos=0;for(const s of unique){if(s.media_type==='video'&&(slow||++videos>1))continue;spotStoryResource(s,true).catch(()=>{})}}).catch(()=>{});
}
function spotPrewarmTray(){if(!state.me||document.hidden||spotStorySession)return;const owners=spotBuildStoryQueue(state.me.id).slice(0,3);spotWarmStories(owners.flatMap(id=>{const rows=spotVisibleStories(id),at=Math.max(0,rows.findIndex(s=>!state.storySeen.has(s.id)));return rows.slice(at,at+1)}))}
function spotPrefetchNext(run){if(spotStorySession!==run)return;const ownerIndex=run.owners.indexOf(run.owner),nextRows=spotVisibleStories(run.owners[ownerIndex+1]),nextAt=Math.max(0,nextRows.findIndex(s=>!state.storySeen.has(s.id)));spotWarmStories([run.rows[run.index+1],run.rows[run.index+2],nextRows[nextAt],run.rows[run.index-1]])}
async function spotOpenStories(owner,storyId=null){
 if(!requiredLogin())return;if(spotComposer&&!spotCloseComposer())return;
 let rows=spotVisibleStories(owner);if(!rows.length){await spotLoadStories(false);rows=spotVisibleStories(owner)}else if(Date.now()-spotStorySyncAt>15000)spotLoadStories(false);
 if(!rows.length)return alertToast('لا توجد ستوريات متاحة لهذا الحساب');spotCloseStory(false);
 const start=storyId?rows.findIndex(s=>s.id===storyId):rows.findIndex(s=>!state.storySeen.has(s.id));spotStorySession={rows,index:Math.max(0,start),owner,owners:spotBuildStoryQueue(owner),positions:new Map(),token:spotUUID(),reasons:new Set(),loaded:false,elapsed:0,seenElapsed:0,seenBusy:false,duration:7000,urls:new Map(),viewers:[],viewerOffset:0,viewerTotal:0,restoreFocus:document.activeElement};
 spotPrefetchNext(spotStorySession);await spotDrawStory();
}
function spotMoveOwner(direction){
 const run=spotStorySession;if(!run)return;run.positions.set(run.owner,run.rows[run.index]?.id);let at=run.owners.indexOf(run.owner)+direction;
 while(at>=0&&at<run.owners.length){const owner=run.owners[at],rows=spotVisibleStories(owner);if(rows.length){run.owner=owner;run.rows=rows;const remembered=direction<0?rows.findIndex(s=>s.id===run.positions.get(owner)):-1,unseen=rows.findIndex(s=>!state.storySeen.has(s.id));run.index=remembered>=0?remembered:direction<0?rows.length-1:Math.max(0,unseen);run.motion=direction;return spotDrawStory()}at+=direction}
 if(direction>0)spotCloseStory();
}
function spotMoveStory(direction){const run=spotStorySession;if(!run)return;const next=run.index+direction;if(next>=0&&next<run.rows.length){run.index=next;run.motion=direction;return spotDrawStory()}return spotMoveOwner(direction)}
function spotStoryAccountControls(run){const index=run.owners.indexOf(run.owner),next=state.people.find(p=>p.id===run.owners[index+1]);return `<div class="spot-story-account-nav"><button type="button" data-action="previous-story-owner" aria-label="الحساب السابق" ${index<=0?'disabled':''}>الحساب السابق</button><span>حساب ${index+1} من ${run.owners.length}</span><button type="button" data-action="next-story-owner" aria-label="${next?'الحساب التالي: '+escape(next.display_name||next.username):'إنهاء الستوريات'}">${next?escape(next.display_name?.split(' ')[0]||next.username)+' ←':'إنهاء'}</button></div>`}
function spotBindStoryGestures(area,run){
 let pointer=null;const reset=()=>{clearTimeout(run.holdTimer);pointer=null;area.style.transform='';spotSetPause('hold',false)};
 area.addEventListener('pointerdown',e=>{if(e.target.closest('button')||pointer||!e.isPrimary)return;if($('#spotStorySheet')){spotCloseStorySheet();return}pointer={x:e.clientX,y:e.clientY,id:e.pointerId,held:false};area.setPointerCapture?.(e.pointerId);run.holdTimer=setTimeout(()=>{if(pointer&&spotStorySession===run){pointer.held=true;spotSetPause('hold',true)}},180)});
 area.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)){clearTimeout(run.holdTimer);spotSetPause('hold',true);area.style.transform=`translateX(${Math.max(-65,Math.min(65,dx*.3))}px)`}});
 area.addEventListener('pointerup',e=>{const down=pointer;if(!down||down.id!==e.pointerId)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;reset();if(spotStorySession!==run)return;if(Math.abs(dy)>70&&Math.abs(dy)>Math.abs(dx)){if(dy>0)spotCloseStory();else if(run.owner===state.me.id)spotOpenViewers();return}if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){spotMoveOwner(dx<0?1:-1);return}if(down.held||Math.hypot(dx,dy)>16)return;const rect=area.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,nextSide=document.documentElement.dir==='rtl'?x<.38:x>.62,prevSide=document.documentElement.dir==='rtl'?x>.62:x<.38;if(nextSide)spotMoveStory(1);else if(prevSide)spotMoveStory(-1);else{run.reasons.delete('play-required');spotSetPause('user',!run.reasons.has('user'))}});
 area.addEventListener('pointercancel',reset);area.addEventListener('lostpointercapture',()=>{if(pointer)reset()});
}
