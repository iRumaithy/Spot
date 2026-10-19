import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,copyFileSync,existsSync,lstatSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
const version=process.env.RELEASE_VERSION;
if(!/^\d+\.\d+\.\d+$/.test(version||''))throw Error('Invalid RELEASE_VERSION');
const router=readFileSync('release-router.js','utf8'),next=router.match(/\bNEXT\s*=\s*['"]([^'"]+)['"]/)?.[1];
if(next!==version||!existsSync('spot-v'+version+'.js'))throw Error('Release version does not match the app files');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha!==process.env.RELEASE_COMMIT)throw Error('Checkout differs from requested release');
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
let count=0;for(const file of files){
 if(file.startsWith('.')||/^(scripts|supabase|docs|tests|integrations)\//.test(file)||/\.(sql|md|ya?ml|map)$/i.test(file))continue;
 if(!(/\.(html|css|js|mjs|json|webmanifest|png|jpe?g|svg|ico|webp|gif|woff2?|txt)$/i.test(file)||file==='CNAME'))continue;
 if(!lstatSync(file).isFile())throw Error('Site may not contain symbolic links');
 const target=join('_site',file);mkdirSync(dirname(target),{recursive:true});copyFileSync(file,target);count++;
}
if(!existsSync('_site/index.html'))throw Error('index.html is missing');
writeFileSync('_site/.nojekyll','');writeFileSync('_site/madar-release.json',JSON.stringify({version,commit:sha}));
console.log('Prepared '+count+' public files for Spot '+version+' ('+sha.slice(0,10)+')');
