from pathlib import Path
root=Path(__file__).resolve().parent.parent
s=(root/'spot-v3.4.0.js').read_text().replace('3.4.0','3.5.0').replace('owner-preview-spot340','owner-preview-spot350')
s=s.replace("function own(p){return !!state.me&&(p.owner_id===state.me.id||state.me.role==='admin')}","function own(p){return !!state.me&&p?.owner_id===state.me.id}")
s=s.replace("let spotStorySession=null,spotStoryFrame=0,spotStoryPreviewURL='',spotPushSyncedFor='';", "let spotPushSyncedFor='';")
a=s.index('function spotNewStory()');b=s.index('async function spotResolveMedia()',a);s=s[:a]+s[b:]
s=s.replace('async function spotStoryAction(act,id,el){','async function legacySpotStoryAction(act,id,el){',1)
a=s.index("document.addEventListener('keydown',e=>{if(!spotStorySession)");b=s.index('// A single launch overlay',a);s=s[:a]+(root/'scripts/story-studio-350.inc').read_text()+'\n'+s[b:]
s=s.replace("if(input.id==='spotStoryFile')return spotPreviewStory(input);",'')
s=s.replace("if(e.key==='Escape'){$('#imageLibraryOverlay')", "if(e.key==='Escape'&&!$('#spotStoryViewer')&&!$('#spotStoryComposer')){$('#imageLibraryOverlay')")
s=s.replace('await spotLoadStories();await spotSyncPush();', 'await spotLoadStories();if(spotStorySession)spotRefreshViewerCount();await spotSyncPush();')
s=s.replace("${avatar(u,'avatar-large')}<h2>","${spotProfileAvatar(u)}<h2>")
old='''<div class="profile-avatar">${me.avatar_url?`<img src="${escape(me.avatar_url)}" alt="صورتك"/>`:escape(me.display_name?.slice(0,1)||'ذ')}</div>'''
s=s.replace(old,'${spotProfileAvatar(me)}')
old='''<div class="profile-avatar">${u.avatar_url?`<img src="${escape(u.avatar_url)}" alt=""/>`:escape(u.display_name?.slice(0,1))}</div>'''
s=s.replace(old,'${spotProfileAvatar(u)}')
# Review editing is visible only to the review owner.
s=s.replace("<div class=\"post-bottom\">${spotLikeControl(post.id)}", "<div class=\"post-bottom\">${spotLikeControl(post.id)}${post.owner_id===state.me?.id?btn(ico('edit',15)+' تعديل تقييمي','edit-review','soft sm',`data-id=\"${escape(post.id)}\"`):''}")
s=s.replace("function showModal(title,body,subtitle=''){spotCloseStory(false);", "function showModal(title,body,subtitle=''){spotCloseComposer(true);spotCloseStory(false);")
s=s.replace("function closeModal(){spotCloseStory(false);", "function closeModal(){spotCloseComposer(true);spotCloseStory(false);")
(root/'spot-v3.5.0.js').write_text(s)
p=(root/'owner-preview-spot340.html').read_text().replace('3.4.0','3.5.0').replace('stories3401','studio3501').replace('spot-v3.4.css','spot-v3.5.css').replace('spot-i18n.js?v=3200','spot-i18n-v3.5.js?v=studio3501')
(root/'owner-preview-spot350.html').write_text(p)
