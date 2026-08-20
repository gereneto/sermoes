/* ---------------------------------------------------------------
   Sermões — aplicação de leitura
   Um ponto por página, navegando de ponto em ponto.

   Rotas (usam # para funcionar em qualquer hospedagem estática):
     #/                          capa
     #/c/<colecao>               índice da coleção
     #/s/<sermao>                índice dos pontos do sermão
     #/s/<sermao>/<n>            um ponto
     #/s/<sermao>/tudo           sermão inteiro (leitura corrida / impressão)
   --------------------------------------------------------------- */

(function () {
  'use strict';

  var dados = { colecoes: [], sermoes: [] };

  /* API usada pelos arquivos de conteúdo (carregados depois deste script) */
  window.SERMOES = {
    colecao: function (c) { dados.colecoes.push(c); },
    sermao:  function (s) { dados.sermoes.push(s); }
  };

  var CHAVE_TEMA = 'sermoes:tema';
  var CHAVE_POS  = 'sermoes:ultimaLeitura';

  /* ----------------------------- utilidades ----------------------------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Realça referências bíblicas: (Ct 1,1) (1Cor 2,13.6) (cf. Jo 4,14) */
  var RE_REF = /\((?:cf\.\s*)?(?:[1-4]\s?)?[A-ZÁÉÍÓÚ][a-zçãéíóúâêôõ]{1,4}\s\d+[^()]*\)/g;

  function realcarRefs(t) {
    return t.replace(RE_REF, function (m) { return '<span class="ref">' + m + '</span>'; });
  }

  function paragrafos(texto) {
    return String(texto).trim().split(/\n\s*\n/).map(function (p) {
      return '<p>' + realcarRefs(esc(p.trim())) + '</p>';
    }).join('\n');
  }

  function incipit(texto, limite) {
    var t = String(texto).replace(/\s+/g, ' ').trim();
    if (t.length <= limite) return esc(t);
    var corte = t.slice(0, limite);
    corte = corte.slice(0, corte.lastIndexOf(' '));
    return esc(corte) + '…';
  }

  function guardar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) { /* modo privado */ }
  }
  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  /* ----------------------------- consultas ----------------------------- */

  function acharColecao(id) {
    for (var i = 0; i < dados.colecoes.length; i++) {
      if (dados.colecoes[i].id === id) return dados.colecoes[i];
    }
    return null;
  }

  function acharSermao(id) {
    for (var i = 0; i < dados.sermoes.length; i++) {
      if (dados.sermoes[i].id === id) return dados.sermoes[i];
    }
    return null;
  }

  function sermoesDe(colecaoId) {
    return dados.sermoes.filter(function (s) { return s.colecao === colecaoId; })
      .sort(function (a, b) { return a.ordem - b.ordem; });
  }

  /* Sequência linear de todos os pontos de uma coleção, para o "seguinte" */
  function sequencia(colecaoId) {
    var seq = [];
    sermoesDe(colecaoId).forEach(function (s) {
      s.pontos.forEach(function (p, i) {
        seq.push({ sermao: s, ponto: p, indice: i });
      });
    });
    return seq;
  }

  function posicaoNaSequencia(seq, sermaoId, n) {
    for (var i = 0; i < seq.length; i++) {
      if (seq[i].sermao.id === sermaoId && seq[i].ponto.n === n) return i;
    }
    return -1;
  }

  /* ----------------------------- páginas ----------------------------- */

  function paginaCapa() {
    var html = '<div class="folha capa">' +
      '<h1>Sermões</h1>' +
      '<p class="subtitulo">Padres e Doutores da Igreja em português</p>' +
      '<blockquote class="epigrafe">Preparai, pois, a garganta, não para o leite, mas para o pão.' +
      '<cite>São Bernardo, Sermão I</cite></blockquote>' +
      '</div><div class="folha">';

    var ult = retomada();
    if (ult) {
      html += '<a class="retomar" href="#/' + ult.rota + '">' +
        '<span class="rot">Continuar a leitura</span>' +
        '<span class="alvo">' + esc(ult.rotulo) + '</span></a>';
    }

    html += '<p class="secao-titulo">Coleções</p>';

    dados.colecoes.forEach(function (c) {
      var lista = sermoesDe(c.id);
      var pts = lista.reduce(function (a, s) { return a + s.pontos.length; }, 0);
      html += '<a class="cartao" href="#/c/' + c.id + '">' +
        '<p class="autor">' + esc(c.autor) + '</p>' +
        '<h2>' + esc(c.titulo) + '</h2>' +
        '<p>' + esc(c.resumo) + '</p>' +
        '<p class="meta">' + lista.length + (lista.length === 1 ? ' sermão' : ' sermões') +
        ' · ' + pts + ' pontos</p></a>';
    });

    html += '<div class="ornamento">❦</div></div>';
    return { html: html, titulo: 'Sermões', trilha: [] };
  }

  function paginaColecao(id) {
    var c = acharColecao(id);
    if (!c) return paginaErro();
    var lista = sermoesDe(id);

    var html = '<div class="folha"><div class="cabeca-sermao">' +
      '<p class="ordinal">' + esc(c.autor) + '</p>' +
      '<h1>' + esc(c.titulo) + '</h1>' +
      (c.periodo ? '<p class="sob">' + esc(c.periodo) + '</p>' : '') +
      '</div>';

    if (c.abertura) html += '<div class="texto">' + paragrafos(c.abertura) + '</div>';

    html += '<div class="ornamento">❦</div><p class="secao-titulo">Sermões</p>';

    lista.forEach(function (s) {
      html += '<a class="cartao" href="#/s/' + s.id + '">' +
        '<p class="autor">Sermão ' + esc(s.numero) + '</p>' +
        '<h2>' + esc(s.titulo) + '</h2>' +
        '<p class="meta">' + s.pontos.length + ' pontos</p></a>';
    });

    if (c.emAndamento) {
      html += '<p class="dica-teclado">' + esc(c.emAndamento) + '</p>';
    }

    html += '</div>';
    return {
      html: html,
      titulo: c.titulo + ' — Sermões',
      trilha: [{ rotulo: c.autor, href: '#/c/' + c.id }]
    };
  }

  function paginaSermao(id) {
    var s = acharSermao(id);
    if (!s) return paginaErro();
    var c = acharColecao(s.colecao);

    var html = '<div class="folha"><div class="cabeca-sermao">' +
      '<p class="ordinal">Sermão ' + esc(s.numero) + '</p>' +
      '<h1>' + esc(s.titulo) + '</h1>' +
      '<p class="sob">' + s.pontos.length + ' pontos' +
      (s.fonte ? ' · ' + esc(s.fonte) : '') + '</p></div>';

    if (s.argumento) html += '<div class="texto">' + paragrafos(s.argumento) + '</div>';

    html += '<div class="ornamento">❦</div><ol class="pontos">';
    s.pontos.forEach(function (p) {
      html += '<li><a href="#/s/' + s.id + '/' + p.n + '">' +
        '<span class="num">' + p.n + '</span>' +
        '<span class="incipit">' + incipit(p.texto, 120) + '</span></a></li>';
    });
    html += '</ol>';

    html += '<div class="acoes">' +
      '<a href="#/s/' + s.id + '/' + s.pontos[0].n + '">Começar a leitura →</a>' +
      '<a href="#/s/' + s.id + '/tudo">Ver o sermão inteiro</a>' +
      '</div>';

    var comNota = s.pontos.filter(function (p) { return p.nota; });
    if (comNota.length) {
      html += '<div class="nota"><h3>Notas do tradutor</h3>';
      comNota.forEach(function (p) {
        html += '<p><strong>' + p.n + '.</strong> ' + realcarRefs(esc(p.nota)) + '</p>';
      });
      html += '</div>';
    }

    html += '</div>';
    return {
      html: html,
      titulo: 'Sermão ' + s.numero + ' — ' + s.titulo,
      trilha: [
        { rotulo: c ? c.autor : '', href: '#/c/' + s.colecao },
        { rotulo: 'Sermão ' + s.numero, href: '#/s/' + s.id }
      ]
    };
  }

  function paginaPonto(id, n) {
    var s = acharSermao(id);
    if (!s) return paginaErro();
    var c = acharColecao(s.colecao);

    var idx = -1;
    for (var i = 0; i < s.pontos.length; i++) if (s.pontos[i].n === n) idx = i;
    if (idx < 0) return paginaErro();
    var p = s.pontos[idx];

    var html = '<article class="folha ponto">' +
      '<div class="ponto-cab">' +
      '<a href="#/s/' + s.id + '">Sermão ' + esc(s.numero) + '</a>' +
      '<span>Ponto ' + p.n + ' de ' + s.pontos.length + '</span>' +
      '</div>' +
      '<p class="numeral">' + p.n + '</p>' +
      '<div class="texto">' + paragrafos(p.texto) + '</div>';

    if (p.nota) {
      html += '<aside class="nota"><h3>Nota</h3>' +
        paragrafos(p.nota) + '</aside>';
    }

    /* Navegação: dentro do sermão e, nas extremidades, para o sermão vizinho */
    var seq = sequencia(s.colecao);
    var pos = posicaoNaSequencia(seq, s.id, p.n);
    var ant = pos > 0 ? seq[pos - 1] : null;
    var pro = pos >= 0 && pos < seq.length - 1 ? seq[pos + 1] : null;

    html += '<nav class="navegacao">';
    if (ant) {
      html += '<a href="#/s/' + ant.sermao.id + '/' + ant.ponto.n + '">' +
        '<span class="rotulo">‹ Anterior</span>' +
        (ant.sermao.id === s.id
          ? 'Ponto ' + ant.ponto.n
          : 'Sermão ' + esc(ant.sermao.numero) + ', ponto ' + ant.ponto.n) + '</a>';
    } else {
      html += '<a href="#/s/' + s.id + '"><span class="rotulo">‹ Anterior</span>Índice do sermão</a>';
    }
    if (pro) {
      html += '<a class="dir" href="#/s/' + pro.sermao.id + '/' + pro.ponto.n + '">' +
        '<span class="rotulo">Seguinte ›</span>' +
        (pro.sermao.id === s.id
          ? 'Ponto ' + pro.ponto.n
          : 'Sermão ' + esc(pro.sermao.numero) + ', ponto ' + pro.ponto.n) + '</a>';
    } else {
      html += '<a class="dir" href="#/c/' + s.colecao + '">' +
        '<span class="rotulo">Fim da coleção</span>Voltar ao índice</a>';
    }
    html += '</nav>' +
      '<p class="dica-teclado">Use as setas ← → do teclado, ou deslize o dedo.</p>' +
      '</article>';

    return {
      html: html,
      titulo: 'Sermão ' + s.numero + ', ponto ' + p.n + ' — ' + (c ? c.autor : 'Sermões'),
      trilha: [
        { rotulo: c ? c.autor : '', href: '#/c/' + s.colecao },
        { rotulo: 'Sermão ' + s.numero, href: '#/s/' + s.id },
        { rotulo: 'Ponto ' + p.n, href: null }
      ],
      progresso: (idx + 1) / s.pontos.length,
      memoria: {
        rota: 's/' + s.id + '/' + p.n,
        rotulo: 'Sermão ' + s.numero + ', ponto ' + p.n
      }
    };
  }

  function paginaCompleta(id) {
    var s = acharSermao(id);
    if (!s) return paginaErro();
    var c = acharColecao(s.colecao);

    var html = '<div class="folha completo"><div class="cabeca-sermao">' +
      '<p class="ordinal">' + (c ? esc(c.autor) + ' · ' : '') + 'Sermão ' + esc(s.numero) + '</p>' +
      '<h1>' + esc(s.titulo) + '</h1></div>';

    s.pontos.forEach(function (p) {
      html += '<section class="bloco">' +
        '<span class="marca-ponto">' + p.n + '</span>' +
        '<div class="texto">' + paragrafos(p.texto) + '</div></section>';
    });

    var comNota = s.pontos.filter(function (x) { return x.nota; });
    if (comNota.length) {
      html += '<div class="nota"><h3>Notas do tradutor</h3>';
      comNota.forEach(function (p) {
        html += '<p><strong>' + p.n + '.</strong> ' + realcarRefs(esc(p.nota)) + '</p>';
      });
      html += '</div>';
    }

    html += '<div class="acoes"><a href="#/s/' + s.id + '">← Voltar ao índice do sermão</a></div></div>';

    return {
      html: html,
      titulo: 'Sermão ' + s.numero + ' (inteiro) — ' + s.titulo,
      trilha: [
        { rotulo: c ? c.autor : '', href: '#/c/' + s.colecao },
        { rotulo: 'Sermão ' + s.numero, href: '#/s/' + s.id },
        { rotulo: 'Inteiro', href: null }
      ]
    };
  }

  function paginaErro() {
    return {
      html: '<div class="folha capa"><h1>Página não encontrada</h1>' +
        '<p class="subtitulo">O texto pedido não existe</p>' +
        '<p><a href="#/">Voltar à capa</a></p></div>',
      titulo: 'Não encontrado — Sermões',
      trilha: []
    };
  }

  /* ----------------------------- memória de leitura ----------------------------- */

  function retomada() {
    var bruto = ler(CHAVE_POS);
    if (!bruto) return null;
    try {
      var o = JSON.parse(bruto);
      return (o && o.rota && o.rotulo) ? o : null;
    } catch (e) { return null; }
  }

  /* ----------------------------- roteador ----------------------------- */

  function partes() {
    var h = location.hash.replace(/^#\/?/, '');
    return h.split('/').filter(function (x) { return x !== ''; }).map(decodeURIComponent);
  }

  function despachar() {
    var p = partes();
    var pag;

    if (p.length === 0) pag = paginaCapa();
    else if (p[0] === 'c' && p[1]) pag = paginaColecao(p[1]);
    else if (p[0] === 's' && p[1] && p[2] === 'tudo') pag = paginaCompleta(p[1]);
    else if (p[0] === 's' && p[1] && p[2]) pag = paginaPonto(p[1], parseInt(p[2], 10));
    else if (p[0] === 's' && p[1]) pag = paginaSermao(p[1]);
    else pag = paginaErro();

    var app = document.getElementById('app');
    app.innerHTML = pag.html;
    document.title = pag.titulo;

    /* trilha */
    var trilha = document.getElementById('trilha');
    if (pag.trilha && pag.trilha.length) {
      trilha.innerHTML = pag.trilha.map(function (t, i) {
        var sep = i ? '<span class="sep">/</span>' : '';
        return sep + (t.href ? '<a href="' + t.href + '">' + esc(t.rotulo) + '</a>' : esc(t.rotulo));
      }).join('');
    } else {
      trilha.innerHTML = '';
    }

    /* barra de progresso */
    var barra = document.getElementById('progresso');
    if (typeof pag.progresso === 'number') {
      barra.hidden = false;
      barra.firstElementChild.style.width = Math.round(pag.progresso * 100) + '%';
    } else {
      barra.hidden = true;
      barra.firstElementChild.style.width = '0%';
    }

    /* memória de onde parou */
    if (pag.memoria) guardar(CHAVE_POS, JSON.stringify(pag.memoria));

    window.scrollTo(0, 0);
    if (pag.memoria) app.focus({ preventScroll: true });
  }

  /* ----------------------------- teclado e toque ----------------------------- */

  function irPara(direcao) {
    var links = document.querySelectorAll('.navegacao a');
    if (!links.length) return;
    var alvo = direcao < 0 ? links[0] : links[links.length - 1];
    if (alvo && alvo.getAttribute('href')) location.hash = alvo.getAttribute('href').slice(1);
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var alvo = e.target.tagName;
    if (alvo === 'INPUT' || alvo === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft')  irPara(-1);
    if (e.key === 'ArrowRight') irPara(1);
  });

  var toqueX = null, toqueY = null;
  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { toqueX = null; return; }
    toqueX = e.touches[0].clientX;
    toqueY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (toqueX === null) return;
    var dx = e.changedTouches[0].clientX - toqueX;
    var dy = e.changedTouches[0].clientY - toqueY;
    toqueX = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) irPara(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ----------------------------- tema ----------------------------- */

  function aplicarTema(t) {
    if (t) document.documentElement.setAttribute('data-tema', t);
    else document.documentElement.removeAttribute('data-tema');
  }

  function alternarTema() {
    var atual = document.documentElement.getAttribute('data-tema');
    var escuroDoSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var novo;
    if (!atual) novo = escuroDoSistema ? 'claro' : 'escuro';
    else novo = atual === 'escuro' ? 'claro' : 'escuro';
    aplicarTema(novo);
    guardar(CHAVE_TEMA, novo);
  }

  /* ----------------------------- arranque ----------------------------- */

  aplicarTema(ler(CHAVE_TEMA));

  document.addEventListener('DOMContentLoaded', function () {
    aplicarTema(ler(CHAVE_TEMA));
    document.getElementById('tema').addEventListener('click', alternarTema);
    window.addEventListener('hashchange', despachar);
    despachar();
  });
})();
