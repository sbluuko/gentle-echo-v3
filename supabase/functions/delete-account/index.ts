import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return new Response("Missing token", { status: 401 });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.id) return new Response("Invalid token", { status: 401 });

    const uid = userData.user.id;

    // Delete user-owned data (add more tables here if needed)
    await admin.from("profiles").delete().eq("id", uid);

    // Finally delete auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
