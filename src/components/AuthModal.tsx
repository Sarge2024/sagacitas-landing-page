import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { auth } from "../services/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/unauthorized-domain") {
        setError(
          "Este domínio não está autorizado para login social no console do Firebase. Adicione o domínio nas configurações de autenticação."
        );
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError("Erro ao autenticar com o Google. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/invalid-email":
          setError("Formato de e-mail inválido.");
          break;
        case "auth/user-disabled":
          setError("Este usuário foi desativado.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("E-mail ou senha incorretos.");
          break;
        case "auth/email-already-in-use":
          setError("Este e-mail já está em uso.");
          break;
        default:
          setError("Ocorreu um erro. Verifique seus dados e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-surface-container-lowest shadow-2xl rounded-lg z-[101] overflow-hidden border border-outline-variant"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-surface-container-high bg-surface">
              <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                <LogIn className="w-6 h-6" />
                Área do Cliente
              </h3>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-colors p-1"
                aria-label="Fechar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tabs */}
              <div className="flex border-b border-surface-container-high">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className={`flex-1 pb-3 text-sm font-headline font-bold tracking-tight border-b-2 transition-all ${
                    !isSignUp
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className={`flex-1 pb-3 text-sm font-headline font-bold tracking-tight border-b-2 transition-all ${
                    isSignUp
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-primary"
                  }`}
                >
                  Criar Conta
                </button>
              </div>

              {/* Error Box */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* OAuth Button */}
              <div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-3 w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-outline-variant rounded font-semibold text-sm transition-all shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isSignUp ? "Cadastrar com Google" : "Entrar com Google"}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-surface-container-high"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-surface-container-high"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="voce@empresa.com"
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Senha
                  </label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm disabled:opacity-50"
                  />
                </div>

                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Confirmar Senha
                    </label>
                    <input
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-3 font-bold rounded-sm shadow-md hover:opacity-90 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    <>{isSignUp ? "Cadastrar" : "Entrar"}</>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
