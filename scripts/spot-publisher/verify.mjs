import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import assert from 'node:assert/strict';
import {retainedVersionAsset} from './router-compatibility.mjs';
const router=readFileSync(new URL('../../release-router.js',import.meta.url),'utf8');
for(const v of ['3.5.1','3.5.2'])assert.equal(retainedVersionAsset(router,v),'spot-v'+v+'.js');
assert.equal(retainedVersionAsset(router,'9.9.9'),null);
for(const broken of [router.replace('script.src=assets[selected]','script.src=assets[NEXT]'),router.replace('cmp(accepted,live)<=0','true'),router.replace("'3.5.2':'./spot-v3.5.2.js?v=studio3521'","'3.5.2':'./spot-v3.5.1.js'"),router.replace("'3.5.2':'./spot-v3.5.2.js?v=studio3521'","'3.5.2':'https://untrusted.invalid/app.js'")])assert.equal(retainedVersionAsset(broken,'3.5.2'),null);
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const pub=await crypto.subtle.exportKey('jwk',pair.publicKey);
let handler,patches=0,missing=false;
globalThis.Deno={serve(fn){handler=fn},env:{get(k){return k==='SUPABASE_URL'?'https://fixture.invalid':'test-service-key'}}};
globalThis.fetch=async(url,options={})=>{
 if(url.includes('raw.githubusercontent.com')){if(url.endsWith('release-router.js'))return new Response(router);return new Response('x'.repeat(600),{status:missing?404:200})}
 if(options.method==='PATCH'){patches++;return Response.json([{stable_version:'3.5.3'}])}
 return Response.json([{stable_version:'3.5.2',stable_revision:3}]);
};
let source=stripTypeScriptTypes(readFileSync(new URL('./edge/index.ts',import.meta.url),'utf8'));
source=source.replace("'../verify-proof.mjs'",JSON.stringify(new URL('./verify-proof.mjs',import.meta.url).href)).replace("'../router-compatibility.mjs'",JSON.stringify(new URL('./router-compatibility.mjs',import.meta.url).href)).replace(/import publicKey from .*?;/,'const publicKey='+JSON.stringify(pub)+';');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
async function request(dryRun){const at=Math.floor(Date.now()/1000),h=enc({alg:'ES256',typ:'JWT'}),p=enc({iss:'https://owner-hub-rumaithy.alromaithi-3bo0d.chatgpt.site',aud:'spot-madar-release',appId:'spot',repository:'iRumaithy/Spot',version:'3.5.3',commitSha:'a'.repeat(40),notes:'test',dryRun,iat:at,exp:at+60});const sig=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(h+'.'+p))).toString('base64url');return handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer '+h+'.'+p+'.'+sig}}))}
assert.equal((await handler(new Request('https://fixture.invalid',{method:'POST'}))).status,401);
let result=await request(true);assert.equal(result.status,200);assert.equal((await result.json()).dryRun,true);assert.equal(patches,0);
missing=true;assert.equal((await request(true)).status,409);assert.equal(patches,0);
missing=false;result=await request(false);assert.equal(result.status,200);assert.equal((await result.json()).version,'3.5.3');assert.equal(patches,1);
console.log('PASS: retained versions, malformed routes, proof authentication, dry-run, missing files and approved publication');
