import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Building2, User, Mail, Phone, Briefcase } from "lucide-react";

export type ClientData = {
  id: string;
  name: string;
  companyName: string;
  cnpj: string;
  email: string;
  phone: string;
  sector: string;
  date: string;
};

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ClientData) => void;
}

export const ClientModal = ({ isOpen, onClose, onSave }: ClientModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    cnpj: "",
    email: "",
    phone: "",
    sector: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: ClientData = {
      id: Math.random().toString(36).substring(7),
      date: new Date().toLocaleDateString("pt-BR"),
      ...formData,
    };
    onSave(newClient);
    setFormData({
      name: "",
      companyName: "",
      cnpj: "",
      email: "",
      phone: "",
      sector: "",
    });
    onClose();
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-surface-container-lowest shadow-2xl rounded-lg z-[101] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-surface-container-high bg-surface">
              <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Cadastro Empresarial
              </h3>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <User className="w-3 h-3" /> Representante / Nome
                  </label>
                  <input
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                    type="text"
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Razão Social
                  </label>
                  <input
                    required
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                    type="text"
                    placeholder="Empresa XYZ Ltda"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail Corporativo
                  </label>
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                    type="email"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone
                  </label>
                  <input
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                    type="text"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                    <Briefcase className="w-3 h-3" /> CNPJ
                  </label>
                  <input
                    required
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                    type="text"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-outline">Setor / Indústria</label>
                  <select
                    required
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm appearance-none"
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="Manufatura">Manufatura</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Varejo">Varejo</option>
                    <option value="Logística">Logística</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end border-t border-surface-container-high mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-outline-variant text-on-surface rounded-sm font-bold hover:bg-surface-container-high transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary rounded-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
