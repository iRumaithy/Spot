from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
s=(root/'spot-v3.5.0.js').read_text().replace('3.5.0','3.5.1').replace('owner-preview-spot350','owner-preview-spot351')
nav=(root/'scripts/story-navigation-351.inc').read_text()
editor=(root/'scripts/story-editor-351.inc').read_text()
names=set(re.findall(r'^(?:async )?function (\w+)\(',nav,re.M))
lines=[]
for line in s.splitlines():
    m=re.match(r'(?:async )?function (\w+)\(',line)
    if m and m[1] in names: continue
    if line.startswith('async function spotDrawStory('):
        line=line[:line.index("const area=$('#spotStoryMedia');")]
        line=line.replace('run.token=spotUUID();run.loaded=false;',"run.composition?.observer.disconnect();run.positions.set(run.owner,story.id);run.token=spotUUID();run.loaded=false;")
        line=line.replace("$('#spotStoryViewer')?.remove();const box=document.createElement('div');", "const box=$('#spotStoryViewer')||document.createElement('div');")
        line=line.replace('document.body.appendChild(box);','if(!box.isConnected)document.body.appendChild(box);')
        line=line.replace('</div></footer>', '</div>${spotStoryAccountControls(run)}</footer>')
        line+='''
const area=$('#spotStoryMedia');area.dataset.direction=run.motion||0;
const failure=()=>{if(spotStorySession!==run||run.token!==token)return;run.loaded=false;clearTimeout(run.mediaTimeout);area.innerHTML='<div class="spot-story-loading"><b>تعذر تحميل اللحظة</b><p>أعد المحاولة عند توفر الاتصال.</p><button type="button" class="spot-story-retry" data-action="story-retry">إعادة التحميل</button></div>'};
run.mediaTimeout=setTimeout(failure,20000);
try{const entry=await spotStoryResource(story);if(spotStorySession!==run||run.token!==token)return;const media=entry.media;if(!media)throw Error('Media unavailable');media.onerror=failure;media.alt=story.caption||'ستوري '+(p?.display_name||'Spot');media.style.objectFit=story.fit_mode==='cover'?'cover':'contain';
 const ready=()=>{if(spotStorySession!==run||run.token!==token||run.loaded)return;clearTimeout(run.mediaTimeout);run.loaded=true;run.reasons.delete('buffering');run.lastTick=performance.now();area.querySelector('.spot-story-loading')?.remove();if(media.tagName==='VIDEO'){const duration=Number.isFinite(media.duration)?media.duration:Number(story.media_duration);if(duration>0)run.duration=Math.min(30500,duration*1000);if(!run.reasons.size)media.play().catch(()=>{if(run.token!==token)return;run.reasons.add('play-required');spotUpdatePlaybackUI()})}spotStoryTick()};
 if(media.tagName==='VIDEO'){media.muted=spotStoryMuted;try{media.currentTime=0}catch{}media.onplaying=()=>{if(spotStorySession!==run||run.token!==token)return;run.reasons.delete('buffering');if(!run.loaded)ready();else spotStoryTick()};media.onwaiting=()=>{if(run.token===token)run.reasons.add('buffering')};media.onended=()=>{if(spotStorySession===run&&run.token===token)spotMoveStory(1)}}else{$('.spot-story-background',box).style.backgroundImage=`url(${JSON.stringify(entry.url)})`}
 run.composition=spotStoryCanvas(area,media,story.overlays||[],false);if(entry.ready)ready();else entry.readyPromise.then(ready,failure);spotPrefetchNext(run)
}catch(error){console.warn('Story media unavailable',error);failure()}}
'''
    lines.append(line)
s='\n'.join(lines)+'\n'
s=s.replace('// A single launch overlay',nav+'\n'+editor+'\n// A single launch overlay')
s=s.replace("duration:null,recording:false,saving:false", "duration:null,recording:false,saving:false,overlays:[],selectedOverlay:''")
s=s.replace('<div class="spot-compose-details hidden" id="spotComposeDetails">','${spotOverlayTools()}<div class="spot-compose-details hidden" id="spotComposeDetails">')
s=s.replace("stage.appendChild(media);$('#spotCameraStatus')", "run.composition?.observer.disconnect();run.overlays=[];run.selectedOverlay='';run.composition=spotStoryCanvas(stage,media,[],true);$('#spotStoryForm').classList.add('is-editing');$('#spotOverlayTools').classList.remove('hidden');spotShowOverlayPanel();$('#spotCameraStatus')")
s=s.replace("if(run.previewURL)URL.revokeObjectURL(run.previewURL);run.selectionToken=", "run.composition?.observer.disconnect();$('#spotCameraStage .spot-story-canvas')?.remove();$('#spotStoryForm').classList.remove('is-editing');$('#spotOverlayTools').classList.add('hidden');run.overlays=[];run.selectedOverlay='';if(run.previewURL)URL.revokeObjectURL(run.previewURL);run.selectionToken=")
s=s.replace("spotComposer=null;clearInterval(run.recordTimer);", "spotComposer=null;run.composition?.observer.disconnect();clearInterval(run.recordTimer);")
s=s.replace("fit_mode:run.fit}).select('id')", "fit_mode:run.fit,overlays:spotCleanOverlays(run.overlays)}).select('id')")
s=s.replace("error?reject(error):resolve()", "error?reject(error):resolve(image)")
s=s.replace("if(!video)await spotValidateStoryImage(prepared);", "if(!video)prepared=await spotPrepareStoryImage(prepared);")
s=s.replace("const media=$('.spot-composer-preview');", "const media=$('.spot-composer-preview');")
s=s.replace("async function spotStoryAction(act,id,el){switch(act){", "async function spotStoryAction(act,id,el){if(spotHandleOverlayAction(act,id))return true;switch(act){case 'next-story-owner':spotMoveOwner(1);return true;case 'previous-story-owner':spotMoveOwner(-1);return true;")
s=s.replace("spotStorySession.urls.delete(spotStorySession.rows[spotStorySession.index].id);", "const story=spotStorySession.rows[spotStorySession.index];spotStoryMediaCache.delete(story.id+':'+story.media_path);")
s=s.replace("if(run){clearTimeout(run.mediaTimeout);", "if(run){run.composition?.observer.disconnect();clearTimeout(run.mediaTimeout);")
s=s.replace("state.session=null;state.me=null;state.tab='home';", "state.session=null;state.me=null;spotResetStoryCache();state.tab='home';")
s=s.replace("if(e.key==='ArrowRight')", "if(e.key==='PageDown'){e.preventDefault();spotMoveOwner(1)}if(e.key==='PageUp'){e.preventDefault();spotMoveOwner(-1)}if(e.key==='ArrowRight')")
s=s.replace("if(e.key==='ArrowRight')spotMoveStory(-1);if(e.key==='ArrowLeft')spotMoveStory(1);", "if(e.key==='ArrowRight')spotMoveStory(document.documentElement.dir==='rtl'?-1:1);if(e.key==='ArrowLeft')spotMoveStory(document.documentElement.dir==='rtl'?1:-1);")
(root/'spot-v3.5.1.js').write_text(s)
p=(root/'owner-preview-spot350.html').read_text().replace('3.5.0','3.5.1').replace('studio3501','studio3511').replace('spot-v3.5.css','spot-v3.5.1.css').replace('spot-i18n-v3.5.js','spot-i18n-v3.5.1.js')
(root/'owner-preview-spot351.html').write_text(p)
