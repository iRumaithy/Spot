import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../scripts/story-replies-370.inc',import.meta.url),'utf8');
const sender='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',owner='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let fail=true,committed=false,uploads=0,ids=[],messages=[];
const story={id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',owner_id:owner,expires_at:new Date(Date.now()+600000).toISOString()};
const input={value:'رد محفوظ',dataset:{story:story.id},disabled:false,isConnected:true,blur(){}},status={hidden:true},button={disabled:false},form={dataset:{story:story.id},querySelector:()=>button};
const c={console,Date,Map,Set,Promise,Error,Number,window:{},document:{addEventListener(){},getElementById:id=>({spotStoryReplyText:input,spotStoryReplyStatus:status}[id]||null),querySelector:()=>({}),querySelectorAll:()=>[]},navigator:{onLine:true},state:{me:{id:sender},stories:[story],dmMessages:[]},spotStorySession:{loaded:true,reasons:new Set()},spotCanView:()=>true,spotUi:ar=>ar,spotSetPause(){},alertToast(){},updateHeader(){},spotLoadMessages:async()=>{},spotUUID:()=>`11111111-1111-4111-8111-${String(ids.length+1).padStart(12,'0')}`,escape:s=>String(s??'').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),ico:()=>'',setInterval(){},requestAnimationFrame:fn=>fn()};
c.sup={
 storage:{from:()=>({upload:async()=>{uploads++;return {error:null}}})},
 from:()=>({
  insert(row){ids.push(row.id);if(!fail||committed)messages.push(row);return {select:()=>({single:async()=>({error:fail?{message:'network error'}:null})})}},
  select(){return {eq(){return this},maybeSingle:async()=>({data:committed?{id:ids.at(-1)}:null,error:null})}}
 })
};

vm.runInNewContext(source+`;spotStoryReplyThumbnail=async()=>({size:100});globalThis.api={send:spotSendStoryReply,attempts:spotStoryReplyAttempts,drafts:spotStoryReplyDrafts,context:spotDmStoryContext};`,c);
await c.api.send(form);assert.equal(input.value,'رد محفوظ');assert.equal(status.hidden,false);assert.equal(c.api.drafts.get(story.id),'رد محفوظ');assert.equal(uploads,1);const firstId=ids[0];
fail=false;await c.api.send(form);assert.equal(uploads,1,'Retry must reuse the uploaded private thumbnail');assert.equal(ids[1],firstId,'Retry must keep the same message id');assert.equal(messages[0].recipient_id,owner);assert.equal(messages[0].story_id,story.id);assert.equal(messages[0].story_preview_path,sender+'/'+firstId+'.jpg');assert.equal(input.value,'');assert.equal(c.api.attempts.size,0);
input.value='نجح الحفظ وفُقد الرد من الخادم';fail=true;committed=true;await c.api.send(form);assert.equal(input.value,'','A confirmed existing row resolves an ambiguous save');assert.equal(messages.length,2);
const before=uploads;input.value='لا ترسل لستوري منتهية';story.expires_at=new Date(Date.now()-1000).toISOString();await c.api.send(form);assert.equal(uploads,before);assert.equal(input.value,'لا ترسل لستوري منتهية');
const html=c.api.context({id:'dm',sender_id:sender,story_id:story.id,story_preview_path:'private.jpg',story_context:{caption:'<script>alert(1)</script>',media_type:'video'}});assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('▶'));assert.ok(!html.includes('<script>'));
console.log('PASS failed-send draft retention, idempotent retry, thumbnail reuse, recipient binding, ambiguous-save recovery, expiry guard and escaped video context');
