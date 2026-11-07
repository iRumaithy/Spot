import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map(),exports=[];let closed=0,pending=[];
function canvas(){const draws=[];return {width:900,height:600,draws,getContext(){return {fillRect(){},clearRect(){},drawImage(...args){draws.push(args)}}},getBoundingClientRect(){return {width:300,height:200}},setPointerCapture(){},toBlob(fn,type){fn({type,width:this.width,height:this.height,draw:draws.at(-1)})}}}
for(const id of ['spotPlaceCrop','spotCropCanvas','spotCropStatus','spotCropZoom','spotCropReset','spotCropRemove'])elements.set(id,id==='spotCropCanvas'?canvas():{classList:{toggle(){},add(){}},setAttribute(){}});
const context={window:{},Image:class{},URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},document:{getElementById:id=>elements.get(id),createElement(){const c=canvas();exports.push(c);return c}},createImageBitmap:async(file)=>{if(file.deferred)return new Promise(resolve=>pending.push(resolve));return {width:file.width,height:file.height,close(){closed++}}}};
vm.runInNewContext(readFileSync(new URL('../spot-place-crop-v3.5.4.js',import.meta.url),'utf8'),context);
const crop=context.window.SPOT_PLACE_CROP;
for(const [w,h] of [[900,1800],[1800,900],[1500,1000]])for(const z of [1,2,3])for(const x of [-1,0,.5,1,2]){
 const g=crop.geometry(w,h,x,x,z);assert.equal(g.sw/g.sh,1.5);assert.ok(g.sx>=0&&g.sy>=0&&g.sx+g.sw<=w+.001&&g.sy+g.sh<=h+.001);
}
const file={width:900,height:1800,size:1000},input={files:[file],isConnected:true,value:'photo'};
await crop.load(input);const preview=elements.get('spotCropCanvas');
preview.onpointerdown({isPrimary:true,button:0,pointerId:1,clientX:150,clientY:150,preventDefault(){}});
preview.onpointermove({pointerId:1,clientX:150,clientY:50,preventDefault(){}});
const shown=preview.draws.at(-1).slice(1,5),saved=await crop.blob(file);
assert.deepEqual(saved.draw.slice(1,5),shown);assert.equal(saved.width/saved.height,1.5);assert.ok(shown[1]>600);
elements.get('spotCropReset').onclick();assert.equal(preview.draws.at(-1)[2],600);
elements.get('spotCropZoom').value=2;elements.get('spotCropZoom').oninput();assert.equal(preview.draws.at(-1)[3],450);
crop.reset();await assert.rejects(crop.blob(file));assert.equal(closed,1);
const old={width:900,height:1800,size:100,deferred:true};const wait=crop.load({files:[old],isConnected:true});await crop.load(input);pending.shift()({width:100,height:100,close(){closed++}});await wait;assert.ok(await crop.blob(file));assert.equal(closed,2);
elements.get('spotCropRemove').onclick();assert.equal(input.value,'');await assert.rejects(crop.blob(file));
console.log('PASS: bounded portrait/landscape/zoom crops, drag/export equality, reset, removal and stale selection handling');
