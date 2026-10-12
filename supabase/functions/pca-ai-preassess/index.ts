import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Cache-Control':'no-store'
};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const supportedImage=new Set(['jpg','jpeg','png','webp']);
const supportedFile=new Set(['pdf','docx','xlsx','pptx','txt']);
const ext=(name:string)=>String(name||'').split('.').pop()?.toLowerCase()||'';
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

function outputText(payload:any){
  if(typeof payload?.output_text==='string'&&payload.output_text.trim())return payload.output_text.trim();
  for(const item of payload?.output||[]){
    for(const part of item?.content||[]){
      if(part?.type==='refusal')throw new Error(part.refusal||'The AI review was refused.');
      if(part?.type==='output_text'&&typeof part.text==='string')return part.text.trim();
    }
  }
  throw new Error('The AI review returned no structured output.');
}

async function openaiJson(apiKey:string,model:string,input:any[],name:string,schema:any,maxOutputTokens=1600){
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({
      model,
      store:false,
      input:[{role:'user',content:input}],
      text:{format:{type:'json_schema',name,strict:true,schema}},
      max_output_tokens:maxOutputTokens
    })
  });
  const payload=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(payload?.error?.message||`OpenAI request failed (${r.status}).`);
  return JSON.parse(outputText(payload));
}

const fileSchema={
  type:'object',additionalProperties:false,
  properties:{
    file_name:{type:'string'},
    relevance_score:{type:'number',minimum:0,maximum:100},
    summary:{type:'string'},
    evidence_points:{type:'array',items:{type:'string'}},
    criteria_relevance:{type:'array',items:{type:'integer',minimum:0}},
    concerns:{type:'array',items:{type:'string'}},
    manual_review_required:{type:'boolean'}
  },
  required:['file_name','relevance_score','summary','evidence_points','criteria_relevance','concerns','manual_review_required']
};

const aggregateSchema={
  type:'object',additionalProperties:false,
  properties:{
    relevance_score:{type:'number',minimum:0,maximum:100},
    overall_summary:{type:'string'},
    required_evidence:{type:'array',items:{
      type:'object',additionalProperties:false,
      properties:{
        requirement:{type:'string'},
        status:{type:'string',enum:['found','partial','not_found','manual_check']},
        evidence_files:{type:'array',items:{type:'string'}},
        explanation:{type:'string'}
      },required:['requirement','status','evidence_files','explanation']
    }},
    criterion_suggestions:{type:'array',items:{
      type:'object',additionalProperties:false,
      properties:{
        criterion_index:{type:'integer',minimum:0},
        suggested_level:{anyOf:[{type:'integer',minimum:0,maximum:4},{type:'null'}]},
        rationale:{type:'string'},
        evidence_files:{type:'array',items:{type:'string'}},
        confidence:{type:'string',enum:['high','medium','low','manual_check']}
      },required:['criterion_index','suggested_level','rationale','evidence_files','confidence']
    }},
    flags:{type:'array',items:{
      type:'object',additionalProperties:false,
      properties:{severity:{type:'string',enum:['info','attention','high']},code:{type:'string'},message:{type:'string'}},
      required:['severity','code','message']
    }},
    manual_review_required:{type:'boolean'}
  },
  required:['relevance_score','overall_summary','required_evidence','criterion_suggestions','flags','manual_review_required']
};

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  let admin:any=null;
  let preId:string|null=null;
  try{
    const auth=req.headers.get('Authorization')||'';
    if(!auth.startsWith('Bearer '))return json({ok:false,error:'Unauthorized'},401);
    const url=Deno.env.get('SUPABASE_URL')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token=auth.slice(7);
    admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userErr}=await admin.auth.getUser(token);
    if(userErr||!user)return json({ok:false,error:'Invalid session'},401);
    const {data:profile,error:profileErr}=await admin.from('profiles').select('id,role').eq('id',user.id).maybeSingle();
    if(profileErr||profile?.role!=='admin')return json({ok:false,error:'Admin authorisation is required.'},403);

    const body=await req.json().catch(()=>({}));
    const submissionId=String(body?.submission_id||'').trim();
    if(!submissionId)return json({ok:false,error:'Select a PCA submission.'},400);

    const {data:submission,error:subErr}=await admin.from('pca_submissions').select('*').eq('id',submissionId).maybeSingle();
    if(subErr||!submission)return json({ok:false,error:'PCA submission not found.'},404);
    if(!['submitted','under_review'].includes(String(submission.status||'')))return json({ok:false,error:'AI pre-assessment is available only while a PCA is awaiting assessor review.'},409);

    const [{data:cfg,error:cfgErr},{data:course,error:courseErr}]=await Promise.all([
      admin.from('course_end_requirements').select('pca_task_config,pca_minimum_score,pca_max_resubmissions').eq('course_id',submission.course_id).maybeSingle(),
      admin.from('courses').select('id,title').eq('id',submission.course_id).maybeSingle()
    ]);
    if(cfgErr||!cfg||courseErr||!course)return json({ok:false,error:'The course PCA configuration could not be loaded.'},400);
    const task=cfg.pca_task_config||{};
    const criteria=Array.isArray(task.criteria)?task.criteria:[];
    const scale=Array.isArray(task.rubric_scale)?task.rubric_scale:[];
    if(!criteria.length||!scale.length)return json({ok:false,error:'The approved PCA rubric is incomplete.'},409);
    const files=Array.isArray(submission.evidence?.files)?submission.evidence.files:[];
    if(!files.length)return json({ok:false,error:'This PCA has no evidence files to review.'},409);

    const model=Deno.env.get('OPENAI_MODEL')||'gpt-6-astra';
    const {data:pre,error:preErr}=await admin.from('pca_ai_preassessments').insert({
      submission_id:submission.id,course_id:submission.course_id,learner_id:submission.user_id,requested_by:user.id,
      status:'running',provider:'openai',model
    }).select('id').single();
    if(preErr)throw preErr;
    preId=pre.id;

    const apiKey=Deno.env.get('OPENAI_API_KEY')||'';
    if(!apiKey){
      await admin.from('pca_ai_preassessments').update({status:'unavailable',error_message:'OPENAI_API_KEY is not configured for the PCA assessor service.',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',preId);
      return json({ok:false,configured:false,preassessment_id:preId,error:'The AI assessor service is not configured yet. Manual PCA assessment remains available.'},503);
    }

    const taskContext={course_title:course.title,purpose:task.purpose||'',instructions:task.instructions||'',components:task.components||[],evidence_requirements:task.evidence_requirements||[],criteria,critical_criterion_rule:task.critical_criterion_rule||{},rubric_scale:scale};
    const fileAnalyses:any[]=[];
    const unsupported:any[]=[];
    const maxFiles=clamp(Number(Deno.env.get('PCA_AI_MAX_FILES')||20),1,20);
    const candidates=files.slice(0,maxFiles);
    if(files.length>maxFiles)unsupported.push({code:'file_limit',message:`${files.length-maxFiles} evidence file(s) were not AI-reviewed because the configured AI file limit is ${maxFiles}.`});

    async function analyseFile(f:any){
      const name=String(f?.name||'Evidence file');
      const extension=ext(name);
      if(!supportedImage.has(extension)&&!supportedFile.has(extension)){
        unsupported.push({code:extension==='mp4'?'video_manual_review':'unsupported_format',message:`${name} requires manual review; this file type is not included in the automated evidence analysis.`,file:name});
        return;
      }
      if(!f?.path){unsupported.push({code:'missing_path',message:`${name} has no verifiable storage path.`,file:name});return;}
      const {data:signed,error:signedErr}=await admin.storage.from('pca-evidence').createSignedUrl(f.path,600);
      if(signedErr||!signed?.signedUrl){unsupported.push({code:'signed_url_failed',message:`${name} could not be opened for AI review and requires manual checking.`,file:name});return;}
      const prompt=`You are performing a PRIVATE PRE-ASSESSMENT for an authorised human assessor at Funda Online Academy. This is advisory only and must never be treated as the learner's final result. Analyse only what is actually visible/readable in this evidence file. Compare it with the exact course PCA task below. Do not assume missing facts, do not invent evidence, and do not infer authenticity or authorship beyond what the file supports. If visual/process evidence cannot be established from this file, say so and require manual review.\n\nCOURSE PCA TASK:\n${JSON.stringify(taskContext)}\n\nFILE METADATA:\n${JSON.stringify({name,type:f?.type||'',size:f?.size||null})}`;
      const evidencePart=supportedImage.has(extension)
        ?{type:'input_image',image_url:signed.signedUrl,detail:'auto'}
        :{type:'input_file',file_url:signed.signedUrl,filename:name,...(extension==='pdf'?{detail:'low'}:{})};
      const result=await openaiJson(apiKey,model,[evidencePart,{type:'input_text',text:prompt}],'pca_evidence_file_analysis',fileSchema,1400);
      result.file_name=name;
      fileAnalyses.push(result);
    }

    for(let i=0;i<candidates.length;i+=4){
      await Promise.all(candidates.slice(i,i+4).map((f:any)=>analyseFile(f).catch((error:any)=>unsupported.push({code:'file_analysis_failed',message:`${String(f?.name||'Evidence file')} could not be AI-reviewed: ${error?.message||'analysis failed'}`,file:String(f?.name||'Evidence file')}))));
    }

    const aggregatePrompt=`You are assisting an authorised human assessor with a PRIVATE FOA PCA pre-assessment. You do NOT make the final competence decision. Use only the exact PCA task, rubric, evidence requirements and the evidence-file analyses supplied below. A learner can ultimately be Competent only when the human-verified weighted score is at least the configured threshold and every critical criterion meets the approved minimum level. Do not fill evidence gaps by assumption. For any criterion that cannot be judged reliably from the analysed evidence, return suggested_level=null and confidence=manual_check. Flag missing, irrelevant, contradictory, unsafe, copied-looking or unverifiable evidence for human review. Never tell the learner a result.\n\nCOURSE TASK:\n${JSON.stringify(taskContext)}\n\nAI-READABLE FILE ANALYSES:\n${JSON.stringify(fileAnalyses)}\n\nFILES / ITEMS REQUIRING MANUAL REVIEW:\n${JSON.stringify(unsupported)}\n\nReturn one suggestion for every rubric criterion, using its zero-based criterion_index.`;
    const aggregate=await openaiJson(apiKey,model,[{type:'input_text',text:aggregatePrompt}],'pca_preassessment_summary',aggregateSchema,3000);

    const byLevel=new Map<number,number>();
    for(const s of scale){const l=Number(s?.level);const pct=Number(s?.criterion_percentage);if(Number.isFinite(l)&&Number.isFinite(pct))byLevel.set(l,pct)}
    const suggested=Array.isArray(aggregate.criterion_suggestions)?aggregate.criterion_suggestions:[];
    let complete=suggested.length===criteria.length;
    let score=0;
    let criticalKnown=true;
    let criticalMet=true;
    const minCritical=Number(task?.critical_criterion_rule?.minimum_level??3);
    for(let i=0;i<criteria.length;i++){
      const s=suggested.find((x:any)=>Number(x?.criterion_index)===i);
      if(!s||s.suggested_level===null||s.suggested_level===undefined){complete=false;if(criteria[i]?.critical)criticalKnown=false;continue;}
      const level=Number(s.suggested_level);const pct=byLevel.get(level);
      if(pct===undefined){complete=false;continue;}
      score+=Number(criteria[i]?.weight||0)*pct/100;
      if(criteria[i]?.critical&&level<minCritical)criticalMet=false;
    }
    const suggestedScore=complete?Math.round(score*10)/10:null;
    const suggestedCritical=criticalKnown?criticalMet:null;
    const flags=[...(Array.isArray(aggregate.flags)?aggregate.flags:[]),...unsupported.map(x=>({severity:'attention',code:x.code,message:x.message}))];
    const evidenceSummary={overall_summary:aggregate.overall_summary||'',required_evidence:aggregate.required_evidence||[],file_analyses:fileAnalyses,unreviewed_or_manual_items:unsupported};

    const {error:updateErr}=await admin.from('pca_ai_preassessments').update({
      status:'completed',model,evidence_summary:evidenceSummary,criterion_suggestions:suggested,suggested_score:suggestedScore,
      suggested_critical_criteria_met:suggestedCritical,relevance_score:Number.isFinite(Number(aggregate.relevance_score))?clamp(Number(aggregate.relevance_score),0,100):null,
      flags,manual_review_required:true,error_message:null,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()
    }).eq('id',preId);
    if(updateErr)throw updateErr;

    return json({ok:true,preassessment_id:preId,status:'completed',model,relevance_score:aggregate.relevance_score,suggested_score:suggestedScore,
      suggested_critical_criteria_met:suggestedCritical,manual_review_required:true,evidence_summary:evidenceSummary,criterion_suggestions:suggested,flags,
      notice:'AI suggestion only — an authorised human assessor must review, score and verify the PCA before any learner outcome is finalised.'});
  }catch(e:any){
    if(admin&&preId){try{await admin.from('pca_ai_preassessments').update({status:'failed',error_message:String(e?.message||e||'AI pre-assessment failed').slice(0,4000),completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',preId)}catch(_){}}
    return json({ok:false,preassessment_id:preId,error:e?.message||'Unable to run PCA AI pre-assessment.'},400);
  }
});
