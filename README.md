# PALCZUK EPA 608 Study Guide

Site estático de estudos para a certificação **EPA Section 608** (Core, Type I, Type II, Type III e Universal),
construído em HTML + CSS + JS puro, com conteúdo dirigido por JSON. Sem build step — funciona direto no
GitHub Pages ou em qualquer hospedagem estática.

## Estrutura

```
palczuk-epa608/
├── index.html          # página única com todas as seções
├── css/styles.css       # design system (tema "manual de campo / blueprint")
├── js/app.js             # navegação, gauge animado, motor do simulado, leitura dos JSON
├── data/
│   ├── questions.json   # banco de questões por seção (core, type1, type2, type3)
│   └── facts.json       # ficha de fatos-chave (datas, níveis de evacuação, etc.)
└── README.md
```

## Rodando localmente

Como o site usa `fetch()` para carregar os arquivos JSON, ele precisa rodar via HTTP (não abrir o `index.html`
direto com `file://`). Qualquer servidor estático simples funciona:

```bash
# Python
python3 -m http.server 8000

# ou Node
npx serve .
```

Depois acesse `http://localhost:8000`.

## Publicando no GitHub Pages

1. Suba esta pasta como repositório no GitHub.
2. Em **Settings → Pages**, selecione a branch principal e a raiz (`/`) como fonte.
3. O site fica disponível em `https://<seu-usuario>.github.io/<repo>/`.

## Editando o conteúdo

- **Adicionar/editar perguntas do simulado**: edite `data/questions.json`. Cada seção (`core`, `type1`, `type2`,
  `type3`) é uma lista de objetos `{ q, options[], answer (índice correto), explain }`.
- **Atualizar a ficha de fatos**: edite `data/facts.json`. Cada grupo é uma lista de `{ label, value }`.
- Nenhuma mudança de conteúdo exige tocar em `index.html`, `styles.css` ou `app.js` — a página lê os JSON em
  tempo de execução.

## Progresso salvo

O simulado salva a melhor pontuação e o número de tentativas por seção no `localStorage` do navegador
(chaves prefixadas com `palczuk-epa608:`). Isso é local ao navegador/dispositivo — não há backend nem conta.

## Aviso

Conteúdo de estudo pessoal, sem afiliação com a EPA ou qualquer organização certificadora. Números críticos
(datas, níveis de evacuação, percentuais de recuperação) devem ser sempre conferidos contra o material oficial
da sua organização certificadora antes do exame — regulamentos podem mudar.
