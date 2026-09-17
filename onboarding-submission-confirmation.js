(()=>{
  if(window.__fundaOnboardingSubmissionConfirmation)return;
  window.__fundaOnboardingSubmissionConfirmation=true;

  const VERSION='20260917-submission-confirmation-v1';
  const TARGET_RPC='submit_student_payment';
  const FUNCTION_NAME='send-enrollment-submission-confirmation';
  let installed=false;
  let attempts=0;

  function getClient(){
    try{return window.FundaEnrollmentContext?.getSupabase?.()||null;}catch(_){return null;}
  }

  async function sendConfirmation(client,enrollmentId){
    if(!client?.functions?.invoke||!enrollmentId)return;
    try{
      const {data,error}=await client.functions.invoke(FUNCTION_NAME,{
        body:{enrollment_id:enrollmentId}
      });
      if(error){
        console.warn('Enrollment confirmation email could not be sent:',error.message||error);
        return;
      }
      if(data?.ok===false){
        console.warn('Enrollment confirmation email was not delivered:',data.error||data);
      }
    }catch(error){
      // Confirmation delivery must never undo or block a successful enrollment.
      console.warn('Enrollment confirmation email warning:',error?.message||error);
    }
  }

  function install(){
    if(installed)return;
    const client=getClient();
    if(!client||typeof client.rpc!=='function'){
      if(attempts++<120)setTimeout(install,250);
      return;
    }

    if(client.rpc.__fundaEnrollmentConfirmationWrapped){
      installed=true;
      return;
    }

    const originalRpc=client.rpc.bind(client);
    const wrappedRpc=async function(functionName,args,options){
      const result=await originalRpc(functionName,args,options);

      if(
        functionName===TARGET_RPC&&
        !result?.error&&
        args?.p_enrolment_id
      ){
        // Wait for the operational email attempt before returning to the existing
        // submission flow. Any email failure is swallowed so the learner's
        // successfully submitted application is never rolled back.
        await sendConfirmation(client,String(args.p_enrolment_id));
      }

      return result;
    };
    wrappedRpc.__fundaEnrollmentConfirmationWrapped=true;
    client.rpc=wrappedRpc;
    installed=true;
  }

  window.FundaOnboardingSubmissionConfirmation={
    version:VERSION,
    install,
    sendConfirmation:(enrollmentId)=>sendConfirmation(getClient(),enrollmentId)
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  }else{
    install();
  }
})();