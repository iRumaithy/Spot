// Validate the explicit installed-version branch in routers that retain more than
// one published release. Approval signatures and exact commit checks stay in edge/index.ts.
export function retainedVersionAsset(router,currentVersion){
 if(!/^\d+\.\d+\.\d+$/.test(currentVersion))return null;
 const code=router.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').replace(/\s+/g,'');
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
