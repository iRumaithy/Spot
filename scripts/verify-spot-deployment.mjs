const url=new URL(process.env.SITE_URL||'');
if(url.protocol!=='https:')throw Error('Missing HTTPS Pages URL');
const manifestUrl=new URL('madar-release.json?verify='+Date.now(),url.href.endsWith('/')?url:new URL(url.href+'/'));
const r=await fetch(manifestUrl,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
if(!r.ok)throw Error('Could not confirm the live Pages release');
const value=await r.json();
if(value.commit!==process.env.RELEASE_COMMIT||value.version!==process.env.RELEASE_VERSION)throw Error('Live Pages files do not match the approved version. Activation blocked; retry after the CDN refreshes.');
console.log('Live Pages release matches the approved commit and version.');
