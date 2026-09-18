(() => {
  "use strict";
  const cfg = window.APP_CONFIG;
  const db = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  const state = { session:null, schoolId:null, analyses:new Map(), attachments:new Map(), excel:new Map(), open:new Set(), modalIndex:null };

  const indicators = [
    ["تعزز المدرسة القيم الإسلامية والهوية الوطنية","نفذت المدرسة عددًا من البرامج والأنشطة التي تهدف إلى تعزيز القيم الإسلامية والهوية الوطنية لدى الطلاب، من خلال البرامج التوعوية والأنشطة المدرسية والمناسبات الوطنية، بما يسهم في تعزيز الانتماء والاعتزاز بالقيم الوطنية والإسلامية."],
    ["يظهر المتعلمون الاعتزاز بالقيم والهوية الوطنية","حرصت المدرسة على تعزيز اعتزاز الطلاب بالقيم والهوية الوطنية من خلال الأنشطة والبرامج الهادفة والمشاركة في المناسبات الوطنية وتنمية الشعور بالانتماء والمسؤولية تجاه الوطن."],
    ["توفر المدرسة مناخًا آمنًا للتعلم والنمو النفسي والاجتماعي","عملت المدرسة على توفير بيئة مدرسية آمنة ومحفزة للتعلم والنمو النفسي والاجتماعي، من خلال المتابعة المستمرة للطلاب والتوجيه والإرشاد ومعالجة المشكلات الطلابية بصورة تربوية."],
    ["تنشر المدرسة قواعد السلوك والمواظبة وتتابع تطبيقها","قامت المدرسة بنشر قواعد السلوك والمواظبة وتعريف الطلاب وأولياء الأمور بها، مع متابعة تطبيقها بصورة مستمرة واتخاذ الإجراءات التربوية المناسبة لتعزيز الانضباط المدرسي."],
    ["توفر المدرسة برامج وأنشطة تربوية داعمة للسلوك الإيجابي","نفذت المدرسة برامج وأنشطة تربوية لتعزيز السلوك الإيجابي لدى الطلاب، مثل برامج التحفيز والتكريم وتعزيز الانضباط والمسؤولية والاحترام."],
    ["تظهر المدرسة مشاركة الأسرة في تعلم أبنائهم والتحضير لمستقبلهم","تم تعزيز مشاركة الأسرة في العملية التعليمية من خلال التواصل المستمر مع أولياء الأمور وعقد الاجتماعات وإرسال الرسائل التوعوية ومتابعة المستوى الدراسي والسلوكي للطلاب."],
    ["يظهر المتعلمون التزامًا بالممارسات الصحية السليمة","نفذت المدرسة برامج توعوية لتعزيز الممارسات الصحية السليمة لدى الطلاب، ومنها التوعية بالنظافة الشخصية والتغذية السليمة والوقاية والمحافظة على الصحة العامة."],
    ["يلتزم المتعلمون بقواعد السلوك والانضباط المدرسي","تتابع المدرسة التزام الطلاب بقواعد السلوك والانضباط المدرسي من خلال المتابعة اليومية للحضور والمواظبة وتنفيذ برامج التوجيه والإرشاد وتحفيز الطلاب المنضبطين."],
    ["يظهر المتعلمون اعتزازًا بثقافتهم واحترامًا للتنوع الثقافي في المجتمع","نفذت المدرسة برامج تربوية لتعزيز اعتزاز الطلاب بثقافتهم واحترام التنوع الثقافي في المجتمع وتنمية قيم الاحترام والتسامح والتعايش الإيجابي."],
    ["تنمي المدرسة المهارات العاطفية والاجتماعية لدى المتعلمين","عملت المدرسة على تنمية المهارات العاطفية والاجتماعية لدى الطلاب من خلال البرامج الإرشادية التي تتناول مهارات التواصل والثقة بالنفس وحل المشكلات وإدارة الانفعالات والعمل الجماعي."],
    ["يظهر المتعلمون اتجاهات إيجابية نحو ذواتهم","قدمت المدرسة برامج إرشادية وتحفيزية تساعد الطلاب على تكوين اتجاهات إيجابية نحو ذواتهم وتعزيز الثقة بالنفس والطموح والتخطيط للمستقبل."]
  ].map((x,i)=>({index:i,title:x[0],report:x[1]}));

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt = d => d ? new Date(d).toLocaleString("ar-SA") : "—";

  async function getMembership(){
    const {data,error}=await db.from("school_memberships").select("school_id").eq("user_id",state.session.user.id).single();
    if(error || !data) throw new Error("تعذر تحديد المدرسة المرتبطة بالحساب");
    state.schoolId=data.school_id;
  }

  async function login(){
    $("loginMessage").textContent=""; $("loginBtn").disabled=true;
    const email=$("loginEmail").value.trim(), password=$("loginPassword").value;
    if(!email || !password){$("loginMessage").textContent="أدخل البريد الإلكتروني وكلمة المرور";$("loginBtn").disabled=false;return;}
    const {data,error}=await db.auth.signInWithPassword({email,password});
    if(error){$("loginMessage").textContent="تعذر تسجيل الدخول: "+error.message;$("loginBtn").disabled=false;return;}
    state.session=data.session; await startApp(); $("loginBtn").disabled=false;
  }

  async function startApp(){
    try{
      await getMembership();
      $("loginView").classList.add("hidden"); $("appView").classList.remove("hidden");
      renderIndicators();
      await refreshAll();
    }catch(e){$("loginMessage").textContent=e.message;$("loginView").classList.remove("hidden");$("appView").classList.add("hidden");}
  }

  function renderIndicators(){
    const q=$("searchInput").value.trim();
    $("indicatorsContainer").innerHTML=indicators.filter(x=>!q || x.title.includes(q)).map(item=>{
      const open=state.open.has(item.index), saved=state.analyses.get(item.index), files=state.attachments.get(item.index)||[];
      const local=localStorage.getItem(`report_${item.index}`) || item.report;
      return `<article class="indicator-card" id="indicator-${item.index}">
        <div class="indicator-head" data-toggle="${item.index}"><div class="indicator-title">المؤشر ${item.index+1}: ${esc(item.title)}</div><span class="badge">${files.length} ملف</span></div>
        <div class="indicator-body ${open?'':'hidden'}" id="body-${item.index}">
          <textarea class="report-text" data-report="${item.index}">${esc(local)}</textarea>
          <div class="actions">
            <button class="btn primary" data-upload="${item.index}">＋ إضافة ملفات</button>
            <button class="btn secondary" data-excel="${item.index}">📊 ربط Excel وتحليل</button>
            ${saved?`<button class="btn secondary" data-view="${item.index}">عرض آخر تحليل</button>`:''}
            <button class="btn secondary" data-print="${item.index}">🖨 طباعة المؤشر</button>
          </div>
          <input class="file-input" id="upload-${item.index}" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv" multiple>
          <input class="file-input" id="excel-${item.index}" type="file" accept=".xlsx,.xls,.csv">
          <div class="files-grid" id="files-${item.index}">${renderFiles(files)}</div>
          <div class="analysis-preview">${saved?`<div class="analysis-status"><div><strong>آخر تحليل محفوظ</strong><br><small>${esc(saved.file_name||'غير محدد')} • ${fmt(saved.updated_at||saved.created_at)}</small></div><button class="btn secondary" data-view="${item.index}">فتح التحليل في نافذة</button></div><div class="saved-analysis-inline">${saved.analysis_html||''}</div>`:'<small>لا يوجد تحليل محفوظ لهذا المؤشر بعد.</small>'}</div>
        </div></article>`;
    }).join("");
    $("indicatorCount").textContent=indicators.length;
  }

  function renderFiles(files){
    if(!files.length) return "";
    return files.map(f=>`<div class="file-card">${f.signedUrl && f.mime_type?.startsWith("image/")?`<img src="${f.signedUrl}" alt="${esc(f.file_name)}">`:'<div style="font-size:36px;text-align:center">📄</div>'}<div class="file-name">${esc(f.file_name)}</div>${f.signedUrl?`<a href="${f.signedUrl}" target="_blank">فتح الملف</a>`:''}<div><button class="btn danger delete-action" data-delete-id="${f.id}" data-delete-path="${esc(f.file_path)}" data-delete-index="${f.indicator_index}">حذف</button></div></div>`).join("");
  }

  async function refreshAll(){
    const btn=$("refreshBtn");
    const oldText=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent="جارٍ التحديث…";}
    try{
      await Promise.all([loadAnalyses(),loadAttachments()]);
      renderIndicators(); updateStats();
    }catch(e){
      console.error("تعذر تحديث البيانات",e);
      alert("تعذر تحديث البيانات: "+(e?.message||e));
    }finally{
      if(btn){btn.disabled=false;btn.textContent=oldText||"تحديث";}
    }
  }

  async function loadAnalyses(){
    const {data,error}=await db.from("indicator_analyses").select("*").eq("school_id",state.schoolId).order("updated_at",{ascending:false});
    if(error) throw error;
    state.analyses.clear();
    (data||[]).forEach(row=>{const i=Number(row.indicator_index); if(!state.analyses.has(i) && row.analysis_html) state.analyses.set(i,row);});
  }

  async function loadAttachments(){
    const {data,error}=await db.from("indicator_attachments").select("*").eq("school_id",state.schoolId).order("created_at",{ascending:false});
    if(error) throw error;
    state.attachments.clear();
    for(const f of (data||[])){
      const {data:signed}=await db.storage.from(cfg.storageBucket).createSignedUrl(f.file_path,3600);
      f.signedUrl=signed?.signedUrl||null; const i=Number(f.indicator_index);
      if(!state.attachments.has(i)) state.attachments.set(i,[]); state.attachments.get(i).push(f);
    }
  }

  function updateStats(){
    $("analysisCount").textContent=state.analyses.size;
    const all=[...state.attachments.values()].flat(); $("attachmentCount").textContent=all.length;
    const dates=[...state.analyses.values()].map(x=>x.updated_at||x.created_at).filter(Boolean).sort().reverse();
    $("lastUpdate").textContent=dates.length?new Date(dates[0]).toLocaleDateString("ar-SA"):"—";
  }

  async function uploadFiles(index, files){
    if(!files?.length) return;
    for(const file of files){
      if(/\.(xlsx?|csv)$/i.test(file.name)){ await readExcel(index,file); continue; }
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"); const path=`${state.schoolId}/${index}/${Date.now()}_${safe}`;
      const {error:upErr}=await db.storage.from(cfg.storageBucket).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
      if(upErr){alert(`تعذر رفع ${file.name}: ${upErr.message}`);continue;}
      const {error:dbErr}=await db.from("indicator_attachments").insert({indicator_index:index,file_name:file.name,file_path:path,mime_type:file.type,file_size:file.size,created_by:state.session.user.id,school_id:state.schoolId});
      if(dbErr){await db.storage.from(cfg.storageBucket).remove([path]);alert(`تعذر حفظ ${file.name}: ${dbErr.message}`);}
    }
    await refreshAll();
  }

  async function readExcel(index,file){
    try{
      const buf=await file.arrayBuffer(), wb=XLSX.read(new Uint8Array(buf),{type:"array"}), sheetName=wb.SheetNames[0], ws=wb.Sheets[sheetName];
      const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      state.excel.set(index,{fileName:file.name,sheetName,headers:matrix[0]||[],rows:matrix.slice(1)});
      await analyze(index);
    }catch(e){alert("تعذر قراءة ملف Excel: "+e.message);}
  }

  function buildAnalysis(index,excel){
    const rows=excel.rows.filter(r=>r?.some(c=>String(c??"").trim()!=="")), headers=excel.headers||[], totalRows=rows.length, totalColumns=headers.length;
    const preferred=["شعبة","الشعبة","صف","الصف","مرحلة","المرحلة","حالة","الحالة","نوع","التصنيف","غياب","حضور"];
    const stats=headers.map((h,colIndex)=>{const values=rows.map(r=>String(r[colIndex]??"").trim()).filter(Boolean),counts={};values.forEach(v=>counts[v]=(counts[v]||0)+1);return{header:String(h||`عمود ${colIndex+1}`),counts,uniqueCount:Object.keys(counts).length};});
    const cats=stats.filter(c=>c.uniqueCount>=2&&c.uniqueCount<=15).sort((a,b)=>Number(preferred.some(w=>b.header.includes(w)))-Number(preferred.some(w=>a.header.includes(w)))).slice(0,3);
    const insights=[]; cats.forEach(c=>{const e=Object.entries(c.counts).sort((a,b)=>b[1]-a[1]);if(e.length)insights.push(`أعلى قيمة في ${c.header}: ${e[0][0]} بعدد ${e[0][1]} سجل`);});
    if(!insights.length) insights.push("تمت قراءة البيانات بنجاح، ولم يتم العثور على عمود تصنيفي مناسب للرسم.");
    const charts=cats.map(c=>{const entries=Object.entries(c.counts).sort((a,b)=>b[1]-a[1]).slice(0,10),max=Math.max(...entries.map(e=>e[1]),1);return `<div class="chart-card"><h3>تحليل ${esc(c.header)}</h3>${entries.map(([name,count])=>`<div class="bar-row"><div class="bar-label"><strong>${esc(name)}</strong><span>${count} (${totalRows?((count/totalRows)*100).toFixed(1):0}%)</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/max*100)}%"></div></div></div>`).join("")}</div>`;}).join("");
    const html=`<div class="analysis-sheet"><div class="metric-grid"><div class="metric"><strong>${totalRows}</strong>إجمالي السجلات</div><div class="metric"><strong>${totalColumns}</strong>عدد الأعمدة</div><div class="metric"><strong>${cats.length}</strong>محاور التحليل</div><div class="metric"><strong style="font-size:18px">${esc(excel.sheetName||'-')}</strong>ورقة البيانات</div></div>${charts}<div class="chart-card"><h3>أبرز النتائج والتوصيات</h3><ul class="insights">${insights.map(x=>`<li>${esc(x)}</li>`).join("")}<li>يوصى بمتابعة القيم الأعلى ومقارنتها دوريًا مع التحديث القادم للبيانات.</li></ul></div><p style="text-align:center;color:#667085;font-size:13px">تم إنشاء التحليل تلقائيًا • ${new Date().toLocaleString("ar-SA")}</p></div>`;
    return {html,data:{totalRows,totalColumns,insights}};
  }

  async function analyze(index){
    const excel=state.excel.get(index); if(!excel?.rows?.length){alert("اختر ملف Excel أولاً");return;}
    const result=buildAnalysis(index,excel);
    // نحفظ HTML الناتج مباشرة؛ لا نعتمد على عنصر DOM مكرر كما في النسخة القديمة.
    const {data,error}=await db.from("indicator_analyses").insert({school_id:state.schoolId,indicator_index:index,file_name:excel.fileName||"",analysis_data:result.data,analysis_html:result.html,updated_at:new Date().toISOString()}).select().single();
    if(error){alert("تعذر حفظ التحليل: "+error.message);return;}
    state.analyses.set(index,data); showAnalysis(index,data); renderIndicators(); updateStats();
  }

  function showAnalysis(index,row){state.modalIndex=index;$("modalTitle").textContent=`التحليل الذكي للمؤشر ${index+1}`;$("modalMeta").textContent=`${row.file_name||""} • ${fmt(row.updated_at||row.created_at)}`;$("modalAnalysisContent").innerHTML=row.analysis_html||"لا يوجد محتوى";$("analysisModal").classList.remove("hidden");$("analysisModal").setAttribute("aria-hidden","false");}
  function closeModal(){$("analysisModal").classList.add("hidden");$("analysisModal").setAttribute("aria-hidden","true");}
  function printModal(){window.print();}
  function downloadModal(){const i=state.modalIndex,row=state.analyses.get(i);if(!row)return;const html=`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تحليل المؤشر ${i+1}</title><style>body{font-family:Tahoma,Arial;padding:30px;direction:rtl}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric,.chart-card{border:1px solid #ddd;border-radius:12px;padding:15px;margin:10px 0}.bar-track{height:16px;background:#eee;border-radius:8px;overflow:hidden}.bar-fill{height:100%;background:#176b5b}</style><body><h1>تقرير التحليل الآلي - المؤشر ${i+1}</h1>${row.analysis_html}</body></html>`;const blob=new Blob([html],{type:"text/html;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`تحليل-المؤشر-${i+1}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}

  async function deleteFile(index,id,path){if(!confirm("هل تريد حذف هذا الملف؟"))return;const {error:sErr}=await db.storage.from(cfg.storageBucket).remove([path]);if(sErr){alert("تعذر حذف الملف: "+sErr.message);return;}const {error}=await db.from("indicator_attachments").delete().eq("id",id).eq("school_id",state.schoolId);if(error){alert("تعذر حذف بيانات الملف: "+error.message);return;}await refreshAll();}
  function printIndicator(index){state.open.add(index);renderIndicators();setTimeout(()=>window.print(),50);}

  document.addEventListener("click",e=>{
    const t=e.target.closest("[data-toggle],[data-upload],[data-excel],[data-view],[data-print],[data-delete-id]"); if(!t)return;
    if(t.dataset.toggle!==undefined){const i=Number(t.dataset.toggle);state.open.has(i)?state.open.delete(i):state.open.add(i);renderIndicators();}
    else if(t.dataset.upload!==undefined) $("upload-"+t.dataset.upload).click();
    else if(t.dataset.excel!==undefined) $("excel-"+t.dataset.excel).click();
    else if(t.dataset.view!==undefined){const i=Number(t.dataset.view);showAnalysis(i,state.analyses.get(i));}
    else if(t.dataset.print!==undefined) printIndicator(Number(t.dataset.print));
    else if(t.dataset.deleteId!==undefined) deleteFile(Number(t.dataset.deleteIndex),t.dataset.deleteId,t.dataset.deletePath);
  });
  document.addEventListener("change",e=>{if(e.target.id?.startsWith("upload-"))uploadFiles(Number(e.target.id.split("-")[1]),e.target.files);if(e.target.id?.startsWith("excel-")){const f=e.target.files[0];if(f)readExcel(Number(e.target.id.split("-")[1]),f);}});
  document.addEventListener("input",e=>{if(e.target.dataset.report!==undefined)localStorage.setItem(`report_${e.target.dataset.report}`,e.target.value);});

  $("loginBtn").addEventListener("click",login); $("loginPassword").addEventListener("keydown",e=>{if(e.key==="Enter")login();});
  $("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.reload();});
  $("refreshBtn").addEventListener("click",refreshAll); $("printAllBtn").addEventListener("click",()=>window.print());
  $("searchInput").addEventListener("input",renderIndicators); $("expandAllBtn").addEventListener("click",()=>{indicators.forEach(x=>state.open.add(x.index));renderIndicators();});
  $("modalCloseBtn").addEventListener("click",closeModal); $("modalPrintBtn").addEventListener("click",printModal); $("modalDownloadBtn").addEventListener("click",downloadModal);

  document.addEventListener("DOMContentLoaded",async()=>{const {data}=await db.auth.getSession();if(data.session){state.session=data.session;await startApp();}});
})();
