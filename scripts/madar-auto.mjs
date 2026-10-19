// No interactive inputs or GitHub PAT. Secrets are used only for Madar requests.
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,appendFileSync} from 'node:fs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const sha=git('rev-parse','HEAD'),mode=process.argv[2];
function output(key,value){if(!/^[a-z_]+$/.test(key)||/[\r\n]/.test(String(value)))throw Error('Invalid output');appendFileSync(process.env.GITHUB_OUTPUT,key+'='+value+'\n');}
function required(key){if(!process.env[key])throw Error('Missing '+key);return process.env[key];}
async function request(path,body){const origin=new URL(required('OWNER_HUB_URL'));if(origin.protocol!=='https:'||origin.username||origin.password)throw Error('Invalid Madar URL');const u=new URL('/api/integration/'+path,origin);if(!body)u.searchParams.set('appId',required('OWNER_HUB_APP_ID'));const r=await fetch(u,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(30000),headers:{Authorization:'Bearer '+required('OWNER_HUB_TOKEN'),'OAI-Sites-Authorization':'Bearer '+required('OWNER_HUB_SITE_ACCESS'),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('Madar HTTP '+r.status);return r.json();}
try{
 if(required('OWNER_HUB_APP_ID')!=='spot')throw Error('This automation is only for Spot');
 if(mode==='submit'){
  const router=readFileSync('release-router.js','utf8'),version=router.match(/\bNEXT\s*=\s*['"]([^'"]+)['"]/)?.[1];
  if(!/^\d+\.\d+\.\d+$/.test(version||'')||!existsSync('spot-v'+version+'.js'))throw Error('NEXT and version file must match');
  const message=git('show','-s','--format=%B','HEAD'),title=message.split('\n')[0].slice(0,200)||'تحديث Spot '+version;
  const changed=git('diff-tree','--root','--no-commit-id','--name-only','-r',sha).split('\n').filter(x=>!x.startsWith('.')&&!x.startsWith('scripts/')).slice(0,60);
  const notes=existsSync('RELEASE-NOTES.md')?readFileSync('RELEASE-NOTES.md','utf8').trim():message+'\n\nالملفات المتغيرة:\n'+changed.join('\n');
  const result=await request('candidate',{appId:'spot',version,commitSha:sha,title,changes:notes.slice(0,10000),automatic:true});if(result.ok!==true)throw Error('Candidate not accepted');
  output('version',version);output('commit',sha);console.log('Private immutable preview linked; candidate submitted.');
 }else if(mode==='approved'){
  const result=await request('next-publication');
  if(result.ready!==true){output('ready','false');console.log('No approved release awaiting publication.');}
  else{if(!/^\d+\.\d+\.\d+$/.test(result.version)||!/^[a-f0-9]{40}$/.test(result.commit))throw Error('Invalid publication response');output('ready','true');output('version',result.version);output('commit',result.commit);}
 }else throw Error('Use submit or approved');
}catch(error){console.error(error.message);process.exit(1);}
