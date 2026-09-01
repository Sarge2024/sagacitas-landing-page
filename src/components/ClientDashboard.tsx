import { useState } from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  FileSpreadsheet, 
  CheckCircle,
  Clock,
  GraduationCap,
  Home
} from "lucide-react";
import PlayerApp from "../player/App";

interface ClientDashboardProps {
  user: User;
  onReturn: () => void;
}

export const ClientDashboard = ({ user, onReturn }: ClientDashboardProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const userName = user.displayName || user.email?.split("@")[0] || "Cliente";
  const userPhoto = user.photoURL;

  const stats = [
    { label: "OEE Médio", value: "84.5%", icon: <TrendingUp className="w-5 h-5 text-tertiary-fixed" />, status: "Estável" },
    { label: "Ativos Monitorados", value: "14 Equipamentos", icon: <Package className="w-5 h-5 text-tertiary-fixed" />, status: "Operacional" },
    { label: "Simulações Ativas", value: "5 Cenários", icon: <Calculator className="w-5 h-5 text-tertiary-fixed" />, status: "Atualizado" }
  ];

  const apps = [
    {
      title: "Dashboard de Produção",
      desc: "Monitore o OEE, paradas de linha e a performance de turnos em tempo real.",
      icon: <LayoutDashboard className="w-8 h-8 text-primary" />,
      actionText: "Abrir Dashboard",
      link: null,
      status: "Em Produção"
    },
    {
      title: "Gestor de Obras",
      desc: "Orçamento, Planejamento e Gestão Financeira e Executiva.",
      icon: <Calculator className="w-8 h-8 text-primary" />,
      actionText: "Acessar Aplicação",
      link: "/work_manager/index.html",
      status: "Disponível"
    },
    {
      title: "Controle Dinâmico de Ativos",
      desc: "Gestão inteligente de estoque de manutenção com inteligência preditiva.",
      icon: <Package className="w-8 h-8 text-primary" />,
      actionText: "Acessar Sistema",
      link: "https://manutencao-proativa-d77eee7d.base44.app",
      status: "Disponível"
    }
  ];

  const reports = [
    { title: "Planilha de Custeio Industrial - Julho 2026", date: "05/08/2026", size: "4.2 MB", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { title: "Relatório de Otimização de Processos - Extrusora A", date: "01/08/2026", size: "1.8 MB", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
    { title: "Análise de Gargalos Produtivos - Linha 2", date: "28/07/2026", size: "2.5 MB", icon: <Clock className="w-5 h-5 text-amber-500" /> }
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-primary text-on-primary border-r border-primary-container shrink-0">
        <div className="p-6 border-b border-primary-container">
          <span className="text-xl font-black font-headline tracking-tight text-white">Sagacitas Portal</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all ${activeTab === "dashboard" ? "bg-primary-container text-white" : "text-slate-300 hover:bg-primary-container/50 hover:text-white"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Painel Geral
          </button>
          <button 
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all ${activeTab === "reports" ? "bg-primary-container text-white" : "text-slate-300 hover:bg-primary-container/50 hover:text-white"}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Relatórios e Custos
          </button>
          <button 
            onClick={() => setActiveTab("trainings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all ${activeTab === "trainings" ? "bg-primary-container text-white" : "text-slate-300 hover:bg-primary-container/50 hover:text-white"}`}
          >
            <GraduationCap className="w-4 h-4" />
            Player de Treinamentos
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all ${activeTab === "settings" ? "bg-primary-container text-white" : "text-slate-300 hover:bg-primary-container/50 hover:text-white"}`}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>

          <div className="pt-4 mt-4 border-t border-primary-container">
            <button 
              onClick={onReturn}
              className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all text-slate-300 hover:bg-primary-container/50 hover:text-white"
            >
              <Home className="w-4 h-4" />
              Voltar ao Site
            </button>
          </div>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-primary-container flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 overflow-hidden">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="w-9 h-9 rounded-full border border-primary-container" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate leading-tight">{userName}</p>
              <p className="text-xs text-slate-400 truncate leading-none mt-1">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-tertiary-fixed transition-colors p-1.5 rounded hover:bg-primary-container/40"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <header className="md:hidden w-full bg-primary text-on-primary p-4 flex items-center justify-between border-b border-primary-container z-50">
        <span className="text-lg font-black font-headline tracking-tight text-white">Sagacitas Portal</span>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="text-slate-300 hover:text-tertiary-fixed transition-colors p-1"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-1"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed top-[61px] inset-x-0 bg-primary text-on-primary p-6 border-b border-primary-container z-40 space-y-4"
          >
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-primary-container">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="w-12 h-12 rounded-full border border-primary-container" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-lg">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-white leading-tight">{userName}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold ${activeTab === "dashboard" ? "bg-primary-container text-white" : "text-slate-300"}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Painel Geral
              </button>
              <button 
                onClick={() => { setActiveTab("reports"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold ${activeTab === "reports" ? "bg-primary-container text-white" : "text-slate-300"}`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Relatórios e Custos
              </button>
              <button 
                onClick={() => { setActiveTab("trainings"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold ${activeTab === "trainings" ? "bg-primary-container text-white" : "text-slate-300"}`}
              >
                <GraduationCap className="w-4 h-4" />
                Player de Treinamentos
              </button>
              <button 
                onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold ${activeTab === "settings" ? "bg-primary-container text-white" : "text-slate-300"}`}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </button>

              <div className="pt-4 mt-4 border-t border-primary-container">
                <button 
                  onClick={() => { onReturn(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold text-slate-300 hover:text-white"
                >
                  <Home className="w-4 h-4" />
                  Voltar ao Site
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Area */}
      {activeTab === "trainings" ? (
        <div className="flex-grow overflow-hidden relative w-full h-screen">
          <PlayerApp />
        </div>
      ) : (
        <main className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Welcome Section */}
          <div className="bg-primary text-on-primary rounded-lg p-6 md:p-8 relative overflow-hidden shadow-md">
            <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-tertiary-fixed/10 to-transparent opacity-40 pointer-events-none" />
            <h1 className="text-3xl md:text-4xl font-headline font-black mb-3">Bem-vindo, {userName}!</h1>
            <p className="text-slate-300 max-w-xl text-sm md:text-base leading-relaxed">
              Esta é a sua Área do Cliente. Acesse suas aplicações dedicadas, consulte relatórios analíticos de custeio industrial e gerencie ativos em tempo real.
            </p>
          </div>

          {activeTab === "dashboard" && (
            <>
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-lg shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-outline">{stat.label}</p>
                      <p className="text-2xl font-headline font-black text-primary">{stat.value}</p>
                      <p className="text-xs text-green-600 font-semibold">{stat.status}</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-full">
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Applications List */}
              <div className="space-y-4">
                <h2 className="text-xl font-headline font-black text-primary border-b border-outline-variant pb-2">Seus Aplicativos de Gestão</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {apps.map((app, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ y: -4 }}
                      className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 shadow-sm flex flex-col justify-between h-[250px]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-primary/5 rounded">
                            {app.icon}
                          </div>
                          <span className="text-xs px-2.5 py-1 bg-tertiary-fixed/20 text-on-tertiary-fixed font-bold rounded-full">
                            {app.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-headline font-bold text-primary mb-2">{app.title}</h3>
                        <p className="text-on-surface-variant text-sm line-clamp-2">{app.desc}</p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-surface-container">
                        {app.link ? (
                          <a 
                            href={app.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block text-center w-full py-2 bg-primary text-on-primary font-bold text-sm rounded hover:opacity-90 active:scale-98 transition-all"
                          >
                            {app.actionText}
                          </a>
                        ) : (
                          <button 
                            className="w-full py-2 border border-primary text-primary font-bold text-sm rounded hover:bg-primary hover:text-on-primary transition-all active:scale-98"
                            onClick={() => setActiveTab("trainings")}
                          >
                            {app.actionText}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recent Reports / Files */}
              <div className="space-y-4">
                <h2 className="text-xl font-headline font-black text-primary border-b border-outline-variant pb-2">Documentos e Planilhas Recentes</h2>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
                  <div className="divide-y divide-surface-container">
                    {reports.map((report, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-3">
                          {report.icon}
                          <div>
                            <p className="text-sm font-bold text-primary">{report.title}</p>
                            <p className="text-xs text-outline">Modificado em: {report.date} | Tamanho: {report.size}</p>
                          </div>
                        </div>
                        <button 
                          className="text-xs font-bold text-primary hover:underline"
                          onClick={() => alert(`Iniciando download de: ${report.title}`)}
                        >
                          Visualizar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-black text-primary border-b border-outline-variant pb-2">Relatórios e Custos</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center space-y-4">
                <FileSpreadsheet className="w-16 h-16 text-outline/50 mx-auto" />
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-headline font-bold text-primary">Análise Financeira & Custos</h3>
                  <p className="text-on-surface-variant text-sm">
                    Esta seção conterá os relatórios mensais e o simulador financeiro completo de custos industriais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-black text-primary border-b border-outline-variant pb-2">Configurações da Conta</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 space-y-6">
                <div className="flex items-center gap-4">
                  {userPhoto ? (
                    <img src={userPhoto} alt={userName} className="w-16 h-16 rounded-full border border-outline-variant" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-2xl border border-outline-variant">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-headline font-bold text-primary">{userName}</h3>
                    <p className="text-sm text-outline">{user.email}</p>
                  </div>
                </div>
                <div className="border-t border-surface-container pt-6 space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-outline">ID do Usuário (Firebase UID)</label>
                    <input readOnly value={user.uid} className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-outline focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-outline">Provedor de Login</label>
                    <input readOnly value={user.providerData[0]?.providerId || "E-mail/Senha"} className="w-full bg-surface-container-high border border-outline-variant rounded p-3 text-sm text-outline focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Support Info */}
          <footer className="pt-6 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-outline">
            <p>© 2026 Sagacitas Consulting. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span>Precisa de ajuda? Entre em contato com contato@sagacitas.com.br</span>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
};
