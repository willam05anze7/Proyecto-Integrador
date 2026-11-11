"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import GlobalCarLogo from "../brand/GlobalCarLogo";
import type { LoginTheme } from "../../services/theme.service";
import { login, register } from "../../services/auth.service";

type LoginFormProps = {
  theme: LoginTheme;
};

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="6.3" r="3.1" />
      <path d="M3.5 17c.4-3 2.7-4.8 6.5-4.8s6.1 1.8 6.5 4.8" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3.5" y="8.5" width="13" height="9" rx="2" />
      <path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 10s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export default function LoginForm({ theme }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegistering) {
        const name = String(formData.get("fullName") ?? "").trim();
        const confirmation = String(formData.get("confirmPassword") ?? "");
        if (password !== confirmation) {
          setErrorMessage("Las contraseñas no coinciden.");
          return;
        }
        await register({ nombre: name, usuario: username, password });
      } else {
        await login({ username, password, rememberMe: remember });
      }
      router.replace("/catalogo");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={`form-panel${isRegistering ? " is-registering" : ""}`} aria-labelledby="login-title">
      <div className="form-heading">
        <div className="mini-mark">
          <GlobalCarLogo theme={theme} className="global-car-logo" />
        </div>
        <div className="eyebrow">{isRegistering ? "ÚNETE A GLOBAL CAR" : "BIENVENIDO DE NUEVO"}</div>
        <h2 id="login-title">{isRegistering ? "Crear cuenta" : "Inicia sesión"}</h2>
        <p>{isRegistering ? "Regístrate para explorar nuestro catálogo." : "Ingresa a tu cuenta para continuar."}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {isRegistering && <>
          <label htmlFor="fullName">NOMBRE COMPLETO</label>
          <div className="input-wrap">
            <UserIcon />
            <input id="fullName" name="fullName" type="text" placeholder="Tu nombre y apellido" autoComplete="name" maxLength={150} required />
          </div>
        </>}
        <label htmlFor="username">USUARIO</label>
        <div className="input-wrap">
          <UserIcon />
          <input
            id="username"
            name="username"
            type="text"
            placeholder="Ingresa tu usuario"
            autoComplete="username"
            minLength={isRegistering ? 3 : undefined}
            maxLength={100}
            required
          />
        </div>

        <div className="label-row">
          <label htmlFor="password">CONTRASEÑA</label>
          {!isRegistering && <a href="#recuperar">¿Olvidaste tu contraseña?</a>}
        </div>
        <div className="input-wrap">
          <LockIcon />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••"
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={isRegistering ? 8 : undefined}
            maxLength={128}
            required
          />
          <button
            type="button"
            className="visibility"
            onClick={() => setShowPassword((isVisible) => !isVisible)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <VisibilityIcon />
          </button>
        </div>

        {isRegistering && <>
          <label htmlFor="confirmPassword">CONFIRMAR CONTRASEÑA</label>
          <div className="input-wrap">
            <LockIcon />
            <input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Repite tu contraseña" autoComplete="new-password" minLength={8} maxLength={128} required />
          </div>
          <p className="gc-register-hint">Mínimo 8 caracteres. Tu cuenta se creará como cliente.</p>
        </>}

        {!isRegistering && <div className="form-options">
          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span className="checkmark">✓</span>
            Recordarme
          </label>
        </div>}

        {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
        <button className="submit-button" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (isRegistering ? "CREANDO CUENTA..." : "VALIDANDO...") : (isRegistering ? "CREAR MI CUENTA" : "ACCEDER A MI CUENTA")} {!isSubmitting && <span>→</span>}
        </button>
      </form>

      <div className="signup">
        {isRegistering ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"} <button type="button" onClick={() => { setIsRegistering((value) => !value); setErrorMessage(null); }}>{isRegistering ? "Iniciar sesión" : "Crear cuenta"} <span>↗</span></button>
      </div>
      <div className="secure-note">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 7V5a4 4 0 1 1 8 0v2m-9 0h10v7H3V7Z" />
        </svg>
        CONEXIÓN SEGURA Y ENCRIPTADA
      </div>
    </section>
  );
}
