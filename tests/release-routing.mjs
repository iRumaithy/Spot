import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../release-router.js',import.meta.url),'utf8');
async function routed(stable,accepted){
 const loaded=[],store=new Map(accepted?[['thawaq-user-approved-version',accepted]]:[]);
 const document={getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},addEventListener(){},createElement(tag){return {tag,style:{},setAttribute(){},addEventListener(){}}},head:{appendChild(el){loaded.push(el.href||el.src);if(el.onload)el.onload()}},body:{appendChild(el){loaded.push(el.src)}}};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 vm.runInNewContext(source,{document,window:{APP_CONFIG:{SUPABASE_URL:'https://example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture'}},localStorage:storage,sessionStorage:{getItem(){return null}},fetch:async()=>({ok:true,json:async()=>[{stable_version:stable}]}),setInterval(){},setTimeout(){},console,URL,location:{href:'https://example.invalid/Spot/',replace(){},reload(){}}});await new Promise(setImmediate);return loaded.filter(Boolean).join(' ');
}
const cases=[['3.5.5','3.5.6','spot-v3.5.5.js'],['3.5.6',null,'spot-v3.5.6.js'],['3.5.6','3.5.5','spot-v3.5.5.js'],['3.5.6','3.5.4','spot-v3.5.4.js'],['3.5.4','3.5.5','spot-v3.5.4.js'],['3.5.5',null,'spot-v3.5.5.js'],['3.5.5','3.5.4','spot-v3.5.4.js'],['3.5.5','3.5.3','spot-v3.5.3.js'],['3.5.3','3.5.4','spot-v3.5.3.js'],['3.5.4',null,'spot-v3.5.4.js'],['3.5.4','3.5.3','spot-v3.5.3.js'],['3.5.4','3.5.2','spot-v3.5.2.js'],['3.5.2','3.5.3','spot-v3.5.2.js'],['3.5.3',null,'spot-v3.5.3.js'],['3.5.3','3.5.3','spot-v3.5.3.js'],['3.5.3','3.5.2','spot-v3.5.2.js'],['3.5.1','3.5.2','spot-v3.5.1.js'],['3.5.2',null,'spot-v3.5.2.js'],['3.5.2','3.5.2','spot-v3.5.2.js'],['3.5.2','3.5.1','spot-v3.5.1.js'],['3.5.0','3.5.1','spot-v3.5.0.js'],['3.5.1',null,'spot-v3.5.1.js'],['3.5.1','3.5.1','spot-v3.5.1.js'],['3.5.1','3.5.0','spot-v3.5.0.js'],['3.5.1','3.4.0','spot-v3.4.0.js'],['3.3.0',null,'spot-v3.3.0.js'],['3.3.0','3.3.0','spot-v3.3.0.js'],['3.3.0','3.4.0','spot-v3.3.0.js'],['3.4.0',null,'spot-v3.4.0.js'],['3.4.0','3.3.0','spot-v3.3.0.js'],['3.4.0','3.4.0','spot-v3.4.0.js'],['3.4.0','3.5.0','spot-v3.4.0.js'],['3.5.0',null,'spot-v3.5.0.js'],['3.5.0','3.4.0','spot-v3.4.0.js'],['3.5.0','3.3.0','spot-v3.3.0.js'],['3.5.0','3.2.1','spot-v3.2.1.js'],['3.5.0','3.5.0','spot-v3.5.0.js'],['3.5.0','3.1.2','thawaq-v3.1.2.js']];
for(const [stable,accepted,expected] of cases)assert.ok((await routed(stable,accepted)).includes(expected),`stable=${stable},accepted=${accepted}`);
const app=readFileSync(new URL('../spot-v3.5.6.js',import.meta.url),'utf8'),expression=app.match(/PREVIEW_ONLY=(.*?), SURL=/)[1];
for(const [pathname,expected] of [['/Spot/index.html',false],['/Spot/owner-preview-spot356.html',true],['/preview/'+ 'a'.repeat(40)+'/3.5.2/index.html',true]])assert.equal(vm.runInNewContext(expression,{location:{pathname}}),expected);
console.log('PASS '+cases.length+' release routing cases and 3 preview routes');

for(const [stable,accepted,css] of [['3.5.3',null,'spot-v3.5.3.css'],['3.5.3','3.5.2','spot-v3.5.2.css'],['3.5.2',null,'spot-v3.5.2.css']])assert.ok((await routed(stable,accepted)).includes(css));

assert.ok((await routed('3.5.4',null)).includes('spot-place-crop-v3.5.4.js'));assert.ok(!(await routed('3.5.4','3.5.3')).includes('spot-place-crop-v3.5.4.js'));assert.ok((await routed('3.5.4',null)).includes('spot-v3.5.4.css'));

for(const [stable,accepted,css] of [['3.5.5',null,'spot-v3.5.5.css'],['3.5.5','3.5.4','spot-v3.5.4.css']])assert.ok((await routed(stable,accepted)).includes(css));
assert.ok((await routed('3.5.5',null)).includes('spot-place-crop-v3.5.4.js'));

assert.ok((await routed('3.5.6',null)).includes('spot-v3.5.6.css'));assert.ok((await routed('3.5.6','3.5.5')).includes('spot-v3.5.5.css'));assert.ok((await routed('3.5.6',null)).includes('spot-place-crop-v3.5.4.js'));
