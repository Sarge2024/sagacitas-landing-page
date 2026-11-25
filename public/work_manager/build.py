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
  <div class="brand">WORKS<b>·</b>MANAGER</div>
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
      <span class="sec-note">{nacts} atividades · <i>N1 → N2</i></span>
    </div>
    <div class="acts">
      {acts}
    </div>
  </section>

  <section class="sec">
    <div class="sec-head">
      <span class="sec-id">// 02</span>
      <h2 class="sec-title">Dois níveis, um mesmo módulo</h2>
      <span class="sec-note">O N2 consome o dado do N1</span>
    </div>
    <div class="levels">
      <div class="lvl">
        <p class="lvl-k"><b>N1 · Assistido</b> — entrada</p>
        <h4>{n1_sub}</h4>
        <ul>{n1_li}</ul>
      </div>
      <div class="lvl">
        <p class="lvl-k"><b>N2 · Automatizado</b> — upgrade</p>
        <h4>{n2_sub}</h4>
        <ul>{n2_li}</ul>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="sec-head">
      <span class="sec-id">// 03</span>
      <h2 class="sec-title">Ficha técnica</h2>
      <span class="sec-note">Fonte: dados do projeto</span>
    </div>
    <dl class="spec">{spec}</dl>
  </section>

  <div class="stamp">{stamp}</div>
  <div class="next"><span>{next_lbl}</span><a href="{next_href}">{next} <span class="m">&#8594;</span></a></div>
</div>

<footer class="foot">
  <p>Works Manager · Gestor de Obras Tecnologia · documento de apresentação, novembro de 2026. Números de mercado, preços e escopo conforme análise competitiva v2.0, proposta comercial set/2026 e arquitetura v1.1.0.</p>
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

MODULES = [
 dict(
  num="01", slug="prancha-01-orcamento",
  mod_label="Módulo 02 · Orçamento de Obras + Módulo 05 · Custos &amp; BDI",
  eyebrow="Prancha 01 <s>·</s> Orçamentação",
  h1="A margem se decide antes da primeira pá.",
  lede="Orçamento paramétrico por CUB para responder rápido. Composição analítica por SINAPI e SICRO para responder certo — com BDI auditável, encargos completos e proposta pronta para ir ao cliente.",
  chips=['<span class="chip a">N1 e N2 na v1.0</span>','<span class="chip">CUB · SINAPI · SICRO</span>','<span class="chip t">BDI auditável</span>'],
  img="orcamento.jpg",
  alt="Sala de orçamentos ao pôr do sol, com engenheiro sobre plantas e monitor de custos",
  title="Prancha 01 · Orçamento — Works Manager",
  desc="Orçamento de obras por CUB, SINAPI e SICRO, com BDI auditável e proposta comercial em PDF.",
  acts=[
   ("CUB paramétrico por padrão e região","Escolhe o padrão construtivo e a região, mexe nos sliders de macroetapa e o total recalcula na hora. Serve para responder ao cliente no mesmo dia.","N1"),
   ("Composição analítica por SINAPI e SICRO","Cada serviço vira composição com insumo, coeficiente e preço de referência. É o que sustenta obra pública e contrato com BDI complexo.","N2"),
   ("Encargos sociais SINAPI, Grupos A–E","Alíquotas parametrizadas por regime e por tipo de obra, com tratamento da desoneração da folha. Nenhum encargo digitado à mão na planilha.","—"),
   ("BDI conforme Acórdão TCU 2.622/2013","Cálculo por tipo de obra com memória rastreável: taxa, base e composição ficam registradas junto do orçamento.","N2"),
   ("Tabela CBO/CCT por região e sindicato","Cargos, pisos e jornadas atualizáveis por acordo coletivo. A mão de obra sai do orçamento com o custo do sindicato certo.","—"),
   ("Simulação de cenários lado a lado","Duas ou três versões do mesmo empreendimento comparadas por macroetapa, para decidir antes de apresentar.","N1"),
   ("Proposta comercial em PDF","Documento personalizado, gerado a partir do orçamento aprovado e versionado por cliente e empreendimento.","N1"),
   ("Previsto × realizado por macroetapa","Ao longo da obra, o orçamento aprovado é comparado com o custo real e o desvio aparece por etapa, não no total.","N2"),
  ],
  n1_sub="O orçamento que fecha rápido, com o usuário arbitrando as composições agregadas.",
  n1_li=["Orçamento paramétrico com CUB e sliders de macroetapa","Bases SINAPI e SICRO consultadas por serviço","Propostas comerciais em PDF","Versionamento por cliente e empreendimento"],
  n2_sub="O mesmo orçamento em composição analítica, com quantitativo derivado e preço auditável.",
  n2_li=["Composição por insumo, coeficiente e encargo","Quantitativos derivados do projeto","BDI auditável por tipo de obra","Comparativo previsto × realizado por etapa"],
  spec=[
   ("Cobre","Módulo 02 · Orçamento de Obras e Módulo 05 · Custos &amp; BDI"),
   ("Conformidade","Acórdão TCU 2.622/2013 · encargos SINAPI Grupos A–E · desoneração da folha (Lei 13.161/2015)"),
   ("Motor de cálculo","45 tabelas relacionais · 20 fórmulas encadeadas (F1–F20) · fluxo em 14 etapas (E1–E14)"),
   ("Planos","Essencial <em>R$ 890/mês</em> (base) · avulso <em>R$ 1.290/mês</em> · incluído no Profissional"),
   ("Escopo","N1 e N2 entregues na v1.0"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","01/04 · ORÇAMENTO"),("Módulos","02 + 05"),("Versão","v1.0 · nov/2026")],
  next="02 · Planejamento — da EAP ao caminho crítico",
 ),
 dict(
  num="02", slug="prancha-02-planejamento",
  mod_label="Módulo 02 · Planejamento",
  eyebrow="Prancha 02 <s>·</s> Planejamento",
  h1="O atraso aparece no Gantt antes de aparecer no caixa.",
  lede="Da EAP ao cronograma CPM e à curva S: o plano nasce do orçamento aprovado, mostra o caminho crítico e chega ao canteiro como onda de compra — não como surpresa.",
  chips=['<span class="chip a">N1 na v1.0 · N2 na v1.1</span>','<span class="chip">EAP/WBS · CPM</span>','<span class="chip t">Curva S</span>'],
  img="planejamento.jpg",
  alt="Sala de planejamento com cronograma mestre na parede, maquete e engenheira apontando o caminho crítico",
  title="Prancha 02 · Planejamento — Works Manager",
  desc="EAP/WBS, Gantt CPM, curva S e histograma de mão de obra, com ondas de compra derivadas do caminho crítico.",
  acts=[
   ("EAP hierárquica multi-nível","WBS customizável por tipologia de obra. A mesma estrutura sustenta orçamento, cronograma e medição — sem remontar a árvore em cada módulo.","N1"),
   ("Gantt CPM com caminho crítico automático","O sistema calcula folgas e marca a cadeia que não pode atrasar. O que está em vermelho é o que decide a entrega.","N1"),
   ("Cronograma gerado do orçamento","Com o orçamento analítico aprovado, as atividades nascem das composições e dos índices de produção, em vez de serem digitadas.","N2"),
   ("Curva S físico-financeira","Previsto, realizado e tendência na mesma linha. A pergunta deixa de ser “quanto já gastamos” e passa a ser “onde vamos chegar”.","N1"),
   ("Histograma de mão de obra","Efetivo por equipe, função e período. Mostra o pico de mobilização antes de ele virar contratação de emergência.","N1"),
   ("Linha de base versionada","O plano aprovado fica congelado como referência. Todo desvio é medido contra ele, e cada replanejamento gera uma nova linha.","N1"),
   ("Ondas de compra pelo caminho crítico","Do prazo de cada atividade sai quando o material precisa estar no canteiro. A compra segue a obra, não o calendário do comprador.","N2"),
   ("Importação de MS Project","Arquivos .mpp e .xml entram com reconciliação de atividades, datas e recursos — para quem já tem cronograma pronto.","N1"),
  ],
  n1_sub="O plano executivo montado à mão, com assistência de cálculo e curva S.",
  n1_li=["EAP/WBS e Gantt CPM assistidos","Curva S e histograma de mão de obra","Linha de base versionada","Importação de cronogramas do MS Project"],
  n2_sub="O cronograma que se monta a partir do orçamento e antecipa a compra.",
  n2_li=["Atividades geradas das composições do orçamento","Duração por índice de produção","Ondas de compra derivadas do caminho crítico","Replanejamento com nova linha de base"],
  spec=[
   ("Cobre","Módulo 02 · Planejamento"),
   ("Entradas","Orçamento aprovado · EAP · calendário e regime de trabalho · índices de produção"),
   ("Saídas","Cronograma CPM · curva S · histograma · ondas de compra · linha de base"),
   ("Planos","Executor <em>R$ 1.590/mês</em> · avulso <em>R$ 1.890/mês</em> · incluído no Profissional"),
   ("Escopo","N1 entregue na v1.0 · N2 na v1.1"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","02/04 · PLANEJAMENTO"),("Módulo","02"),("Versão","v1.0 · nov/2026")],
  next="03 · Execução — OS e RDO em campo",
 ),
 dict(
  num="03", slug="prancha-03-execucao",
  mod_label="Módulo 03 · Execução (OS) + Módulo 04 · RDO em Campo",
  eyebrow="Prancha 03 <s>·</s> Execução &amp; campo",
  h1="O diário de obra não se perde no canteiro.",
  lede="A ordem de serviço nasce do cronograma. O RDO nasce no canteiro, offline, com idempotência que garante ao diário o valor de prova — e a telemetria fecha a produtividade real.",
  chips=['<span class="chip a">N1 na v1.0 · N2 na v1.1</span>','<span class="chip">iOS · Android · offline</span>','<span class="chip t">Idempotência</span>'],
  img="execucao.jpg",
  alt="Canteiro de obras em golden hour, com grua içando caçamba e engenheiro com tablet",
  title="Prancha 03 · Execução — Works Manager",
  desc="Ordens de serviço vinculadas à EAP e RDO offline com idempotência, fotos georreferenciadas e telemetria.",
  acts=[
   ("Ordem de serviço vinculada à EAP","Cada OS carrega escopo, equipe, prazo e a atividade que ela realiza. O que foi executado fica rastreável até a linha do cronograma.","N1"),
   ("OS geradas do Gantt","Na virada da semana, as ordens saem do cronograma para o campo. O gestor revisa e libera em vez de redigitar.","N2"),
   ("RDO offline com idempotência","O canteiro opera em LTE fraco. A sincronização parcial não duplica registro: cada diário tem uma chave única por obra e data.","N1"),
   ("Fotos georreferenciadas com timestamp","Prova de execução com coordenada, hora e autor. Serve para medir, para contestar e para defender o prazo em contrato.","N1"),
   ("Alertas de clima, segurança e atraso","Regras configuráveis disparam aviso por WhatsApp e e-mail quando o dia foge do previsto.","N1"),
   ("Produtividade por equipe e efetivo","Horas por serviço, efetivo por dia e desvio contra o previsto. A produtividade real deixa de ser estimativa de fim de obra.","N2"),
   ("Medição e fechamento do registro","O fechamento do RDO gera o evento que alimenta a medição. No financeiro (v1.2), é o mesmo evento que vira título a receber.","N1"),
   ("Requisição de material a partir da OS","A OS que vai começar puxa o material contra o almoxarifado da obra, com rastro de quem pediu e para qual serviço.","N2"),
  ],
  n1_sub="O campo registrando à mão, com garantia de que nada será duplicado nem perdido.",
  n1_li=["OS manuais criadas e distribuídas pelo gestor","RDO offline com sincronização idempotente","Fotos georreferenciadas e alertas","Medição a partir do registro fechado"],
  n2_sub="O campo alimentado pelo cronograma e medido por telemetria, não por apontamento.",
  n2_li=["OS geradas automaticamente do Gantt","Requisição de material contra o almoxarifado","Telemetria de frota: horas, ociosidade e consumo","Produtividade real fechada contra o previsto"],
  spec=[
   ("Cobre","Módulo 03 · Execução (OS) e Módulo 04 · RDO em Campo"),
   ("Integridade","Registro único por (construtora, obra, data) · sincronização parcial sem duplicidade · evento de fechamento consumido pela medição"),
   ("Campo","Aplicativo iOS e Android com operação offline · fotos com coordenada, hora e autor"),
   ("Planos","Executor <em>R$ 1.590/mês</em> · RDO Starter <em>R$ 149/mês</em> (até 2 obras) · avulso <em>R$ 1.590/mês</em>"),
   ("Escopo","N1 entregue na v1.0 · N2 na v1.1 · financeiro de obra na v1.2"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","03/04 · EXECUÇÃO"),("Módulos","03 + 04"),("Versão","v1.0 · nov/2026")],
  next="04 · Ativos &amp; frota — almoxarifado e horímetro",
 ),
 dict(
  num="04", slug="prancha-04-ativos-frota",
  mod_label="Módulo 05 · Ativos — almoxarifado e frota",
  eyebrow="Prancha 04 <s>·</s> Ativos &amp; frota",
  h1="Cada hora de máquina parada aparece no horímetro.",
  lede="Almoxarifado e frota no mesmo lugar: saldo por obra, curva ABC do que consome o orçamento e manutenção preventiva disparada pela hora real de máquina — não pelo calendário.",
  chips=['<span class="chip a">N1 na v1.0 · N2 na v1.1</span>','<span class="chip">Curva ABC</span>','<span class="chip t">Horímetro</span>'],
  img="frota.jpg",
  alt="Pátio de máquinas ao pôr do sol, com escavadeiras enfileiradas e central de despacho",
  title="Prancha 04 · Ativos e frota — Works Manager",
  desc="Almoxarifado com curva ABC, controle de ativos e manutenção preventiva disparada por horímetro.",
  acts=[
   ("Almoxarifado por obra e centro de custo","Entradas, saídas e saldo no mesmo lugar. O material que chegou tem nota, obra e serviço de destino.","N1"),
   ("Requisição e baixa de material","Do pedido do encarregado à baixa no estoque, com rastro por OS e por centro de custo.","N1"),
   ("Curva ABC de materiais","Quais poucos itens concentram a maior parte do valor comprado. É onde a negociação com fornecedor rende de verdade.","N1"),
   ("Cadastro de ativos com ficha própria","Veículos, máquinas e equipamentos com identificação, alocação por obra e histórico de uso.","N1"),
   ("Telemetria de horas, ociosidade e consumo","O equipamento informa o que fez no dia. Cruzado com o RDO, fecha a produtividade real da frota.","N2"),
   ("Manutenção preventiva por horímetro","O plano dispara pela hora trabalhada, não pela data. Máquina parada por falha deixa de ser fatalidade e passa a ser indicador.","N2"),
   ("Custo por equipamento contra o orçado","Hora-máquina real contra hora-máquina prevista, por obra. Mostra se o equipamento próprio está saindo mais caro que a locação.","N2"),
   ("Fornecedores e histórico cruzado","Compras por fornecedor, por obra e por profissional, com o preço praticado ao lado do preço de referência.","N1"),
  ],
  n1_sub="O controle que já organiza o canteiro antes de qualquer sensor entrar em campo.",
  n1_li=["Almoxarifado com entradas, saídas e saldo","Requisições com baixa rastreada por OS","Curva ABC de materiais","Cadastro de ativos e fornecedores"],
  n2_sub="A frota que se mantém sozinha, guiada pela hora real de trabalho.",
  n2_li=["Telemetria cruzada com o RDO","Plano de manutenção disparado por horímetro","Custo por equipamento contra o orçado","Alerta de ociosidade por obra"],
  spec=[
   ("Cobre","Módulo 05 · Ativos (almoxarifado e frota), apoiado no módulo 04 · RDO"),
   ("Fonte do horímetro","Telemetria do RDO: horas trabalhadas, ociosidade e consumo por equipamento"),
   ("Base","Cadastros de ativos, fornecedores e centros de custo da plataforma transversal"),
   ("Planos","Incluído na gestão completa — Profissional <em>R$ 2.490/mês</em>. Não é vendido avulso"),
   ("Escopo","N1 (almoxarifado) na v1.0 · N2 (manutenção por horímetro) na v1.1"),
  ],
  stamp=[("Projeto","WORKS MANAGER"),("Prancha","04/04 · ATIVOS"),("Módulo","05"),("Versão","v1.0 · nov/2026")],
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
 "prancha-03-execucao": "04 · Ativos &amp; frota — almoxarifado e horímetro",
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
            f'<span class="act-tag {("n1" if t=="N1" else "n2" if t=="N2" else "")}">'
            f'{"N1 assistido" if t=="N1" else "N2 automatizado" if t=="N2" else "ambos"}</span></div>'
            f'<h3>{html.escape(a)}</h3><p>{html.escape(d)}</p></article>'
            for i,(a,d,t) in enumerate(m["acts"],1)
        )
        out = TPL.format(
            title=m["title"], desc=m["desc"], css=CSS, nav=nav,
            num=m["num"], mod_label=m["mod_label"], img=imgs[m["img"]], alt=m["alt"], vid=VIDEO[m["slug"]],
            eyebrow=m["eyebrow"], h1=m["h1"], lede=m["lede"], chips="".join(m["chips"]),
            nacts=len(m["acts"]), acts=acts,
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
