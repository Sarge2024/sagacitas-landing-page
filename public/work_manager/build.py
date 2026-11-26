#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera as quatro pranchas (paginas de modulo) do Works Manager."""
import base64, os, json, html

HERE = os.path.dirname(os.path.abspath(__file__))

def _asset(n):
    with open(os.path.join(HERE, "assets", n), encoding="utf-8") as f:
        return f.read()

def _css():
    return _asset("theme.css") + "\n" + _asset("prancha.css")

CSS = _css()



TPL = r"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Saira:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
__THEME_HEAD__
<style>{css}</style>
</head>
<body>
<header class="rail">
  <div class="brand"><a href="/" style="color:inherit;text-decoration:none;">SAGACITAS</a><b>·</b>WORKS<b>·</b>MANAGER</div>
  <div class="rail-meta">Dossiê de capacidades · prancha {num} de 04</div>
  __THEME_TOGGLE__
  <nav class="nav" aria-label="Pranchas">
    {nav}
  </nav>
</header>

<main class="sheet">
<div class="frame">
  <div class="sheet-head">
    <span>Gestão de obras · <b>{mod_label}</b></span>
    <span>Prancha <b>{num}/04</b> · Nov 2026</span>
  </div>

  <section class="hero">
    <video src="{vid}" poster="{img}" autoplay muted playsinline preload="auto" aria-label="{alt}"></video>
    <div class="hero-copy">
      <p class="eyebrow">{eyebrow}</p>
      <h1>{h1}</h1>
      <p class="lede">{lede}</p>
      <div class="chips">{chips}</div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head">
      <span class="sec-id">// 01</span>
      <h2 class="sec-title">O que esta prancha entrega</h2>
      <span class="sec-note">{nacts} atividades · <i>{lvl_note}</i></span>
    </div>
    <div class="acts">
      {acts}
    </div>
  </section>

  <section class="sec">
    <div class="sec-head">
      <span class="sec-id">// 02</span>
      <h2 class="sec-title">Dois planos, um mesmo sistema</h2>
      <span class="sec-note">Cada plano herda tudo do anterior</span>
    </div>
    <div class="levels">
      <div class="lvl">
        <p class="lvl-k"><b>{n1_k}</b> — entrada</p>
        <h4>{n1_sub}</h4>
        <ul>{n1_li}</ul>
      </div>
      <div class="lvl">
        <p class="lvl-k"><b>{n2_k}</b> — upgrade</p>
        <h4>{n2_sub}</h4>
        <ul>{n2_li}</ul>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head">
      <span class="sec-id">// 03</span>
      <h2 class="sec-title">Ficha técnica</h2>
      <span class="sec-note">Fonte: documentação do sistema v1.10</span>
    </div>
    <dl class="spec">{spec}</dl>
  </section>

  <div class="stamp">{stamp}</div>
  <div class="next"><span>{next_lbl}</span><a href="{next_href}">{next} <span class="m">&#8594;</span></a></div>
</div>

<footer class="foot">
  <p>Works Manager · Gestor de Obras Tecnologia · documento de apresentação, novembro de 2026. Escopo por plano conforme a documentação do sistema v1.10.1 (ADR-013 e especificação de módulos comerciais v1.1). Preços conforme proposta comercial set/2026.</p>
  <p>Prancha {num}/04</p>
</footer>
</main>

<script>
(function(){{
  var hero=document.querySelector('.hero');
  if(!hero) return;
  var v=hero.querySelector('video');
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var done=false;
  function finish(){{
    if(done) return; done=true;
    hero.classList.add('done');
  }}
  if(!v || reduced){{
    if(v){{ try{{ v.pause(); }}catch(e){{}} }}
    finish(); return;
  }}
  v.addEventListener('ended', finish);
  v.addEventListener('error', finish);
  v.addEventListener('loadedmetadata', function(){{
    var d=(v.duration && isFinite(v.duration)) ? v.duration : 5;
    setTimeout(finish, d*1000 + 700);
  }});
  setTimeout(function(){{
    if(v.paused && v.currentTime === 0) finish();
  }}, 2200);
  var p=v.play();
  if(p && p.catch) p.catch(function(){{ finish(); }});
}})();
(function(){{
  var els=document.querySelectorAll('.act');
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){{
    els.forEach(function(e){{e.classList.add('in')}});return;
  }}
  var io=new IntersectionObserver(function(entries){{
    entries.forEach(function(en){{
      if(en.isIntersecting){{en.target.classList.add('in');io.unobserve(en.target);}}
    }});
  }},{{rootMargin:'0px 0px -8% 0px',threshold:.15}});
  els.forEach(function(e,i){{e.style.transitionDelay=(i%2)*70+'ms';io.observe(e);}});
}})();
</script>
__THEME_JS__
</body>
</html>
"""

# Tag de cada atividade: em qual plano ela entra (herança cumulativa, ADR-013).
TAGS = {
 "E": ("n1", "Essencial"),
 "P": ("n2", "Professional"),
 "X": ("n2", "Enterprise"),
 "T": ("", "todos os planos"),
 "A": ("", "addon"),
}

MODULES = [
 dict(
  num="01", slug="prancha-01-orcamento",
  mod_label="Orçamentação · CUB, composição, produtividade e reformas",
  eyebrow="Prancha 01 <s>·</s> Orçamentação",
  h1="A margem se decide antes da primeira pá.",
  lede="Orçamento paramétrico por CUB para responder rápido. Composição analítica pelas bases SINAPI, SICRO, DER e IOPES, ou por produtividade no Budget Pro, para responder certo — sempre a partir de uma premissa de obra registrada e versionada.",
  chips=['<span class="chip a">3 métodos de orçamento</span>','<span class="chip">CUB · SINAPI · SICRO · DER · IOPES</span>','<span class="chip t">Premissas versionadas</span>'],
  img="orcamento.jpg",
  alt="Sala de orçamentos ao pôr do sol, com engenheiro sobre plantas e monitor de custos",
  title="Prancha 01 · Orçamento — Works Manager",
  desc="Orçamento de obras por CUB, por composição SINAPI/SICRO/DER/IOPES e por produtividade TCPO, com premissas versionadas e addon de reformas.",
  acts=[
   ("CUB paramétrico com produtividade TCPO","Escolhe o padrão construtivo e a região, ajusta as macroetapas e o total recalcula na hora. Os preços vêm do catálogo local, mantido pela própria construtora.","E"),
   ("Premissas de obra versionadas","Cada orçamento parte de uma premissa registrada. Uma revisão gera nova versão; a anterior nunca é apagada, e o orçamento guarda qual versão usou.","T"),
   ("Composição pelas bases públicas","Orçamento bottom-up por item de EAP, com composições SINAPI, SICRO, DER, IOPES e CMG filtradas por UF, mês e regime, já com insumos e custo.","P"),
   ("Budget Pro: orçamento por produtividade","Custo calculado pela produtividade TCPO/RUP: horas-homem por unidade, mão de obra por CBO com encargos e materiais do catálogo, para obras rodoviárias e prediais.","P"),
   ("Composições próprias da construtora","Editor de composições com o custo-hora real da mão de obra. Cobre o serviço que a tabela pública não tem e entra na mesma EAP das bases oficiais.","P"),
   ("Curva ABC dos insumos","Mostra os poucos insumos que concentram a maior parte do custo do orçamento. É onde a negociação com o fornecedor rende de verdade.","P"),
   ("Ciclo de vida até a aprovação","Rascunho, pré-projeto e aprovado. Na aprovação, o projeto ganha um retrato imutável que serve de base para medir a obra.","P"),
   ("Reformas: do diagnóstico ao Ante-Projeto","Caracterização da edificação, unidades geradas por template e checklist de patologias por unidade. Cada método de reparo aponta composições compatíveis e gera o orçamento por unidade e global.","A"),
  ],
  lvl_note="Essencial → Professional",
  n1_k="Essencial", n2_k="Professional",
  n1_sub="O orçamento que fecha rápido, com o catálogo de preços da própria construtora.",
  n1_li=["Orçamento paramétrico por CUB com padrão TCPO","Catálogo local de preços, mantido pelo cliente","Premissas de obra versionadas","Budget Pro disponível como addon"],
  n2_sub="O mesmo orçamento em composição analítica, com bases públicas e composições próprias.",
  n2_li=["Composição SINAPI, SICRO, DER, IOPES e CMG","Budget Pro incluso no plano","Editor de composições próprias e curva ABC","Addon Reformas para condomínios e edificações existentes"],
  spec=[
   ("Cobre","Orçamentação: CUB paramétrico, composição analítica, Budget Pro e addon Reformas"),
   ("Bases","SINAPI · SICRO · DER · IOPES · CMG, por UF, mês e regime (Professional em diante)"),
   ("Catálogo Reformas","6 categorias · 14 patologias · 43 métodos de reparo · 4 técnicas de preparação · 8 templates de unidade"),
   ("Planos","Essencial <em>R$ 890/mês</em> (CUB) · Professional <em>R$ 2.490/mês</em> (composição e Budget Pro) · Budget Pro avulso no Essencial e Reformas: sob consulta"),
   ("Versão","Reformas entregue na v1.10.0 · correção de composições na v1.10.1 (nov/2026)"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","01/04 · ORÇAMENTO"),("Planos","ESSENCIAL + PROFESSIONAL"),("Versão","v1.10 · nov/2026")],
  next="02 · Planejamento — da EAP ao caminho crítico",
 ),
 dict(
  num="02", slug="prancha-02-planejamento",
  mod_label="Planejamento · EAP, cronograma CPM e recursos",
  eyebrow="Prancha 02 <s>·</s> Planejamento",
  h1="O atraso aparece no Gantt antes de aparecer no caixa.",
  lede="Da estrutura da obra ao caminho crítico: o cronograma nasce do orçamento, conta prazo em dias úteis, respeita a cura do concreto e mostra a cadeia que não pode atrasar.",
  chips=['<span class="chip a">CPM com folgas reais</span>','<span class="chip">Dias úteis · feriados · cura</span>','<span class="chip t">Regras ABNT/TCPO</span>'],
  img="planejamento.jpg",
  alt="Sala de planejamento com cronograma mestre na parede, maquete e engenheira apontando o caminho crítico",
  title="Prancha 02 · Planejamento — Works Manager",
  desc="EAP a partir de estruturas de obra, cronograma CPM com calendário de dias úteis e regras de cura ABNT/TCPO, histograma, nivelamento de recursos e planejamento de compras.",
  acts=[
   ("EAP a partir de estruturas de obra","Catálogo de estruturas com macroetapas, etapas filhas, regras construtivas e locação por pavimento. Importada no projeto, já traz durações e predecessoras.","T"),
   ("Caminho crítico calculado de verdade","Ida e volta do método CPM: início e fim mais tarde, folga de cada tarefa e destaque no Gantt da cadeia que decide a entrega.","T"),
   ("Calendário de dias úteis","Durações em dias úteis, com feriados e exceções do calendário. A sucessora que cairia num feriado é empurrada para o próximo dia útil.","T"),
   ("Regras tecnológicas ABNT/TCPO","Lags de cura e espera normativos em dias corridos, úteis ou percentual da duração, com seis regras padrão editáveis e restauráveis.","T"),
   ("Físico-financeiro, curva S e histograma","Gerados a partir do orçamento: quanto se gasta e quanta gente se mobiliza em cada período, sem montar planilha à parte.","E"),
   ("Cronograma executivo com redistribuição","Um ajuste de prazo redistribui automaticamente os recursos no tempo. O plano executivo acompanha a obra, não fica congelado no planejado.","P"),
   ("Equipes por EAP e nivelamento","Equipes vinculadas aos itens da estrutura, nivelamento por disponibilidade limitada e redimensionamento pela capacidade financeira do cliente.","P"),
   ("Planejamento de compras","Quantitativos de materiais por período, corrigidos pelo cronograma. A compra segue a aplicação definida na EAP, não o calendário do comprador.","P"),
  ],
  lvl_note="Essencial → Professional",
  n1_k="Essencial", n2_k="Professional",
  n1_sub="O cronograma planejado, gerado do orçamento e calculado pelo caminho crítico.",
  n1_li=["EAP a partir de estruturas de obra","Gantt CPM com calendário de dias úteis e cura","Cronograma físico-financeiro e histograma automáticos","Importação de cronogramas do MS Project (.xml/.mpp)"],
  n2_sub="O cronograma executivo que redistribui recursos e antecipa a compra.",
  n2_li=["Cronograma executivo com redistribuição automática","Equipes por EAP e nivelamento de recursos","Agenda e calendários de disponibilidade","Planejamento de compras alinhado ao cronograma"],
  spec=[
   ("Cobre","Planejamento: EAP, cronograma CPM, recursos e compras"),
   ("Entradas","Orçamento · estrutura de obra · calendário com feriados · regras tecnológicas · arquivos do MS Project"),
   ("Saídas","Gantt com caminho crítico · folgas · físico-financeiro · curva S · histograma · quantitativos de compra"),
   ("Planos","Essencial <em>R$ 890/mês</em> (cronograma planejado) · Professional <em>R$ 2.490/mês</em> (executivo, nivelamento e compras)"),
   ("Versão","Motor CPM e regras tecnológicas na v1.7 · estruturas de obra na v1.8 · esteira construtiva em 7 fases na v1.9"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","02/04 · PLANEJAMENTO"),("Planos","ESSENCIAL + PROFESSIONAL"),("Versão","v1.10 · nov/2026")],
  next="03 · Execução — OS e RDO em campo",
 ),
 dict(
  num="03", slug="prancha-03-execucao",
  mod_label="Execução · ordens de serviço, RDO em campo e medição",
  eyebrow="Prancha 03 <s>·</s> Execução &amp; campo",
  h1="O diário de obra não se perde no canteiro.",
  lede="A ordem de serviço nasce da EAP. O RDO nasce no canteiro, offline, em aparelho autorizado e sem duplicar registro — e é ele que alimenta a medição do período.",
  chips=['<span class="chip a">RDO nos três planos</span>','<span class="chip">App de campo offline</span>','<span class="chip t">Idempotência</span>'],
  img="execucao.jpg",
  alt="Canteiro de obras em golden hour, com grua içando caçamba e engenheiro com tablet",
  title="Prancha 03 · Execução — Works Manager",
  desc="Ordens de serviço vinculadas à EAP, RDO offline com idempotência e controle de dispositivos, medição por período e addon RDO Full para projetos sem orçamento.",
  acts=[
   ("Ordens de serviço manuais","O gestor cria a OS com escopo, equipe e prazo e a distribui para o campo. Disponível desde o Essencial.","E"),
   ("OS geradas das composições e da EAP","Na aprovação do projeto, as OS saem do quantitativo das composições, com mão de obra, materiais e ativos associados. A geração é idempotente e incremental.","P"),
   ("RDO offline com idempotência","O canteiro opera em sinal fraco. Cada envio tem chave única, a sincronização parcial não duplica o diário e só aparelhos autorizados transmitem.","T"),
   ("Transmissão com retomada e integridade","O envio interrompido retoma de onde parou, o conteúdo é conferido na chegada e as fotos, com hora e localização, ganham cópia de segurança.","T"),
   ("RDOs Recebidos: revisão antes de medir","No Essencial o RDO vai direto para a medição. No Professional ele passa por revisão e aprovação antes de entrar na conta.","P"),
   ("Medição por período","O usuário define o período e a medição soma todos os RDOs disponíveis nele. Funciona igual em todos os planos.","T"),
   ("Terceirizados e locação","Cadastro em todos os planos. No Professional, terceirizados e equipamentos locados ficam vinculados às OS e aos contratos.","P"),
   ("RDO Full: projeto sem orçamento","Para quem só precisa medir para cobrar: o projeto entra com a EAP montada à mão, sem orçamento, e a base de medição fica protegida contra alteração.","A"),
  ],
  lvl_note="Essencial → Professional",
  n1_k="Essencial", n2_k="Professional",
  n1_sub="O campo registrando com garantia de que nada é duplicado nem perdido.",
  n1_li=["OS manuais criadas e distribuídas pelo gestor","RDO offline com sincronização idempotente","RDO disponível para medição na hora","Até 5 usuários e 3 projetos"],
  n2_sub="O campo alimentado pela EAP e revisado antes de virar medição.",
  n2_li=["OS geradas das composições e da EAP","RDOs Recebidos com revisão e aprovação","App de campo com equipes, ativos e frentes de serviço","Rendimento de equipes e registro de NRs"],
  spec=[
   ("Cobre","Execução: ordens de serviço, RDO em campo e medição"),
   ("Integridade","Envio idempotente · controle de dispositivos por construtora · retomada e conferência na transmissão · cópia de segurança das fotos"),
   ("Campo","App RDO Field Manager disponível nos três planos; os recursos do app variam por plano"),
   ("Planos","Essencial <em>R$ 890/mês</em> · Professional <em>R$ 2.490/mês</em> · RDO Full como addon: sob consulta"),
   ("Versão","Telas novas do app de campo na v1.3 · RDO Full na v1.6"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","03/04 · EXECUÇÃO"),("Planos","TODOS"),("Versão","v1.10 · nov/2026")],
  next="04 · Ativos &amp; frota — manutenção e almoxarifado",
 ),
 dict(
  num="04", slug="prancha-04-ativos-frota",
  mod_label="Ativos · frota, manutenção e almoxarifado",
  eyebrow="Prancha 04 <s>·</s> Ativos &amp; frota",
  h1="Cada hora de máquina parada aparece no horímetro.",
  lede="Frota com odômetro e horímetro, planos de manutenção preventiva e ordens de manutenção no Professional. Almoxarifado, materiais por obra e manutenção de máquinas e ferramentas no Enterprise.",
  chips=['<span class="chip a">Professional · Enterprise</span>','<span class="chip">Odômetro · horímetro</span>','<span class="chip t">Manutenção preventiva</span>'],
  img="frota.jpg",
  alt="Pátio de máquinas ao pôr do sol, com escavadeiras enfileiradas e central de despacho",
  title="Prancha 04 · Ativos e frota — Works Manager",
  desc="Gestão de frota com odômetro e horímetro, manutenção preventiva e corretiva, almoxarifado e controle de materiais por obra.",
  acts=[
   ("Cadastro de ativos por categoria e tipo","Veículos, máquinas e equipamentos catalogados por categoria e tipo, com ficha própria. Disponível desde o Essencial.","E"),
   ("Alocação de equipamentos por obra","Cada equipamento tem obra e projeto de destino, e o histórico de alocação fica registrado.","P"),
   ("Odômetro e horímetro","Leituras lançadas no sistema ou no app de campo, junto do RDO, com operador, combustível e quilometragem do dia.","P"),
   ("Manutenção preventiva e corretiva","Planos de manutenção preventiva e ordens de serviço de manutenção de veículos, da abertura ao fechamento.","P"),
   ("Ocorrências de frota pelo app","O operador registra a ocorrência no campo, com tipo, recomendação e fotos, já ligada à OS.","P"),
   ("Manutenção de máquinas e ferramentas","Complementa a manutenção de veículos, com histórico completo de manutenção por ativo.","X"),
   ("Almoxarifado","Entrada por nota fiscal, saldo de estoque e inventário, por obra.","X"),
   ("Controle de materiais por obra e OS","Rastreia onde cada material foi aplicado: em qual obra e em qual ordem de serviço.","X"),
  ],
  lvl_note="Professional → Enterprise",
  n1_k="Professional", n2_k="Enterprise",
  n1_sub="A frota controlada pela hora real de uso, com manutenção planejada.",
  n1_li=["Alocação de equipamentos por obra","Odômetro e horímetro no sistema e no app","Planos de manutenção preventiva","OS de manutenção de veículos"],
  n2_sub="O patrimônio inteiro da construtora: estoque, materiais e todo tipo de equipamento.",
  n2_li=["Almoxarifado com nota fiscal, saldo e inventário","Rastreio de materiais por obra e OS","OS de manutenção de máquinas e ferramentas","Histórico completo de manutenção por ativo"],
  spec=[
   ("Cobre","Ativos: frota e manutenção (Professional), almoxarifado e manutenção de máquinas (Enterprise)"),
   ("Medidores","Odômetro e horímetro por equipamento, lançados no sistema ou no app de campo"),
   ("Base","Cadastro de ativos por categoria e tipo, disponível em todos os planos"),
   ("Planos","Frota no Professional <em>R$ 2.490/mês</em> · almoxarifado e manutenção de máquinas no Enterprise: sob consulta"),
   ("Versão","v1.10 · nov/2026"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","04/04 · ATIVOS"),("Planos","PROFESSIONAL + ENTERPRISE"),("Versão","v1.10 · nov/2026")],
  next="Fim do dossiê · próximo passo: página de abertura",
 ),
]

VIDEO = {
 "prancha-01-orcamento": "vids/etapa-01.mp4",
 "prancha-02-planejamento": "vids/etapa-02.mp4",
 "prancha-03-execucao": "vids/etapa-03.mp4",
 "prancha-04-ativos-frota": "vids/etapa-04.mp4",
}

NAVLABELS = [("01","Orçamento","prancha-01-orcamento.html"),
             ("02","Planejamento","prancha-02-planejamento.html"),
             ("03","Execução","prancha-03-execucao.html"),
             ("04","Ativos","prancha-04-ativos-frota.html")]
NEXTLABEL = {
 "prancha-01-orcamento": "02 · Planejamento — da EAP ao caminho crítico",
 "prancha-02-planejamento": "03 · Execução — OS e RDO em campo",
 "prancha-03-execucao": "04 · Ativos &amp; frota — manutenção e almoxarifado",
 "prancha-04-ativos-frota": "Voltar ao índice — as quatro pranchas",
}

def b64(name):
    with open(os.path.join(HERE,name),'rb') as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

def build():
    imgs = {m["img"]: b64(m["img"]) for m in MODULES}
    for m in MODULES:
        nav = '<a class="home" href="index.html">Índice</a>' + "".join(
            '<a class="' + ("on" if n == m["num"] else "") + '" href="' + href + '">' + n + " " + lab + '</a>'
            for n, lab, href in NAVLABELS
        )
        acts = "".join(
            f'<article class="act"><div class="act-top"><span class="act-num">{i:02d}</span>'
            f'<span class="act-tag {TAGS[t][0]}">{TAGS[t][1]}</span></div>'
            f'<h3>{html.escape(a)}</h3><p>{html.escape(d)}</p></article>'
            for i,(a,d,t) in enumerate(m["acts"],1)
        )
        out = TPL.format(
            title=m["title"], desc=m["desc"], css=CSS, nav=nav,
            num=m["num"], mod_label=m["mod_label"], img=imgs[m["img"]], alt=m["alt"], vid=VIDEO[m["slug"]],
            eyebrow=m["eyebrow"], h1=m["h1"], lede=m["lede"], chips="".join(m["chips"]),
            nacts=len(m["acts"]), acts=acts, lvl_note=m["lvl_note"],
            n1_k=m["n1_k"], n2_k=m["n2_k"],
            n1_sub=m["n1_sub"], n2_sub=m["n2_sub"],
            n1_li="".join(f"<li>{x}</li>" for x in m["n1_li"]),
            n2_li="".join(f"<li>{x}</li>" for x in m["n2_li"]),
            spec="".join(f"<dt>{k}</dt><dd>{v}</dd>" for k,v in m["spec"]),
            stamp="".join(f'<div class="cell"><div class="k">{k}</div><div class="v">{v}</div></div>' for k,v in m["stamp"]),
            next=NEXTLABEL[m["slug"]],
            next_href=(MODULES[MODULES.index(m)+1]["slug"] + ".html") if MODULES.index(m)+1 < len(MODULES) else "index.html",
            next_lbl="Próxima prancha" if MODULES.index(m)+1 < len(MODULES) else "Fim do dossiê",
        )
        out = (out.replace("__THEME_HEAD__", _asset("theme_head.html"))
                  .replace("__THEME_TOGGLE__", _asset("theme_toggle.html"))
                  .replace("__THEME_JS__", "<script>" + _asset("theme_js.js") + "</script>"))
        path = os.path.join(HERE, m["slug"] + ".html")
        with open(path,'w',encoding='utf-8') as f:
            f.write(out)
        print(path, round(len(out)/1024,1), "KB")

if __name__ == "__main__":
    build()
