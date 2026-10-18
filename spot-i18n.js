/* SPOT 3.2 bilingual UI. Static UI text only; user's submitted review text is left as authored. */
(()=>{'use strict';
const KEY='spot-ui-language';
const stored=localStorage.getItem(KEY);
let language=stored==='en'?'en':'ar';
const dictPairs=[
 ['الرئيسية','Home'],['المجتمع','Community'],['الرسائل','Messages'],['اكتشف','Discover'],['يومياتي','My journal'],['حسابي','My profile'],['إحصاءاتي','My insights'],['تجربة جديدة','New review'],['تجارب تستحق التذكر','Experiences worth remembering'],
 ['كل مكان له حكاية','Every spot has a story'],['مزامنة مباشرة','Live sync'],['● المزامنة متصلة','● Synced'],['● دون اتصال · الحفظ مؤجل','● Offline · save pending'],['تحديث البيانات فقط','Refresh data only'],['صفحة تجارب عامة','Public reviews page'],
 ['سجّل دخولك لتوثّق تجربتك','Sign in to save your experience'],['تسجيل الدخول','Sign in'],['البريد الإلكتروني أو اسم المستخدم','Email or username'],['كلمة المرور','Password'],['إبقائي مسجّلًا على هذا الجهاز','Keep me signed in on this device'],['حسابك خاص وآمن','Your private account'],['الدخول متاح فقط للمستخدمين المعتمدين من المالك.','Only approved members can sign in.'],
 ['مرحباً','Welcome'],['حيّاك','Welcome'],['أماكني','My spots'],['زياراتي','My visits'],['أصنافي','My items'],['متوسط تقييمي','My average rating'],['تجارب تستاهل المشاركة','Reviews worth sharing'],['آخر الأماكن المضافة على Spot','Recently shared spots on Spot'],['كل الأماكن','All spots'],['ابدأ','Get started'],['أول تجربة تبدأ من هنا','Your first review starts here'],['ما في تقييمات منشورة حتى الآن.','No reviews published yet.'],['تجاربك','Your experiences'],['من ناس تتابعهم','From people you follow'],['جديد التجارب من مجتمعك','New reviews from your community'],['تابع أصحاب الذوق اللي يشبه ذوقك!','Follow people who share your taste!'],['ابحث عن أعضاء','Find members'],['أماكنك المميزة','Your favorite spots'],['أعلى تقييماتك الخاصة','Your highest rated spots'],['قيّم طلبًا واستكشف ذوقك','Review your order and discover your taste'],
 ['مجتمع Spot','Spot Community'],['ناس حقيقيون، تجارب حقيقية. اختر من تتابع وتوصلك جديد تجاربهم.','Real people, real experiences. Follow people whose tastes you trust.'],['تنبيهات المجتمع','Community alerts'],['تنبيهات للأشخاص الذين اخترت تشغيل الإشعارات لهم، وليست لكل أعضاء التطبيق.','Alerts only from members whose notifications you enabled.'],['المجتمع بانتظار متابعاتك','Your community is waiting'],['ما فيه تجارب منشورة بعد','No published reviews yet'],['اكتشف الأعضاء','Discover members'],['اكتشف أعضاء','Discover members'],['المتابعة','Follow'],['✓ أتابعه','✓ Following'],['+ متابعة','+ Follow'],['🔔 تنبيهاتي مفعّلة','🔔 Alerts on'],['🔕 تنبيهات هذا العضو','🔕 Enable alerts'],['أتابعهم','Following'],['يتابعونني','Followers'],['متابع','Followers'],['تجاربي المنشورة','My published reviews'],['الكل','All'],['الأعضاء','Members'],['ابحث بالاسم أو @username','Search name or @username'],['لا توجد تنبيهات بعد.','No alerts yet.'],['تحديد الكل كمقروء','Mark all read'],['غير مقروءة','Unread'],['عرض التجربة كاملة','View full review'],['صفحة عضو في Spot','Spot member profile'],['آخر تجاربه','Latest reviews'],['لم ينشر أي تجربة بعد.','No reviews published yet.'],['نشر تجربة جديدة','Published a new review'],['فتح حسابه','Open profile'],
 ['آراء المجتمع','Community reviews'],['الأماكن','Spots'],['الأشخاص','People'],['اكتشف على ذوقك','Explore your taste'],['أماكن وتجارب حقيقية، من ناس يشاركون رأيهم','Real spots and honest reviews from the community'],['ابحث عن مكان، مدينة، أو صنف…','Search for a spot, city or item…'],['كل المدن','All cities'],['الأحدث','Newest'],['الأعلى تقييمًا','Top rated'],['الأكثر زيارة','Most visited'],['حسب الاسم','By name'],['مطاعم','Restaurants'],['كوفيات','Cafés'],['شاي','Tea'],['مطعم','Restaurant'],['كوفي','Café'],['الكل ✨','All ✨'],['مطاعم 🍽️','Restaurants 🍽️'],['كوفيات ☕','Cafés ☕'],['شاي 🫖','Tea 🫖'],['ما لقينا أماكن بهذا البحث.','No matching spots found.'],['لا توجد أماكن في نتائج البحث.','No places matched your search.'],['جديد','New'],['الأعلى','Top'],['الأقرب','Nearest'],['استكشاف','Explore'],
 ['هذا مكانك الخاص','Your personal space'],['حسابك ومشاركاتك ومفضلاتك وإعداداتك في مكان مرتب وآمن.','Your reviews, saved places, and settings in one secure place.'],['حسابي ومشاركتي','My profile and posts'],['انشر ذوقك بطريقتك','Share what you love'],['أماكن','Spots'],['مفضلة','Saved'],['تجارب موثقة','Documented reviews'],['أماكن محفوظة','Saved spots'],['مدير المنصة','Platform owner'],['كل مكان يستحق حكاية صغيرة.','Every spot has a story worth sharing.'],['رابط صفحتك في Spot','Your Spot profile link'],['رابط صفحتك العام','Your public page link'],['مشاركة','Share'],['نسخ الرابط','Copy link'],['إعدادات','Settings'],['الإعدادات والخصوصية','Settings & privacy'],['تعديل حسابي','Edit profile'],['إدارة منصة Spot','Manage Spot'],['إدارة المستخدمين','Manage users'],['تصدير نسخة احتياطية','Export backup'],['تفعيل الإشعارات الخارجية','Enable push notifications'],['فحص تحديث التطبيق','Check app update'],['تسجيل الخروج','Log out'],['حفظ الرابط','Save link'],['تخصيص رابطك','Customize your link'],['بياناتك ومزامنتك','Your data & sync'],['مزامنة البيانات الآن','Sync data now'],['الإصدار والتحديثات','Version & updates'],['تحكّم واضح بدون إعدادات مبعثرة','Simple, organized controls'],['تعديل ملفي','Edit my profile'],['الاسم الظاهر','Display name'],['اسم المستخدم','Username'],['نبذة عنك','About you'],['حفظ التغييرات','Save changes'],['حفظ','Save'],['إلغاء','Cancel'],['إغلاق','Close'],
 ['وثّق تجربة جديدة','Share a new review'],['تعديل المكان','Edit spot'],['اسم المطعم أو الكوفي','Restaurant or café name'],['المدينة','City'],['التصنيف','Category'],['ملاحظاتك','Your notes'],['الموقع على خرائط Google — اختياري','Google Maps link — optional'],['رابط Google Maps','Google Maps link'],['صورة المكان','Spot photo'],['صورة المكان — اختياري','Spot photo — optional'],['أضف صنفًا وقيّمه','Add and rate an item'],['تعديل الصنف','Edit item'],['اسم الطلب','Item name'],['السعر بالدرهم — اختياري','Price in AED — optional'],['ملاحظتك المختصرة','Your quick note'],['قيّم بنصف نجمة أو نجمة كاملة','Rate by half or whole stars'],['تقييمك من 5 نجوم','Your rating out of 5 stars'],['اختر تقييمًا من نصف إلى خمس نجوم','Choose a rating between 0.5 and 5'],['صورة الصنف — اختياري','Item photo — optional'],['حفظ المكان','Save spot'],['حفظ الصنف','Save item'],['حفظ الصنف وتقييمه','Save item and rating'],['إضافة صنف','Add item'],['رجوع للزيارة','Back to visit'],['فاتورة الزيارة','Visit receipt'],['رفع فاتورة','Upload receipt'],['إجمالي الزيارة','Visit total'],['مجموع الأصناف','Items subtotal'],['ضريبة','Tax'],['إضافة زيارة جديدة اليوم','Add a visit today'],['زيارة جديدة','New visit'],['سجل الزيارات','Visit history'],['زيارة','Visit'],['زيارات','Visits'],['لا توجد أصناف بعد','No items yet'],['لا يوجد رابط Google Maps مسجل لهذا المكان','No Google Maps link was added for this spot'],['موقعه في الخرائط','View on maps'],['اضف مكان','Add spot'],['حذف المكان وجميع زياراته','Delete spot and all its visits'],['غير مسجل','Not provided'],['يمكن تركه فارغًا','Can be left blank'],['لم تضف أصنافًا لهذه الزيارة.','No items added for this visit.'],['المكان محفوظ','Spot saved'],['تم حفظ الصنف','Item saved'],
 ['اختر صورة من الألبوم أو صوّر الآن','Choose from Photos or Camera'],['البحث عن صورة عبر Google','Search images on Google'],['صور Google','Google Images'],['ابحث عن صورة','Find an image'],['رفع صورة','Upload a photo'],['صورة من الألبوم أو الكاميرا','Photo from album or camera'],
 ['الرسائل الخاصة','Private messages'],['محادثاتك مع أفراد المجتمع · لا تظهر للآخرين','Chats with Spot members · private to participants'],['المحادثات','Conversations'],['محادثة خاصة','Private conversation'],['ابحث عن مستخدم','Find a member'],['اكتب رسالتك…','Write a message…'],['إرسال','Send'],['رسالة خاصة','Message'],['لا توجد محادثات بعد. ابحث عن عضو لبدء محادثة.','No conversations yet. Find a member to start chatting.'],['اختر محادثة أو ابحث عن شخص','Choose a conversation or find a member'],['رسائلك لا يراها إلا أنت والطرف الآخر.','Only you and the other participant can read these messages.'],['ابدأ المحادثة برسالة لطيفة','Say hello to start your conversation'],['وصلتك رسالة خاصة. افتح Spot لقراءتها.','You have a new private message. Open Spot to read it.'],['رسالة جديدة من مجتمع Spot','New message on Spot'],['رسالة جديدة','New message'],
 ['المستخدم','User'],['الصلاحية','Role'],['الحالة','Status'],['إصدار جهاز المستخدم','Installed version'],['مالك','Owner'],['نشط','Active'],['موقوف','Suspended'],['تفعيل','Enable'],['إيقاف','Disable'],['إصدار التطبيق','App version'],['آخر اتصال','Last seen'],['لم يُبلّغ عن الإصدار بعد','No version reported yet'],['إنشاء مستخدم','Create user'],['إنشاء الحساب','Create account'],['البريد الإلكتروني','Email'],['كلمة مرور مبدئية لا تقل عن 8 أحرف','Temporary password of at least 8 characters'],['التحديثات — اعتماد المالك','Updates — owner approval'],['اعتماد التحديث لجميع المستخدمين','Approve update for all users'],['انتهيت من اختبار','I finished testing'],['النسخة الرسمية','Stable version'],['النسخة التجريبية','Preview version'],['جاهزة للمالك','Available to owner'],['لم يتم تثبيت أي تحديث','No update installed'],['تحديث الآن','Update now'],['لاحقًا','Later'],['نسخة احتياطية','Backup'],
 ['العربية','العربية'],['اختر العربية أو English، ويُحفظ الخيار على هذا الجهاز.','Choose Arabic or English. Your selection is saved on this device.'],['لغة التطبيق','App language'],['تجريبي للمالك','Owner preview'],['صُنع لذكريات الطعم الحلوة','Made for delicious memories'],['الحفظ مؤجل','Save pending'],['مزامنة','Sync'],['سعر','Price'],['مجتمع','Community'],['إحصاء','Insights']
];
dictPairs.push(
 ['حيّاك يا','Welcome,'],
 ['كل زيارة، كل قهوة، وكل طبق عجبك أو ما عجبك… خليها في مكان مرتب ترجع له متى ما بغيت.','Every visit, every coffee, every dish you liked (or did not) — all remembered in one place.'],
 ['أصناف','items'],['صنف','item'],['تجارب','reviews'],['زيارات','visits'],
 ['آراء حقيقية من كل أفراد Spot Community — كل رأي باسم صاحبه','Real opinions from everyone in Spot Community — each review credited to its author'],
 ['جاري جلب جميع الآراء المطابقة...','Loading matching reviews...'],
 ['تظهر آراء الأعضاء عند تقييم صنف في زيارة فعلية. إذا قيّم ثلاثة أشخاص المكان نفسه، سيظهر كل رأي بشكل مستقل مع اسم صاحبه.','Member reviews appear after an item is rated during a real visit. If three people review the same place, each opinion appears separately with its author.'],
 ['يومياتك','Your journal'],
 ['كل الأماكن والزيارات التي تستحق التذكر، بترتيبها الحقيقي.','All your spots and visits worth remembering, in chronological order.'],
 ['المحفوظة','Saved'],['الSaved','Saved'],['التنبيهات','Alerts'],
 ['اسم جميل للعرض داخل التطبيق. عند المشاركة يُستخدم العنوان الحقيقي الذي يعمل عند الآخرين.','A friendly label shown in Spot. Sharing uses a real, working link.'],
 ['الإعدادات','Settings'],['الSettings','Settings'],
 ['🍽️ مطعم','🍽️ Restaurant'],['☕ كوفي','☕ Café'],['🫖 شاي','🫖 Tea'],
 ['كل','All'],['كل ما نشروا تقييمًا جديدًا، بتشوفه هنا.','When they share a new review, you will see it here.'],['كلما','Whenever'],['أصناف أخرى','more items'],
 ['يتابعهم','Following'],['تابعين','followers'],['مُتابع','follower'],
 ['يتم','is being'],['تجريبي للمالك','Owner preview'],
 ['صُنع لذكريات الطعم الحلوة','Made for delicious memories']
);
const dict=new Map(dictPairs);
const sorted=[...dict.entries()].filter(([a])=>a.length>=5).sort((a,b)=>b[0].length-a[0].length);
const prior=new WeakMap();
const attrs=new WeakMap();
function translate(value){if(!value||!/[\u0600-\u06ff]/.test(value))return value;
 const trim=value.trim(), exact=dict.get(trim);if(exact){return value.replace(trim,exact)}
 let out=value;for(const [ar,en] of sorted){if(out.includes(ar))out=out.split(ar).join(en)}
 return out.replaceAll('الSaved','Saved').replaceAll('آراء حقيقية من كل أفراد Spot Community — كل رأي باسم صاحبه','Real opinions from the Spot community — each review credited to its author');
}
function skip(el){return !!el?.closest?.('script,style,textarea,[contenteditable="true"],.post-review,.spot-dm-bubble,.spot-user-content');}
function visitNode(node){
 if(node.nodeType===3){const p=node.parentElement;if(!p||skip(p))return;
  const original=prior.has(node)?prior.get(node):node.textContent;prior.set(node,original);
  const target=language==='en'?translate(original):original;
  if(node.textContent!==target)node.textContent=target;
  return;
 }
 if(node.nodeType!==1||skip(node))return;
 const el=node;const old=attrs.get(el)||{};
 for(const a of ['placeholder','title','aria-label']){
  if(!el.hasAttribute(a))continue;
  if(!(a in old))old[a]=el.getAttribute(a);
  const target=language==='en'?translate(old[a]):old[a];
  if(el.getAttribute(a)!==target)el.setAttribute(a,target);
 }
 attrs.set(el,old);
 for(const child of [...el.childNodes])visitNode(child);
}
let pending=false;
function apply(){pending=false;document.documentElement.lang=language;document.documentElement.dir=language==='en'?'ltr':'rtl';
 const l=document.getElementById('spotLanguageBtn');if(l){l.classList.remove('hidden');l.textContent=language==='en'?'عربي':'EN';l.title=language==='en'?'Switch to Arabic':'Switch to English';}
 visitNode(document.body);
}
function request(){if(!pending){pending=true;requestAnimationFrame(apply)}}
window.SPOT_I18N={get language(){return language},setLanguage(v){if(!['ar','en'].includes(v))return;localStorage.setItem(KEY,v);language=v;request()},apply:request,activate:request};
const observer=new MutationObserver(request);
function boot(){document.addEventListener('click',e=>{
 const direct=e.target.closest('[data-spot-language]');if(direct){e.preventDefault();window.SPOT_I18N.setLanguage(direct.dataset.spotLanguage);return;}
 if(e.target.closest('#spotLanguageBtn')){e.preventDefault();window.SPOT_I18N.setLanguage(language==='en'?'ar':'en');}
 },true);
 observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','title','aria-label']});apply();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
