// A disabled video track can be resumed while this visible app session remains open.
// The browser, rather than localStorage, remains the authority for camera permission.
const spotCameraPool={stream:null,facing:'environment',owner:null,pending:null,epoch:0};
function spotHardStopCamera(){spotCameraPool.epoch++;spotStopStream(spotCameraPool.stream);spotCameraPool.stream=null;spotCameraPool.pending=null;spotCameraPool.owner=null}
function spotParkCamera(stream,ownerRun=null){if(!stream)return;if(ownerRun&&spotComposer&&spotComposer!==ownerRun&&spotComposer.stream===stream)return;if(stream!==spotCameraPool.stream){spotStopStream(stream);return}stream.getVideoTracks().forEach(track=>track.enabled=false)}
async function spotAcquireCamera(facing='environment'){
 const owner=state.me?.id;if(!owner||document.hidden)throw Object.assign(Error('Camera session unavailable'),{name:'AbortError'});
 if(spotCameraPool.owner&&spotCameraPool.owner!==owner)spotHardStopCamera();spotCameraPool.owner=owner;
 const live=spotCameraPool.stream?.getVideoTracks().some(track=>track.readyState==='live');
 if(live&&spotCameraPool.facing===facing){spotCameraPool.stream.getVideoTracks().forEach(track=>track.enabled=true);return spotCameraPool.stream}
 if(spotCameraPool.pending){const pending=spotCameraPool.pending;await pending;if(spotCameraPool.pending===pending)spotCameraPool.pending=null;return spotAcquireCamera(facing)}
 if(spotCameraPool.stream){spotHardStopCamera();spotCameraPool.owner=owner}
 const epoch=spotCameraPool.epoch;
 const pending=navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}}}).then(stream=>{if(epoch!==spotCameraPool.epoch||document.hidden||state.me?.id!==owner){spotStopStream(stream);throw Object.assign(Error('Camera session ended'),{name:'AbortError'})}spotCameraPool.stream=stream;spotCameraPool.facing=facing;return stream});spotCameraPool.pending=pending;
 try{return await pending}finally{if(spotCameraPool.pending===pending)spotCameraPool.pending=null}
}
function spotReleaseCamera(run){spotParkCamera(run?.stream);spotStopStream(run?.audioStream);if(run){run.stream=null;run.audioStream=null}const video=$('#spotCameraLive');if(video){video.pause();video.srcObject=null}}
function spotShowCameraPermissionHelp(){if(!spotComposer)return;$('#spotCameraPermissionHelp')?.remove();const help=document.createElement('aside');help.id='spotCameraPermissionHelp';help.className='spot-camera-permission-help';help.setAttribute('role','dialog');help.setAttribute('aria-label','حفظ إذن الكاميرا');help.innerHTML='<b>إذن الكاميرا لموقع Spot</b><p>في Safari افتح قائمة الصفحة ← إعدادات الموقع ← الكاميرا ← سماح.</p><p>هذا الاختيار يخص موقع Spot. إذا بقي الخيار «سؤال»، يستطيع Safari طلب الإذن مجددًا؛ التطبيق لا يغيّر اختيارك تلقائيًا.</p><button type="button" data-action="camera-permission-close">فهمت</button>';$('#spotStoryForm').appendChild(help);help.querySelector('button').focus()}
document.addEventListener('visibilitychange',()=>{if(document.hidden)spotHardStopCamera()});
window.addEventListener('pagehide',spotHardStopCamera);
