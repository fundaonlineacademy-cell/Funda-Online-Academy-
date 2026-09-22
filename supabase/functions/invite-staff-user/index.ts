import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Cache-Control':'no-store'
};

function json(body:unknown,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
}

function oneTimeAccessCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes=new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let body='';
  for(const b of bytes) body+=alphabet[b%alphabet.length];
  return 'FOA-SEC-'+body.slice(0,5)+'-'+body.slice(5);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  let admin: ReturnType<typeof createClient> | null = null;
  let createdUserId: string | null = null;
  let finalised = false;

  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' },401);

    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: { user }, error: userErr } = await admin.auth.getUser(auth.replace('Bearer ', ''));
    if (userErr || !user) return json({error:'Invalid session'},401);

    const { data: actor, error: actorErr } = await admin
      .from('profiles')
      .select('id,role,job_title,department')
      .eq('id', user.id)
      .single();

    if (actorErr || !actor || actor.role !== 'admin') {
      return json({ error: 'Only executive administration may create staff accounts' },403);
    }

    const b = await req.json();
    const full_name = String(b.full_name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const job_title = String(b.job_title || '').trim();
    const department = String(b.department || '').trim();
    const access_level = ['read', 'edit', 'manager'].includes(b.access_level) ? b.access_level : 'edit';
    const can_approve = !!b.can_approve;
    const allowedDepartments = new Set([
      'Human Resources',
      'Finance & Accounting',
      'Academic, Assessments & Content',
      'Enrolments & Courses',
      'Student Support & CRM',
      'Marketing & Admissions',
      'Communication Hub',
      'IT, Security & Platform'
    ]);

    if (!full_name || !email || !job_title || !department) {
      throw new Error('Name, email, job title and department are required');
    }
    if (!allowedDepartments.has(department)) {
      throw new Error('Choose one of the Academy’s approved staff departments');
    }

    const { data: staff_number, error: numberErr } = await admin.rpc('next_staff_number', {
      p_department: department
    });
    if (numberErr) throw numberErr;

    const access_code=oneTimeAccessCode();

    const options: Record<string, unknown> = {
      data: {
        full_name,
        role: 'staff',
        account_type: 'staff',
        registration_source: 'admin_staff_invite',
        staff_number,
        job_title,
        department
      }
    };

    if (b.redirect_to && /^https?:\/\//i.test(String(b.redirect_to))) {
      options.redirectTo = String(b.redirect_to);
    }

    const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, options);
    if (inviteErr) throw inviteErr;
    if (!invite?.user?.id) throw new Error('Staff invitation did not return a user ID');

    createdUserId = invite.user.id;

    const { data: finalData, error: finalErr } = await admin.rpc('finalize_staff_invitation_v2', {
      p_user_id: createdUserId,
      p_email: email,
      p_full_name: full_name,
      p_staff_number: staff_number,
      p_access_code: access_code,
      p_job_title: job_title,
      p_department: department,
      p_access_level: access_level,
      p_can_approve: can_approve,
      p_invited_by: user.id,
      p_start_date: b.start_date || null,
      p_notes: b.notes || null
    });
    if (finalErr) throw finalErr;

    finalised = true;

    return json({
      ok: true,
      user_id: createdUserId,
      staff_number,
      access_code,
      department,
      access_level,
      can_approve,
      finalised: finalData?.ok === true
    });
  } catch (e) {
    if (admin && createdUserId && !finalised) {
      try { await admin.auth.admin.deleteUser(createdUserId); } catch (_) {}
    }
    return json({ error: e instanceof Error ? e.message : 'Unable to invite staff user' },400);
  }
});
