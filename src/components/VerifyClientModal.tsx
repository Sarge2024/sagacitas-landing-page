import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, Mail } from "lucide-react";

interface VerifyClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (email: string) => void;
}

export const VerifyClientModal = ({ isOpen, onClose, onVerify }: VerifyClientModalProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onVerify(email);
      setEmail("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface-container-lowest shadow-2xl rounded-lg z-[101] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-surface-container-high bg-surface">
              <h3 className="text-xl font-headline font-bold text-primary flex items-center gap-2">
                <Search className="w-5 h-5" />
                Identificação
              </h3>
              <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant mb-4">
                Por favor, insira o e-mail corporativo cadastrado para darmos continuidade no agendamento.
              </p>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                  <Mail className="w-3 h-3" /> E-mail Corporativo
                </label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                  placeholder="voce@empresa.com"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-on-primary rounded-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  Continuar
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
