(()=>{
  if(window.__fundaOnboardingContactValidation)return;
  window.__fundaOnboardingContactValidation=true;

  const ERROR='Enter a valid South African mobile / WhatsApp number, for example 0721234567 or +27721234567.';

  function compact(value){
    return String(value||'').trim().replace(/[\s()\-.]/g,'');
  }

  function isValid(value){
    const phone=compact(value);
    return /^0[678][0-9]{8}$/.test(phone)||/^\+27[678][0-9]{8}$/.test(phone);
  }

  function boot(){
    if(!/(^|\/)onboarding\.html$/i.test(location.pathname))return;
    const input=document.getElementById('mobile');
    if(!input||input.dataset.fundaPhoneValidation==='1')return;
    input.dataset.fundaPhoneValidation='1';
    input.setAttribute('inputmode','tel');
    input.setAttribute('autocomplete','tel');
    input.setAttribute('maxlength','16');
    input.placeholder='e.g. 072 123 4567 or +27 72 123 4567';

    const helper=document.createElement('p');
    helper.id='mobileValidationHelp';
    helper.className='text-xs text-gray-500 mt-2 leading-5';
    helper.textContent='Use a South African number in 10-digit format (0...) or international +27 format.';
    input.insertAdjacentElement('afterend',helper);

    function validate(focus=false){
      const value=String(input.value||'').trim();
      const valid=!!value&&isValid(value);
      input.setCustomValidity(valid?'':ERROR);
      helper.textContent=valid
        ? 'Contact number format accepted.'
        : (value?ERROR:'A mobile / WhatsApp number is required.');
      helper.className=`text-xs mt-2 leading-5 ${valid?'text-emerald-700':'text-red-600'}`;
      if(!valid&&focus){input.focus();input.reportValidity();}
      return valid;
    }

    input.addEventListener('input',()=>{
      input.setCustomValidity('');
      helper.textContent='Use a South African number in 10-digit format (0...) or international +27 format.';
      helper.className='text-xs text-gray-500 mt-2 leading-5';
    });
    input.addEventListener('blur',()=>{if(input.value.trim())validate(false);});

    document.addEventListener('click',event=>{
      const button=event.target.closest?.('button');
      if(!button)return;
      const id=button.id||'';
      const isAdvance=['registrationContinue','paymentContinue','submitButton'].includes(id)||/submit enrollment application/i.test(button.textContent||'');
      if(!isAdvance)return;
      if(validate(false))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      validate(true);
      try{window.showMessage?.(ERROR);}catch(_){}
    },true);

    document.addEventListener('submit',event=>{
      if(validate(false))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      validate(true);
      try{window.showMessage?.(ERROR);}catch(_){}
    },true);

    try{
      if(typeof validateApplication==='function'&&!validateApplication.__fundaPhoneWrapped){
        const original=validateApplication;
        const wrapped=function(values,file){
          if(!isValid(values?.mobile_whatsapp))return ERROR;
          return original(values,file);
        };
        wrapped.__fundaPhoneWrapped=true;
        validateApplication=wrapped;
      }
    }catch(error){console.warn('Phone validation wrapper unavailable:',error);}
  }

  window.FundaStudentPhoneValidation={compact,isValid,errorMessage:ERROR,boot};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
