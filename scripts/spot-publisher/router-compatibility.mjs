// Validate the explicit installed-version branch in routers that retain more than
// one published release. Approval signatures and exact commit checks stay in edge/index.ts.
export function retainedVersionAsset(router,currentVersion){
 if(!/^\d+\.\d+\.\d+$/.test(currentVersion))return null;
 const code=router.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').replace(/\s+/g,'');
 // Current routers keep installed versions in an explicit asset map. Require the
 // bounded installed-version selection and its actual script assignment too.
 const map=code.match(/constassets=\{([^{}]*)\};/);
 if(map&&code.includes('constchooseVersion=(live,accepted)=>assets[accepted]&&cmp(accepted,live)<=0?accepted:')&&code.includes('constselected=chooseVersion(live,accepted);')&&code.includes('script.src=assets[selected];')){
  const rows=[...map[1].matchAll(/['"](\d+\.\d+\.\d+)['"]:['"]\.\/(spot-v\d+\.\d+\.\d+\.js|thawaq-v3\.1\.2\.js)(?:\?[^'"\\]*)?['"]/g)];
  if(rows.map(r=>r[0]).join(',')!==map[1]||new Set(rows.map(r=>r[1])).size!==rows.length)return null;
  const row=rows.find(r=>r[1]===currentVersion);
  return row&&row[2]==='spot-v'+currentVersion+'.js'?row[2]:null;
 }
 const stable=code.match(/(?:const|,)STABLE=['"]([^'"]+)['"]/)?.[1];
 if(stable===currentVersion)return 'spot-v'+currentVersion+'.js';
 const legacy=code.match(/(?:const|,)LEGACY=['"]([^'"]+)['"]/)?.[1];
 if(!legacy||legacy===currentVersion)return null;
 if(!code.includes('constuseCandidate=cmp(live,NEXT)>=0&&(accepted===NEXT||!accepted);')||!code.includes('constuseLegacy=accepted===LEGACY;'))return null;
 const escaped=currentVersion.replace(/\./g,'\\.');
 const branch=code.match(new RegExp("const([A-Za-z_$][\\w$]*)=!useCandidate&&!useLegacy&&\\(accepted===['\"]"+escaped+"['\"]\\|\\|\\(!accepted&&cmp\\(live,['\"]"+escaped+"['\"]\\)>=0\\)\\);"));
 if(!branch)return null;
 const alias=branch[1];
 const selection=new RegExp("script\\.src=useCandidate\\?['\"]\\./spot-v[0-9.]+\\.js(?:\\?[^'\"]*)?['\"]:"+alias+"\\?['\"]\\./spot-v"+escaped+"\\.js(?:\\?[^'\"]*)?['\"]:");
 return selection.test(code)?'spot-v'+currentVersion+'.js':null;
}

