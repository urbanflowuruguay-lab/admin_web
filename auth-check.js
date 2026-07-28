// auth-check.js — Middleware de autenticación para el panel admin
// Incluir en cada página admin: <script src="/auth-check.js"></script>

(function() {
    const SUPABASE_URL = "https://eyfgkopaamnkprzpwocz.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTk0ODMsImV4cCI6MjA5NDE5NTQ4M30.bXkq4Ks3p2yb2SQH76__8jXhmM5Thi2izIL5UPkKa0I";

    // Esperar a que Supabase SDK esté disponible
    function waitForSupabase() {
        return new Promise((resolve) => {
            if (window.supabase && window.supabase.createClient) {
                resolve();
            } else {
                const check = setInterval(() => {
                    if (window.supabase && window.supabase.createClient) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
            }
        });
    }

    async function checkAuth() {
        await waitForSupabase();

        const sb = window._authSB || supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
        window._authSB = sb;

        const { data: { session }, error } = await sb.auth.getSession();

        if (error || !session) {
            window.location.href = "/login.html?redirect=" + encodeURIComponent(window.location.pathname);
            return null;
        }

        const userId = session.user.id;
        const { data: profile, error: profileError } = await sb
            .from("perfiles")
            .select("type, status, full_name, email")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            await sb.auth.signOut();
            window.location.href = "/login.html?error=no_profile";
            return null;
        }

        // Verificar si es admin
        const { data: adminCheck } = await sb
            .from("perfiles")
            .select("role")
            .eq("id", userId)
            .single();

        const role = adminCheck?.role || profile.type;

        if (role !== "admin") {
            await sb.auth.signOut();
            window.location.href = "/login.html?error=not_admin";
            return null;
        }

        return { session, profile, role, userId, sb };
    }

    // Ejecutar check y exponer resultado
    window.__authReady = checkAuth().then(auth => {
        window.__auth = auth;
        document.dispatchEvent(new CustomEvent("auth-ready", { detail: auth }));
        return auth;
    });

    // Función de logout global
    window.__logout = async function() {
        const sb = window._authSB;
        if (sb) await sb.auth.signOut();
        window.location.href = "/login.html";
    };
})();
