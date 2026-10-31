import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retainedVersionAsset} from '../supabase/functions/spot-madar-release/router-compatibility.mjs';
const router=readFileSync(new URL('../release-router.js',import.meta.url),'utf8');
test('approved 3.4.0 router retains both current and older installed releases',()=>{
 assert.equal(retainedVersionAsset(router,'3.3.0'),'spot-v3.3.0.js');
 assert.equal(retainedVersionAsset(router,'3.2.1'),'spot-v3.2.1.js');
});
test('reject a retained branch that actually serves another version',()=>{
 assert.equal(retainedVersionAsset(router.replace("use330?'./spot-v3.3.0.js","use330?'./spot-v3.2.1.js"),'3.3.0'),null);
});
test('reject removed installed-version condition and unconditional candidate routing',()=>{
 assert.equal(retainedVersionAsset(router.replace("accepted==='3.3.0'||","accepted==='3.2.0'||"),'3.3.0'),null);
 assert.equal(retainedVersionAsset(router.replace('cmp(live,NEXT)>=0&&(accepted===NEXT||!accepted)','true'),'3.3.0'),null);
});
test('filenames in comments and unknown versions cannot establish compatibility',()=>{
 assert.equal(retainedVersionAsset("/* "+router.replace(/\/\*[\s\S]*?\*\//g,'')+" */",'3.3.0'),null);
 assert.equal(retainedVersionAsset(router,'3.5.0'),null);
 assert.equal(retainedVersionAsset(router,'3.3.0/../../'),null);
});
