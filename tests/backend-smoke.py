import json, re, urllib.request, urllib.error
from pathlib import Path
s=(Path(__file__).resolve().parent.parent/'config.js').read_text()
base=re.search(r"SUPABASE_URL: '([^']+)'",s)[1]
key=re.search(r"SUPABASE_PUBLISHABLE_KEY: '([^']+)'",s)[1]
cases=[('story anonymity','GET','/rest/v1/spot_stories?select=id',None),('follow anonymity','POST','/rest/v1/rpc/spot_request_follow',{'target':'00000000-0000-0000-0000-000000000000'}),('privacy anonymity','POST','/functions/v1/spot-privacy',{'is_private':True}),('push anonymity','POST','/functions/v1/push-notifications',{'action':'test-self'})]
for name,method,path,data in cases:
 req=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'apikey':key,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=20) as r:code=r.status;body=r.read()
 except urllib.error.HTTPError as e:code=e.code;body=e.read()
 if name=='story anonymity' and code==200:
  assert json.loads(body)==[], 'Anonymous stories exposed'
 else:assert code in (401,403),(name,code)
 print('PASS:',name,code)
