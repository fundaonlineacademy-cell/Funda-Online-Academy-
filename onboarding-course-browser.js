(()=>{
  const VERSION='20261107-combined-course-checkout-v13';
  if(window.FundaOnboardingCourseBrowser?.version===VERSION)return;

  const PAGE_SIZE=10;
  let currentPage=1;
  let searchTerm="";
  const selectedCourseIds=new Set();
  // Show more vertical detail from the same full-width photo, retaining its people and work.
  const PHOTO_FRAMING={"bookkeeping":[1.45,0.03],"business-administration":[1.55,0.11],"carpentry-fundamentals-workplace-practice":[1.4,0.02],"cashier-excellence":[1.4,0.02],"commercial-cleaning-professional-janitorial-services":[1.2,0.06],"computer-digital-literacy":[1.55,0.11],"construction-site-skills-workplace-readiness":[1.35,0.05],"corporate-reception":[1.55,0.11],"customer-service-excellence":[1.55,0.11],"cybersecurity-digital-safety":[1.55,0.11],"digital-device-repair-technical-support":[1.45,0.12],"ecommerce-online-retail":[1.55,0.11],"early-childhood-care-development-fundamentals":[1.2,0.06],"event-management-wedding-conference-planning":[1.45,0.12],"fashion-design-garment-making-fundamentals":[1.4,0.03],"fire-safety-emergency-response-safety-officer":[1.18,0.04],"food-beverage-service-hospitality-operations":[1.3,0.04],"food-safety-hygiene-haccp-fundamentals":[1.25,0.04],"front-office-hotel-reception-guest-services":[1.45,0.03],"gel-acrylic-nail-technology":[1.35,0.02],"graphic-design-visual-communication":[1.25,0.02],"landscaping-professional-garden-maintenance":[1.25,0.07],"office-administration-assistant":[1.5,0.105],"petrol-station-attendant-forecourt-customer-service":[1.15,0.04],"poultry-production-enterprise-management":[1.15,0.04],"print-branding-custom-product-production":[1.35,0.03],"professional-baking-enterprise-development":[1.25,0.02],"professional-housekeeping-hospitality-services":[1.2,0.025],"professional-makeup-artistry-client-services":[1.35,0.02],"retail-management-team-leadership":[1.25,0.07],"retail-merchandising-visual-display":[1.25,0.02],"sewing-garment-production-small-business":[1.45,0.12],"strategic-social-media-marketing-paid-media":[1.4,0.1],"urban-farming-small-scale-agriculture":[1.2,0.055],"warehouse-logistics-operations":[1.2,0.055]};
  function photoFraming(url){
    const key=String(url||"").split("?")[0].split("/").pop().replace(/-course-hero[.]webp$/i,"");
    return Object.prototype.hasOwnProperty.call(PHOTO_FRAMING,key)?PHOTO_FRAMING[key]:[1,0];
  }
  function photoFramingStyle(url){
    const [zoom,y]=photoFraming(url);
    return `--course-photo-height:${zoom*100}%;--course-photo-y:${-y*100}%`;
  }

  // Resample the accepted frame once at screen resolution, without changing the source photo.
  const pendingPhotoLoads=new WeakSet();
  function renderDesktopPhoto(image){
    if(!image.isConnected||!window.matchMedia("(min-width:1024px)").matches)return;
    if(!image.complete||!image.naturalWidth)return;
    const media=image.parentElement;
    const rect=media.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const ratio=window.devicePixelRatio||1;
    const width=Math.max(1,Math.round(rect.width*ratio));
    const height=Math.max(1,Math.round(rect.height*ratio));
    const source=image.currentSrc||image.src;
    const key=`${source}|${width}|${height}`;
    const previous=media.querySelector(".course-card-detail");
    if(previous?.dataset.photoKey===key)return;
    try{
      const canvas=document.createElement("canvas");
      canvas.width=width;canvas.height=height;
      const context=canvas.getContext("2d");
      if(!context){previous?.remove();return;}
      const [zoom,y]=photoFraming(source);
      context.imageSmoothingEnabled=true;
      context.imageSmoothingQuality="high";
      context.drawImage(image,0,y*image.naturalHeight,image.naturalWidth,image.naturalHeight/zoom,0,0,width,height);
      // Keep colours/identities intact; restore only small final-size luminance edges.
      try{
        const frame=context.getImageData(0,0,width,height);
        const pixels=frame.data,original=new Uint8ClampedArray(pixels);
        const stride=width*4;
        for(let row=1;row<height-1;row++)for(let col=1;col<width-1;col++){
          const i=(row*width+col)*4;
          let detail=0;
          for(let channel=0;channel<3;channel++){
            const p=i+channel;
            const soft=(original[p-stride-4]+2*original[p-stride]+original[p-stride+4]+2*original[p-4]+4*original[p]+2*original[p+4]+original[p+stride-4]+2*original[p+stride]+original[p+stride+4])/16;
            detail+=(original[p]-soft)*[0.2126,0.7152,0.0722][channel];
          }
          const correction=Math.abs(detail)>1.5?Math.max(-7,Math.min(7,detail*0.4)):0;
          for(let channel=0;channel<3;channel++)pixels[i+channel]=original[i+channel]+correction;
        }
        context.putImageData(frame,0,0);
      }catch(_){/* Cross-origin photos still get high-quality scaling without pixel readback. */}
      canvas.className="course-card-detail";
      canvas.setAttribute("aria-hidden","true");
      canvas.dataset.photoKey=key;
      previous?.remove();
      media.appendChild(canvas);
    }catch(_){previous?.remove();/* Keep the original image if canvas drawing is unavailable. */}
  }
  function renderDesktopPhotos(){
    if(!window.matchMedia("(min-width:1024px)").matches)return;
    coursesContainer.querySelectorAll(".course-card-image").forEach(image=>{
      if(!image.complete&&!pendingPhotoLoads.has(image)){
        pendingPhotoLoads.add(image);
        image.addEventListener("load",()=>renderDesktopPhoto(image),{once:true});
      }
      renderDesktopPhoto(image);
    });
  }
  let photoResizeFrame=0;
  window.addEventListener("resize",()=>{
    cancelAnimationFrame(photoResizeFrame);
    photoResizeFrame=requestAnimationFrame(renderDesktopPhotos);
  },{passive:true});

  function getSelectedCourses(){
    return [...selectedCourseIds].map(id=>courses.find(course=>String(course.id)===id)).filter(Boolean);
  }

  function selectionChanged(reason="selection"){
    renderSelectionSummary();
    window.dispatchEvent(new CustomEvent("funda:course-selection-changed",{detail:{reason}}));
  }

  function selectCourseForBasket(courseId){
    const course=courses.find(item=>String(item.id)===String(courseId));
    if(!course)return;
    const price=Number(course.price);
    if(!Number.isFinite(price)||price<0){showMessage?.("This course fee could not be loaded. Please refresh before selecting it.");return;}
    selectedCourseIds.add(String(course.id));
    if(!selectedCourse||!selectedCourseIds.has(String(selectedCourse.id))){selectedCourse=course;existingEnrollment=null;}
    renderCourses();
    selectionChanged();
  }

  function removeSelection(courseId,reason="selection"){
    selectedCourseIds.delete(String(courseId));
    if(!selectedCourseIds.has(String(selectedCourse?.id))){selectedCourse=getSelectedCourses()[0]||null;existingEnrollment=null;}
    renderCourses();
    selectionChanged(reason);
    return selectedCourseIds.size;
  }

  function restoreSelection(ids,activeId){
    selectedCourseIds.clear();
    for(const id of Array.isArray(ids)?ids:[]){
      if(courses.some(course=>String(course.id)===String(id)))selectedCourseIds.add(String(id));
    }
    selectedCourse=getSelectedCourses().find(course=>String(course.id)===String(activeId))||getSelectedCourses()[0]||null;
    existingEnrollment=null;
    renderCourses();
    renderSelectionSummary();
  }

  function renderSelectionSummary(){
    const chosen=getSelectedCourses();
    const name=byId("selectedCourseName"),meta=byId("selectedCourseMeta"),button=byId("continueButton");
    continueBar?.classList.toggle("hidden-section",!chosen.length);
    const totalCents=chosen.reduce((sum,course)=>sum+Math.round(Number(course.price)*100),0);
    if(name)name.textContent=chosen.length>1?`${chosen.length} courses selected`:(chosen[0]?.title||"—");
    if(meta)meta.textContent=chosen.length>1?`${formatMoney(totalCents/100)} total course fees`:(chosen.length?`${chosen[0].duration||"Flexible"} • ${formatMoney(chosen[0].price)}`:"—");
    if(button)button.textContent=chosen.length>1?"Continue with selected courses →":"Continue →";
    const label=name?.previousElementSibling;
    if(label)label.textContent=chosen.length>1?"Selected Courses":"Selected Course";
    let list=byId("selectedCourseList");
    if(!list&&name){
      list=document.createElement("div");list.id="selectedCourseList";
      list.className="mt-3 hidden max-h-40 overflow-auto text-sm text-[#03133d]";
      name.parentElement.appendChild(list);
    }
    if(list){
      list.classList.toggle("hidden",chosen.length<2);
      const expanded=!!list.querySelector("details")?.open;
      list.innerHTML=chosen.length>1?`<details${expanded?" open":""}><summary class="cursor-pointer font-bold text-blue-700">View selected courses</summary><p class="my-2 text-xs leading-5 text-gray-600">Your selected courses share one payment based on their combined payable total. Previous-study benefits are checked per course.</p><ul class="space-y-2">${chosen.map(course=>`<li class="flex items-start justify-between gap-3"><span>${escapeHtml(course.title)} — <strong>${formatMoney(course.price)}</strong></span><button type="button" class="shrink-0 font-bold text-blue-700 underline" data-remove-course="${escapeHtml(course.id)}" aria-label="Remove ${escapeHtml(course.title)}">Remove</button></li>`).join("")}</ul></details>`:"";
      list.querySelectorAll("[data-remove-course]").forEach(control=>control.addEventListener("click",()=>removeSelection(control.dataset.removeCourse)));
    }
  }

  function byId(id){return document.getElementById(id)}

  function visibleCourses(){
    const q=searchTerm.trim().toLowerCase();
    if(!q)return courses.slice();
    return courses.filter(course=>{
      const title=String(course?.title||"").toLowerCase();
      const description=String(course?.description||"").toLowerCase();
      return title.includes(q)||description.includes(q);
    });
  }

  function totalPagesFor(list){
    return Math.max(1,Math.ceil(list.length/PAGE_SIZE));
  }

  function ensureSelectionControls(){
    const continueButtonEl=byId("continueButton");
    if(!continueButtonEl||byId("courseClearSelection"))return;

    const parent=continueButtonEl.parentElement;
    if(!parent)return;

    const actions=document.createElement("div");
    actions.id="courseSelectionActions";
    actions.className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end";

    const clear=document.createElement("button");
    clear.id="courseClearSelection";
    clear.type="button";
    clear.className="rounded-xl border border-gray-300 bg-white px-5 py-3.5 font-extrabold text-gray-700 hover:bg-gray-50";
    clear.textContent="Clear selection";
    clear.addEventListener("click",clearSelection);

    parent.insertBefore(actions,continueButtonEl);
    actions.appendChild(clear);
    actions.appendChild(continueButtonEl);
  }

  function ensureBrowserUi(){
    if(!coursesContainer)return;

    ensureSelectionControls();

    if(byId("courseBrowserTools"))return;

    const tools=document.createElement("div");
    tools.id="courseBrowserTools";
    tools.className="mb-6 rounded-2xl border border-white/10 bg-white/10 p-4 sm:p-5";
    tools.innerHTML=`
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <label for="courseSearchInput" class="sr-only">Search courses</label>
          <input
            id="courseSearchInput"
            type="search"
            autocomplete="off"
            placeholder="Search for a course by name"
            class="w-full rounded-xl border border-white/20 bg-white px-4 py-3 pr-10 text-[#03133d] placeholder:text-gray-400"
          >
        </div>
        <button
          id="courseSearchButton"
          type="button"
          class="rounded-xl bg-[#2563eb] px-5 py-3 font-extrabold text-white hover:bg-[#1d4ed8]"
        >Search</button>
        <button
          id="courseSearchClear"
          type="button"
          class="hidden rounded-xl border border-white/25 px-5 py-3 font-bold text-white hover:bg-white/10"
        >Clear</button>
      </div>
      <div id="courseBrowserSummary" class="mt-3 text-sm font-semibold text-blue-100"></div>
    `;
    coursesContainer.parentNode.insertBefore(tools,coursesContainer);

    const pager=document.createElement("div");
    pager.id="coursePagination";
    pager.className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 sm:flex-row sm:items-center sm:justify-between";
    pager.innerHTML=`
      <div id="coursePageStatus" class="text-sm font-semibold text-blue-100"></div>
      <div class="flex items-center gap-2">
        <button id="coursePrevPage" type="button" class="rounded-xl border border-white/25 px-4 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">← Previous</button>
        <button id="courseNextPage" type="button" class="rounded-xl bg-white px-4 py-2.5 font-extrabold text-[#03133d] disabled:cursor-not-allowed disabled:opacity-40">Next →</button>
      </div>
    `;
    coursesContainer.insertAdjacentElement("afterend",pager);

    byId("courseSearchButton").addEventListener("click",applySearch);
    byId("courseSearchInput").addEventListener("keydown",event=>{
      if(event.key==="Enter"){
        event.preventDefault();
        applySearch();
      }
    });
    byId("courseSearchClear").addEventListener("click",()=>{
      byId("courseSearchInput").value="";
      searchTerm="";
      currentPage=1;
      renderCourses();
      byId("courseSearchInput").focus();
    });
    byId("coursePrevPage").addEventListener("click",()=>changePage(-1));
    byId("courseNextPage").addEventListener("click",()=>changePage(1));
  }

  function applySearch(){
    searchTerm=String(byId("courseSearchInput")?.value||"").trim();
    currentPage=1;
    renderCourses();
  }

  function changePage(delta){
    const filtered=visibleCourses();
    const totalPages=totalPagesFor(filtered);
    const next=Math.min(totalPages,Math.max(1,currentPage+delta));
    if(next===currentPage)return;
    currentPage=next;
    renderCourses();
    document.getElementById("courseBrowserTools")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function clearSelection(){
    selectedCourseIds.clear();
    selectedCourse=null;
    existingEnrollment=null;
    renderCourses();
    selectionChanged();
  }

  function ensureDescriptionModal(){
    if(byId("courseDescriptionModal"))return;
    const modal=document.createElement("div");
    modal.id="courseDescriptionModal";
    modal.className="hidden fixed inset-0 z-[100] bg-slate-950/70 p-4 sm:p-6";
    modal.setAttribute("role","dialog");
    modal.setAttribute("aria-modal","true");
    modal.setAttribute("aria-labelledby","courseDescriptionTitle");
    modal.innerHTML=`
      <div class="mx-auto mt-[8vh] max-h-[82vh] max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-blue-600">Course Description</p>
            <h2 id="courseDescriptionTitle" class="mt-1 text-2xl font-black text-[#03133d]"></h2>
          </div>
          <button id="courseDescriptionClose" type="button" class="rounded-full border border-gray-200 px-3 py-1.5 text-xl font-black text-gray-500" aria-label="Close course description">×</button>
        </div>
        <p id="courseDescriptionText" class="mt-5 whitespace-pre-line text-sm leading-7 text-gray-600"></p>
        <button id="courseDescriptionDone" type="button" class="mt-6 w-full rounded-xl bg-[#03133d] px-5 py-3 font-extrabold text-white">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    byId("courseDescriptionClose").addEventListener("click",closeDescription);
    byId("courseDescriptionDone").addEventListener("click",closeDescription);
    modal.addEventListener("click",event=>{
      if(event.target===modal)closeDescription();
    });
    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&!modal.classList.contains("hidden"))closeDescription();
    });
  }

  function openDescription(courseId){
    const course=courses.find(item=>String(item.id)===String(courseId));
    if(!course)return;
    window.open(`course-view.html?id=${encodeURIComponent(course.id)}`,"_blank","noopener");
  }

  function closeDescription(){
    byId("courseDescriptionModal")?.classList.add("hidden");
    document.body.style.overflow="";
  }

  function renderBrowserCourses(){
    ensureBrowserUi();
    if(!selectedCourseIds.size&&selectedCourse&&courses.some(course=>String(course.id)===String(selectedCourse.id)))selectedCourseIds.add(String(selectedCourse.id));
    renderSelectionSummary();

    const filtered=visibleCourses();
    const totalPages=totalPagesFor(filtered);
    if(currentPage>totalPages)currentPage=totalPages;

    const start=(currentPage-1)*PAGE_SIZE;
    const pageCourses=filtered.slice(start,start+PAGE_SIZE);

    const summary=byId("courseBrowserSummary");
    const clear=byId("courseSearchClear");
    const pager=byId("coursePagination");

    if(summary){
      summary.textContent=searchTerm
        ? `${filtered.length} course${filtered.length===1?"":"s"} found for “${searchTerm}”.`
        : `${courses.length} available course${courses.length===1?"":"s"}. Showing up to ${PAGE_SIZE} at a time.`;
    }
    clear?.classList.toggle("hidden",!searchTerm);

    if(!filtered.length){
      coursesContainer.innerHTML=`
        <div class="col-span-2 lg:col-span-4 rounded-3xl bg-white p-10 text-center">
          <div class="text-4xl">🔎</div>
          <h2 class="mt-3 text-xl font-black text-[#03133d]">No matching course found</h2>
          <p class="mt-2 text-sm text-gray-500">Try another course name or clear the search.</p>
        </div>`;
      if(pager)pager.classList.add("hidden");
      return;
    }

    if(pager)pager.classList.remove("hidden");

    coursesContainer.innerHTML=pageCourses.map(course=>{
      const selected=selectedCourseIds.has(String(course.id));
      const fallback="Practical, career-focused online learning.";
      const description=String(course.description||fallback).trim();
      const selectionAction=selected
        ? `window.FundaOnboardingCourseBrowser.removeSelection('${escapeHtml(course.id)}')`
        : `selectCourse('${escapeHtml(course.id)}')`;
      return `
        <article class="course-card ${selected?"selected border-blue-600":"border-transparent"} flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-white text-left">
          <div class="course-card-media shrink-0 bg-slate-100">
            ${course.image_url
              ? `<img src="${escapeHtml(course.image_url)}" alt="${escapeHtml(course.title)}" style="${photoFramingStyle(course.image_url)}" class="course-card-image block h-auto w-full" loading="lazy">`
              : `<div class="flex h-40 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-5xl">🎓</div>`}
          </div>
          <div class="course-card-content flex flex-1 flex-col p-5">
            <h2 class="course-card-title font-black text-[#03133d]">${escapeHtml(course.title)}</h2>
            <p class="course-card-preview mt-2 text-sm text-gray-500">${escapeHtml(description)}</p>
            <a href="course-view.html?id=${encodeURIComponent(course.id)}" target="_blank" rel="noopener" aria-label="View more about ${escapeHtml(course.title)} (opens in a new tab)" class="course-card-details mt-2 self-start text-sm font-extrabold text-blue-600 hover:underline">View more</a>
            <div class="course-card-meta mt-auto flex items-center justify-between gap-3 pt-5">
              <span class="text-xs font-bold text-gray-500">⏱ ${escapeHtml(course.duration||"Flexible")}</span>
              <span class="text-sm font-black text-blue-600">${formatMoney(course.price)}</span>
            </div>
            <button type="button" onclick="${selectionAction}" aria-pressed="${selected}" class="course-card-select mt-4 w-full rounded-xl ${selected?"bg-blue-50 text-blue-700 ring-1 ring-blue-200":"bg-slate-50 text-[#03133d] hover:bg-blue-50 hover:text-blue-700"} px-4 py-3 text-sm font-extrabold">
              ${selected?"Remove this course":"Select this course"}
            </button>
          </div>
        </article>`;
    }).join("");

    renderDesktopPhotos();

    const first=start+1;
    const last=Math.min(start+PAGE_SIZE,filtered.length);
    const status=byId("coursePageStatus");
    if(status)status.textContent=`Page ${currentPage} of ${totalPages} · Showing ${first}–${last} of ${filtered.length}`;

    const prev=byId("coursePrevPage");
    const next=byId("courseNextPage");
    if(prev)prev.disabled=currentPage<=1;
    if(next)next.disabled=currentPage>=totalPages;
  }

  const style=document.createElement("style");
  style.textContent=`
    .course-card-title{
      font-size:1.08rem;
      line-height:1.45rem;
      min-height:4.35rem;
      display:-webkit-box;
      -webkit-box-orient:vertical;
      -webkit-line-clamp:3;
      overflow:hidden;
    }
    .course-card-preview{
      line-height:1.45rem;
      min-height:4.35rem;
      display:-webkit-box;
      -webkit-box-orient:vertical;
      -webkit-line-clamp:3;
      overflow:hidden;
    }
    @media (max-width:640px){
      .course-card-title{min-height:auto;-webkit-line-clamp:2}
      .course-card-preview{min-height:4.35rem}
    }
    #continueButton{max-width:100%;white-space:normal}
    #continueBar>div>div:first-child{min-width:0;flex:1}
    #courseSelectionActions{max-width:100%}
    #coursesContainer{gap:12px}
    #coursesContainer .course-card-media{height:96px;overflow:hidden}
    #coursesContainer .course-card-image{width:100%;height:var(--course-photo-height,100%);object-fit:fill;transform:translateY(var(--course-photo-y,0%));image-rendering:auto}
    #coursesContainer .course-card-media>div{height:100%}
    #coursesContainer .course-card-detail{display:none}
    #coursesContainer .course-card-content{padding:8px 10px}
    #coursesContainer .course-card-title{
      display:block;min-height:54px;font-size:14px;line-height:18px;
      overflow:visible;-webkit-line-clamp:unset;
    }
    #coursesContainer .course-card-preview{display:none}
    #coursesContainer .course-card-details{margin-top:4px;font-size:12px;line-height:16px}
    #coursesContainer .course-card-meta{padding-top:6px;gap:8px;flex-wrap:wrap}
    #coursesContainer .course-card-meta span{font-size:12px;line-height:16px}
    #coursesContainer .course-card-select{margin-top:6px;padding:6px 8px;font-size:12px;line-height:16px}
    @media (max-width:767px){
      #coursesContainer{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      #coursesContainer .course-card-content{padding:8px}
      #coursesContainer .course-card-title{min-height:68px;font-size:13px;line-height:17px}
      #coursesContainer .course-card-select{min-height:36px;padding:8px 4px}
    }
    @media (min-width:1024px){
      #coursesContainer .course-card-media{position:relative}
      #coursesContainer .course-card-detail{display:block;position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      body:has(#courseStep:not(.hidden-section)) header>div{padding-top:8px;padding-bottom:8px}
      body:has(#courseStep:not(.hidden-section)) header img{width:32px;height:32px}
      body:has(#courseStep:not(.hidden-section)) main{padding-top:12px;padding-bottom:24px}
      body:has(#courseStep:not(.hidden-section)) #stepLabel{font-size:11px;line-height:14px}
      body:has(#courseStep:not(.hidden-section)) #pageTitle{margin-top:4px;font-size:28px;line-height:32px}
      body:has(#courseStep:not(.hidden-section)) #welcomeMessage{margin-top:4px;font-size:14px;line-height:18px}
      #courseStep{margin-top:12px}
      #courseBrowserTools{display:flex;align-items:center;gap:12px;padding:8px 10px;margin-bottom:12px}
      #courseBrowserTools>div:first-child{flex:1;min-width:0;gap:8px}
      #courseBrowserSummary{max-width:220px;margin-top:0;font-size:12px;line-height:16px}
      #courseSearchInput,#courseSearchButton,#courseSearchClear{padding-top:6px;padding-bottom:6px}
    }
  `;
  document.head.appendChild(style);

  renderCourses=renderBrowserCourses;

  window.FundaOnboardingCourseBrowser={
    version:VERSION,
    render:renderBrowserCourses,
    selectCourse:selectCourseForBasket,
    removeSelection,
    restoreSelection,
    getSelectedCourses,
    completeCourse:courseId=>removeSelection(courseId,"submitted"),
    completeCourses:ids=>{
      ids.forEach(id=>selectedCourseIds.delete(String(id)));
      selectedCourse=getSelectedCourses()[0]||null;existingEnrollment=null;
      renderCourses();selectionChanged('submitted');return selectedCourseIds.size;
    },
    openDescription,
    closeDescription,
    clearSelection
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{
      ensureBrowserUi();
      if(Array.isArray(courses)&&courses.length)renderBrowserCourses();
    },{once:true});
  }else{
    ensureBrowserUi();
    if(Array.isArray(courses)&&courses.length)renderBrowserCourses();
  }
})();
