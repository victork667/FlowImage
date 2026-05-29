import { FormEvent, useEffect, useState } from "react";
import { Camera, Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { useAuth } from "../../auth/AuthProvider";

type Mode = "login" | "register";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { configured, loading, user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [from, loading, navigate, user]);

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        navigate(from, { replace: true });
      } else {
        const result = await signUp(email.trim(), password);
        setMessage(result);
        setMode("login");
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-gradient grid min-h-screen place-items-center px-4 py-8 text-ink">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[34px] border border-white/80 bg-white/90 shadow-[0_32px_90px_rgba(54,19,100,0.18)] backdrop-blur-2xl lg:grid-cols-[1fr_440px]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-violet-950 p-8 text-white lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_32%),linear-gradient(120deg,#2e1065,#6d28d9_54%,#d946ef)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_100%)] bg-[length:34px_34px]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-white/15 text-xl font-black shadow-2xl backdrop-blur">
                  F
                </div>
                <div>
                  <div className="text-2xl font-black">FlowImage</div>
                  <div className="text-xs font-black uppercase text-fuchsia-100">studio</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid h-44 w-36 place-items-center rounded-[28px] border border-white/20 bg-white/12 shadow-[0_30px_70px_rgba(0,0,0,0.22)] backdrop-blur">
                <Camera size={44} />
              </div>
              <div>
                <h1 className="max-w-md text-4xl font-black leading-tight">Acesso ao painel de processamento.</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="p-5 sm:p-8">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-gradient-to-br from-violet-950 via-purple-700 to-fuchsia-500 text-xl font-black text-white">
              F
            </div>
            <div>
              <div className="text-2xl font-black text-violet-950">FlowImage</div>
              <div className="text-xs font-black uppercase text-fuchsia-600">studio</div>
            </div>
          </div>

          <div className="mb-6 inline-grid grid-cols-2 rounded-2xl border border-violet-100 bg-violet-50/70 p-1">
            <button
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${mode === "login" ? "bg-violet-950 text-white shadow-lg" : "text-violet-950"}`}
              type="button"
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${mode === "register" ? "bg-violet-950 text-white shadow-lg" : "text-violet-950"}`}
              type="button"
              onClick={() => setMode("register")}
            >
              Cadastrar
            </button>
          </div>

          <form className="grid gap-4" onSubmit={submit}>
            <div>
              <h2 className="text-2xl font-black text-violet-950">{mode === "login" ? "Entrar no sistema" : "Criar acesso"}</h2>
            </div>

            {!configured ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                Supabase Auth nao configurado no ambiente.
              </div>
            ) : null}
            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-danger">{error}</div> : null}
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div> : null}

            <label className="grid gap-1.5 text-sm font-bold text-steel">
              <span className="text-xs font-black uppercase text-violet-950/75">Email</span>
              <span className="focus-within:ring-violet-500 flex min-h-12 items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3.5 shadow-inner shadow-violet-100/60 focus-within:ring-2">
                <Mail size={18} className="text-violet-800" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-ink outline-none"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </span>
            </label>

            <label className="grid gap-1.5 text-sm font-bold text-steel">
              <span className="text-xs font-black uppercase text-violet-950/75">Senha</span>
              <span className="focus-within:ring-violet-500 flex min-h-12 items-center gap-2 rounded-2xl border border-violet-100 bg-white px-3.5 shadow-inner shadow-violet-100/60 focus-within:ring-2">
                <Lock size={18} className="text-violet-800" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-ink outline-none"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button className="rounded-lg p-1 text-steel hover:bg-violet-50" type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <Button disabled={!configured || submitting} icon={mode === "login" ? <Lock size={18} /> : <UserPlus size={18} />}>
              {submitting ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha na autenticacao.";
  if (message.toLowerCase().includes("invalid login")) return "Email ou senha invalidos.";
  if (message.toLowerCase().includes("already registered")) return "Este email ja esta cadastrado.";
  if (message.toLowerCase().includes("password")) return "Verifique a senha informada.";
  return message;
}
