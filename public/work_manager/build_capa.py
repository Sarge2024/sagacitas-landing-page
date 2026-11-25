#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Capa do dossiê — índice das quatro pranchas + modelo cíclico interativo."""
import base64, os, math

HERE = os.path.dirname(os.path.abspath(__file__))

def _asset(n):
    with open(os.path.join(HERE, "assets", n), encoding="utf-8") as f:
        return f.read()

def _css():
    return _asset("theme.css") + "\n" + _asset("capa.css")

CSS = _css()



# ---------- geometria do anel ----------
CX, CY, R, W = 300, 300, 196, 44
GAP = 3.2  # graus de respiro entre fases

PHASES = [
 dict(id="01", name="Orçamentação &amp; Aprovação", short="Orçamentação", price="R$ 890/mês",
      mode="Essencial · Opex",
      rows=[("Gatilho","Do primeiro contato comercial até a <b>assinatura do contrato</b> de obra"),
            ("Contabilidade","<b>Opex</b> — despesa corrente do período"),
            ("O que roda","Orçamentos CUB paramétrico, propostas, simulações de cenário, planejamento preliminar"),
            ("Duração","Variável — enquanto a obra está em negociação")],
      foot="Manter a máquina ligada sem assumir custo de projeto"),
 dict(id="02", name="Execução &amp; Gestão", short="Execução", price="R$ 2.490/mês",
      mode="Profissional · incremento R$ 1.600",
      rows=[("Gatilho","Contrato assinado + <b>ordem de início</b> emitida"),
            ("Contabilidade","Incremento de R$ 1.600/mês como <em>Capex do projeto</em>, recuperável via BDI"),
            ("O que roda","Todos os cinco módulos: EAP, Gantt, físico-financeiro, RDO em campo, custos e BDI"),
            ("Duração","3 a 18 meses, conforme porte e tipologia")],
      foot="O único momento em que o software custa caro — e a obra está faturando"),
 dict(id="03", name="Encerramento &amp; Transição", short="Encerramento", price="R$ 890/mês",
      mode="Retorno ao Essencial",
      rows=[("Gatilho","Conclusão física e financeira com <b>aceite do cliente final</b>"),
            ("Contabilidade","Volta ao Opex de R$ 890/mês, sem multa residual"),
            ("O que roda","Extração completa dos dados em CSV, JSON, PDF e ZIP"),
            ("Multa","<b>Zero</b> — sem taxa de saída, sem fidelidade residual")],
      foot="A obra termina; a base de dados continua sendo do cliente"),
 dict(id="04", name="Novo Ciclo", short="Novo ciclo", price="R$ 890/mês",
      mode="Base histórica preservada",
      rows=[("Gatilho","Nova obra entra em orçamentação"),
            ("Contabilidade","Mesma linha de base Essencial, sem reinstalação"),
            ("O que roda","Cadastros, orçamentos e propostas anteriores disponíveis para reuso"),
            ("Resultado","Composições e índices reais da obra anterior calibram a próxima")],
      foot="Cada ciclo fecha mais preciso — o histórico é o ativo"),
]

def arc(cx, cy, r, w, a0, a1):
    """Path de arco anular entre dois ângulos em graus (0 = topo, sentido horário)."""
    def pt(a, rad):
        t = math.radians(a - 90)
        return cx + rad*math.cos(t), cy + rad*math.sin(t)
    ro, ri = r + w/2, r - w/2
    x0o,y0o = pt(a0,ro); x1o,y1o = pt(a1,ro)
    x1i,y1i = pt(a1,ri); x0i,y0i = pt(a0,ri)
    large = 1 if (a1-a0) > 180 else 0
    return (f"M{x0o:.2f},{y0o:.2f} A{ro:.2f},{ro:.2f} 0 {large} 1 {x1o:.2f},{y1o:.2f} "
            f"L{x1i:.2f},{y1i:.2f} A{ri:.2f},{ri:.2f} 0 {large} 0 {x0i:.2f},{y0i:.2f} Z")

def ring_svg():
    seg = 360/4
    colors = ["var(--arc-1)", "var(--arc-2)", "var(--arc-3)", "var(--arc-4)"]
    parts = []
    labels = []
    for i,p in enumerate(PHASES):
        a0 = i*seg + GAP; a1 = (i+1)*seg - GAP
        d = arc(CX,CY,R,W,a0,a1)
        parts.append(f'<path class="arc{" on" if i==0 else ""}" data-phase="{i}" d="{d}" fill="{colors[i]}" stroke="none"></path>')
        # rótulo no meio do arco, fora do anel
        mid = (a0+a1)/2
        lx,ly = CX + (R+W/2+27)*math.cos(math.radians(mid-90)), CY + (R+W/2+27)*math.sin(math.radians(mid-90))
        anchor = "middle"
        if abs(math.cos(math.radians(mid-90))) > .5:
            anchor = "start" if math.cos(math.radians(mid-90)) > 0 else "end"
        labels.append(
          f'<text class="arc-lb{" on" if i==0 else ""}" data-phase="{i}" x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}" '
          f'dominant-baseline="middle"><tspan class="num" x="{lx:.1f}" dy="-7">{p["id"]}</tspan>'
          f'<tspan x="{lx:.1f}" dy="13">{p["short"]}</tspan></text>')
    core = (f'<text class="ring-core" x="{CX}" y="{CY-46}" text-anchor="middle">linha de base</text>'
            f'<text class="ring-core-v" x="{CX}" y="{CY-8}" text-anchor="middle">R$ 890</text>'
            f'<text class="ring-core-s" x="{CX}" y="{CY+14}" text-anchor="middle">por mês · sempre ativo</text>'
            f'<text class="ring-core-s" x="{CX}" y="{CY+44}" text-anchor="middle">+ R$ 1.600 em obra</text>')
    return (f'<svg class="ring" viewBox="0 0 600 600" role="img" '
            f'aria-label="Ciclo de operação: quatro fases sobre uma linha de base de R$ 890 por mês">'
            f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="var(--line)" stroke-width="1"></circle>'
            + "".join(parts) + core + "".join(labels) + '</svg>')

def detail_panel(i=0):
    p = PHASES[i]
    rows = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k,v in p["rows"])
    return (f'<div class="pd-top"><span class="pd-id">Fase {p["id"]}</span>'
            f'<h3 class="pd-name">{p["name"]}</h3><span class="pd-price">{p["price"]}</span></div>'
            f'<dl class="pd-rows">{rows}</dl>'
            f'<div class="pd-foot"><i></i>{p["mode"]}</div>'
            f'<p class="pd-note">{p["foot"]}.</p>')

CONTRACT = """
<section class="sec" id="contratar">
  <div class="sec-head">
    <span class="sec-id">// 03</span>
    <h2 class="sec-title">Contratação</h2>
    <p class="sec-desc">Três níveis de entrada, um mesmo sistema. Comece pelo orçamento e suba quando a obra começar — sem trocar de plataforma e sem perder o histórico.</p>
  </div>

  <div class="plans">
    <article class="plan">
      <div class="plan-k">Nível 01 · entrada</div>
      <h3>Essencial</h3>
      <div class="plan-price">R$ 890<small>/mês</small></div>
      <p class="plan-commit">Sem fidelidade · a linha de base permanente do ciclo Opex</p>
      <ul>
        <li>Cadastros operacionais: funcionários com CBO, equipes, ativos</li>
        <li>Orçamento CUB paramétrico com sliders de macroetapa</li>
        <li>Propostas comerciais em PDF e versionamento</li>
        <li>Exportação de dados em CSV, JSON, PDF e ZIP</li>
        <li>Suporte por WhatsApp e e-mail · resposta em 48h úteis</li>
      </ul>
      <a class="plan-go" href="#contratar">Contratar Essencial <i>&#8594;</i></a>
    </article>

    <article class="plan hl">
      <div class="plan-tag">Mais escolhido</div>
      <div class="plan-k">Nível 02 · execução</div>
      <h3>Budget Pro</h3>
      <div class="plan-price">R$ 1.590<small>/mês</small></div>
      <p class="plan-commit">6 meses · orçamento completo mais gestão e campo</p>
      <ul>
        <li>Tudo do Essencial, com orçamento analítico completo</li>
        <li>EAP/WBS e Gantt CPM com caminho crítico</li>
        <li>Curva S físico-financeira e histograma de mão de obra</li>
        <li>RDO em campo: app offline com idempotência</li>
        <li>Suporte por WhatsApp, e-mail e telefone · 24h úteis</li>
      </ul>
      <a class="plan-go" href="#contratar">Contratar Budget Pro <i>&#8594;</i></a>
    </article>

    <article class="plan">
      <div class="plan-k">Nível 03 · completa</div>
      <h3>Professional</h3>
      <div class="plan-price">R$ 2.490<small>/mês</small></div>
      <p class="plan-commit">12 meses · todos os cinco módulos integrados</p>
      <ul>
        <li>Tudo do Budget Pro, com os cinco módulos ativos</li>
        <li>Custos &amp; BDI auditável: CBO/CCT, encargos e Acórdão TCU</li>
        <li>Telemetria de frota e manutenção por horímetro</li>
        <li>Imputação do incremento como Capex do projeto, via BDI</li>
        <li>Suporte dedicado com base de testes antecipada</li>
      </ul>
      <a class="plan-go" href="#contratar">Contratar Professional <i>&#8594;</i></a>
    </article>
  </div>

  <div class="addons">
    <div class="addon"><div class="addon-name"><b>RDO Starter</b><span>Freemium · até 2 obras</span></div><div class="addon-price">R$ 149/mês</div></div>
    <div class="addon"><div class="addon-name"><b>02 · Orçamento de Obras</b><span>Módulo avulso</span></div><div class="addon-price">R$ 1.290/mês</div></div>
    <div class="addon"><div class="addon-name"><b>03 · Gestão da Obra</b><span>Módulo avulso</span></div><div class="addon-price">R$ 1.890/mês</div></div>
    <div class="addon"><div class="addon-name"><b>04 · RDO em Campo</b><span>Módulo avulso</span></div><div class="addon-price">R$ 1.590/mês</div></div>
    <div class="addon"><div class="addon-name"><b>05 · Custos &amp; BDI</b><span>Módulo avulso</span></div><div class="addon-price">R$ 990/mês</div></div>
    <div class="addon"><div class="addon-name"><b>Implantação Essencial</b><span>Setup · 5 dias úteis</span></div><div class="addon-price">R$ 4.900</div></div>
    <div class="addon"><div class="addon-name"><b>Implantação Professional</b><span>Setup · 15 dias úteis</span></div><div class="addon-price">R$ 12.900</div></div>
    <div class="addon"><div class="addon-name"><b>Enterprise</b><span>Customizações · BI · integrações</span></div><div class="addon-price">sob consulta</div></div>
  </div>

  <div class="terms">
    <div><div class="k">Multa</div><div class="v">Zero em qualquer nível. Retorno ao Essencial no aceite da obra, sem multa residual.</div></div>
    <div><div class="k">Reajuste</div><div class="v">IPCA-12m, uma vez por ano, nunca acima do índice oficial do IBGE.</div></div>
    <div><div class="k">Antecipação</div><div class="v">5% de desconto no pagamento trimestral ou semestral antecipado.</div></div>
    <div><div class="k">Dados</div><div class="v">100% do cliente. Exportação gratuita e conta desativada em até 7 dias úteis.</div></div>
  </div>

  <p class="contract-note"><span>·</span><span><b>Rótulo em definição.</b> O nível intermediário aparece como <b>Budget Pro</b> nesta página; nos materiais atuais de proposta e arquitetura o mesmo plano está nomeado <b>Executor</b>, com preço e escopo idênticos aos apresentados aqui.</span></p>

  <div class="contract-cta">
    <p>Demonstração de 60 min em ambiente sandbox <br><b>contato@gestordeobras.com.br · (11) 4000-0000</b></p>
    <a class="btn solid" href="#contratar">Agendar demonstração <span>&#8594;</span></a>
  </div>
</section>
"""

SLIDES = [
 dict(i=0, img="orcamento.jpg", num="Prancha 01", title="Orçamento", alt="Sala de orçamentos ao pôr do sol"),
 dict(i=1, img="planejamento.jpg", num="Prancha 02", title="Planejamento", alt="Sala de planejamento com cronograma mestre"),
 dict(i=2, img="execucao.jpg", num="Prancha 03", title="Execução", alt="Canteiro de obras em golden hour"),
 dict(i=3, img="frota.jpg", num="Prancha 04", title="Ativos &amp; frota", alt="Pátio de máquinas com central de despacho"),
]

CARDS = [
 dict(slug="prancha-01-orcamento.html", img="orcamento.jpg", num="Prancha 01 · módulos 02 + 05",
      title="Orçamento", desc="CUB paramétrico para responder no mesmo dia; composição SINAPI e SICRO para responder certo. BDI auditável conforme Acórdão TCU 2.622/2013, encargos Grupos A–E e proposta em PDF.",
      tags=["CUB · SINAPI · SICRO","BDI auditável","Proposta em PDF","Previsto × realizado"],
      go="Abrir a prancha 01", flag="N1 e N2 na v1.0", first=True),
 dict(slug="prancha-02-planejamento.html", img="planejamento.jpg", num="Prancha 02 · módulo 02",
      title="Planejamento", desc="EAP/WBS e Gantt CPM com caminho crítico automático, curva S e histograma. O cronograma nasce do orçamento aprovado e vira onda de compra.",
      tags=["EAP/WBS","Gantt CPM","Curva S","Ondas de compra"],
      go="Abrir a prancha 02", flag="N1 v1.0 · N2 v1.1"),
 dict(slug="prancha-03-execucao.html", img="execucao.jpg", num="Prancha 03 · módulos 03 + 04",
      title="Execução &amp; RDO", desc="Ordem de serviço vinculada à EAP e RDO offline com idempotência. O diário de obra mantém valor de prova mesmo quando o canteiro perde sinal.",
      tags=["OS na EAP","RDO offline","Fotos georreferenciadas","Telemetria"],
      go="Abrir a prancha 03", flag="N1 v1.0 · N2 v1.1"),
 dict(slug="prancha-04-ativos-frota.html", img="frota.jpg", num="Prancha 04 · módulo 05",
      title="Ativos &amp; frota", desc="Almoxarifado com saldo por obra, curva ABC do que consome o orçamento e manutenção preventiva disparada pela hora real de máquina.",
      tags=["Curva ABC","Almoxarifado","Manutenção por horímetro","Custo por equipamento"],
      go="Abrir a prancha 04", flag="N1 v1.0 · N2 v1.1"),
]

def b64(name):
    with open(os.path.join(HERE, name), 'rb') as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

def build():
    imgs = {n: b64(n.replace(".jpg","-s.jpg")) for n in ("orcamento.jpg","planejamento.jpg","execucao.jpg","frota.jpg")}

    tiles = "".join(
        f'<a class="tile" href="{(CARDS[s["i"]]["slug"])}" aria-label="{s["num"]}: {s["title"]}">'
        f'<img src="{imgs[s["img"]]}" alt="{s["alt"]}">'
        f'<div class="tile-txt"><div class="tile-n">{s["num"]}</div>'
        f'<div class="tile-t">{s["title"]}</div>'
        f'<div class="tile-a">{CARDS[s["i"]]["tags"][0]} · {CARDS[s["i"]]["tags"][1]}</div>'
        f'</div></a>' for s in SLIDES)

    cards = "".join(
        f'<a class="card reveal" href="{c["slug"]}">'
        f'<div class="card-media"><span class="card-flag">{c["flag"]}</span>'
        f'<img src="{imgs[c["img"]]}" alt="{c["title"]}"></div>'
        f'<div class="card-body"><div class="card-n">{c["num"]}</div>'
        f'<h3>{c["title"]}</h3><p>{c["desc"]}</p>'
        f'<div class="card-tags">' + "".join(f"<span>{t}</span>" for t in c["tags"]) + '</div>'
        f'<div class="card-go">{c["go"]}<i>→</i></div></div></a>' for c in CARDS)

    steps = "".join(
        f'<button data-phase="{i}" class="{"on" if i==0 else ""}">{p["id"]} · {p["short"]}</button>'
        for i,p in enumerate(PHASES))

    plates = "".join(
        f'<a href="{c["slug"]}">{c["num"].split(" ·")[0]}</a>' for c in CARDS)

    html = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Works Manager — dossiê de capacidades</title>
<meta name="description" content="Orçamento, planejamento, execução e frota em um único sistema de gestão de obras, com custo do software acompanhando o ciclo de caixa de cada obra.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Saira:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
__THEME_HEAD__
<style>{CSS}</style>
</head>
<body>

<header class="rail">
  <div class="brand">WORKS<b>·</b>MANAGER</div>
  <div class="rail-meta">Dossiê de capacidades · nov 2026</div>
  __THEME_TOGGLE__
  <nav class="nav" aria-label="Seções">
    <a href="#pranchas">Pranchas</a>
    <a href="#modelo">Modelo cíclico</a>
    <a class="cta" href="#pranchas">Começar a leitura</a>
  </nav>
</header>

<section class="cover">
  <div class="cover-grid">
    <div>
      <p class="eyebrow">Gestão de obras <s>·</s> publicação de capacidades <s>·</s> quatro pranchas</p>
      <h1>A obra inteira, <em>prancha por prancha.</em></h1>
      <p class="lede">Orçamento, planejamento, execução e frota num só sistema modular. Cada etapa entra em cena com as atividades que realmente acontecem — e o custo do software acompanha o <b>ciclo de caixa de cada obra</b>, não o calendário do contrato.</p>
      <div class="cover-act">
        <a class="btn solid" href="#pranchas">Ver as quatro pranchas <span>→</span></a>
        <a class="btn" href="#modelo">Entender o modelo cíclico</a>
      </div>
    </div>
    <div class="mosaic">{tiles}</div>
  </div>
</section>

<div class="strip">
  <div><div class="k">Mercado de software de obras</div><div class="v">R$ 2–3 <i>bi</i>/ano</div><div class="s">crescendo 12–15% ao ano</div></div>
  <div><div class="k">Construção civil no Brasil</div><div class="v">R$ 522,5 <i>bi</i></div><div class="s">191 mil empresas ativas · 2,5 mi de empregos</div></div>
  <div><div class="k">Concentração das 8 maiores</div><div class="v">3,1<i>%</i></div><div class="s">mercado pulverizado — nenhum incumbente domina</div></div>
  <div><div class="k">Empresas de pequeno porte</div><div class="v">97,6<i>%</i></div><div class="s">faixa onde não há oferta estruturada</div></div>
</div>

<main>

<section class="sec" id="pranchas">
  <div class="sec-head">
    <span class="sec-id">// 01</span>
    <h2 class="sec-title">Quatro pranchas, quatro etapas</h2>
    <p class="sec-desc">Cada prancha abre o módulo em detalhe: as atividades, os dois níveis de automação e a ficha técnica com escopo e preço.</p>
  </div>
  <div class="cards">{cards}</div>
</section>

<section class="sec" id="modelo">
  <div class="sec-head">
    <span class="sec-id">// 02</span>
    <h2 class="sec-title">O modelo cíclico</h2>
    <p class="sec-desc">Nenhum concorrente mapeado cobra assim. Selecione uma fase do ciclo para ver o gatilho, a contabilidade e o que roda nela.</p>
  </div>

  <div class="cycle-wrap">
    <div class="ring-box">{ring_svg()}</div>
    <div>
      <div class="cycle-steps" role="tablist" aria-label="Fases do modelo cíclico">{steps}</div>
      <div class="phase-detail" id="pd" aria-live="polite">{detail_panel(0)}</div>
    </div>
  </div>

  <div class="compare">
    <div>
      <h4>Concorrência <b>· assinatura fixa</b></h4>
      <ul>
        <li>Preço cheio mesmo na entressafra, sem obra aprovada gerando receita</li>
        <li>100% Opex: onera o resultado fixo da empresa</li>
        <li>Fidelidade de 12 a 24 meses; multa ou preço cheio ao encerrar</li>
        <li>Dados presos na plataforma ou exportação cobrada à parte</li>
      </ul>
    </div>
    <div>
      <h4>Works Manager <b>· ciclo</b></h4>
      <ul>
        <li>R$ 890/mês na orçamentação — a base fica ligada sem custo de projeto</li>
        <li>Opex na estrutura + Capex na obra, recuperável via BDI</li>
        <li>Retorno automático ao Essencial no aceite, sem multa</li>
        <li>Exportação gratuita em CSV, JSON, PDF e ZIP, a qualquer momento</li>
      </ul>
    </div>
  </div>
</section>

__CONTRACT__

<section class="close">
  <h2>Comece pela etapa que dói hoje.</h2>
  <p>A construtora entra em qualquer ponto do ciclo e sobe sem trocar de plataforma — cada módulo tem nível assistido de entrada e nível automatizado de upgrade. Quem começa pelo RDO pode terminar com o orçamento analítico completo.</p>
  <div class="plates">{plates}</div>
  <a class="btn solid" href="prancha-01-orcamento.html">Abrir a prancha 01 · Orçamento <span>→</span></a>
</section>

</main>

<footer>
  <p>Works Manager · Gestor de Obras Tecnologia · documento de apresentação, novembro de 2026. Números de mercado, preços e escopo conforme análise competitiva v2.0, proposta comercial set/2026 e arquitetura v1.1.0.</p>
  <p>Capa · 4 pranchas</p>
</footer>

<script>
(function(){{
  var data = __DATA__;
  var pd = document.getElementById('pd');
  var btns = document.querySelectorAll('[data-phase]');

  function esc(s){{return s;}}
  function render(i){{
    var p = data[i];
    var rows = p.rows.map(function(r){{return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>';}}).join('');
    pd.innerHTML = '<div class="pd-top"><span class="pd-id">Fase '+p.id+'</span>'
      + '<h3 class="pd-name">'+p.name+'</h3><span class="pd-price">'+p.price+'</span></div>'
      + '<dl class="pd-rows">'+rows+'</dl>'
      + '<div class="pd-foot"><i></i>'+p.mode+'</div>'
      + '<p class="pd-note">'+p.foot+'.</p>';
    btns.forEach(function(b){{
      b.classList.toggle('on', b.getAttribute('data-phase') === String(i));
    }});
  }}
  btns.forEach(function(b){{
    var act = function(){{ render(parseInt(b.getAttribute('data-phase'),10)); }};
    b.addEventListener('click', act);
    b.addEventListener('keydown', function(e){{
      if(e.key === 'Enter' || e.key === ' '){{
        if(b.tagName === 'text'){{ e.preventDefault(); act(); }}
      }}
    }});
  }});

  var els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches){{
    els.forEach(function(e){{e.classList.add('in');}});
  }} else {{
    var io = new IntersectionObserver(function(en){{
      en.forEach(function(x){{ if(x.isIntersecting){{ x.target.classList.add('in'); io.unobserve(x.target); }} }});
    }},{{threshold:.12}});
    els.forEach(function(e,i){{ e.style.transitionDelay=(i%2)*60+'ms'; io.observe(e); }});
  }}
}})();
</script>
__THEME_JS__
</body>
</html>
"""
    import json
    payload = [dict(id=p["id"], name=p["name"], price=p["price"], mode=p["mode"],
                    rows=[[k,v] for k,v in p["rows"]], foot=p["foot"]) for p in PHASES]
    html = html.replace("__DATA__", json.dumps(payload, ensure_ascii=False))
    html = html.replace("{{", "{").replace("}}", "}")
    html = html.replace("__CONTRACT__", CONTRACT)
    html = (html.replace("__THEME_HEAD__", _asset("theme_head.html"))
                .replace("__THEME_TOGGLE__", _asset("theme_toggle.html"))
                .replace("__THEME_JS__", "<script>" + _asset("theme_js.js") + "</script>"))
    out = os.path.join(HERE, "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)
    print(out, round(len(html)/1024, 1), "KB")

if __name__ == "__main__":
    build()
