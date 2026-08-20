# Sermões

Sítio de leitura de sermões dos Padres e Doutores da Igreja em tradução portuguesa.
Um ponto por página, navegando de ponto em ponto.

Primeira coleção: **São Bernardo de Claraval — Sermões sobre o Cântico dos Cânticos**.

## Como funciona

Site estático puro: HTML, CSS e um arquivo de JavaScript. Sem build, sem dependências,
sem npm. Basta abrir o `index.html` no navegador — funciona até sem servidor.

```
index.html                        página única; lista os arquivos de conteúdo
css/estilo.css                    toda a aparência
js/app.js                         roteador e renderização
conteudo/colecoes.js              dados das coleções (autor, título, apresentação)
conteudo/bernardo-cantico/        um arquivo por sermão
netlify.toml                      configuração de publicação
```

As rotas usam `#` (por exemplo `#/s/bernardo-cantico-02/3`), de modo que qualquer
hospedagem estática serve, sem precisar de regras de reescrita.

## Publicar no Netlify

1. Suba os arquivos para `github.com/gereneto/sermoes`.
2. No Netlify: **Add new site → Import an existing project** e escolha o repositório.
3. Deixe o comando de build vazio e o **publish directory** como `.` (o `netlify.toml`
   já traz isso). Publique.

Cada `git push` republica o sítio.

## Acrescentar um sermão novo

1. Copie um arquivo existente em `conteudo/bernardo-cantico/` com o próximo número,
   por exemplo `sermao-03.js`.
2. Ajuste os campos:

```js
SERMOES.sermao({
  id: 'bernardo-cantico-03',      // único no sítio inteiro
  colecao: 'bernardo-cantico',
  ordem: 3,                        // define a ordem de leitura
  numero: 'III',                   // como aparece na tela
  titulo: 'Do beijo do pé, da mão e da boca do Senhor',
  fonte: 'De osculo pedis, manus et oris Domini',
  argumento: `Apresentação do sermão (opcional).`,
  pontos: [
    { n: 1, texto: `Texto do ponto 1.

Parágrafos separados por uma linha em branco.`, nota: `Nota do tradutor (opcional).` },
    { n: 2, texto: `Texto do ponto 2.` }
  ]
});
```

3. Acrescente a linha correspondente no `index.html`, junto das outras:

```html
<script defer src="conteudo/bernardo-cantico/sermao-03.js"></script>
```

Pronto — o sermão aparece no índice, entra na numeração dos pontos e liga-se
automaticamente ao anterior e ao seguinte.

### Detalhes de formatação

- Use crases (`` ` ``) para abrir e fechar o texto; assim pode escrever livremente
  em várias linhas.
- Referências entre parênteses no padrão `(Ct 1,1)`, `(1Cor 2,13.6)`, `(cf. Jo 4,14)`
  são realçadas sozinhas — não é preciso marcar nada.
- Aspas: prefira `«…»`, como no resto do sítio.

## Acrescentar uma coleção nova

Registre-a em `conteudo/colecoes.js` seguindo o modelo, crie a pasta em `conteudo/`
e inclua os arquivos no `index.html`. A capa passa a mostrar as duas coleções.

## Leitura

- Setas `←` e `→` do teclado passam de ponto em ponto, atravessando a fronteira
  entre sermões.
- No celular, deslizar o dedo faz o mesmo.
- O botão `◐` no alto alterna tema claro e escuro.
- O sítio guarda no navegador o último ponto lido e oferece «Continuar a leitura»
  na capa.
- Cada sermão tem também uma versão corrida (`Ver o sermão inteiro`), própria
  para imprimir.

## Textos

Os originais latinos estão em domínio público. As traduções portuguesas foram
feitas para este sítio.
