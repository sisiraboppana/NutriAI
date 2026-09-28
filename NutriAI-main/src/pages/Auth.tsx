import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import appleLogo from "@/assets/apple-logo.png";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const oauthRedirectTo = `${window.location.origin}/auth`;

  useEffect(() => {
    if (user) navigate("/menu", { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/menu` },
        });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
      }
      navigate("/menu");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md w-full">
      <header className="pt-8 pb-3 px-5 flex items-center gap-3">
        <img src={appleLogo} alt="NutriAI logo" width={80} height={80} className="w-20 h-20 drop-shadow-lg" />
        <h1 className="wordmark text-6xl leading-none">Nutri AI</h1>
      </header>

      <div className="nutri-banner">
        <h1>{mode === "signup" ? "Create Account" : "Welcome Back"}</h1>
      </div>

      <main className="flex-1 px-6 py-8">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-white text-lg font-medium mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-white/95 text-foreground outline-none focus:ring-2 focus:ring-teal-deep"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-white text-lg font-medium mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 bg-white/95 text-foreground outline-none focus:ring-2 focus:ring-teal-deep"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-white text-teal-deep font-semibold py-3 shadow-lg hover:bg-white/90 transition disabled:opacity-60"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <p className="text-center text-white/90">Or</p>

          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: oauthRedirectTo,
                },
              });
              if (error) toast.error(error.message || "Google sign-in failed");
            }}
            className="w-full rounded-xl bg-white py-3 font-medium text-foreground shadow-lg hover:bg-white/95 transition flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3-11.3-7.4l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35.1 44 30 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
            Sign in with Google
          </button>

          <p className="text-center text-white">
            {mode === "signup" ? "Already have an account? " : "New here? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="underline font-semibold"
            >
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </p>
        </form>
      </main>

      <p className="quote-footer pt-4">
        "To eat is a necessity, but to eat intelligently is an art" — La Rochefoucauld
      </p>
    </div>
  );
};

export default Auth;
