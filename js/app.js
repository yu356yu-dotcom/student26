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
      const fileName = file.name.toLowerCase();

if (
  fileName.endsWith(".xlsx") ||
  fileName.endsWith(".xls")
) {
  await readExcel(index, file);
  continue;
}

if (fileName.endsWith(".pdf")) {
  await readPdf(index, file);
  continue;
} 
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"); const path=`${state.schoolId}/${index}/${Date.now()}_${safe}`;
      const {error:upErr}=await db.storage.from(cfg.storageBucket).upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false});
      if(upErr){alert(`تعذر رفع ${file.name}: ${upErr.message}`);continue;}
      const {error:dbErr}=await db.from("indicator_attachments").insert({indicator_index:index,file_name:file.name,file_path:path,mime_type:file.type,file_size:file.size,created_by:state.session.user.id,school_id:state.schoolId});
      if(dbErr){await db.storage.from(cfg.storageBucket).remove([path]);alert(`تعذر حفظ ${file.name}: ${dbErr.message}`);}
    }
    await refreshAll();
  }
async function readPdf(index, file) {
  try {
    if (typeof pdfjsLib === "undefined") {
      throw new Error("مكتبة PDF.js غير محملة");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const buffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer)
    }).promise;

    let fullText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const pageText = content.items
        .map(item => item.str)
        .join(" ");

      fullText += pageText + "\n";
    }

    fullText = fullText.trim();

    if (!fullText) {
      alert(
        "تم فتح ملف PDF ولكن لم يتم العثور على نص قابل للقراءة. قد يكون الملف عبارة عن صور ممسوحة ضوئياً."
      );
      return;
    }

    const wordCount = fullText
      .split(/\s+/)
      .filter(Boolean).length;

    alert(
      "تمت قراءة ملف PDF بنجاح ✅\n\n" +
      "اسم الملف: " + file.name + "\n" +
      "عدد الصفحات: " + pdf.numPages + "\n" +
      "عدد الكلمات تقريباً: " + wordCount
    );

  } catch (e) {
    console.error("PDF error:", e);
    alert("تعذر قراءة ملف PDF: " + e.message);
  }
}

  async function readExcel(index,file){
    try{
      const buf=await file.arrayBuffer(), wb=XLSX.read(new Uint8Array(buf),{type:"array"}), sheetName=wb.SheetNames[0], ws=wb.Sheets[sheetName];
      const matrix=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
      state.excel.set(index,{fileName:file.name,sheetName,headers:matrix[0]||[],rows:matrix.slice(1)});
      await analyze(index);
    }catch(e){alert("تعذر قراءة ملف Excel: "+e.message);}
  }

  function buildAnalysis(index, excel) {
  const headers = excel.headers || [];

  // تنظيف الصفوف واستبعاد الصفوف الفارغة
  const rows = (excel.rows || []).filter(row =>
    row?.some(cell => String(cell ?? "").trim() !== "")
  );

  const totalRows = rows.length;
  const totalColumns = headers.length;

  // كلمات تساعد على إعطاء الأولوية للأعمدة المهمة تربويًا
  const preferred = [
    "الصف",
    "الشعبة",
    "الحالة",
    "نوع",
    "التصنيف",
    "المرحلة",
    "الجنس",
    "غياب",
    "سلوك",
    "تحصيل",
    "درجة",
    "نتيجة"
  ];

  // تحليل كل عمود
  const stats = headers.map((header, colIndex) => {
    const values = rows.map(row =>
      String(row[colIndex] ?? "").trim()
    );

    const nonEmpty = values.filter(Boolean);
    const missing = totalRows - nonEmpty.length;

    const counts = {};

    nonEmpty.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });

    const uniqueCount = Object.keys(counts).length;

    const numericValues = nonEmpty
      .map(value => Number(
        String(value).replace(/,/g, "").replace("%", "")
      ))
      .filter(value => Number.isFinite(value));

    let numeric = null;

    if (
      numericValues.length >= Math.max(
        2,
        Math.round(nonEmpty.length * 0.7)
      )
    ) {
      const sum = numericValues.reduce((a, b) => a + b, 0);

      numeric = {
        count: numericValues.length,
        average: numericValues.length
          ? sum / numericValues.length
          : 0,
        min: numericValues.length
          ? Math.min(...numericValues)
          : 0,
        max: numericValues.length
          ? Math.max(...numericValues)
          : 0
      };
    }

    return {
      header: String(header || `عمود ${colIndex + 1}`),
      counts,
      uniqueCount,
      missing,
      numeric
    };
  });

  // حساب جودة البيانات
  const totalCells = totalRows * totalColumns;

  const missingCells = stats.reduce(
    (sum, item) => sum + item.missing,
    0
  );

  const completeness = totalCells
    ? ((totalCells - missingCells) / totalCells) * 100
    : 0;

  // اكتشاف الصفوف المكررة
  const rowKeys = rows.map(row =>
    JSON.stringify(
      headers.map((_, i) =>
        String(row[i] ?? "").trim()
      )
    )
  );

  const duplicateRows =
    rowKeys.length - new Set(rowKeys).size;

  // اختيار أفضل الأعمدة التصنيفية للرسم
  const categories = stats
    .filter(item =>
      item.uniqueCount >= 2 &&
      item.uniqueCount <= 20
    )
    .sort((a, b) => {
      const aPreferred = preferred.some(word =>
        a.header.includes(word)
      );

      const bPreferred = preferred.some(word =>
        b.header.includes(word)
      );

      return Number(bPreferred) - Number(aPreferred);
    })
    .slice(0, 4);

  // إنشاء الاستنتاجات
  const insights = [];

  categories.forEach(category => {
    const entries = Object.entries(category.counts)
      .sort((a, b) => b[1] - a[1]);

    if (!entries.length) return;

    const [topName, topCount] = entries[0];

    const percent = totalRows
      ? ((topCount / totalRows) * 100).toFixed(1)
      : "0.0";

    insights.push(
      `${category.header}: الأعلى "${topName}" بعدد ${topCount} (${percent}%).`
    );
  });

  if (missingCells > 0) {
    insights.push(
      `يوجد ${missingCells} حقلًا فارغًا في البيانات، ونسبة اكتمال البيانات ${completeness.toFixed(1)}%.`
    );
  } else {
    insights.push(
      "لا توجد قيم مفقودة في البيانات المحللة."
    );
  }

  if (duplicateRows > 0) {
    insights.push(
      `تم اكتشاف ${duplicateRows} صفًا مكررًا ويُنصح بمراجعته قبل اعتماد النتائج النهائية.`
    );
  }

  const numericStats = stats
    .filter(item => item.numeric)
    .slice(0, 4);

  numericStats.forEach(item => {
    insights.push(
      `${item.header}: المتوسط ${item.numeric.average.toFixed(1)}، الأدنى ${item.numeric.min}، الأعلى ${item.numeric.max}.`
    );
  });

  // الرسوم البيانية
  const charts = categories.map(category => {
    const entries = Object.entries(category.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const max = Math.max(
      1,
      ...entries.map(entry => entry[1])
    );

    const bars = entries.map(([name, count]) => {
      const percent = totalRows
        ? ((count / totalRows) * 100).toFixed(1)
        : "0.0";

      const width = Math.max(
        3,
        Math.round((count / max) * 100)
      );

      return `
        <div class="bar-row">
          <div class="bar-label">
            <strong>${esc(name)}</strong>
            <span>${count} (${percent}%)</span>
          </div>

          <div class="bar-track">
            <div
              class="bar-fill"
              style="width:${width}%"
            ></div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="chart-card">
        <h3>📊 ${esc(category.header)}</h3>
        ${bars}
      </div>
    `;
  }).join("");

  const qualityText =
    completeness >= 95
      ? "ممتازة"
      : completeness >= 85
        ? "جيدة جدًا"
        : completeness >= 70
          ? "جيدة"
          : "تحتاج مراجعة";

  const html = `
    <div class="analysis-sheet">

      <div class="metric-grid">

        <div class="metric">
          <strong>${totalRows}</strong>
          إجمالي السجلات
        </div>

        <div class="metric">
          <strong>${totalColumns}</strong>
          عدد الأعمدة
        </div>

        <div class="metric">
          <strong>${completeness.toFixed(1)}%</strong>
          اكتمال البيانات
        </div>

        <div class="metric">
          <strong>${duplicateRows}</strong>
          الصفوف المكررة
        </div>

        <div class="metric">
          <strong>${categories.length}</strong>
          محاور التحليل
        </div>

        <div class="metric">
          <strong>${qualityText}</strong>
          جودة البيانات
        </div>

      </div>

      ${charts || `
        <div class="chart-card">
          لا توجد أعمدة تصنيفية مناسبة لإنشاء رسم بياني.
        </div>
      `}

      <div class="chart-card">
        <h3>🔎 أبرز النتائج والتوصيات</h3>

        <ul class="insights">
          ${insights.map(item =>
            `<li>${esc(item)}</li>`
          ).join("")}
        </ul>
      </div>

      <div
        style="
          text-align:center;
          color:#667085;
          font-size:13px;
          margin-top:15px;
        "
      >
        تم إنشاء التحليل آليًا •
        ${new Date().toLocaleString("ar-SA")}
      </div>

    </div>
  `;

  return {
    html,
    data: {
      totalRows,
      totalColumns,
      completeness: Number(completeness.toFixed(1)),
      missingCells,
      duplicateRows,
      insights
    }
  };
}

  async function analyze(index){
  const excel=state.excel.get(index);
  if(!excel?.rows?.length){
    alert("أولاً اختر ملف Excel");
    return;
  }

  const result=buildAnalysis(index,excel);

  // تحديد فترة التحليل تلقائياً
  const now = new Date();

const defaultPeriod =
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const periodInput = prompt(
  "أدخل فترة التحليل بصيغة YYYY-MM\nمثال: 2026-09",
  defaultPeriod
);

if (periodInput === null) {
  return;
}

const periodLabel = periodInput.trim();

if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodLabel)) {
  alert("صيغة الفترة غير صحيحة. استخدم مثلاً: 2026-09");
  return;
}

const [analysisYearText, analysisMonthText] = periodLabel.split("-");
const analysisYear = Number(analysisYearText);
const analysisMonth = Number(analysisMonthText);
// اسم تلقائي للملف عند عدم وجود اسم
const automaticFileName = `تحليل_${periodLabel}.xlsx`;

const safeFileName =
  excel.fileName && String(excel.fileName).trim()
    ? excel.fileName
    : automaticFileName;
  // حفظ تحليل جديد مستقل وعدم الكتابة فوق التحليلات السابقة
  const {data,error}=await db.from("indicator_analyses").insert({
    school_id:state.schoolId,
    indicator_index:index,
    file_name:safeFileName,
    analysis_data:result.data,
    analysis_html:result.html,
    analysis_year:analysisYear,
    analysis_month:analysisMonth,
    period_label:periodLabel,
    updated_at:now.toISOString()
  }).select().single();

  if(error){
    alert("تعذر حفظ التحليل: "+error.message);
    return;
  }

  state.analyses.set(index,data);
  showAnalysis(index,data);
  renderIndicators();
  updateStats();
}

  function showAnalysis(index,row){state.modalIndex=index;$("modalTitle").textContent=`التحليل الذكي للمؤشر ${index+1}`;$("modalMeta").textContent=`${row.file_name||""} • ${fmt(row.updated_at||row.created_at)}`;$("modalAnalysisContent").innerHTML=row.analysis_html||"لا يوجد محتوى";$("analysisModal").classList.remove("hidden");$("analysisModal").setAttribute("aria-hidden","false");loadAnalysisHistory(index);}

  async function loadAnalysisHistory(index) {
  const { data, error } = await db
    .from("indicator_analyses")
    .select("*")
    .eq("school_id", state.schoolId)
    .eq("indicator_index", index)
    .order("created_at", { ascending: false });

  if (error) {
    alert("تعذر تحميل سجل التحليلات: " + error.message);
    return [];
  }

  const list = $("analysisHistoryList");

  if (list) {
    if (!data || data.length === 0) {
      list.innerHTML = "<p>لا توجد تحليلات سابقة لهذا المؤشر.</p>";
    } else {
   list.innerHTML = data.map((row, i) => `
  <div style="padding:10px;border:1px solid #ddd;border-radius:8px;margin:8px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">

   ${row.period_label ? `
  <input
    type="checkbox"
    class="analysis-period-check"
    value="${i}"
    data-period="${row.period_label}"
    style="width:18px;height:18px;"
    title="اختيار هذه الفترة للمقارنة"
  >
` : `
  <span
    style="font-size:12px;color:#888;margin-left:8px;"
    title="هذا تحليل قديم لم يتم تسجيل فترة زمنية له">
    غير متاح للمقارنة
  </span>
`}

    <strong>${row.period_label || "بدون فترة"}</strong>

    <span> - ${row.file_name || "بدون اسم ملف"}</span>

    <button
      class="btn secondary"
      onclick="openHistoryAnalysis(${index}, ${i})">
      عرض التحليل
    </button>

  </div>
`).join("");   
    }
  }
const compareBtn = document.createElement("button");
compareBtn.className = "btn secondary";
compareBtn.style.margin = "12px 0";
compareBtn.textContent = "📊 مقارنة الفترات المحددة";
compareBtn.onclick = () => {
  const selected = [
    ...document.querySelectorAll(".analysis-period-check:checked")
  ];

  const periods = selected.map(item => item.dataset.period);

  window.compareSelectedPeriods(periods);
};

list.appendChild(compareBtn);
  window.analysisHistoryData = data || [];
const monthlyRows = (data || []).filter(row => row.period_label);

window.analysisMonthsData = monthlyRows.filter(
  (row, i, arr) =>
    i === arr.findIndex(x => x.period_label === row.period_label)
);
  return data || [];
}


window.openHistoryAnalysis = function(index, i){
  const row = window.analysisHistoryData?.[i];

  if (!row) {
    alert("تعذر العثور على التحليل");
    return;
  }

  state.modalIndex = index;

  $("modalTitle").textContent =
    `التحليل المحفوظ للمؤشر ${index + 1}`;

  $("modalMeta").textContent =
    `${row.period_label || "بدون فترة"} • ${row.file_name || ""} • ${fmt(row.updated_at || row.created_at)}`;

  $("modalAnalysisContent").innerHTML =
    row.analysis_html || "لا يوجد محتوى";

  $("analysisModal").classList.remove("hidden");
  $("analysisModal").setAttribute("aria-hidden", "false");
}
window.compareAllMonths = function () {
  const rows = window.analysisMonthsData || [];
const uniquePeriods = [...new Set(
  rows
    .map(row => row.period_label)
    .filter(Boolean)
)];

if (uniquePeriods.length < 2) {
  alert("الفترات المختارة تحمل نفس الشهر. اختر فترتين مختلفتين للمقارنة.");
  return;
}
  if (rows.length < 2) {
    alert("يجب وجود تحليلين لشهرين مختلفين على الأقل لإجراء المقارنة");
    return;
  }

  // الاحتفاظ بتحليل واحد فقط لكل فترة
const uniqueRows = Array.from(
  new Map(
    rows.map(row => [row.period_label, row])
  ).values()
);

// ترتيب الفترات زمنياً
const sorted = [...uniqueRows].sort((a, b) =>
  String(a.period_label).localeCompare(String(b.period_label))
);
// ===== التنبؤ الذكي للفترة القادمة =====
const totals = sorted.map(row =>
  Number(row.analysis_data?.totalRows || 0)
);

let prediction = null;
let predictionTrend = "غير متاح";
let predictionConfidence = "منخفض";

if (totals.length >= 2) {
  const changes = [];

  for (let i = 1; i < totals.length; i++) {
    changes.push(totals[i] - totals[i - 1]);
  }

  const averageChange =
    changes.reduce((sum, value) => sum + value, 0) /
    changes.length;

  const lastTotal = totals[totals.length - 1];

  prediction = Math.max(
    0,
    Math.round(lastTotal + averageChange)
  );

  if (averageChange > 0) {
    predictionTrend = "▲ اتجاه تصاعدي";
  } else if (averageChange < 0) {
    predictionTrend = "▼ اتجاه تنازلي";
  } else {
    predictionTrend = "● اتجاه مستقر";
  }

  if (totals.length >= 6) {
    predictionConfidence = "مرتفع";
  } else if (totals.length >= 3) {
    predictionConfidence = "متوسط";
  }
}
  const comparisonRows = sorted.map((row, i) => {
    const current = row.analysis_data || {};
    const previous = i > 0 ? (sorted[i - 1].analysis_data || {}) : null;

    const total = Number(current.totalRows || 0);
    const previousTotal = previous
      ? Number(previous.totalRows || 0)
      : null;

    let changeText = "—";

    if (previousTotal !== null) {
  const difference = total - previousTotal;

  let percentText = "";

  if (previousTotal !== 0) {
    const percent = Math.abs(
      (difference / previousTotal) * 100
    ).toFixed(1);

    percentText = ` (${percent}%)`;
  }

  if (difference > 0) {
    changeText = `▲ زيادة ${difference}${percentText}`;
  } else if (difference < 0) {
    changeText = `▼ انخفاض ${Math.abs(difference)}${percentText}`;
  } else {
    changeText = "● بدون تغيير (0%)";
  }
}

    return `
      <tr>
        <td>${row.period_label || "—"}</td>
        <td>${total}</td>
        <td>${current.totalColumns || 0}</td>
        <td>${changeText}</td>
      </tr>
    `;
  }).join("");

  $("modalTitle").textContent = "📊 مقارنة التحليلات الشهرية";

  $("modalMeta").textContent =
    `عدد الأشهر المقارنة: ${sorted.length}`;

  $("modalAnalysisContent").innerHTML = `
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;text-align:center">
        <thead>
          <tr>
            <th style="padding:10px;border:1px solid #ddd">الفترة</th>
            <th style="padding:10px;border:1px solid #ddd">إجمالي السجلات</th>
            <th style="padding:10px;border:1px solid #ddd">عدد الأعمدة</th>
            <th style="padding:10px;border:1px solid #ddd">التغير عن الفترة السابقة</th>
          </tr>
        </thead>
        <tbody>
          ${comparisonRows}
        </tbody>
      </table>
      <div style="margin-top:20px;padding:16px;border:1px solid #ddd;border-radius:10px;text-align:right;">
  <h3>🔮 التنبؤ للفترة القادمة</h3>

  ${
    prediction !== null
      ? `
        <p><strong>القيمة المتوقعة:</strong> ${prediction}</p>
        <p><strong>الاتجاه المتوقع:</strong> ${predictionTrend}</p>
        <p><strong>مستوى الثقة:</strong> ${predictionConfidence}</p>

        <h3>💡 المقترحات العلمية</h3>

        ${
          predictionTrend.includes("تصاعدي")
            ? `
              <p>• دراسة أسباب الارتفاع وتحديد العوامل الأكثر تأثيرًا.</p>
              <p>• تطبيق تدخلات وقائية مبكرة للفئات الأكثر تأثرًا.</p>
              <p>• متابعة المؤشر دوريًا وقياس أثر التدخلات.</p>
            `
            : predictionTrend.includes("تنازلي")
            ? `
              <p>• المحافظة على الإجراءات التي ساهمت في التحسن.</p>
              <p>• تحليل العوامل المرتبطة بالانخفاض للاستفادة منها.</p>
              <p>• استمرار المتابعة للتأكد من استدامة الاتجاه الإيجابي.</p>
            `
            : `
              <p>• استمرار متابعة المؤشر خلال الفترات القادمة.</p>
              <p>• تحليل المتغيرات المؤثرة للحفاظ على الاستقرار وتحسين النتائج.</p>
            `
        }

        <p style="font-size:13px;margin-top:15px;">
          ⚠️ التنبؤ تقديري ومبني على الاتجاه التاريخي للبيانات المتاحة،
          ولا يُعد قرارًا نهائيًا.
        </p>
      `
      : `
        <p>لا توجد بيانات زمنية كافية لإجراء التنبؤ.</p>
      `
  }
</div>
    </div>
  `;

  $("analysisModal").classList.remove("hidden");
  $("analysisModal").setAttribute("aria-hidden", "false");
};
window.compareSelectedPeriods = function(periods) {
  if (!periods || periods.length < 2) {
    alert("اختر فترتين على الأقل لإجراء المقارنة");
    return;
  }

  const rows = (window.analysisHistoryData || [])
  
    .filter(row => periods.includes(row.period_label));

  if (rows.length < 2) {
    alert("تعذر العثور على بيانات الفترات المحددة");
    return;
  }

  window.analysisMonthsData = rows;
  window.compareAllMonths();
};
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
