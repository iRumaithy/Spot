/* Spot place covers: preview and uploaded JPEG share one 3:2 source rectangle. */
(()=>{'use strict';
let active=null;
const ui=(ar,en)=>window.SPOT_I18N?.language==='en'?en:ar;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,Number(v)||0));
function geometry(width,height,x=.5,y=.5,zoom=1){
 const sw=Math.min(width,height*1.5)/clamp(zoom,1,3),sh=sw/1.5;
 return {sx:(width-sw)*clamp(x),sy:(height-sh)*clamp(y),sw,sh};
}
function reset(){const old=active;active=null;if(old){old.image?.close?.();if(old.url)URL.revokeObjectURL(old.url)}}
function markup(){return `<section id="spotPlaceCrop" class="spot-place-crop hidden" aria-labelledby="spotCropTitle"><strong id="spotCropTitle">${ui('حدّد الجزء الظاهر من صورة المكان','Choose the visible part of your place photo')}</strong><p id="spotCropHelp">${ui('هذا هو الجزء الذي سيظهر في القائمة وتفاصيل المكان. اسحب الصورة بإصبعك لتحديد الجزء المرغوب.','This exact area will appear in the list and place details. Drag the photo to choose the visible area.')}</p><div class="spot-crop-frame"><canvas id="spotCropCanvas" width="900" height="600" tabindex="0" role="img" aria-label="${ui('اسحب الصورة لتحديد الجزء الظاهر، أو استخدم أسهم لوحة المفاتيح','Drag to position the photo, or use the keyboard arrow keys')}" aria-describedby="spotCropHelp"></canvas></div><div class="spot-crop-tools"><label for="spotCropZoom">${ui('تكبير الصورة','Photo zoom')}</label><input id="spotCropZoom" type="range" min="1" max="3" step="0.05" value="1"><button id="spotCropReset" class="btn outline sm" type="button">${ui('توسيط الصورة','Center photo')}</button><button id="spotCropRemove" class="btn ghost sm" type="button">${ui('إلغاء الصورة المختارة','Remove selected photo')}</button></div><p id="spotCropStatus" role="status" class="muted-small"></p></section>`}
function draw(run){if(active!==run||!run.image)return;const g=geometry(run.image.width||run.image.naturalWidth,run.image.height||run.image.naturalHeight,run.x,run.y,run.zoom),c=run.canvas,ctx=c.getContext('2d');ctx.fillStyle='#f7f5f0';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(run.image,g.sx,g.sy,g.sw,g.sh,0,0,c.width,c.height);run.rect=g}
async function decode(file,run){try{return await createImageBitmap(file)}catch{run.url=URL.createObjectURL(file);const image=new Image();image.src=run.url;await image.decode();return image}}
function load(input){
 reset();const file=input.files?.[0],panel=document.getElementById('spotPlaceCrop');if(!panel)return Promise.resolve(null);panel.classList.toggle('hidden',!file);if(!file)return Promise.resolve(null);
 const canvas=document.getElementById('spotCropCanvas'),status=document.getElementById('spotCropStatus'),zoom=document.getElementById('spotCropZoom');
 const run=active={file,input,canvas,x:.5,y:.5,zoom:1,image:null,url:null,pointer:null};zoom.value='1';panel.setAttribute('aria-busy','true');status.textContent=ui('جارٍ تجهيز معاينة الصورة…','Preparing photo preview…');canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
 run.ready=(async()=>{if(file.size>16*1024*1024)throw Error(ui('اختر صورة لا تتجاوز 16MB','Choose an image up to 16MB'));const image=await decode(file,run);if(active!==run||!input.isConnected){image.close?.();if(run.url)URL.revokeObjectURL(run.url);return null}run.image=image;draw(run);status.textContent=ui('سيُحفظ الجزء المعروض عند حفظ المكان.','The displayed area will be saved when you save the place.');panel.setAttribute('aria-busy','false');return run})().catch(error=>{if(active===run){run.error=Error(file.size>16*1024*1024?ui('اختر صورة لا تتجاوز 16MB','Choose an image up to 16MB'):ui('تعذر فتح الصورة. اختر صورة أخرى بصيغة JPG أو PNG.','Unable to open this photo. Choose another JPG or PNG image.'));status.textContent=run.error.message;panel.setAttribute('aria-busy','false')}throw run.error||error});
 canvas.onpointerdown=e=>{if(!run.image||active!==run||e.isPrimary===false||e.button!==0)return;e.preventDefault();const bounds=canvas.getBoundingClientRect();run.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:run.x,startY:run.y,bounds,rect:{...run.rect}};canvas.setPointerCapture(e.pointerId)};
 canvas.onpointermove=e=>{const p=run.pointer;if(active!==run||!p||p.id!==e.pointerId)return;e.preventDefault();const width=run.image.width||run.image.naturalWidth,height=run.image.height||run.image.naturalHeight;run.x=width-p.rect.sw>0?clamp(p.startX-(e.clientX-p.x)*p.rect.sw/p.bounds.width/(width-p.rect.sw)):.5;run.y=height-p.rect.sh>0?clamp(p.startY-(e.clientY-p.y)*p.rect.sh/p.bounds.height/(height-p.rect.sh)):.5;draw(run)};
 const finish=e=>{if(run.pointer?.id===e.pointerId)run.pointer=null};canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=finish;
 canvas.onkeydown=e=>{if(!run.image||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();run.x=clamp(run.x+(e.key==='ArrowLeft'?.05:e.key==='ArrowRight'?-.05:0));run.y=clamp(run.y+(e.key==='ArrowUp'?.05:e.key==='ArrowDown'?-.05:0));draw(run)};
 zoom.oninput=()=>{run.pointer=null;run.zoom=clamp(zoom.value,1,3);draw(run)};
 document.getElementById('spotCropReset').onclick=()=>{run.pointer=null;run.x=run.y=.5;run.zoom=1;zoom.value='1';draw(run)};
 document.getElementById('spotCropRemove').onclick=()=>{input.value='';reset();panel.classList.add('hidden');status.textContent=''};
 return run.ready.catch(()=>null);
}
async function blob(file){
 const run=active;if(!run||run.file!==file)throw Error(ui('اختر الصورة وحدّد الجزء الظاهر قبل الحفظ','Choose a photo and preview its visible area before saving'));
 await run.ready;if(active!==run||!run.image||run.input.files?.[0]!==file)throw Error(ui('تغيّرت الصورة، راجع المعاينة ثم احفظ','The photo changed. Review the preview and save again'));
 const image=run.image,g=geometry(image.width||image.naturalWidth,image.height||image.naturalHeight,run.x,run.y,run.zoom),canvas=document.createElement('canvas');canvas.width=Math.max(3,Math.floor(Math.min(1600,g.sw)/3)*3);canvas.height=canvas.width*2/3;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f5f0';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,g.sx,g.sy,g.sw,g.sh,0,0,canvas.width,canvas.height);
 const result=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));if(!result)throw Error(ui('تعذر تجهيز الصورة للحفظ، حاول مجددًا','Unable to prepare the photo. Please try again'));return result;
}
window.SPOT_PLACE_CROP={markup,load,reset,blob,geometry};
})();
