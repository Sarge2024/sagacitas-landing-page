import {
  Factory,
  Banknote,
  BarChart3,
  Smartphone,
  LayoutDashboard,
  Calculator,
  Package,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  Menu,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Chatbot } from "./components/Chatbot";
import { ClientModal, ClientData } from "./components/ClientModal";
import { ClientTable } from "./components/ClientTable";
import { VerifyClientModal } from "./components/VerifyClientModal";
import { ScheduleModal } from "./components/ScheduleModal";

const Navbar = ({ onOpenModal }: { onOpenModal: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-primary font-headline tracking-tight">
          Sagacitas
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          <a className="text-on-surface-variant hover:text-primary font-headline font-bold tracking-tight transition-all duration-300" href="#quem-somos">Quem Somos</a>
          <a className="text-on-surface-variant hover:text-primary font-headline font-bold tracking-tight transition-all duration-300" href="#servicos">Serviços</a>
          <a className="text-on-surface-variant hover:text-primary font-headline font-bold tracking-tight transition-all duration-300" href="#clientes">Clientes</a>
          <a className="text-on-surface-variant hover:text-primary font-headline font-bold tracking-tight transition-all duration-300" href="#contato">Contato</a>
          <button onClick={onOpenModal} className="bg-primary text-on-primary px-6 py-2 rounded-sm font-bold text-sm hover:opacity-80 transition-all duration-300 active:scale-95">
            Área do Cliente
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-surface border-t border-surface-container p-4 flex flex-col gap-4">
          <a className="text-on-surface-variant font-bold px-4 py-2" href="#quem-somos" onClick={() => setIsOpen(false)}>Quem Somos</a>
          <a className="text-on-surface-variant font-bold px-4 py-2" href="#servicos" onClick={() => setIsOpen(false)}>Serviços</a>
          <a className="text-on-surface-variant font-bold px-4 py-2" href="#clientes" onClick={() => setIsOpen(false)}>Clientes</a>
          <a className="text-on-surface-variant font-bold px-4 py-2" href="#contato" onClick={() => setIsOpen(false)}>Contato</a>
          <button onClick={() => { setIsOpen(false); onOpenModal(); }} className="bg-primary text-on-primary px-6 py-3 rounded-sm font-bold text-sm">
            Área do Cliente
          </button>
        </div>
      )}
    </nav>
  );
};

const Hero = ({ onDiagnosticoClick }: { onDiagnosticoClick: () => void }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-surface-container-highest">
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-30 grayscale mix-blend-multiply"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrV6nlAseUV6QiDggArkUM6udIrPRUsNwsMA9l0_MgkSE9FdnUoyTeGAasg-tf7qEJayx2w3vJUfb3X7Mt5VTB-c612qizFrM4GgKSpWLs8mV60pRUFeUq2dRFHNcI00AqC3f3HEbP2cZhLKwxpOLzAI-EncFa8rQ7T25IBGRWdXwGprUVKLdh6OaZs8A8nU6MPOYB6eTuw29M9ot2-BHeLl4l7VguXWn7xTjztggCwY3ggUGWi3VkBBEeMwpKlqbEtfZuoxj6JhMX"
          alt="Industrial Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h1 className="font-headline font-extrabold text-5xl md:text-7xl text-primary editorial-text leading-[1.1]">
            Otimize Processos. <br />
            <span className="text-on-primary-container">Maximize Lucros.</span> <br />
            Conecte sua Indústria ao Futuro.
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-lg leading-relaxed">
            Consultoria especializada em processos, custos e inteligência de negócios aliada ao desenvolvimento de aplicações gerenciais sob medida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onDiagnosticoClick} className="bg-primary text-on-primary px-8 py-4 rounded-sm font-bold text-lg hover:opacity-90 transition-all shadow-lg active:scale-95">
              Agende um Diagnóstico Gratuito
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block relative"
        >
          <div className="bg-primary p-1 absolute -top-8 -right-8 w-24 h-24 opacity-20"></div>
          <img
            className="rounded-sm shadow-2xl relative z-10 w-full h-[500px] object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKB2yuTF_A4IIP8lK_gfqohdA_3l8eAbieOjhq_4PeDWZ2mzdEhsthGE64x1kVeSbKf-s426xj4Vlc2NeJU6XxP18JLv9qYxLSvubyeB8zHHIa24f6tlbNilH3BKuo46f2TQqZiBdDry1UhDdDOtncD4S6N1o01iutnxheU5d8haV01T-98KrsjCira426tCq3zv7cEFyEQ7AdBou9QNMoRt8nNj-hlE5ObJE_x-dhY9eVeewr2-TXm2R4b-mhXPGKdro7yTBCEpcZ"
            alt="Consultant"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -bottom-6 -left-6 bg-tertiary-fixed text-on-tertiary-fixed p-6 rounded-sm shadow-xl z-20">
            <span className="font-headline font-bold text-4xl">15+</span>
            <p className="text-xs uppercase tracking-widest font-semibold">Anos de Expertise</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Services = () => {
  const services = [
    {
      icon: <Factory className="w-10 h-10" />,
      title: "Análise de Processos Industriais",
      desc: "Identificação de gargalos e redesenho de fluxos produtivos para máxima eficiência operacional.",
      tall: false
    },
    {
      icon: <Banknote className="w-10 h-10" />,
      title: "Custeio Industrial",
      desc: "Estruturação de modelos de custos precisos para garantir a rentabilidade real de cada produto.",
      tall: true
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Análise de Negócios (BI)",
      desc: "Transformação de dados brutos em dashboards estratégicos para tomada de decisão em tempo real.",
      tall: false
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "Aplicações Personalizadas",
      desc: "Sistemas sob medida que integram suas regras de negócio ao ecossistema digital da sua empresa.",
      tall: true
    }
  ];

  return (
    <section className="py-24 bg-surface" id="servicos">
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-16">
          <span className="text-primary-container font-bold tracking-[0.2em] uppercase text-sm">Expertise</span>
          <h2 className="text-4xl font-headline font-extrabold text-primary mt-2">Nossas Soluções</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className={`p-8 flex flex-col justify-between group hover:bg-primary transition-all duration-500 rounded-sm shadow-sm ${s.tall ? 'bg-surface-container h-[440px]' : 'bg-surface-container-lowest h-[400px]'}`}
            >
              <div className="space-y-6">
                <div className="text-primary group-hover:text-tertiary-fixed transition-colors">
                  {s.icon}
                </div>
                <h3 className="text-2xl font-headline font-bold text-primary group-hover:text-white">{s.title}</h3>
                <p className="text-on-surface-variant group-hover:text-slate-300">{s.desc}</p>
              </div>
              <div className="w-12 h-1 bg-tertiary-fixed"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section className="py-24 bg-surface-container-low overflow-hidden" id="quem-somos">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-12 gap-16 items-center">
        <div className="md:col-span-5 space-y-6">
          <span className="text-primary-container font-bold tracking-[0.2em] uppercase text-sm">Sobre Nós</span>
          <h2 className="text-4xl font-headline font-extrabold text-primary leading-tight">Arquitetos de Eficiência Digital</h2>
          <p className="text-on-surface-variant leading-relaxed">
            A Sagacitas Consulting nasceu da união entre o rigor da engenharia industrial e a agilidade do desenvolvimento de software. Acreditamos que a tecnologia deve servir ao processo, e não o contrário.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            Nossa equipe é composta por consultores seniores com décadas de experiência no chão de fábrica e desenvolvedores especialistas em arquitetura de dados industrial.
          </p>
        </div>
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          <div className="space-y-4 pt-12">
            <div className="bg-surface-container-lowest p-4 rounded-sm shadow-sm">
              <img
                className="w-full h-64 object-cover mb-4 grayscale hover:grayscale-0 transition-all duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLu-KtI7PdpRW1dwXZ2Q7LqgJ9yVk6BIY_W-DlqvF8tmg_Mbhe49zXVXVcZVR9HtZ--IiIZcDxU3hK37r-1I2dcAeYpf0fmzaP81y5hEoKq9axySMF-fZn4evvBM6eUunKHCur3n8x8x4KWbXhL1W7AfuJ0Fy2zAI09LGfGJPJjYtWJtr0KQ9QK-vAMintOSpaZjTqUGVb92g7P-QEr1RSvDPciKNLePchYtdKP6LeTjcEosG0BXfXdrTGCvrSvkJdzTJe_lkRJ-fZ"
                alt="Ricardo Lima"
                referrerPolicy="no-referrer"
              />
              <h4 className="font-headline font-bold text-primary">Eng. Ricardo Lima</h4>
              <p className="text-xs text-on-surface-variant uppercase tracking-tighter">Sócio Diretor - Processos</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-4 rounded-sm shadow-sm">
              <img
                className="w-full h-64 object-cover mb-4 grayscale hover:grayscale-0 transition-all duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0qeFJ7FD8UePQr4qo2r7nN5G--NaQv_Z-wrM5haW2bXX9kfvvEVIRFEt--eF8vU-ChUkJBV4kkQ7nIUsuLh7V6QgMs4SYdm6CWNNyxCwwfghEsMOn-e7Q1eLNvGS9AHvDBv-s_AFw5JlHdqGGCn9y4ovJuA4PDguOtfKP_C823pMRfQGtba0YrLXu65r92Bzt5aB36LY0CrE7TiEt0TxpVoOkRorY5D44bHGVqfmJRLNTu0wzMDiR9gzKUpEC8-5fBDpJ4qvzsSWF"
                alt="Helena Souza"
                referrerPolicy="no-referrer"
              />
              <h4 className="font-headline font-bold text-primary">Dra. Helena Souza</h4>
              <p className="text-xs text-on-surface-variant uppercase tracking-tighter">Head de Tecnologia & BI</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ClientPortal = () => {
  const apps = [
    {
      icon: <LayoutDashboard className="w-10 h-10" />,
      title: "Dashboard de Produção",
      desc: "Visualize o OEE, paradas de linha e performance por turno em tempo real."
    },
    {
      icon: <Calculator className="w-10 h-10" />,
      title: "Simulador de Investimentos",
      desc: "Realize simulações What-If de precificação e custos de matéria-prima.",
      link: "https://invest-pro-bc4cf4a1.base44.app"
    },
    {
      icon: <Package className="w-10 h-10" />,
      title: "Controle de Inventário",
      desc: "Gestão inteligente de estoque com previsibilidade baseada em demanda."
    }
  ];

  return (
    <section className="py-24 bg-primary text-on-primary">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-4xl font-headline font-extrabold mb-4">Seus Aplicativos de Gestão</h2>
          <p className="text-on-primary-container text-lg">Acesse suas ferramentas exclusivas e dashboards em tempo real através do nosso ecossistema integrado.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {apps.map((app, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-xl p-8 border border-white/10 rounded-lg hover:border-tertiary-fixed transition-colors"
            >
              <div className="text-tertiary-fixed mb-6">{app.icon}</div>
              <h3 className="text-xl font-headline font-bold mb-4">{app.title}</h3>
              <p className="text-slate-400 mb-8 text-sm">{app.desc}</p>
              {app.link ? (
                <a href={app.link} target="_blank" rel="noopener noreferrer" className="block text-center w-full py-3 border border-tertiary-fixed text-tertiary-fixed font-bold hover:bg-tertiary-fixed hover:text-primary transition-all">
                  Acessar Aplicação
                </a>
              ) : (
                <button className="w-full py-3 border border-tertiary-fixed text-tertiary-fixed font-bold hover:bg-tertiary-fixed hover:text-primary transition-all">
                  Acessar Aplicação
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Partners = () => {
  const logos = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBwl13HHMiK8VltCl-96-Hr3hwpiNZPz5h7o87qDsXkwmAiCb2mXJfNnnSAaqUtQlrIgwQQ6n1e6AyE7YFuHNtWkblZhhOxtmCgrFwJ-YwvSRKpr435O7rQMDokYIPDbBctCwfQzQ6BtO5w5NWSRnIl95uEDi0bVTJNlFY7WZAFMYzXHVTRVj2SBoavX4wmuMd6wUYLaSndAHx3yoDH1aqDLoYbgs0fxkvDDuJnI8YuBHnM1qBMN6PGCPKdpN9vyA_NBjj9Aq2A--6L",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBYTP-GBtvAlfuDfGJKxKwssxK-Oi_hAkft0rxMlSepmEKGF4Txb2AUclF9g6-5B1_TiDMmEmjCBnOnwtgq3U8LVCScc5bToAb6_Sqzt-XLGKkTNu4BecnbEynu3pxRB7e0XfpHTOHH7U2bpKiHIx_WOGJXrN6Tv3DQ0f1VqRshzlDhldxramHjBFIF6bb--I8LZ3e40JS6FiNIU7UCMjNSVgWwDipvbdZv0Zt8dz8P1R9wGex1JjHrvt3fxsakh42xh4gOMwMEsH88",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuChx6jn0l_XL-C34pC-aw6_QkK_FZQfdCP-VpMFcbiC4nG6wlyaPj1JRGjJtFEvzGhPWHtgQTBKWddjn1vuJO6b5M1HTK1sxtEncRTu4FRtpsBluGhd0Dvp8jNijzMzFikG88zgatcj0q611QxYROJtD0UCys4w_QQcLKLt1gZI2BTM73YIGxSPBmIwrZ5_Ks9d2POuf_LqAajHQqZWL9-8VIvqqDmrRca062RlrJjjhFM7w0Y1WL_AjQ0yoQjSeseikpWxaM3KTBJU",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDxnTkgG4A7WD11ZQ3Dmmy5paef9L-UlGeUo9XVb35rbdwZ7swrFHlfkT7ZmpcdbRVS3ntghFTeAx5_9l_Om8z34tV0sq_vp_hXn-b1h1lHfKSZTmcjscB1WnV6ejrby8m2i3erNb5tpqU3zFHFVivSW2zhETiJ-SSa7f44-vFLB3EA2IDtoPM8u-Qzk89g23_RsFWz32tvqXdyIdbDo51Hw32WoLNO6d-5JPVVdbNfxeH3uCzcphFG70m-nnJ7jFZ-QzrjfqpbE_QD",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDyoaLvVOr4ENGA9g252yHiHIDtVOnbcX8PZn5lN-tudH6RqUKbS7MscvdBLPyCNdx3q23VSljCuZEV_gE5h7PpEWRdUt9n4oKnNCJZpgElhXtNldPOpqLonily5JY9P8r-dzIkTUCp4eye_rLwhoFILqDFGzCbg1FCwJ3cUtEv8-X6JmTBJ0Y2I6nmz9uX6EDYXwKTU7aIT3Mp0jRyF8iCi-Mhw7Sjk-sL9lpHbMc2KcRxhj-bMv4tyEvfzrWnWsp900m6fCevG_fZ"
  ];

  return (
    <section className="py-12 bg-surface-container" id="clientes">
      <div className="max-w-7xl mx-auto px-8 overflow-hidden">
        <p className="text-center text-xs uppercase tracking-[0.3em] font-bold text-outline mb-8">Indústrias que confiam em nossa arquitetura</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          {logos.map((logo, i) => (
            <img key={i} className="h-8 md:h-10 w-auto" src={logo} alt="Partner Logo" referrerPolicy="no-referrer" />
          ))}
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section className="py-24 bg-surface" id="contato">
      <div className="max-w-5xl mx-auto px-8 bg-surface-container-highest p-12 rounded-sm shadow-2xl relative">
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-32 bg-primary"></div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-headline font-extrabold text-primary mb-4">Pronto para o próximo nível?</h2>
            <p className="text-on-surface-variant mb-8">Nossos consultores estão prontos para analisar seu cenário e propor soluções que geram ROI real em menos de 6 meses.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Mail className="text-primary w-5 h-5" />
                <span className="text-on-surface font-semibold">contato@sagacitas.com.br</span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-primary w-5 h-5" />
                <span className="text-on-surface font-semibold">+55 11 4002-8922</span>
              </div>
            </div>
          </div>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-outline">Seu Nome</label>
              <input className="w-full bg-surface-container-high border-none border-b-2 border-primary/20 focus:border-primary focus:ring-0 transition-all p-3" type="text" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-outline">E-mail Corporativo</label>
              <input className="w-full bg-surface-container-high border-none border-b-2 border-primary/20 focus:border-primary focus:ring-0 transition-all p-3" type="email" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-outline">Mensagem</label>
              <textarea className="w-full bg-surface-container-high border-none border-b-2 border-primary/20 focus:border-primary focus:ring-0 transition-all p-3" rows={3}></textarea>
            </div>
            <button className="w-full bg-primary text-on-primary py-4 font-bold rounded-sm hover:opacity-90 active:scale-95 transition-all">
              Enviar Solicitação
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-surface-container w-full py-12 px-8 border-t border-surface-container-high">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
        <div className="space-y-4">
          <div className="text-lg font-bold text-primary font-headline">Sagacitas Consulting</div>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">Inteligência de processos e desenvolvimento de software industrial de alta performance.</p>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Navegação</span>
          <a className="text-on-surface-variant hover:text-primary text-sm transition-colors" href="#">Privacidade</a>
          <a className="text-on-surface-variant hover:text-primary text-sm transition-colors" href="#">Termos de Uso</a>
          <a className="text-on-surface-variant hover:text-primary text-sm transition-colors" href="#">Trabalhe Conosco</a>
        </div>
        <div className="md:text-right space-y-4">
          <p className="text-on-surface-variant text-sm">© 2024 Sagacitas Consulting. Todos os direitos reservados.</p>
          <div className="flex md:justify-end gap-4 text-primary">
            <Linkedin className="w-5 h-5 cursor-pointer hover:opacity-70" />
            <Github className="w-5 h-5 cursor-pointer hover:opacity-70" />
            <Globe className="w-5 h-5 cursor-pointer hover:opacity-70" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);

  // Scheduling States
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState(false);

  const handleVerify = (email: string) => {
    const found = clients.find(c => c.email.toLowerCase() === email.toLowerCase());
    setIsVerifyOpen(false);
    if (found) {
      setSelectedClient(found);
      setIsScheduleOpen(true);
    } else {
      setPendingSchedule(true);
      setIsModalOpen(true);
    }
  };

  const handleSaveClient = (data: ClientData) => {
    setClients([...clients, data]);
    if (pendingSchedule) {
      setSelectedClient(data);
      setIsScheduleOpen(true);
      setPendingSchedule(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onOpenModal={() => { setPendingSchedule(false); setIsModalOpen(true); }} />
      <Hero onDiagnosticoClick={() => setIsVerifyOpen(true)} />
      <Services />
      <About />
      <ClientPortal />
      <Partners />
      <Contact />
      <ClientTable clients={clients} />
      <Footer />
      <Chatbot />
      <ClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveClient}
      />
      <VerifyClientModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerify={handleVerify}
      />
      <ScheduleModal 
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
