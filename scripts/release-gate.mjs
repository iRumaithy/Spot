#!/usr/bin/env node
// Run in the source application's CI, on an immutable checked-out commit.
// Secrets are read only from environment and never logged.
import {execFileSync} from 'node:child_process';
const [command]=process.argv.slice(2),allowed=['submit','check','publish-spot','preflight-spot'];
if(!allowed.includes(command)){console.error('Usage: node scripts/release-gate.mjs submit|check|publish-spot|preflight-spot');process.exit(2);}
function required(key){const value=process.env[key];if(!value)throw new Error('Missing environment variable: '+key);return value;}
try{
 const site=new URL(required('OWNER_HUB_URL'));if(site.protocol!=='https:'||site.username||site.password)throw new Error('OWNER_HUB_URL must be HTTPS');
 const appId=required('OWNER_HUB_APP_ID'),version=required('RELEASE_VERSION'),commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const expectedCommit=process.env.RELEASE_COMMIT||process.env.GITHUB_SHA;
 if(expectedCommit&&expectedCommit!==commit)throw new Error('Checkout does not match the selected release commit');
 const headers={'Authorization':'Bearer '+required('OWNER_HUB_TOKEN'),'OAI-Sites-Authorization':'Bearer '+required('OWNER_HUB_SITE_ACCESS')};
 if(command.endsWith('-spot')&&appId!=='spot')throw new Error('This publish command is only for Spot');
 let url=new URL('/api/integration/'+(command==='submit'?'candidate':command.endsWith('-spot')?command:'gate'),site),options={headers,redirect:'error',signal:AbortSignal.timeout(30000)};
 if(command==='submit'){options={...options,method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({appId,version,commitSha:commit,title:required('RELEASE_TITLE'),changes:required('RELEASE_CHANGES'),previewUrl:process.env.RELEASE_PREVIEW_URL||''})};}
 else if(command.endsWith('-spot')){options={...options,method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({appId,version,commitSha:commit})};}
 else{url.search=new URLSearchParams({appId,version,commit}).toString();}
 const response=await fetch(url,options);if(!response.ok)throw new Error('Owner Hub returned HTTP '+response.status);
 const result=await response.json();if(command==='check'){if(result.allowed!==true||result.commit!==commit||result.version!==version)throw new Error('This exact release is not approved. Deployment blocked.');console.log('Exact release approved. Deployment may continue.');}
 else if(command.endsWith('-spot')){if(result.ok!==true||result.version!==version)throw new Error('Spot publication was not confirmed');console.log(command==='preflight-spot'?'Spot preflight passed.':result.alreadyPublished?'Spot already uses this version.':'Spot publication confirmed.');}
 else{if(result.ok!==true)throw new Error('Candidate was not accepted');console.log(result.duplicate?'Candidate already recorded.':'Candidate submitted for owner review.');}
}catch(error){console.error(error.message);process.exit(1);}
