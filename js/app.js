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
const reportTemplates = {
  "التهيئة الإرشادية": {
    description: "برنامج إرشادي يهدف إلى تهيئة الطلاب للبيئة المدرسية وتعريفهم بالأنظمة والخدمات والبرامج المقدمة لهم.",
    goals: [
      "تهيئة الطلاب نفسيًا وتربويًا للعام الدراسي.",
      "تعريف الطلاب بالأنظمة والتعليمات المدرسية.",
      "تعزيز الشعور بالأمان والانتماء للمدرسة.",
      "تعريف الطلاب بخدمات التوجيه والإرشاد."
    ],
    target: "طلاب المرحلة الثانوية، مع التركيز على الطلاب المستجدين.",
    implementation: "تنفيذ لقاءات تعريفية وبرامج توعوية وأنشطة إرشادية وتعريف الطلاب بالمرافق والخدمات والأنظمة المدرسية.",
    indicators: "مشاركة الطلاب في البرنامج، مستوى التفاعل، ومدى معرفة الطلاب بالأنظمة والخدمات المدرسية.",
    results: "تحسين تكيف الطلاب مع البيئة المدرسية وتعزيز شعورهم بالأمان والانتماء.",
    recommendations: "استمرار برامج التهيئة ومتابعة الطلاب الذين يحتاجون إلى دعم إضافي."
  },

  "تعزيز الانضباط المدرسي والمواظبة": {
    description: "برنامج يهدف إلى تعزيز الانضباط والمواظبة والحد من الغياب والتأخر لدى الطلاب.",
    goals: [
      "رفع مستوى الانضباط المدرسي.",
      "الحد من الغياب والتأخر.",
      "تعزيز المسؤولية لدى الطلاب.",
      "متابعة حالات الغياب المتكرر."
    ],
    target: "جميع طلاب المرحلة الثانوية.",
    implementation: "متابعة الحضور والغياب وتنفيذ برامج توعوية وتحفيزية والتواصل مع الطلاب وأولياء الأمور عند الحاجة.",
    indicators: "نسب الحضور والغياب والتأخر والحالات المتكررة ومستوى التحسن.",
    results: "رفع مستوى الوعي بأهمية الانضباط وتحسين مستوى المواظبة.",
    recommendations: "استمرار المتابعة المبكرة للحالات المتكررة وتعزيز البرامج التحفيزية."
  },

  "تعزيز الدافعية للتعلم والتحصيل الدراسي": {
    description: "برنامج يهدف إلى رفع دافعية الطلاب للتعلم وتحسين مستوى التحصيل الدراسي.",
    goals: [
      "رفع الدافعية نحو التعلم.",
      "تحسين مستوى التحصيل الدراسي.",
      "متابعة الطلاب منخفضي التحصيل.",
      "تعزيز مهارات تنظيم الوقت والاستذكار."
    ],
    target: "طلاب المرحلة الثانوية، وخاصة الطلاب الذين يحتاجون إلى دعم دراسي.",
    implementation: "تنفيذ لقاءات إرشادية ومتابعة نتائج الطلاب وتحديد جوانب الضعف ووضع خطط متابعة وتحفيز.",
    indicators: "مستوى التحسن الدراسي، نتائج الطلاب، وعدد الحالات التي تمت متابعتها.",
    results: "تحسن الدافعية للتعلم ورفع مستوى التحصيل لدى الطلاب المستهدفين.",
    recommendations: "استمرار متابعة التحصيل وتقديم التدخل الإرشادي المبكر للطلاب المتعثرين."
  },

  "تعزيز القيم والسلوك الإيجابي": {
    description: "برنامج تربوي يهدف إلى تعزيز القيم الإسلامية والوطنية والسلوكيات الإيجابية لدى الطلاب.",
    goals: [
      "تعزيز القيم الإسلامية والوطنية.",
      "تنمية السلوك الإيجابي.",
      "تعزيز المسؤولية والاحترام.",
      "الحد من السلوكيات غير المرغوبة."
    ],
    target: "جميع طلاب المرحلة الثانوية.",
    implementation: "تنفيذ أنشطة وبرامج توعوية ومسابقات ومواقف تربوية تعزز القيم والسلوك الإيجابي.",
    indicators: "مشاركة الطلاب، السلوكيات الإيجابية المرصودة، ومستوى انخفاض المخالفات.",
    results: "تعزيز السلوك الإيجابي وتنمية القيم والمسؤولية لدى الطلاب.",
    recommendations: "استمرار تعزيز السلوكيات الإيجابية وربطها بالمواقف اليومية داخل المدرسة."
  },

  "التوجيه والإرشاد المهني": {
    description: "برنامج يساعد طلاب المرحلة الثانوية على التعرف على ميولهم وقدراتهم واتخاذ قرارات تعليمية ومهنية مناسبة.",
    goals: [
      "تنمية الوعي المهني.",
      "التعرف على الميول والقدرات.",
      "التعريف بالتخصصات الجامعية.",
      "مساعدة الطلاب على التخطيط لمستقبلهم."
    ],
    target: "طلاب المرحلة الثانوية، وخاصة الصفوف القريبة من التخرج.",
    implementation: "تنفيذ لقاءات مهنية واختبارات ميول واستضافة مختصين والتعريف بالتخصصات والفرص التعليمية والمهنية.",
    indicators: "عدد المستفيدين، مستوى المشاركة، ومدى وضوح الخيارات التعليمية والمهنية لدى الطلاب.",
    results: "زيادة وعي الطلاب بالمسارات التعليمية والمهنية ودعم قدرتهم على اتخاذ القرار.",
    recommendations: "زيادة البرامج المهنية وربط الطلاب بالمصادر والجهات التعليمية والمهنية الموثوقة."
  },

  "التفوق والتميز الدراسي": {
    description: "برنامج يهدف إلى رعاية الطلاب المتفوقين وتعزيز استمرار تفوقهم وتحفيزهم على التميز.",
    goals: [
      "رعاية الطلاب المتفوقين.",
      "تحفيز الطلاب على التميز.",
      "تعزيز المنافسة الإيجابية.",
      "تقدير الإنجازات الدراسية."
    ],
    target: "الطلاب المتفوقون والمتميزون دراسيًا.",
    implementation: "حصر الطلاب المتفوقين وتكريمهم وتنفيذ برامج تحفيزية ومتابعة استمرار تقدمهم الدراسي.",
    indicators: "عدد الطلاب المتفوقين، نسب التحصيل، واستمرار مستوى التفوق.",
    results: "رفع مستوى التحفيز وتعزيز ثقافة التفوق والتميز.",
    recommendations: "استمرار برامج التكريم والتحفيز وتقديم فرص إثرائية للطلاب المتفوقين."
  },

  "الدعم النفسي والاجتماعي": {
    description: "برنامج يهدف إلى تقديم الدعم النفسي والاجتماعي للطلاب وتعزيز التوافق النفسي والاجتماعي داخل البيئة المدرسية.",
    goals: [
      "تعزيز الصحة النفسية.",
      "مساعدة الطلاب في مواجهة المشكلات.",
      "تنمية مهارات التكيف.",
      "تقديم الدعم للحالات التي تحتاج إلى متابعة."
    ],
    target: "جميع الطلاب، مع التركيز على الحالات التي تحتاج إلى دعم نفسي أو اجتماعي.",
    implementation: "جلسات إرشادية فردية وجماعية وبرامج توعوية ومتابعة الحالات والتواصل مع الأسرة والجهات المختصة عند الحاجة.",
    indicators: "عدد الحالات المتابعة، مستوى التحسن، وعدد البرامج والجلسات المنفذة.",
    results: "تحسين التوافق النفسي والاجتماعي ودعم الطلاب في التعامل مع المشكلات.",
    recommendations: "استمرار المتابعة والمحافظة على السرية والإحالة للجهات المختصة عندما تتطلب الحالة ذلك."
  },

  "المهارات الحياتية والشخصية": {
    description: "برنامج يهدف إلى تنمية المهارات الشخصية والاجتماعية التي تساعد الطالب على التعامل الإيجابي مع المواقف المختلفة.",
    goals: [
      "تنمية مهارات اتخاذ القرار.",
      "تعزيز مهارات حل المشكلات.",
      "تطوير مهارات التواصل.",
      "تنمية إدارة الوقت والضغوط."
    ],
    target: "جميع طلاب المرحلة الثانوية.",
    implementation: "ورش عمل وأنشطة تطبيقية ومواقف تدريبية وجلسات إرشادية لتنمية المهارات الحياتية.",
    indicators: "عدد الأنشطة والمستفيدين ومستوى المشاركة والتطبيق.",
    results: "تحسن مهارات التواصل واتخاذ القرار وحل المشكلات لدى الطلاب.",
    recommendations: "زيادة الأنشطة التطبيقية وربط المهارات بالمواقف الدراسية والحياتية."
  },

  "الشراكة بين الأسرة والمدرسة": {
    description: "برنامج يهدف إلى تعزيز التواصل والتكامل بين المدرسة والأسرة لدعم الطالب تربويًا ودراسيًا وسلوكيًا.",
    goals: [
      "تعزيز التواصل مع أولياء الأمور.",
      "رفع مستوى مشاركة الأسرة.",
      "دعم التحصيل والانضباط.",
      "تحقيق التكامل بين الأسرة والمدرسة."
    ],
    target: "أولياء أمور طلاب المرحلة الثانوية والطلاب.",
    implementation: "عقد اللقاءات وإرسال الرسائل والاستبانات ومناقشة مستوى الطلاب وتقديم التوصيات المناسبة للأسرة.",
    indicators: "نسبة مشاركة أولياء الأمور، عدد اللقاءات، والاستجابات والمتابعات المنفذة.",
    results: "تحسين التواصل بين المدرسة والأسرة وتعزيز متابعة الطلاب.",
    recommendations: "تنويع وسائل التواصل وزيادة مشاركة أولياء الأمور في البرامج المدرسية."
  },

  "رعاية الحالات الطلابية والفئات ذات الاحتياج": {
    description: "برنامج يهدف إلى اكتشاف ودراسة ومتابعة الحالات الطلابية التي تحتاج إلى خدمات إرشادية أو تربوية خاصة.",
    goals: [
      "الاكتشاف المبكر للحالات.",
      "دراسة احتياجات الطلاب.",
      "تقديم التدخل الإرشادي المناسب.",
      "متابعة تطور الحالة."
    ],
    target: "الطلاب الذين تظهر لديهم احتياجات تربوية أو اجتماعية أو دراسية أو سلوكية تستدعي المتابعة.",
    implementation: "دراسة الحالة ووضع خطة متابعة وتنفيذ التدخلات المناسبة والتواصل مع الأسرة والإحالة للجهات المختصة عند الحاجة.",
    indicators: "عدد الحالات، نوع التدخل، مستوى المتابعة، ونسبة التحسن.",
    results: "تحسين متابعة الحالات وتقديم التدخل المناسب وفق احتياجات كل طالب.",
    recommendations: "استمرار المتابعة وتحديث خطط الحالات والمحافظة على الخصوصية والسرية."
  }
};
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt = d => d ? new Date(d).toLocaleString("ar-SA") : "—";

  async function getMembership(){
    const {data,error}=await db.from("school_memberships").select("school_id, role").eq("user_id",state.session.user.id).single();
    if(error || !data) throw new Error("تعذر تحديد المدرسة المرتبطة بالحساب");
    state.schoolId=data.school_id; 
    state.role = data.role;
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
     loadProgramTemplates(); 
     $("openProgramReportBtn").onclick = openProgramReport;
     $("programReportCloseBtn").onclick = () => {
  $("programReportModal").classList.add("hidden");
  $("programReportModal").setAttribute("aria-hidden", "true");
};
const isMobilePrint = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
$("programReportPrintBtn").onclick = () => {
  const reportContent = document.getElementById("programReportModalContent");
  if (!reportContent) {
    alert("تعذر العثور على محتوى التقرير");
    return;
  }
if (isMobilePrint) {
  window.print();
  return;
}
  const printWindow = window.open("", "_blank", "width=900,height=1000");
  const reportClone = reportContent.cloneNode(true);

  reportClone.querySelectorAll("button, .report-photo-actions, .photo-layout-selector").forEach(el => el.remove());

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير البرنامج</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body {
          font-family: Arial, Tahoma, sans-serif;
          direction: rtl;
          color: #163c39;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        h1 {
          margin: 0 0 12px !important;
          padding: 12px 16px !important;
          text-align: center !important;
          color: #075e54 !important;
          background: #eaf5f2 !important;
          border-right: 6px solid #d4af37 !important;
          border-bottom: 3px solid #d4af37 !important;
          border-radius: 10px !important;
          font-size: 23px !important;
          line-height: 1.35 !important;
        }
        .report-section {
          margin: 0 0 8px !important;
          padding: 10px 12px !important;
          background: #f8fbfa !important;
          border: 1px solid #d7e7e2 !important;
          border-right: 5px solid #0f766e !important;
          border-radius: 10px !important;
          box-shadow: none !important;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .report-section h2 {
          margin: -10px -12px 8px !important;
          padding: 7px 12px !important;
          background: linear-gradient(135deg, #0f766e, #115e59) !important;
          color: #fff !important;
          border: 0 !important;
          border-radius: 9px 9px 4px 4px !important;
          font-size: 16px !important;
          line-height: 1.4 !important;
        }
        p, li { font-size: 12.5px !important; line-height: 1.6 !important; }
        p { margin: 4px 0 !important; }
        ul { margin: 4px 0 !important; padding-right: 20px !important; }
        .report-photos {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)) !important;
          gap: 8px !important;
          width: 100% !important;
          margin-top: 8px !important;
        }
        .report-photos img {
          width: 100% !important;
          height: 135px !important;
          object-fit: cover !important;
          border: 1px solid #d7e7e2 !important;
          border-radius: 8px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        button, .report-photo-actions, .photo-layout-selector { display: none !important; }
      </style>
    </head>
    <body>${reportClone.innerHTML}</body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
};
$("programReportShareBtn").onclick = async () => {
  const reportContent = document.getElementById("programReportModalContent");

  if (!reportContent) {
    alert("تعذر العثور على محتوى التقرير");
    return;
  }

  if (typeof html2pdf === "undefined") {
    alert("تعذر تحميل أداة إنشاء PDF");
    return;
  }

  try {
    const programName =
      $("programSelect")?.value || "تقرير_برنامج";

    const safeName = programName
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "_");

    // نستخدم التقرير الظاهر نفسه وليس نسخة مخفية خارج الشاشة
    const reportClone = reportContent.cloneNode(true);

    // إزالة أزرار التحكم فقط مع إبقاء الشواهد والصور
    reportClone
      .querySelectorAll(
        "button, .report-photo-actions, .photo-layout-selector, input[type='file']"
      )
      .forEach(el => el.remove());

    // حاوية مؤقتة ظاهرة لمحرك PDF ولكن فوق الصفحة
    const renderHost = document.createElement("div");

    Object.assign(renderHost.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: "794px",
      background: "#ffffff",
      zIndex: "999999",
      opacity: "1",
      pointerEvents: "none"
    });

    Object.assign(reportClone.style, {
      display: "block",
      visibility: "visible",
      opacity: "1",
      width: "794px",
      maxWidth: "794px",
      background: "#ffffff"
    });

    renderHost.appendChild(reportClone);
    document.body.appendChild(renderHost);

    // انتظار تحميل الصور والشواهد
    const images = [...reportClone.querySelectorAll("img")];

    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }

        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 3000);
        });
      })
    );

    // إعطاء Safari وقتًا للرسم
    await new Promise(resolve =>
      requestAnimationFrame(() =>
        requestAnimationFrame(resolve)
      )
    );

    const options = {
      margin: 8,
      filename: `${safeName}.pdf`,

      image: {
        type: "jpeg",
        quality: 0.98
      },

      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794
      },

      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      },

      pagebreak: {
        mode: ["css", "legacy"],
        avoid: [".report-section", ".report-photo-item", "img"]
      }
    };

    // إنشاء PDF كملف Blob بدلاً من تنزيله
    const pdfBlob = await html2pdf()
      .set(options)
      .from(reportClone)
      .outputPdf("blob");

    renderHost.remove();

    const pdfFile = new File(
      [pdfBlob],
      `${safeName}.pdf`,
      { type: "application/pdf" }
    );

    // مشاركة مباشرة في iPhone / iPad عند دعم مشاركة الملفات
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfFile] })
    ) {
      await navigator.share({
        title: programName,
        files: [pdfFile]
      });

      return;
    }

    // بديل للكمبيوتر أو المتصفحات التي لا تدعم مشاركة الملفات
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = `${safeName}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 5000);

  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      alert("تعذر إنشاء أو مشاركة ملف PDF");
    }
  }
};
      await refreshAll();
    }catch(e){$("loginMessage").textContent=e.message;$("loginView").classList.remove("hidden");$("appView").classList.add("hidden");}
  }
function loadProgramTemplates() {
  const select = $("programSelect");
  if (!select) return;

  select.innerHTML =
    '<option value="">-- اختر أحد البرامج --</option>';

  Object.keys(reportTemplates).forEach(programName => {
    const option = document.createElement("option");
    option.value = programName;
    option.textContent = programName;
    select.appendChild(option);
  });
}
function openProgramReport() {
  const select = $("programSelect");
  const programName = select?.value;
const templateSelect = $("reportTemplateSelect");
const templateType = templateSelect?.value || "official";
  if (!programName) {
    alert("اختر أحد البرامج أولاً");
    return;
  }

  const report = reportTemplates[programName];

  if (!report) {
    alert("تعذر العثور على نموذج التقرير");
    return;
  }

  const goals = report.goals
    .map(goal => `<li>${esc(goal)}</li>`)
    .join("");

  const reportWindow = {
  document: {
    write(html) {
      const modal = $("programReportModal");
      const content = $("programReportModalContent");
      const title = $("programReportModalTitle");

      if (!modal || !content) {
        alert("تعذر فتح نافذة التقرير");
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const reportStyles = doc.querySelector("style")?.textContent || "";

content.innerHTML = `
  <style>
    ${reportStyles}
  </style>

  <div
    class="program-report-export"
    data-template="${templateType}"
    dir="rtl"
  >
    ${doc.body.innerHTML}
  </div>
`;

      if (title) {
        title.textContent = programName;
      }

      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");
    },

    close() {}
  }
};

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl" data-template="${templateType}">
    <head>
      <meta charset="UTF-8">
      <title>${esc(programName)}</title>
      <style>
        body {
  font-family: Arial, "Tahoma", sans-serif;
  direction: rtl;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 24px 32px;
  box-sizing: border-box;
  line-height: 1.7;
  color: #163c39;
  background: #ffffff;
  overflow-x: hidden;
}

        h1 {
  text-align: center;
   color: #075e54 !important;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.4;
  margin: 8px 0 24px;
  padding-bottom: 14px;
  border-bottom: 3px solid #d4af37;
}

h2 {
  color: #075e54;
  font-size: 21px;
  font-weight: 800;
  margin: 0 0 10px;
}

        .report-section {
  background: #f8fbfa;
  border: 1px solid #d7e7e2;
  border-right: 5px solid #d4af37;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 3px 10px rgba(7, 94, 84, 0.08);
  break-inside: avoid;
}

        button {
          padding: 10px 18px;
          margin: 10px 5px;
          cursor: pointer;
        }

        @media print {
          button {
            display: none;
          }
        }
        /* ===== تصاميم قوالب التقارير ===== */

/* 1- الرسمي الوزاري */
html[data-template="official"] body {
  background: #ffffff;
  border-top: 8px solid #0f766e;
}

html[data-template="official"] h1 {
  color: #123c3a;
}

html[data-template="official"] h2 {
  color: #0f766e;
  font-weight: 800;
  padding: 8px 14px;
  margin: 18px 0 10px;
  border-right: 5px solid #d4af37;
  background: linear-gradient(90deg, #ffffff, #f0fdfa);
  border-radius: 8px;
}

html[data-template="official"] body .report-section {
  border: 1px solid #d7e7e2 !important;
  border-right: 6px solid #0f766e !important;
  background: linear-gradient(135deg, #ffffff, #f0fdfa) !important;
  border-radius: 14px !important;
  padding: 16px 20px !important;
  margin: 14px 0 !important;
  box-shadow: 0 3px 10px rgba(15, 118, 110, 0.08) !important;
  break-inside: avoid;
}

/* 2- الحديث الاحترافي */
html[data-template="modern"] body {
  background: linear-gradient(180deg, #f8fafc, #ffffff);
}

html[data-template="modern"] h1 {
  padding: 22px;
  border-radius: 18px;
  background: linear-gradient(135deg, #36afa5, #0891b2);
  color: white;
}

html[data-template="modern"] .report-section {
  border: none;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 5px 20px rgba(0,0,0,.10);
}

/* 3- البصري بالصور */
html[data-template="visual"] body {
  background: #fafafa;
}

html[data-template="visual"] h1 {
  background: #134e4a;
  color: white;
  padding: 25px;
  border-radius: 15px;
}

html[data-template="visual"] .report-section {
  border-radius: 18px;
  border: 2px solid #d1fae5;
  background: white;
}

/* 4- المختصر التنفيذي */
html[data-template="executive"] body {
  max-width: 800px;
}

html[data-template="executive"] .report-section {
  padding: 12px 18px;
  margin-bottom: 10px;
  border-radius: 8px;
  border-right: 4px solid #334155;
}

html[data-template="executive"] h2 {
  margin: 5px 0;
}

/* 5- التحليلي بالمؤشرات */
html[data-template="analytics"] body {
  background: #f8fafc;
}

html[data-template="analytics"] h1 {
  color: #1e3a8a;
}

html[data-template="analytics"] .report-section {
  background: white;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  box-shadow: 0 3px 12px rgba(30,58,138,.08);
}

html[data-template="analytics"] h2 {
  color: #1d4ed8;
}

/* 6- الدائري / الأسطواني */
html[data-template="circular"] body {
  background:
    radial-gradient(circle at top, #ecfeff 0, #ffffff 55%);
}

html[data-template="circular"] h1 {
  width: 70%;
  margin: 20px auto 35px;
  padding: 25px;
  border-radius: 50px;
  background: linear-gradient(135deg, #0f766e, #06b6d4);
  color: white;
  box-shadow: 0 8px 22px rgba(15,118,110,.20);
}

html[data-template="circular"] .report-section {
  border: 3px solid #99f6e4;
  border-radius: 45px;
  padding: 22px 30px;
  background: white;
  box-shadow: 0 6px 18px rgba(0,0,0,.08);
}  
  /* ===== العناوين الرئيسية داخل التقارير ===== */

.report-section h2 {
  padding: 10px 18px;
  margin: -15px -15px 16px;
  color: #fff;
  font-size: 19px;
  border-radius: 10px;
}

/* الرسمي الوزاري */
html[data-template="official"] .report-section h2 {
  background: linear-gradient(135deg, #0f766e, #115e59);
}

/* الحديث الاحترافي */
html[data-template="modern"] .report-section h2 {
  background: linear-gradient(135deg, #0f766e, #0891b2);
  border-radius: 14px;
}

/* البصري بالصور */
html[data-template="visual"] .report-section h2 {
  background: linear-gradient(135deg, #047857, #10b981);
  border-radius: 14px;
}

/* المختصر التنفيذي */
html[data-template="executive"] .report-section h2 {
  background: linear-gradient(135deg, #334155, #475569);
  border-radius: 8px;
}

/* التحليلي بالمؤشرات */
html[data-template="analytics"] .report-section h2 {
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
  color: #fff;
  border-radius: 12px;
}

/* الدائري / الأسطواني */
html[data-template="circular"] .report-section h2 {
  width: fit-content;
  min-width: 180px;
  margin: -18px auto 18px;
  padding: 10px 28px;
  text-align: center;
  background: linear-gradient(135deg, #0f766e, #06b6d4);
  color: #fff;
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(15,118,110,.18);
}
/* ===== تحسين القالب البصري والصور ===== */

html[data-template="visual"] body {
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px;
  background: #f4f8f7;
  color: #1f2937;
}

html[data-template="visual"] h1 {
  background: linear-gradient(135deg, #0f766e, #0d9488);
  color: #ffffff;
  padding: 24px;
  border-radius: 18px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 6px 18px rgba(15,118,110,.16);
}

html[data-template="visual"] .report-section {
  background: #ffffff;
  border: 1px solid #dbe9e6;
  border-right: 5px solid #0f766e;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 18px;
  box-shadow: 0 3px 12px rgba(0,0,0,.05);
}

html[data-template="visual"] .report-section h2 {
  color: #0f766e;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 20px;
}

.report-photo-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 15px 0 20px;
}

.photo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 18px;
  background: #0f766e;
  color: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

.report-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.report-photos img {
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  break-inside: avoid;
}
/* ===== قوالب الصور ===== */

/* تلقائي ذكي */
.report-photos.layout-auto {
  grid-template-columns: repeat(2, 1fr);
}

/* صورتان */
.report-photos.layout-two {
  grid-template-columns: repeat(2, 1fr);
}

/* أربع صور */
.report-photos.layout-four {
  grid-template-columns: repeat(2, 1fr);
}

/* ست صور */
.report-photos.layout-six {
  grid-template-columns: repeat(3, 1fr);
}

/* صورة رئيسية + 4 صور */
.report-photos.layout-featured {
  grid-template-columns: repeat(2, 1fr);
}

.report-photos.layout-featured img:first-child {
  grid-column: 1 / -1;
  height: 300px;
}

.report-photos.layout-two img {
  height: 260px;
}

.report-photos.layout-four img {
  height: 210px;
}

.report-photos.layout-six img {
  height: 170px;
}
@media (max-width: 700px) {
  html[data-template="visual"] body {
    padding: 12px;
  }

  .report-photos {
    grid-template-columns: repeat(2, 1fr);
  }

  .report-photos img {
    height: 160px;
  }

  .photo-btn {
    flex: 1 1 100%;
  }
}

@media print {
  .report-photo-actions {
    display: none !important;
  }

  html[data-template="visual"] .report-section {
    break-inside: avoid;
    box-shadow: none;
  }
 .report-photos {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 10px !important;
  margin-top: 12px !important;
}

.report-photos img {
  width: 100% !important;
  height: 150px !important;
  object-fit: cover !important;
  border-radius: 8px !important;
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

.report-photos {
  break-inside: auto !important;
} 


.report-photos {
  break-inside: auto !important;
  page-break-inside: auto !important;
}    
}

      /* ===== الهوية الموحدة النهائية لتقارير البرامج ===== */
      body {
        background: #f7fbfa !important;
        color: #163c39 !important;
      }
      h1 {
        color: #075e54 !important;
        background: #eaf5f2 !important;
        border-right: 7px solid #d4af37 !important;
        border-bottom: 3px solid #d4af37 !important;
        border-radius: 12px !important;
        padding: 14px 18px !important;
        margin: 6px 0 20px !important;
        font-size: 28px !important;
        font-weight: 900 !important;
      }
      .report-section {
        background: linear-gradient(135deg, #ffffff, #f4fbf9) !important;
        border: 1px solid #d7e7e2 !important;
        border-right: 6px solid #0f766e !important;
        border-radius: 14px !important;
        padding: 16px 18px !important;
        margin: 0 0 14px !important;
        box-shadow: 0 3px 10px rgba(15,118,110,.07) !important;
      }
      .report-section h2 {
        margin: -16px -18px 12px !important;
        padding: 9px 14px !important;
        color: #ffffff !important;
        background: linear-gradient(135deg, #0f766e, #115e59) !important;
        border: 0 !important;
        border-radius: 13px 13px 5px 5px !important;
        font-size: 18px !important;
        font-weight: 800 !important;
      }
      .report-section p, .report-section li {
        color: #263b39 !important;
        line-height: 1.75 !important;
      }
      .photo-layout-selector {
        margin: 10px 0 14px;
        padding: 10px 12px;
        background: #eef8f5;
        border: 1px solid #d7e7e2;
        border-radius: 10px;
      }
      .photo-layout-selector select {
        margin-right: 8px;
        padding: 8px 10px;
        border: 1px solid #b9d7d0;
        border-radius: 8px;
        background: #fff;
      }
      .report-photos {
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)) !important;
        gap: 12px !important;
      }
      .report-photos img {
        height: 175px !important;
        object-fit: cover !important;
        border-radius: 10px !important;
      }

      </style>
    </head>

    <body>
      <h1>تقرير برنامج ${esc(programName)}</h1>

      <div class="report-section">
        <h2>نبذة عن البرنامج</h2>
        <p>${esc(report.description)}</p>
      </div>

      <div class="report-section">
        <h2>الأهداف</h2>
        <ul>${goals}</ul>
      </div>

      <div class="report-section">
        <h2>الفئة المستهدفة</h2>
        <p>${esc(report.target)}</p>
      </div>

      <div class="report-section">
        <h2>آلية التنفيذ</h2>
        <p>${esc(report.implementation)}</p>
      </div>

      <div class="report-section">
        <h2>مؤشرات النجاح</h2>
        <p>${esc(report.indicators)}</p>
      </div>

      <div class="report-section">
        <h2>النتائج</h2>
        <p>${esc(report.results)}</p>
      </div>

      <div class="report-section">
        <h2>التوصيات</h2>
        <p>${esc(report.recommendations)}</p>
      </div>
<div class="report-section">
  <h2>📸 الشواهد والصور</h2>
<div class="photo-layout-selector">
  <label for="photoLayout"><strong>🖼️ اختر قالب الصور:</strong></label>

  <select id="photoLayout" onchange="changePhotoLayout(this.value)">
    <option value="auto">✨ تلقائي ذكي</option>
    <option value="two">▣ صورتان</option>
    <option value="four">▦ أربع صور</option>
    <option value="six">▦ ست صور</option>
    <option value="featured">⭐ صورة رئيسية + 4 صور</option>
  </select>
</div>
  <div class="report-photo-actions">
    <label class="photo-btn">
      📷 التقاط صورة
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onchange="addReportPhotos(event)"
        style="display:none"
      >
    </label>

    <label class="photo-btn">
      🖼️ اختيار من الاستديو
      <input
        type="file"
        accept="image/*"
        multiple
        onchange="addReportPhotos(event)"
        style="display:none"
      >
    </label>
  </div>

  <div id="reportPhotos" class="report-photos"></div>
</div>
      <button onclick="window.print()">🖨️ طباعة التقرير</button>
    </body>
    </html>
  `);

  reportWindow.document.close();
}
window.changePhotoLayout = function(layout) {
  const photos = document.getElementById("reportPhotos");
  if (!photos) return;

  photos.classList.remove(
    "layout-auto",
    "layout-two",
    "layout-four",
    "layout-six",
    "layout-featured"
  );

  photos.classList.add("layout-" + layout);
};
window.openProgramReport = openProgramReport;
window.addReportPhotos = function(event) {
  const files = Array.from(event.target.files || []);
  const container = document.getElementById("reportPhotos");

  if (!container || files.length === 0) return;

  files.forEach(file => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = function(e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.alt = "صورة من شواهد البرنامج";
      container.appendChild(img);
    };

    reader.readAsDataURL(file);
  });

  event.target.value = "";
};

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
          <button class="btn secondary" data-rename="${item.index}">✏️ تعديل اسم المؤشر</button>
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
  .filter(item => {
    const isClassColumn =
      item.header.includes("الشعبة") ||
      item.header.includes("رقم الشعبة") ||
      item.header.includes("الفصل");

    return (
      isClassColumn ||
      (
        item.uniqueCount >= 2 &&
        item.uniqueCount <= 20
      )
    );
  })
  .sort((a, b) => {
    const aClass =
      a.header.includes("الشعبة") ||
      a.header.includes("رقم الشعبة");

    const bClass =
      b.header.includes("الشعبة") ||
      b.header.includes("رقم الشعبة");

    if (aClass && !bClass) return -1;
    if (!aClass && bClass) return 1;

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

  // استبعاد الأعمدة التعريفية من التحليل الإحصائي
const identifierKeywords = [
  "id",
  "student id",
  "student_id",
  "رقم الشعبة",
  "رقم الهوية",
  "الهوية",
  "هوية",
  "رقم الطالب",
  "رقم الجوال",
  "الجوال",
  "جوال",
  "mobile",
  "phone",
  "telephone",
  "contact",
"طابع زمني"
];
const classNumberStat = stats.find(item =>
  item.header.includes("رقم الشعبة") ||
  item.header.includes("الشعبة")
);

if (classNumberStat && classNumberStat.numeric) {
  insights.push(
    `رقم الشعبة: الأدنى ${classNumberStat.numeric.min}، الأعلى ${classNumberStat.numeric.max}.`
  );
}

const numericStats = stats
  .filter(item => {
    if (!item.numeric) return false;

    const header = String(item.header || "")
      .trim()
      .toLowerCase();

    const isIdentifier = identifierKeywords.some(keyword =>
      header.includes(keyword.toLowerCase())
    );

    return !isIdentifier;
  })
  .slice(0, 4);

numericStats.forEach(item => {
  insights.push(
    `${item.header}: المتوسط ${item.numeric.average.toFixed(1)}، الأدنى ${item.numeric.min}، الأعلى ${item.numeric.max}.`
  );
});
// قياس الأثر
const impactMeasurement = {
  completeness: Number(completeness.toFixed(1)),
  missingCells,
  duplicateRows,
  totalRows,
  status: ""
};

if (completeness >= 95 && duplicateRows === 0) {
  impactMeasurement.status = "أثر مرتفع وجودة بيانات ممتازة";
} else if (completeness >= 85) {
  impactMeasurement.status = "أثر جيد مع فرص للتحسين";
} else if (completeness >= 70) {
  impactMeasurement.status = "أثر متوسط ويحتاج إلى متابعة";
} else {
  impactMeasurement.status = "الأثر يحتاج إلى تدخل وتحسين جودة البيانات";
}

insights.push(
  `قياس الأثر: نسبة اكتمال البيانات ${impactMeasurement.completeness}%، ` +
  `وعدد السجلات ${impactMeasurement.totalRows}، ` +
  `والسجلات المكررة ${impactMeasurement.duplicateRows}. ` +
  `التقييم: ${impactMeasurement.status}.`
);
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
<div class="chart-card">
  <h3>📈 قياس الأثر</h3>

  <div class="metric-grid">
    <div class="metric-card">
      <strong>${impactMeasurement.completeness}%</strong>
      <span>اكتمال البيانات</span>
    </div>

    <div class="metric-card">
      <strong>${impactMeasurement.totalRows}</strong>
      <span>السجلات المقاسة</span>
    </div>

    <div class="metric-card">
      <strong>${impactMeasurement.duplicateRows}</strong>
      <span>السجلات المكررة</span>
    </div>
  </div>

  <p style="margin-top:12px;">
    <strong>تقييم الأثر:</strong>
    ${esc(impactMeasurement.status)}
  </p>
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
async function renameIndicatorInDatabase(index, newTitle, applyToAllSchools = false) {
  try {
    const item = indicators.find(x => x.index === index);

    if (!item) {
      throw new Error("لم يتم العثور على المؤشر");
    }

    let query = db
      .from("school_indicators")
      .update({ title: newTitle });

    if (!applyToAllSchools) {
      query = query
        .eq("school_id", state.schoolId)
        .eq("sort_order", index);
    } else {
      query = query.eq("sort_order", index);
    }

    const { error } = await query;

    if (error) throw error;

    return true;

  } catch (error) {
    console.error("Rename indicator error:", error);
    alert("تعذر حفظ اسم المؤشر: " + error.message);
    return false;
  }
}
  document.addEventListener("click", async e => {
    const t=e.target.closest("[data-toggle],[data-rename],[data-upload],[data-excel],[data-view],[data-print],[data-delete-id]"); if(!t)return;
   if (t.dataset.rename !== undefined) {
  const index = Number(t.dataset.rename);
  const item = indicators.find(x => x.index === index);

  if (!item) return;
if (!["super_admin", "school_admin", "counselor"].includes(state.role)) {
  alert("ليس لديك صلاحية تعديل المؤشرات");
  return;
}
  const newName = prompt("اكتب اسم المؤشر الجديد:", item.title);

  if (newName === null) return;

  const cleanName = newName.trim();

  if (!cleanName) {
    alert("اسم المؤشر لا يمكن أن يكون فارغًا");
    return;
  }
let applyToAllSchools = false;

if (state.role === "super_admin") {
  const scope = prompt(
    "اختر نطاق التعديل:\n\n1 = هذه المدرسة فقط\n2 = جميع المدارس",
    "1"
  );

  if (scope === null) return;

  if (scope === "2") {
    applyToAllSchools = true;
  } else if (scope !== "1") {
    alert("الاختيار غير صحيح. اختر 1 أو 2");
    return;
  }
}
 const saved = await renameIndicatorInDatabase(
  index,
  cleanName,
  applyToAllSchools
);

if (!saved) return;

item.title = cleanName;
renderIndicators();

alert(
  applyToAllSchools
    ? "تم تغيير اسم المؤشر لجميع المدارس بنجاح ✅"
    : "تم تغيير اسم المؤشر لهذه المدرسة بنجاح ✅"
);

return;
} if(t.dataset.toggle!==undefined){const i=Number(t.dataset.toggle);state.open.has(i)?state.open.delete(i):state.open.add(i);renderIndicators();}
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
