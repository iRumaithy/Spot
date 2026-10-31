import { createClient } from 'npm:@supabase/supabase-js@2.112.3'
import webpush from 'npm:web-push@3.6.7'

const url = Deno.env.get('SUPABASE_URL')!
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
const serviceKey = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const VAPID_PUBLIC = 'BKJ5AbJj7ffXHuGRDQPhaf98ZNM-FVftxaLoI1ymYLMJjS0ukmfgUdPiN_gT06htgbL8mFxY8hYqLRyBenqUowk'
const VAPID_PRIVATE = Deno.env.get('SPOT_VAPID_PRIVATE')!
const PROCESS_SECRET = Deno.env.get('SPOT_PUSH_PROCESS_SECRET')!
const APP_ORIGIN = 'https://irumaithy.github.io'
webpush.setVapidDetails('mailto:notifications@thawaq.app', VAPID_PUBLIC, VAPID_PRIVATE)

function cors(req: Request) {
  const origin = req.headers.get('origin') || ''
  return {
    'Access-Control-Allow-Origin': origin === APP_ORIGIN ? origin : APP_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info, x-push-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}
function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors(req), 'Content-Type': 'application/json' } })
}

async function authedUser(req: Request) {
  const header = req.headers.get('authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile } = await admin.from('profiles').select('id,role,is_active').eq('id', data.user.id).maybeSingle()
  if (!profile?.is_active) return null
  return { user: data.user, profile }
}

async function sendSubscription(row: any, payload: any) {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload),
      { TTL: 86400, urgency: 'high' }
    )
    return { ok: true }
  } catch (e: any) {
    const status = Number(e?.statusCode || e?.status || 0)
    if (status === 404 || status === 410) {
      await admin.from('push_subscriptions').delete().eq('id', row.id)
      return { ok: false, invalid: true, error: 'expired subscription' }
    }
    console.error('push send error', status, e?.message || e)
    return { ok: false, error: String(e?.message || e) }
  }
}

async function processJobs() {
  const { data: jobs, error } = await admin.from('push_jobs').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(10)
  if (error) throw error
  let processed = 0, delivered = 0
  for (const job of jobs || []) {
    const { data: profiles } = job.audience === 'admin'
      ? await admin.from('profiles').select('id').eq('role', 'admin').eq('is_active', true)
      : await admin.from('profiles').select('id').eq('is_active', true)
    const ids = (profiles || []).map((p: any) => p.id)
    let subs: any[] = []
    if (ids.length) {
      const { data } = await admin.from('push_subscriptions').select('*').in('user_id', ids)
      subs = data || []
    }
    if (!subs.length) {
      await admin.from('push_jobs').update({ attempts: Number(job.attempts || 0) + 1, last_error: 'no active push subscriptions' }).eq('id', job.id)
      continue
    }
    let okCount = 0
    for (const sub of subs) {
      const result = await sendSubscription(sub, {
        title: job.title,
        body: job.body,
        version: job.version,
        kind: job.audience === 'admin' ? 'candidate' : 'stable',
        url: job.url,
        tag: `thawaq-update-${job.version}-${job.audience}`,
      })
      if (result.ok) okCount++
    }
    await admin.from('push_jobs').update({
      status: okCount > 0 ? 'sent' : 'failed',
      attempts: Number(job.attempts || 0) + 1,
      last_error: okCount > 0 ? '' : 'all push attempts failed',
      sent_at: okCount > 0 ? new Date().toISOString() : null,
    }).eq('id', job.id)
    processed++
    delivered += okCount
  }
  return { processed, delivered }
}


// Private, durable, server-created activity notification queue.
// A client cannot choose the recipient or create arbitrary delivery events.
async function processSpotSocialJobs() {
  const {data:expired,error:expiryError}=await admin.from('spot_stories').select('id,media_path').lt('expires_at',new Date().toISOString()).limit(50)
  if(!expiryError&&expired?.length){
    const {error:removeError}=await admin.storage.from('spot-stories').remove(expired.map((s:any)=>s.media_path))
    if(!removeError)await admin.from('spot_stories').delete().in('id',expired.map((s:any)=>s.id))
  }
  const {data:events,error:claimError}=await admin.rpc('spot_claim_push_events',{p_limit:18})
  if(claimError)throw claimError
  let processed=0,delivered=0
  for(const event of events||[]){
    const update=async(status:string,last_error='',available_at?:string)=>{
      const values:any={status,last_error:last_error.slice(0,450),processed_at:status==='sent'||status==='skipped'?new Date().toISOString():null}
      if(available_at)values.available_at=available_at
      const {error}=await admin.from('spot_push_events').update(values).eq('id',event.id)
      if(error)console.error('social job update failed',event.id,error.message)
    }
    try{
      const {data:people,error:pe}=await admin.from('profiles').select('id,username,is_active').in('id',[event.actor_id,event.recipient_id])
      if(pe)throw pe
      const sender=people?.find((p:any)=>p.id===event.actor_id),receiver=people?.find((p:any)=>p.id===event.recipient_id)
      if(!sender?.is_active||!receiver?.is_active){await update('skipped','account unavailable');continue}
      // Skip if a user reversed the action before delivery.
      if(event.kind==='like'){
        const {data}=await admin.from('spot_post_likes').select('post_id').eq('post_id',event.post_id).eq('user_id',event.actor_id).maybeSingle()
        if(!data){await update('skipped','like removed');continue}
      }else if(event.kind==='follow_request'){
        const {data}=await admin.from('spot_follow_requests').select('requester_id').eq('requester_id',event.actor_id).eq('recipient_id',event.recipient_id).maybeSingle()
        if(!data){await update('skipped','request no longer pending');continue}
      }else if(event.kind==='follow_accepted'){
        const {data}=await admin.from('social_follows').select('follower_id').eq('follower_id',event.recipient_id).eq('followed_id',event.actor_id).maybeSingle()
        if(!data){await update('skipped','follow removed');continue}
      }else if(event.kind==='follow'){
        const {data}=await admin.from('social_follows').select('follower_id').eq('follower_id',event.actor_id).eq('followed_id',event.recipient_id).maybeSingle()
        if(!data){await update('skipped','follow removed');continue}
      }else if(event.kind==='post'){
        const {data}=await admin.from('social_follows').select('follower_id,notify_new_posts').eq('follower_id',event.recipient_id).eq('followed_id',event.actor_id).maybeSingle()
        if(!data?.notify_new_posts){await update('skipped','post alert disabled');continue}
      }
      // Shares a claim with legacy message notifications to prevent duplicate pushes.
      let dmClaimed=false
      if(event.kind==='message'){
        const {error:ce}=await admin.from('spot_dm_push_claims').insert({message_id:event.message_id,recipient_id:event.recipient_id})
        if(ce?.code==='23505'){await update('skipped','already notified by previous version');continue}
        if(ce)throw ce
        dmClaimed=true
      }
      const {data:subs,error:subError}=await admin.from('push_subscriptions').select('*').eq('user_id',event.recipient_id)
      if(subError)throw subError
      if(!subs?.length){await update('skipped','no subscribed devices');continue}
      const actor='@'+String(sender.username||'spot').slice(0,30)
      const title=event.kind==='follow_request'?'Spot · طلب متابعة':event.kind==='follow_accepted'?'Spot · قُبل طلب متابعتك':event.kind==='follow'?'Spot · متابع جديد':event.kind==='like'?'Spot · إعجاب جديد':event.kind==='message'?'Spot · رسالة خاصة':'Spot · تجربة جديدة'
      const body=event.kind==='follow_request'?actor+' طلب متابعتك':event.kind==='follow_accepted'?actor+' قبل طلب متابعتك':event.kind==='follow'?actor+' بدأ بمتابعتك':event.kind==='like'?actor+' أعجب بتجربتك':event.kind==='message'?actor+' أرسل لك رسالة خاصة':actor+' نشر تجربة جديدة'
      const base='https://irumaithy.github.io/Spot/'
      const target=event.kind==='message'?base+'?messages=1&user='+event.actor_id:
         ['follow','follow_request','follow_accepted'].includes(event.kind)?base+'?user='+event.actor_id:base+'?post='+event.post_id
      let good=0
      for(const sub of subs){const result=await sendSubscription(sub,{title,body,kind:event.kind,url:target,tag:'spot-social-'+event.id});if(result.ok)good++}
      if(good){await update('sent');delivered+=good}else{
        if(dmClaimed)await admin.from('spot_dm_push_claims').delete().eq('message_id',event.message_id)
        const delay=Math.min(1800,30*Math.pow(2,Math.min(event.attempts||1,6)))
        await update(event.attempts>=6?'failed':'pending','no device accepted push',new Date(Date.now()+delay*1000).toISOString())
      }
      processed++
    }catch(e:any){
      const delay=Math.min(1800,30*Math.pow(2,Math.min(event.attempts||1,6)))
      await update(event.attempts>=6?'failed':'pending',String(e?.message||e),new Date(Date.now()+delay*1000).toISOString())
    }
  }
  return {processed,delivered}
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) })
  if (req.method !== 'POST') return json(req, { ok: false, error: 'METHOD_NOT_ALLOWED' }, 405)
  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action || '')

    if (action === 'process') {
      if (req.headers.get('x-push-secret') !== PROCESS_SECRET) return json(req, { ok: false, error: 'UNAUTHORIZED' }, 401)
      return json(req, { ok: true, ...(await processJobs()) })
    }

    if (action === 'process-spot-social') {
      if(req.headers.get('x-push-secret')!==PROCESS_SECRET)return json(req,{ok:false,error:'UNAUTHORIZED'},401)
      return json(req,{ok:true,...(await processSpotSocialJobs())})
    }

    const auth = await authedUser(req)
    if (!auth) return json(req, { ok: false, error: 'UNAUTHORIZED' }, 401)

    if (action === 'register') {
      const s = body?.subscription || {}
      const endpoint = String(s?.endpoint || '')
      const p256dh = String(s?.keys?.p256dh || '')
      const authKey = String(s?.keys?.auth || '')
      let endpointValid=false
      try{const u=new URL(endpoint);endpointValid=u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['fcm.googleapis.com','updates.push.services.mozilla.com','push.apple.com','web.push.apple.com','wns.windows.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{}
      if (!endpointValid || endpoint.length>4096 || !/^[A-Za-z0-9_-]{80,120}$/.test(p256dh) || !/^[A-Za-z0-9_-]{20,30}$/.test(authKey)) return json(req, { ok: false, error: 'INVALID_SUBSCRIPTION' }, 400)
      await admin.from('push_subscriptions').delete().eq('endpoint', endpoint)
      const { error } = await admin.from('push_subscriptions').insert({
        user_id: auth.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        user_agent: String(body?.userAgent || '').slice(0, 1000),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
      return json(req, { ok: true })
    }


    if (action === 'unregister') {
      const endpoint=String(body.endpoint||'')
      const {error}=await admin.from('push_subscriptions').delete().eq('user_id',auth.user.id).eq('endpoint',endpoint)
      if(error)throw error
      return json(req,{ok:true})
    }

    if (action === 'notify-dm') {
      const messageId = String(body?.message_id || '')
      if (!/^[0-9a-f-]{36}$/i.test(messageId)) return json(req,{ok:false,error:'INVALID_MESSAGE'},400)
      const {data:msg,error:readErr}=await admin.from('spot_direct_messages')
        .select('id,sender_id,recipient_id,created_at')
        .eq('id',messageId).eq('sender_id',auth.user.id).maybeSingle()
      if(readErr||!msg)return json(req,{ok:false,error:'NOT_FOUND'},404)
      if(Date.now()-Date.parse(msg.created_at)>180000 || Date.parse(msg.created_at)>Date.now()+15000)
        return json(req,{ok:false,error:'EXPIRED'},400)
      const {data:claim,error:claimErr}=await admin.from('spot_dm_push_claims')
        .insert({message_id:msg.id,recipient_id:msg.recipient_id})
        .select('message_id').single()
      if(claimErr){
        if(claimErr.code==='23505')return json(req,{ok:true,already_sent:true})
        throw claimErr
      }
      const {data:recipient}=await admin.from('profiles').select('is_active').eq('id',msg.recipient_id).maybeSingle()
      if(!recipient?.is_active)return json(req,{ok:true,sent:0})
      const {data:subs}=await admin.from('push_subscriptions').select('*').eq('user_id',msg.recipient_id)
      let sent=0
      for(const subscription of subs||[]){
        const result=await sendSubscription(subscription,{
          title:'Spot · رسالة خاصة جديدة',
          body:'لديك رسالة خاصة من أحد أعضاء Spot.',
          kind:'dm',
          url:'https://irumaithy.github.io/Spot/?messages=1',
          tag:'spot-dm-'+msg.id
        })
        if(result.ok)sent++
      }
      return json(req,{ok:true,sent})
    }

    if (action === 'test-self') {
      let query=admin.from('push_subscriptions').select('*').eq('user_id', auth.user.id)
      if(body.endpoint)query=query.eq('endpoint',String(body.endpoint))
      const {data:subs,error:subsError}=await query
      if(subsError)throw subsError
      if (!subs?.length) return json(req, { ok: false, error: 'NO_SUBSCRIPTION' }, 404)
      const { data: rel } = await admin.from('app_release').select('*').eq('id', 'main').maybeSingle()
      const isAdmin = auth.profile.role === 'admin'
      const candidate = isAdmin && rel?.candidate_available
      const version = candidate ? rel.candidate_version : rel?.stable_version
      const payload = candidate ? {
        title: 'نسخة تجريبية من Spot جاهزة',
        body: `الإصدار v${version} بانتظار اختبارك. خذ نسخة احتياطية أولًا.`,
        version, kind: 'candidate', url: 'https://irumaithy.github.io/Spot/?admin=1', tag: `thawaq-test-${Date.now()}`,
      } : {
        title: 'تم تفعيل إشعارات Spot',
        body: 'ستصلك إشعارات التحديثات خارج التطبيق أيضًا.',
        version, kind: 'test', url: 'https://irumaithy.github.io/Spot/?dashboard=1', tag: `thawaq-test-${Date.now()}`,
      }
      let sent = 0
      for (const sub of subs) if ((await sendSubscription(sub, payload)).ok) sent++
      return json(req, { ok: sent > 0, sent })
    }

    if (action === 'process-admin') {
      if (auth.profile.role !== 'admin') return json(req, { ok: false, error: 'FORBIDDEN' }, 403)
      return json(req, { ok: true, ...(await processJobs()) })
    }

    return json(req, { ok: false, error: 'UNKNOWN_ACTION' }, 400)
  } catch (e: any) {
    console.error(e)
    return json(req, { ok: false, error: 'SERVER_ERROR', detail: String(e?.message || e) }, 500)
  }
})

