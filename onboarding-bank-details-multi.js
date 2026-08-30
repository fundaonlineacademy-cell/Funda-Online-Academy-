(()=>{
  if(window.__fundaMultiBankDetails)return;window.__fundaMultiBankDetails=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  async function render(){
    const status=document.getElementById('bankDetailsStatus'),rows=document.getElementById('bankDetailsRows');
    if(!status||!rows||!window.supabaseClient)return;
    try{
      const {data,error}=await supabaseClient.from('academy_payment_settings').select('bank_name,account_name,account_number,branch_code,account_type,payment_reference_instruction,is_active').eq('is_active',true).order('id');
      if(error)throw error;
      const banks=(data||[]).filter(x=>x.bank_name&&x.account_number);
      if(!banks.length)throw new Error('No active banking details');
      status.textContent=banks.length>1?'Choose either of the official Academy accounts below for EFT / bank transfer or bank deposit:':'Use the official Academy account below for EFT / bank transfer or bank deposit:';
      status.className='text-sm text-gray-700 leading-6 mt-2';
      rows.className='mt-4 grid gap-4 text-sm';
      rows.innerHTML=banks.map(b=>`<section class="rounded-2xl bg-white border border-blue-100 p-4"><div class="font-black text-[#03133d] text-base">${esc(b.bank_name)}</div><div class="mt-3 grid sm:grid-cols-2 gap-3"><div><span class="text-xs text-gray-500">Account name</span><div class="font-bold text-[#03133d]">${esc(b.account_name||'Funda Online Academy')}</div></div><div><span class="text-xs text-gray-500">Account number</span><div class="font-black text-[#03133d]">${esc(b.account_number)}</div></div><div><span class="text-xs text-gray-500">Branch code</span><div class="font-black text-[#03133d]">${esc(b.branch_code||'—')}</div></div>${b.account_type?`<div><span class="text-xs text-gray-500">Account type</span><div class="font-bold text-[#03133d]">${esc(b.account_type)}</div></div>`:''}</div></section>`).join('')+`<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span class="text-xs uppercase tracking-widest font-black text-amber-700">Payment reference</span><div class="font-black text-[#03133d] mt-1">Use your South African ID number</div><p class="text-xs text-gray-600 mt-2">Use only one of the official accounts above. Do not split one instalment between both accounts unless Admissions & Finance instructs you to do so.</p></section>`;
    }catch(e){
      status.textContent='Banking details could not be loaded. Do not make payment until the official details are displayed.';
      status.className='text-sm text-red-700 font-semibold leading-6 mt-2';rows.classList.add('hidden');
    }
  }
  function init(){if(document.getElementById('bankDetailsStatus'))render();}
  const obs=new MutationObserver(()=>{if(document.getElementById('bankDetailsStatus')&&!document.getElementById('bankDetailsRows')?.dataset.multiLoaded){const r=document.getElementById('bankDetailsRows');if(r)r.dataset.multiLoaded='1';setTimeout(render,50);}});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,100),{once:true});else setTimeout(init,100);
})();