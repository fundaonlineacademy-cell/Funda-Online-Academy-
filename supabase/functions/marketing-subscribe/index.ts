import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const H = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

const clean = (v: unknown, max = 500) =>
  String(v ?? "").trim().slice(0, max);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: H });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: H
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = clean(body.email, 320).toLowerCase();
    const fullName = clean(body.full_name, 160) || null;
    const source = clean(body.source, 80) || "website";
    const courseInterest = clean(body.course_interest, 200) || null;
    const consent = body.consent === true;

    if (!consent) {
      return new Response(
        JSON.stringify({ error: "Marketing consent is required." }),
        { status: 400, headers: H }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Enter a valid email address." }),
        { status: 400, headers: H }
      );
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service, {
      auth: { persistSession: false }
    });
    const now = new Date().toISOString();

    const { data: existing, error: findErr } = await admin
      .from("marketing_subscribers")
      .select("id,email,consent,unsubscribed_at")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing) {
      if (existing.consent === true && !existing.unsubscribed_at) {
        const { error } = await admin
          .from("marketing_subscribers")
          .update({
            full_name: fullName,
            source,
            course_interest: courseInterest,
            updated_at: now
          })
          .eq("id", existing.id);
        if (error) throw error;

        return new Response(
          JSON.stringify({ ok: true, status: "already_active" }),
          { status: 200, headers: H }
        );
      }

      const { error: updateErr } = await admin
        .from("marketing_subscribers")
        .update({
          full_name: fullName,
          source,
          course_interest: courseInterest,
          consent: true,
          consent_at: now,
          unsubscribed_at: null,
          unsubscribe_token: crypto.randomUUID(),
          updated_at: now
        })
        .eq("id", existing.id);

      if (updateErr) throw updateErr;

      return new Response(
        JSON.stringify({ ok: true, status: "resubscribed" }),
        { status: 200, headers: H }
      );
    }

    const { error: insertErr } = await admin
      .from("marketing_subscribers")
      .insert({
        email,
        full_name: fullName,
        source,
        course_interest: courseInterest,
        consent: true,
        consent_at: now
      });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ ok: true, status: "subscribed" }),
      { status: 201, headers: H }
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e)
      }),
      { status: 500, headers: H }
    );
  }
});
