/* Student26 local program report drafts, no Supabase calls. */
(() => {
  'use strict';
  const DB_NAME = 'student26_local_program_reports_v1';
  const STORE = 'drafts';
  const $ = id => document.getElementById(id);
  const time = v => new Date(v).toLocaleString('ar-SA');
  function storeOpen() {
    return new Promise((resolve,reject) => {
      if (!window.indexedDB) { reject(new Error('المتصفح لا يدعم التخزين المحلي المطلوب')); return; }
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => { if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE,{keyPath:'id'}); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('تعذر فتح قاعدة الحفظ'));
    });
  }
  async function operation(mode,action,value) {
    const db=await storeOpen();
    try { return await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,mode), st=tx.objectStore(STORE);
      const req= action === 'put' ? st.put(value) : action === 'delete' ? st.delete(value) : action === 'getAll' ? st.getAll() : st.get(value);
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
      tx.onabort=()=>reject(tx.error||new Error('تعذر الحفظ'));
    }); } finally { db.close(); }
  }
  function schoolKey() { return ($('schoolLabel')?.textContent || 'مدرسة غير محددة').trim(); }
  function currentReport() { return $('programReportModalContent')?.querySelector('#modernProgramReport, .program-report-export'); }
  function currentTitle() { return ($('programReportModalTitle')?.textContent || $('programSelect')?.selectedOptions?.[0]?.textContent || 'تقرير برنامج').trim(); }
  function reportSnapshot() {
    const host=$('programReportModalContent'), report=currentReport();
    if (!host || !report) throw new Error('افتح تقرير البرنامج أولًا');
    const copy=report.cloneNode(true);
    // form elements are stored as actual values where supported
    const inputs=report.querySelectorAll('input,textarea,select'), dest=copy.querySelectorAll('input,textarea,select');
    inputs.forEach((el,i)=>{ const d=dest[i]; if (!d) return; if (el.matches('input[type=file]')) return;
      if(el.tagName==='TEXTAREA') d.textContent=el.value;
      else if(el.tagName==='SELECT') Array.from(d.options).forEach(o=>o.selected=o.value===el.value);
      else d.setAttribute('value',el.value);
    });
    return {html:copy.outerHTML, style:[...host.querySelectorAll('style')].map(s=>s.textContent).join('\n'), template:$('reportTemplateSelect')?.value || 'official'};
  }
  const state={editingId:null, currentCreated:null};
  async function save() {
    try {
      const shot=reportSnapshot(), now=new Date().toISOString();
      const id=state.editingId || (window.crypto?.randomUUID ? window.crypto.randomUUID() : `report-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      const payload={ id, school:schoolKey(), title:currentTitle(), template:shot.template,
        html:shot.html, style:shot.style, created:state.currentCreated || now, updated:now };
      await operation('readwrite','put',payload);
      state.editingId=id; state.currentCreated=payload.created;
      alert('تم حفظ التقرير محليًا على هذا الجهاز ✅');
    } catch (e) {
      console.error('Local report save error:',e);
      alert(`لم يتم حفظ التقرير: ${e.message || 'قد تكون مساحة التخزين ممتلئة بسبب الصور'}`);
    }
  }
  function reportPhotoBindings() {
    const root=$('programReportModalContent');
    root?.querySelectorAll('.mr-photo-input').forEach(input=>input.addEventListener('change',async e=>{
      const photos=root.querySelector('#modernPhotos'); if(!photos) return;
      const files=[...(e.target.files||[])].filter(f=>f.type.startsWith('image/'));
      for (const f of files) {
        try {
          const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(f);});
          photos.querySelector('.mr-empty')?.remove();
          const fig=document.createElement('figure');fig.className='mr-photo';
          const img=document.createElement('img');img.src=data;img.alt='شاهد من تنفيذ البرنامج';
          const cap=document.createElement('figcaption');cap.className='mr-editable';cap.contentEditable='true';cap.textContent='اكتب وصف الصورة';
          fig.append(img,cap);photos.append(fig);
        } catch(err) { console.error(err); alert('تعذر قراءة إحدى الصور'); }
      }
      e.target.value='';
    }));
  }
  async function openSaved(id) {
    try {
      const rec=await operation('readonly','get',id);
      if(!rec || rec.school!==schoolKey()) { alert('تعذر فتح التقرير ضمن هذه المدرسة'); return; }
      const host=$('programReportModalContent');
      host.replaceChildren();
      if(rec.style) {const style=document.createElement('style');style.textContent=rec.style;host.append(style);}
      const tpl=document.createElement('template');tpl.innerHTML=rec.html;
      host.append(tpl.content);
      $('programReportModalTitle').textContent=rec.title;
      if($('reportTemplateSelect')) $('reportTemplateSelect').value=rec.template || 'official';
      if($('programSelect') && [...$('programSelect').options].some(o=>o.value===rec.title)) $('programSelect').value=rec.title;
      $('programReportModal').classList.remove('hidden');$('programReportModal').setAttribute('aria-hidden','false');
      state.editingId=rec.id;state.currentCreated=rec.created;
      reportPhotoBindings();closeArchive();
    } catch(e){alert('تعذر فتح التقرير: '+e.message);}
  }
  function closeArchive(){ $('localReportsArchive')?.remove(); }
  function showRow(rec,container){
    const item=document.createElement('div');item.className='lr-row';
    const details=document.createElement('div');
    const title=document.createElement('strong');title.textContent=rec.title;
    const date=document.createElement('small');date.textContent=`آخر حفظ: ${time(rec.updated)}`;
    details.append(title,date);
    const actions=document.createElement('div');actions.className='lr-actions';
    const open=document.createElement('button');open.type='button';open.textContent='فتح / تعديل';open.onclick=()=>openSaved(rec.id);
    const del=document.createElement('button');del.type='button';del.textContent='حذف';del.className='lr-danger';del.onclick=async()=>{
      if(!confirm('حذف هذا التقرير المحفوظ من هذا المتصفح؟'))return;
      try{await operation('readwrite','delete',rec.id);if(state.editingId===rec.id){state.editingId=null;state.currentCreated=null;}item.remove();}catch(e){alert('تعذر الحذف: '+e.message);}
    };
    actions.append(open,del);item.append(details,actions);container.append(item);
  }
  async function showArchive(){
    closeArchive();const shade=document.createElement('div');shade.id='localReportsArchive';shade.className='lr-shade';
    const pane=document.createElement('section');pane.className='lr-pane';pane.dir='rtl';
    const header=document.createElement('div');header.className='lr-head';
    const h=document.createElement('h2');h.textContent='التقارير المحفوظة على هذا الجهاز';
    const close=document.createElement('button');close.textContent='إغلاق';close.onclick=closeArchive;header.append(h,close);
    const search=document.createElement('input');search.placeholder='البحث باسم البرنامج';search.className='lr-search';
    const rows=document.createElement('div');rows.className='lr-rows';
    const exportBtn=document.createElement('button');exportBtn.textContent='تنزيل نسخة احتياطية JSON';
    pane.append(header,search,rows,exportBtn);shade.append(pane);document.body.append(shade);
    shade.addEventListener('click',e=>{if(e.target===shade)closeArchive();});
    try{
      const all=(await operation('readonly','getAll')).filter(r=>r.school===schoolKey()).sort((a,b)=>b.updated.localeCompare(a.updated));
      const draw=()=>{rows.replaceChildren(); const filter=search.value.trim();const shown=all.filter(r=>r.title.includes(filter));
        if(!shown.length){const empty=document.createElement('p');empty.textContent='لا توجد تقارير مطابقة محفوظة';rows.append(empty);}
        shown.forEach(r=>showRow(r,rows));};
      search.oninput=draw;draw();
      exportBtn.onclick=()=>{
        const blob=new Blob([JSON.stringify({type:'student26-program-reports-backup',version:1,school:schoolKey(),exported:new Date().toISOString(),reports:all},null,2)],{type:'application/json'});
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='نسخة-احتياطية-تقارير-التوجيه.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      };
    }catch(e){rows.textContent='تعذر فتح المحفوظات: '+e.message;}
  }
  function injectUI(){
    const actions=$('programReportShareBtn')?.parentElement;
    if(actions && !$('localSaveReportBtn')){
      const save=document.createElement('button');save.id='localSaveReportBtn';save.type='button';save.className='btn secondary';save.textContent='💾 حفظ التقرير';save.onclick=()=>saveCurrent();
      actions.insertBefore(save,$('programReportShareBtn'));
    }
    const section=$('programReportsSection');
    if(section && !$('localReportsArchiveBtn')){
      const archive=document.createElement('button');archive.id='localReportsArchiveBtn';archive.type='button';archive.className='btn secondary';archive.textContent='📁 التقارير المحفوظة';archive.style.margin='12px 0';archive.onclick=showArchive;section.append(archive);
    }
  }
  function saveCurrent(){return save();}
  function styles(){ const style=document.createElement('style');style.textContent=`
    .lr-shade{position:fixed;inset:0;z-index:30000;background:#0009;display:grid;place-items:center;padding:14px;direction:rtl}
    .lr-pane{background:#fff;color:#183d38;border-radius:18px;width:min(700px,95vw);max-height:90vh;overflow:auto;padding:22px;box-shadow:0 15px 55px #0004;font-family:Tahoma,Arial,sans-serif}
    .lr-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.lr-head h2{font-size:21px;margin:0;color:#0a7060}
    .lr-pane button{cursor:pointer;padding:9px 13px;background:#0b6f60;color:white;border:0;border-radius:8px;font:inherit}
    .lr-search{width:100%;font:inherit;padding:11px;margin:14px 0;border:1px solid #cdded7;border-radius:8px}
    .lr-row{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #e1e9e5;padding:12px 0}
    .lr-row strong,.lr-row small{display:block}.lr-row small{color:#62716e;margin-top:4px}.lr-actions{display:flex;gap:7px;flex-wrap:wrap}.lr-pane .lr-danger{background:#a52a2a}
    @media(max-width:560px){.lr-row{align-items:start;flex-direction:column}.lr-head h2{font-size:17px}}
  `;document.head.append(style); }
  function init(){styles();injectUI();
    // Opening a new report clears selection of an existing saved report, without touching its saved record.
    $('openProgramReportBtn')?.addEventListener('click',()=>{state.editingId=null;state.currentCreated=null;});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
