import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
const url=Deno.env.get('SUPABASE_URL')!
const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}')
const admin=createClient(url,keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
const cors={'Access-Control-Allow-Origin':'https://irumaithy.github.io','Access-Control-Allow-Headers':'authorization,content-type,apikey,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'}
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}})
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 if(req.method!=='POST')return reply({ok:false},405)
 try{
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')
  const {data:{user},error:authError}=await admin.auth.getUser(token)
  if(authError||!user)return reply({ok:false,error:'UNAUTHORIZED'},401)
  const {data:me}=await admin.from('profiles').select('id,is_active,is_private').eq('id',user.id).single()
  if(!me?.is_active)return reply({ok:false,error:'FORBIDDEN'},403)
  const body=await req.json()
  if(typeof body.is_private!=='boolean')return reply({ok:false,error:'INVALID_INPUT'},400)
  // Hide rows before moving bytes. A partial failure remains private and can safely be retried.
  if(body.is_private){
   const {error}=await admin.from('profiles').update({is_private:true}).eq('id',user.id);if(error)throw error
   const prefix=url+'/storage/v1/object/public/blog-media/'
   const columns:Record<string,string[]>={places:['cover_url','receipt_url'],visits:['receipt_url'],items:['photo_url']}
   const moved=new Set<string>()
   for(const [table,fields] of Object.entries(columns)){
    const {data:rows,error:readError}=await admin.from(table).select(['id',...fields].join(',')).eq('owner_id',user.id)
    if(readError)throw readError
    for(const row of rows||[]){
     const updates:Record<string,string>={}
     for(const field of fields){
      const value=String((row as any)[field]||'')
      if(value.startsWith('spot-media:')){moved.add(value.slice(11));continue}
      if(!value.startsWith(prefix))continue
      const path=decodeURIComponent(value.slice(prefix.length).split('?')[0])
      if(!path.startsWith(user.id+'/')||path.includes('..'))continue
      if(!moved.has(path)){
       const {data:blob,error:downloadError}=await admin.storage.from('blog-media').download(path)
       if(downloadError)throw downloadError
       const {error:uploadError}=await admin.storage.from('spot-private').upload(path,blob,{contentType:blob.type||'image/jpeg',upsert:true})
       if(uploadError)throw uploadError
       moved.add(path)
      }
      updates[field]='spot-media:'+path
     }
     if(Object.keys(updates).length){const {error}=await admin.from(table).update(updates).eq('id',(row as any).id).eq('owner_id',user.id);if(error)throw error}
    }
   }
   // All referring rows now point to protected storage. Avatars remain public.
   if(moved.size){const {error}=await admin.storage.from('blog-media').remove([...moved]);if(error)throw error}
  }else{
   const {error}=await admin.from('profiles').update({is_private:false}).eq('id',user.id);if(error)throw error
  }
  return reply({ok:true,is_private:body.is_private})
 }catch(e){console.error('privacy change failed',e instanceof Error?e.message:'unknown');return reply({ok:false,error:'PRIVACY_UPDATE_INCOMPLETE'},500)}
})

