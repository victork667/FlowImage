import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

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
    <div className="flex min-h-screen bg-slate-50">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-900 to-purple-800 p-12 text-white lg:flex">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet-700 opacity-20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-600 opacity-20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <span className="text-xl font-bold text-violet-800">F</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">FlowImage</h1>
          </div>
          <p className="mt-2 text-sm uppercase tracking-widest text-violet-200">Studio</p>
        </div>

        <div className="relative z-10 mb-20">
          <h2 className="text-4xl font-extrabold leading-tight">Gerencie seus ativos digitais com inteligencia e fluidez.</h2>
          <p className="mt-4 text-lg text-violet-200">Sua plataforma central para processamento, organizacao e revisao de moldes e imagens.</p>
        </div>

        <div className="relative z-10 text-sm text-violet-300">2026 FlowImage Studio.</div>
      </section>

      <section className="flex flex-1 flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:w-1/2 lg:flex-none xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-700 text-xl font-bold text-white">F</div>
              <div>
                <div className="text-xl font-bold leading-none text-gray-900">FlowImage</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-violet-600">Studio</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h2>
            <p className="mt-2 text-sm text-gray-600">{mode === "login" ? "Acesse sua conta para continuar." : "Preencha os dados abaixo para comecar."}</p>
          </div>

          <div className="mt-8">
            <form onSubmit={submit}>
              {mode === "register" ? <DisplayInput label="Nome Completo" type="text" placeholder="Seu nome" icon={<User className="h-5 w-5" />} /> : null}
              <AuthInput label="Email" type="email" placeholder="seu@email.com" icon={<Mail className="h-5 w-5" />} value={email} onChange={setEmail} />
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm leading-5 placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-violet-600" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === "login" ? (
                <div className="mt-4 flex items-center justify-end">
                  <button className="text-sm font-medium text-violet-600 transition hover:text-violet-500" type="button">
                    Esqueceu a senha?
                  </button>
                </div>
              ) : null}

              {!configured ? <Message tone="warning">Supabase Auth nao configurado no ambiente.</Message> : null}
              {error ? <Message tone="error">{error}</Message> : null}
              {message ? <Message tone="success">{message}</Message> : null}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!configured || submitting}
                  className="flex w-full justify-center rounded-lg border border-transparent bg-violet-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Aguarde..." : mode === "login" ? "Entrar na Plataforma" : "Cadastrar-se"}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">{mode === "login" ? "Novo por aqui?" : "Ja tem uma conta?"}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setMode((current) => (current === "login" ? "register" : "login"));
                  setError(null);
                  setMessage(null);
                }}
                className="mt-6 flex w-full justify-center rounded-lg border-2 border-violet-600 bg-white px-4 py-3 text-sm font-medium text-violet-600 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                type="button"
              >
                {mode === "login" ? "Criar uma conta" : "Fazer login"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthInput({ label, type, placeholder, icon, value, onChange }: { label: string; type: string; placeholder: string; icon: ReactNode; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>
        <input
          type={type}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm leading-5 placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder={placeholder}
          autoComplete="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        />
      </div>
    </div>
  );
}

function DisplayInput({ label, type, placeholder, icon }: { label: string; type: string; placeholder: string; icon: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>
        <input className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm leading-5 placeholder-gray-500 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500" type={type} placeholder={placeholder} />
      </div>
    </div>
  );
}

function Message({ children, tone }: { children: ReactNode; tone: "warning" | "error" | "success" }) {
  const classes = {
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return <div className={`mt-4 rounded-lg border p-3 text-sm font-medium ${classes[tone]}`}>{children}</div>;
}

function authErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha na autenticacao.";
  if (message.toLowerCase().includes("invalid login")) return "Email ou senha invalidos.";
  if (message.toLowerCase().includes("already registered")) return "Este email ja esta cadastrado.";
  if (message.toLowerCase().includes("password")) return "Verifique a senha informada.";
  return message;
}
