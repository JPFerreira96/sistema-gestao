"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.mfaRequired) {
        router.push("/mfa");
        return;
      }
      if (result.mfaEnabled === false) {
        router.push("/mfa");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError("Email ou senha invalidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="login-card">
        <div className="login-brand">
          <span className="tagline">OPERACOES CENTRAIS</span>
          <h1 className="brand-title">Sistema Gestao Tatico</h1>
          <p className="brand-subtitle">
            Controle completo de cadastro, permissao e distribuicao de acesso para
            equipes estrategicas.
          </p>
          <p className="brand-subtitle">
            Acesse o painel com credenciais autorizadas.
          </p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@comando.gov"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>
          {error ? <p className="login-hint">{error}</p> : null}
          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <p className="login-hint">Ambiente protegido com autenticacao JWT.</p>
        </form>
      </section>
    </main>
  );
}
