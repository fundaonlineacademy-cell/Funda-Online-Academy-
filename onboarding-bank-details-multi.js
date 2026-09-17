(()=>{
  if(window.__fundaMultiBankDetails)return;window.__fundaMultiBankDetails=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  let tries=0;

  function getClient(){
    try{
      if(typeof supabaseClient!=='undefined'&&supabaseClient)return supabaseClient;
    }catch(e){}
    if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
      try{return window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);}catch(e){}
    }
    return null;
  }

  function displayBankName(bankName){
    const raw=String(bankName||'').trim();
    const compact=raw.toLowerCase().replace(/[^a-z]/g,'');
    if(compact==='tymebank'||compact==='gotyme'||compact==='gotymebank')return 'GoTyme Bank / TymeBank';
    return raw;
  }

  function isCapitec(bankName){
    return /^capitec\b/i.test(String(bankName||'').trim());
  }

  function bankCard(b){
    const bankName=displayBankName(b.bank_name);
    const capitec=isCapitec(b.bank_name);
    return `<section class="rounded-2xl bg-white border border-blue-100 p-4">
      <div class="font-black text-[#03133d] text-base">${esc(bankName)}</div>
      <div class="mt-3 grid sm:grid-cols-2 gap-3">
        <div><span class="text-xs text-gray-500">Beneficiary / Business</span><div class="font-bold text-[#03133d]">${esc(b.account_name||'Funda Online Academy')}</div></div>
        ${capitec?`<div><span class="text-xs text-gray-500">Account holder shown by the bank</span><div class="font-bold text-[#03133d]">Mr Futhe</div></div>`:''}
        <div><span class="text-xs text-gray-500">Account number</span><div class="font-black text-[#03133d]">${esc(b.account_number)}</div></div>
        <div><span class="text-xs text-gray-500">Branch code</span><div class="font-black text-[#03133d]">${esc(b.branch_code||'—')}</div></div>
        ${b.account_type?`<div><span class="text-xs text-gray-500">Account type</span><div class="font-bold text-[#03133d]">${esc(b.account_type)}</div></div>`:''}
      </div>
      ${capitec?`<div class="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-gray-700"><strong class="text-[#03133d]">Capitec verification note:</strong> This is the official Funda Online Academy business/entrepreneur account. When you add the beneficiary or make a deposit, Capitec may display the verified account holder as <strong>Mr Futhe</strong>. This is expected. Please confirm that the bank and account number match the official details shown here before paying.</div>`:''}
    </section>`;
  }

  async function render(){
    const status=document.getElementById('bankDetailsStatus'),rows=document.getElementById('bankDetailsRows');
    if(!status||!rows){if(tries++<30)setTimeout(render,200);return;}
    const client=getClient();
    if(!client){if(tries++<30)setTimeout(render,200);return;}
    try{
      const {data,error}=await client.from('academy_payment_settings').select('bank_name,account_name,account_number,branch_code,account_type,payment_reference_instruction,is_active,id').eq('is_active',true).order('id');
      if(error)throw error;
      const banks=(data||[]).filter(x=>x.bank_name&&x.account_number);
      if(!banks.length)throw new Error('No active banking details');
      status.textContent=banks.length>1?'Choose either of the official Academy accounts below for EFT / bank transfer or bank deposit:':'Use the official Academy account below for EFT / bank transfer or bank deposit:';
      status.className='text-sm text-gray-700 leading-6 mt-2';
      rows.className='mt-4 grid gap-4 text-sm';
      rows.innerHTML=`<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span class="text-xs uppercase tracking-widest font-black text-amber-700">Important account-name notice</span><p class="text-sm text-gray-700 leading-6 mt-2">These are official Funda Online Academy business banking details. Depending on the bank and account type, your banking app or ATM may display the registered account holder's name rather than “Funda Online Academy” when verifying the beneficiary. Always confirm that the <strong>bank name and account number</strong> exactly match the official details shown below before making payment.</p></section>`+banks.map(bankCard).join('')+`<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span class="text-xs uppercase tracking-widest font-black text-amber-700">Payment reference</span><div class="font-black text-[#03133d] mt-1">Use your South African ID number</div><p class="text-xs text-gray-600 mt-2">Use only one of the official accounts above. Do not split one instalment between both accounts unless Admissions & Finance instructs you to do so.</p></section>`;
      rows.dataset.multiLoaded='1';
    }catch(e){
      console.error('Bank details loader:',e);
      status.textContent='Banking details could not be loaded. Do not make payment until the official details are displayed.';
      status.className='text-sm text-red-700 font-semibold leading-6 mt-2';
      rows.classList.add('hidden');
    }
  }

  function schedule(){tries=0;setTimeout(render,150);setTimeout(render,700);setTimeout(render,1600);}
  const obs=new MutationObserver(()=>{const r=document.getElementById('bankDetailsRows');if(r&&!r.dataset.multiLoaded)schedule();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();