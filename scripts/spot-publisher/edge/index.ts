import {verifyProof,compareVersions} from '../verify-proof.mjs';
import {retainedVersionAsset} from '../router-compatibility.mjs';
import publicKey from '../public-key.json' with {type:'json'};
declare const Deno:{serve(handler:(req:Request)=>Promise<Response>):void;env:{get(key:string):string|undefined}};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 if(req.method!=='POST')return json({ok:false,error:'Method not allowed'},405);
 let proof;try{proof=await verifyProof((req.headers.get('Authorization')||'').replace(/^Bearer /,''),publicKey);}catch{return json({ok:false,error:'Unauthorized'},401);}
 try{
  // Independent source verification: the approved commit must contain this app version.
  const base='https://raw.githubusercontent.com/iRumaithy/Spot/'+proof.commitSha+'/';
  const options={redirect:'error' as const,signal:AbortSignal.timeout(12000)};
  const [routerResponse,codeResponse]=await Promise.all([fetch(base+'release-router.js',options),fetch(base+'spot-v'+proof.version+'.js',options)]);
  if(!routerResponse.ok||!codeResponse.ok)return json({ok:false,error:'Release files missing at approved commit'},409);
  const router=await routerResponse.text(),code=await codeResponse.text();
  const next=router.match(/\bNEXT\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if(next!==proof.version||code.length<500)return json({ok:false,error:'Release router does not match approved version'},409);
  const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!serviceKey)return json({ok:false,error:'Backend is unavailable'},503);
  const headers={apikey:serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'};
  const get=await fetch(url+'/rest/v1/app_release?id=eq.main&select=stable_version,stable_revision',{headers,signal:AbortSignal.timeout(10000)});
  if(!get.ok)return json({ok:false,error:'Could not read current version'},502);
  const currentRows=await get.json();
  if(!Array.isArray(currentRows)||currentRows.length!==1||typeof currentRows[0].stable_version!=='string'||!/^\d+\.\d+\.\d+$/.test(currentRows[0].stable_version)||!Number.isSafeInteger(Number(currentRows[0].stable_revision)))return json({ok:false,error:'Release record missing'},409);
  const current=currentRows[0];
  if(compareVersions(proof.version,current.stable_version)<0)return json({ok:false,error:'Downgrade blocked'},409);
  if(compareVersions(proof.version,current.stable_version)>0){
   const retained=retainedVersionAsset(router,current.stable_version);
   if(!retained)return json({ok:false,error:'Release router must preserve the current stable version for installed devices'},409);
   const retainedResponse=await fetch(base+retained,options);
   if(!retainedResponse.ok||(await retainedResponse.text()).length<500)return json({ok:false,error:'Installed release file missing at approved commit'},409);
  }
  if(proof.dryRun)return json({ok:true,dryRun:true,version:proof.version,currentVersion:current.stable_version});
  if(proof.version===current.stable_version)return json({ok:true,alreadyPublished:true,version:proof.version});
  const revision=Number(current.stable_revision)+1;
  const changed=await fetch(url+'/rest/v1/app_release?id=eq.main&stable_version=eq.'+encodeURIComponent(current.stable_version)+'&stable_revision=eq.'+current.stable_revision,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},signal:AbortSignal.timeout(10000),body:JSON.stringify({stable_version:proof.version,stable_revision:revision,candidate_version:proof.version,candidate_revision:revision,candidate_available:false,candidate_notes:proof.notes,updated_at:new Date().toISOString()})});
  if(!changed.ok)return json({ok:false,error:'Could not publish approved version'},502);
  const rows=await changed.json();if(!Array.isArray(rows)||rows.length!==1)return json({ok:false,error:'Current release changed; retry review'},409);
  return json({ok:true,version:rows[0].stable_version});
 }catch{return json({ok:false,error:'Release verification failed'},502);}
});


