"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { fetchSession, setupMfa, verifyMfa } from "../lib/api";

const DIGIT_COUNT = 6;

const buildEmptyDigits = () => Array.from({ length: DIGIT_COUNT }, () => "");

export default function MfaSetupPage() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"setup" | "verify" | null>(null);
  const [digits, setDigits] = useState<string[]>(buildEmptyDigits);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let active = true;

    fetchSession()
      .then((session) => {
        if (!active) {
          return null;
        }
        if (session.mfaEnabled) {
          if (session.mfaVerified !== false) {
            router.push("/dashboard");
            return null;
          }
          setMode("verify");
          return null;
        }
        setMode("setup");
        return setupMfa();
      })
      .then((data) => {
        if (!active || !data) {
          return;
        }
        setSecret(data.secretBase32);
        setOtpauthUrl(data.otpauthUrl);
      })
      .catch((err) => {
        if (err instanceof Error && err.message === "MFA already enabled.") {
          router.push("/dashboard");
          return;
        }
        if (err instanceof Error && err.message === "UNAUTHORIZED") {
          router.push("/");
          return;
        }
        setError("Falha ao iniciar MFA.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    if (!otpauthUrl) {
      setQrDataUrl(null);
      return () => undefined;
    }

    QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl(null);
        }
      });

    return () => {
      active = false;
    };
  }, [otpauthUrl]);

  const token = useMemo(() => digits.join(""), [digits]);

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    const next = [...digits];
    next[index] = sanitized ? sanitized[sanitized.length - 1] : "";
    setDigits(next);

    if (sanitized && index < DIGIT_COUNT - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const text = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (!text) {
      return;
    }

    const next = buildEmptyDigits();
    text.split("").forEach((digit, idx) => {
      next[idx] = digit;
    });
    setDigits(next);

    if (text.length === DIGIT_COUNT) {
      inputsRef.current[DIGIT_COUNT - 1]?.focus();
    }
  };

  const handleCopy = async () => {
    if (!secret) {
      return;
    }
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (token.length !== DIGIT_COUNT) {
      setError("Digite os 6 digitos.");
      return;
    }

    setSubmitting(true);

    try {
      await verifyMfa(token);
      router.push("/dashboard");
    } catch {
      setError("Codigo invalido. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="mfa-card">
        <div>
          <span className="tagline">VERIFICACAO 2FA</span>
          <h1 className="mfa-title">{mode === "verify" ? "Verificacao 2FA" : "Ativar MFA"}</h1>
          <p className="mfa-subtitle">
            {mode === "verify"
              ? "Digite os 6 digitos do seu autenticador para continuar."
              : "Escaneie o QR Code no autenticador, copie o codigo manual se precisar e confirme os 6 digitos abaixo."}
          </p>
        </div>

        {loading ? (
          <p className="mfa-subtitle">Carregando configuracao...</p>
        ) : mode === "setup" ? (
          <>
            <div className="mfa-qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code MFA" />
              ) : (
                <span className="mfa-subtitle">QR indisponivel</span>
              )}
            </div>

            <div className="mfa-secret">
              <span className="mfa-subtitle">Codigo manual</span>
              <code>{secret ?? "---"}</code>
              <button type="button" className="mfa-copy" onClick={handleCopy} disabled={!secret}>
                {copied ? "Copiado" : "Copiar codigo"}
              </button>
            </div>
          </>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="mfa-boxes" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={`digit-${index}`}
                className="mfa-digit"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
              />
            ))}
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="mfa-actions">
            <button type="submit" disabled={submitting || loading}>
              {submitting ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
