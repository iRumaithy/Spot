import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../release-router.js',import.meta.url),'utf8');
async function routed(stable,accepted){
 const loaded=[],store=new Map(accepted?[['thawaq-user-approved-version',accepted]]:[]);
 const document={getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},addEventListener(){},createElement(tag){return {tag,style:{},setAttribute(){},addEventListener(){}}},head:{appendChild(el){if(el.onload)el.onload()}},body:{appendChild(el){loaded.push(el.src)}}};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const context={document,window:{APP_CONFIG:{SUPABASE_URL:'https://example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture'}},localStorage:storage,sessionStorage:{getItem(){return null}},fetch:async()=>({ok:true,json:async()=>[{stable_version:stable}]}),setInterval(){},setTimeout(){},console,location:{reload(){}}};
 vm.runInNewContext(source,context);await new Promise(setImmediate);return loaded.find(Boolean);
}
const cases=[['3.3.0',null,'spot-v3.3.0.js'],['3.3.0','3.3.0','spot-v3.3.0.js'],['3.3.0','3.2.1','spot-v3.2.1.js'],['3.3.0','3.4.0','spot-v3.2.1.js'],['3.4.0',null,'spot-v3.4.0.js'],['3.4.0','3.3.0','spot-v3.3.0.js'],['3.4.0','3.2.1','spot-v3.2.1.js'],['3.4.0','3.4.0','spot-v3.4.0.js'],['3.4.0','3.1.2','thawaq-v3.1.2.js']];
for(const [stable,accepted,expected] of cases)assert.ok((await routed(stable,accepted)).includes(expected),`stable=${stable}, accepted=${accepted}`);
console.log(`PASS ${cases.length} release routing cases: candidate gating and installed-version retention`);
const app=readFileSync(new URL('../spot-v3.4.0.js',import.meta.url),'utf8');
const previewExpression=app.match(/PREVIEW_ONLY=(.*?), SURL=/)[1];
for(const [pathname,expected] of [['/Spot/index.html',false],['/Spot/owner-preview-spot340.html',true],['/preview/aca7fdfb2efe0e08639ce8553cd7004208f0a9b5/3.4.0/index.html',true]]){
 assert.equal(vm.runInNewContext(previewExpression,{location:{pathname}}),expected,pathname);
}
console.log('PASS 3 preview route cases: managed preview disables system notifications and app worker');
