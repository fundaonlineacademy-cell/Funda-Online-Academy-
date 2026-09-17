(()=>{
  if(window.FundaOnboardingCourseBrowser)return;

  const PAGE_SIZE=10;
  let currentPage=1;
  let searchTerm="";

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

  function ensureBrowserUi(){
    if(!coursesContainer||byId("courseBrowserTools"))return;

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

    ensureDescriptionModal();
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
    ensureDescriptionModal();
    byId("courseDescriptionTitle").textContent=course.title||"Course";
    byId("courseDescriptionText").textContent=course.description||"Practical, career-focused online learning.";
    byId("courseDescriptionModal").classList.remove("hidden");
    document.body.style.overflow="hidden";
    byId("courseDescriptionClose")?.focus();
  }

  function closeDescription(){
    byId("courseDescriptionModal")?.classList.add("hidden");
    document.body.style.overflow="";
  }

  function renderBrowserCourses(){
    ensureBrowserUi();

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
        <div class="md:col-span-2 lg:col-span-3 rounded-3xl bg-white p-10 text-center">
          <div class="text-4xl">🔎</div>
          <h2 class="mt-3 text-xl font-black text-[#03133d]">No matching course found</h2>
          <p class="mt-2 text-sm text-gray-500">Try another course name or clear the search.</p>
        </div>`;
      if(pager)pager.classList.add("hidden");
      return;
    }

    if(pager)pager.classList.remove("hidden");

    coursesContainer.innerHTML=pageCourses.map(course=>{
      const selected=selectedCourse&&String(selectedCourse.id)===String(course.id);
      const fallback="Practical, career-focused online learning.";
      const description=String(course.description||fallback).trim();
      return `
        <article class="course-card ${selected?"selected border-blue-600":"border-transparent"} flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-white text-left">
          <div class="h-40 shrink-0 overflow-hidden bg-slate-100">
            ${course.image_url
              ? `<img src="${escapeHtml(course.image_url)}" alt="${escapeHtml(course.title)}" class="block h-full w-full object-cover object-center" loading="lazy">`
              : `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-5xl">🎓</div>`}
          </div>
          <div class="flex flex-1 flex-col p-5">
            <h2 class="course-card-title font-black text-[#03133d]">${escapeHtml(course.title)}</h2>
            <p class="course-card-preview mt-2 text-sm text-gray-500">${escapeHtml(description)}</p>
            <button type="button" onclick="window.FundaOnboardingCourseBrowser.openDescription('${escapeHtml(course.id)}')" class="mt-2 self-start text-sm font-extrabold text-blue-600 hover:underline">View more</button>
            <div class="mt-auto flex items-center justify-between gap-3 pt-5">
              <span class="text-xs font-bold text-gray-500">⏱ ${escapeHtml(course.duration||"Flexible")}</span>
              <span class="text-sm font-black text-blue-600">${formatMoney(course.price)}</span>
            </div>
            <button type="button" onclick="selectCourse('${escapeHtml(course.id)}')" class="mt-4 w-full rounded-xl ${selected?"bg-blue-50 text-blue-700 ring-1 ring-blue-200":"bg-slate-50 text-[#03133d] hover:bg-blue-50 hover:text-blue-700"} px-4 py-3 text-sm font-extrabold">
              ${selected?"✓ Selected":"Select this course"}
            </button>
          </div>
        </article>`;
    }).join("");

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
  `;
  document.head.appendChild(style);

  renderCourses=renderBrowserCourses;

  window.FundaOnboardingCourseBrowser={
    render:renderBrowserCourses,
    openDescription,
    closeDescription
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