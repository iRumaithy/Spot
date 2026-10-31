from pathlib import Path
import re
root=Path(__file__).resolve().parent.parent
s=(root/'spot-v3.5.1.js').read_text().replace('3.5.1','3.5.2').replace('owner-preview-spot351','owner-preview-spot352')
editor=(root/'scripts/story-editor-352.inc').read_text()
camera=(root/'scripts/story-camera-352.inc').read_text()
replacement_names=set(re.findall(r'^(?:async )?function (\w+)\(',editor+'\n'+camera,re.M))
renames={'spotShowOverlayPanel':'spotLegacyOverlayPanel','spotAddOverlay':'spotLegacyAddOverlay','spotHandleOverlayAction':'spotLegacyOverlayAction'}
# Remove function declarations by lexical brace depth, including template literals.
def function_end(source,start):
    at=source.index('{',start);depth=1;i=at+1
    while depth:
        if source[i]=='{':depth+=1
        elif source[i]=='}':depth-=1
        i+=1
    return i
for match in list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M))[::-1]:
    name=match[1]
    if name not in replacement_names:continue
    end=function_end(s,match.start())
    if name in renames:s=s[:match.start()]+s[match.start():end].replace('function '+name+'(','function '+renames[name]+'(',1)+s[end:]
    else:s=s[:match.start()]+s[end:]
s=s.replace('// A single launch overlay',editor+'\n'+camera+'\n// A single launch overlay')
s=s.replace("overlays:[],selectedOverlay:''", "overlays:[],selectedOverlay:'',drawings:[],drawUndo:[],drawRedo:[],drawingMode:false,brush:{tool:'pen',color:'#ffffff',width:6}")
s=s.replace("fit_mode:run.fit,overlays:spotCleanOverlays(run.overlays)", "fit_mode:run.fit,overlays:spotCleanOverlays(run.overlays),drawings:spotCleanDrawings(run.drawings)")
s=s.replace("spotStoryCanvas(area,media,story.overlays||[],false)", "spotStoryCanvas(area,media,story.overlays||[],false,story.drawings||[])")
s=s.replace("run.overlays=[];run.selectedOverlay='';", "run.overlays=[];run.selectedOverlay='';run.drawings=[];run.drawUndo=[];run.drawRedo=[];run.drawingMode=false;")
# Physical direction is explicit and independent of interface language.
s=s.replace("nextSide=document.documentElement.dir==='rtl'?x<.38:x>.62,prevSide=document.documentElement.dir==='rtl'?x>.62:x<.38", "nextSide=x>.62,prevSide=x<.38")
s=s.replace("spotMoveStory(document.documentElement.dir==='rtl'?-1:1)", "spotMoveStory(1)").replace("spotMoveStory(document.documentElement.dir==='rtl'?1:-1)", "spotMoveStory(-1)")
s=s.replace("+' ←'", "+' →'")
s=s.replace("spot-glass-button\" aria-label=\"تبديل الكاميرا الأمامية والخلفية", "spot-glass-button\" aria-label=\"تبديل الكاميرا الأمامية والخلفية")
s=s.replace("navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:run.facing},width:{ideal:1920},height:{ideal:1080}}})", "spotAcquireCamera(run.facing)")
s=s.replace("spotComposer!==run||run.cameraToken!==token){spotStopStream(stream);return}run.stream=stream;", "spotComposer!==run||run.cameraToken!==token){spotParkCamera(stream,run);return}run.stream=stream;stream.getVideoTracks().forEach(t=>t.enabled=true);")
s=s.replace("if(spotComposer!==run){spotStopStream(stream);return}status", "if(spotComposer!==run){spotParkCamera(stream,run);return}status")
s=s.replace("if(spotComposer!==run){spotStopStream(run.audioStream);return}", "if(spotComposer!==run||document.hidden){spotStopStream(run.audioStream);return}")
s=s.replace("state.me=null;spotResetStoryCache();", "state.me=null;spotHardStopCamera();spotResetStoryCache();")
s=s.replace("async function spotStoryAction(act,id,el){", "async function spotStoryAction(act,id,el){if(act==='camera-permission-info'){spotShowCameraPermissionHelp();return true}if(act==='camera-permission-close'){$('#spotCameraPermissionHelp')?.remove();return true}")
s=s.replace('<p class="spot-studio-hint" id="spotCameraHint">', '<button type="button" class="spot-camera-help-button" data-action="camera-permission-info">يتكرر طلب إذن الكاميرا؟</button><p class="spot-studio-hint" id="spotCameraHint">')
# Hint reflects the corrected physical tap direction.
s=s.replace('اضغط مطولًا للإيقاف · اسحب للتنقّل', 'يمين التالي · يسار السابق · اسحب بين الحسابات')
(root/'spot-v3.5.2.js').write_text(s)
p=(root/'owner-preview-spot351.html').read_text().replace('3.5.1','3.5.2').replace('studio3511','studio3521').replace('spot-v3.5.1.css','spot-v3.5.2.css').replace('spot-i18n-v3.5.1.js','spot-i18n-v3.5.2.js')
(root/'owner-preview-spot352.html').write_text(p)
