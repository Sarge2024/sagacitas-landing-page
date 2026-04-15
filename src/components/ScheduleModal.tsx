import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { ClientData } from "./ClientModal";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
}

export const ScheduleModal = ({ isOpen, onClose, client }: ScheduleModalProps) => {
  const [scheduled, setScheduled] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    date: "",
    time: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call and show success state
    setScheduled(true);
    setTimeout(() => {
      setScheduled(false);
      setFormData({ reason: "", date: "", time: "" });
      onClose();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && client && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!scheduled ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg bg-surface-container-lowest shadow-2xl rounded-lg z-[101] overflow-hidden"
          >
            {scheduled ? (
              <div className="p-12 flex flex-col items-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-tertiary-fixed" />
                </motion.div>
                <h3 className="text-2xl font-headline font-bold text-primary">Agendamento Solicitado!</h3>
                <p className="text-on-surface-variant">
                  A Sagacitas entrará em contato com a <strong>{client.companyName}</strong> para confirmar a visita técnica no dia {formData.date.split("-").reverse().join("/")} às {formData.time}.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-6 border-b border-surface-container-high bg-surface">
                  <div>
                    <h3 className="text-2xl font-headline font-bold text-primary flex items-center gap-2">
                      <CalendarDays className="w-6 h-6" />
                      Visita Técnica
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">Solicitação para: {client.companyName}</p>
                  </div>
                  <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors p-1">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-outline">Motivo da Visita</label>
                    <select
                      required
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm appearance-none"
                    >
                      <option value="" disabled>Selecione um motivo...</option>
                      <option value="Consultoria">Consultoria Técnica Geral</option>
                      <option value="Processos">Otimização de Processos</option>
                      <option value="Custos">Avaliação de Custos Industriais</option>
                      <option value="Auditoria">Auditoria Operacional e BI</option>
                      <option value="Outro">Outro Motivo</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Data Desejada
                      </label>
                      <input
                        required
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm pattern-date"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-outline flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Horário
                      </label>
                      <input
                        required
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="w-full bg-surface-container-high border border-outline-variant rounded p-3 focus:outline-none focus:border-primary transition-all text-sm"
                      />
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
                      Solicitar Agendamento
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
