import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  let admin: ReturnType<typeof createClient> | null = null;
  let createdUserId: string | null = null;
  let finalised = false;

  try {
    const auth = req.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: { user }, error: userErr } = await admin.auth.getUser(auth.replace('Bearer ', ''));
    if (userErr || !user) throw new Error('Invalid session');

    const { data: actor, error: actorErr } = await admin
      .from('profiles')
      .select('id,role,job_title,department')
      .eq('id', user.id)
      .single();

    if (actorErr || !actor || actor.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only executive administration may create staff accounts' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const b = await req.json();
    const full_name = String(b.full_name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const job_title = String(b.job_title || '').trim();
    const department = String(b.department || '').trim();
    const access_level = ['read', 'edit', 'manager'].includes(b.access_level) ? b.access_level : 'edit';
    const can_approve = !!b.can_approve;

    if (!full_name || !email || !job_title || !department) {
      throw new Error('Name, email, job title and department are required');
    }

    const { data: staff_code, error: codeErr } = await admin.rpc('next_staff_code', {
      p_department: department
    });
    if (codeErr) throw codeErr;

    const options: Record<string, unknown> = {
      data: {
        full_name,
        role: 'staff',
        account_type: 'staff',
        registration_source: 'admin_staff_invite',
        staff_code,
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

    const { data: finalData, error: finalErr } = await admin.rpc('finalize_staff_invitation', {
      p_user_id: createdUserId,
      p_email: email,
      p_full_name: full_name,
      p_staff_code: staff_code,
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

    return new Response(JSON.stringify({
      ok: true,
      user_id: createdUserId,
      staff_code,
      department,
      access_level,
      can_approve,
      finalised: finalData?.ok === true
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    if (admin && createdUserId && !finalised) {
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch (_) {
        // If cleanup itself fails, the Admin receives the original error and
        // the Academy can reconcile the failed invite from the audit trail.
      }
    }

    return new Response(JSON.stringify({ error: e?.message || 'Unable to invite staff user' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
