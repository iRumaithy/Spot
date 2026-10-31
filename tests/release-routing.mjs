import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../release-router.js',import.meta.url),'utf8');
async function routed(stable,accepted){
 const loaded=[],store=new Map(accepted?[['thawaq-user-approved-version',accepted]]:[]);
 const document={getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},addEventListener(){},createElement(tag){return {tag,style:{},setAttribute(){},addEventListener(){}}},head:{appendChild(el){if(el.onload)el.onload()}},body:{appendChild(el){loaded.push(el.src)}}};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 vm.runInNewContext(source,{document,window:{APP_CONFIG:{SUPABASE_URL:'https://example.invalid',SUPABASE_PUBLISHABLE_KEY:'fixture'}},localStorage:storage,sessionStorage:{getItem(){return null}},fetch:async()=>({ok:true,json:async()=>[{stable_version:stable}]}),setInterval(){},setTimeout(){},console,URL,location:{href:'https://example.invalid/Spot/',replace(){},reload(){}}});await new Promise(setImmediate);return loaded.find(Boolean);
}
const cases=[['3.3.0',null,'spot-v3.3.0.js'],['3.3.0','3.3.0','spot-v3.3.0.js'],['3.3.0','3.4.0','spot-v3.3.0.js'],['3.4.0',null,'spot-v3.4.0.js'],['3.4.0','3.3.0','spot-v3.3.0.js'],['3.4.0','3.4.0','spot-v3.4.0.js'],['3.4.0','3.5.0','spot-v3.4.0.js'],['3.5.0',null,'spot-v3.5.0.js'],['3.5.0','3.4.0','spot-v3.4.0.js'],['3.5.0','3.3.0','spot-v3.3.0.js'],['3.5.0','3.2.1','spot-v3.2.1.js'],['3.5.0','3.5.0','spot-v3.5.0.js'],['3.5.0','3.1.2','thawaq-v3.1.2.js']];
for(const [stable,accepted,expected] of cases)assert.ok((await routed(stable,accepted)).includes(expected),`stable=${stable},accepted=${accepted}`);
const app=readFileSync(new URL('../spot-v3.5.0.js',import.meta.url),'utf8'),expression=app.match(/PREVIEW_ONLY=(.*?), SURL=/)[1];
for(const [pathname,expected] of [['/Spot/index.html',false],['/Spot/owner-preview-spot350.html',true],['/preview/'+ 'a'.repeat(40)+'/3.5.0/index.html',true]])assert.equal(vm.runInNewContext(expression,{location:{pathname}}),expected);
console.log('PASS 13 release routing cases and 3 preview routes');
