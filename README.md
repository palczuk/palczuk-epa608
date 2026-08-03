# PALCZUK EPA 608 Study Guide

Site estático de estudos para a certificação **EPA Section 608** (Core, Type I, Type II, Type III e Universal),
construído em HTML + CSS + JS puro, com conteúdo dirigido por JSON. Sem build step — funciona direto no
GitHub Pages ou em qualquer hospedagem estática.

## Bilíngue (PT/EN)

O site tem um botão de idioma (PT/EN) no topo. Toda a interface, ficha de fatos e simulado trocam de idioma
sem recarregar a página. A escolha de idioma fica salva no navegador (localStorage).

## Fonte do conteúdo

Fatos e questões foram revisados e corrigidos com base no *EPA 608 Certification Study Guide* oficial (PDF em
inglês) fornecido pelo autor — datas, tabela de evacuação, taxas de vazamento e demais números seguem
exatamente esse documento. Cobertura completa inclui: óleos de refrigeração, blends/fractionation, ciclo de
refrigeração, ferramentas de detecção de vazamento, manômetros (manifold), evacuação/microns, técnicas de
recuperação, decomposição térmica, substitutos/drop-ins, e definições oficiais completas (appliance, technician,
apprentice, MVAC-like, refrigerant circuit, major repair, opening). Total: 86 perguntas por idioma (172 no
total) — Core 31, Type I 15, Type II 20, Type III 20. As perguntas foram reescritas com palavras próprias (não
copiadas literalmente do PDF), mas testam os mesmos fatos e números.

## Painel de prioridades (sticky)

Um botão flutuante "★ Prioridades" no canto inferior direito abre um painel fixo com os ~9 fatos mais cobrados
na prova (nota de corte, datas-chave, taxas de vazamento, limite de recuperação passiva, armadilha de unidade
Type II vs III, vácuo profundo, penalidades). Fica disponível em qualquer parte da página, nos dois idiomas.

## Estrutura

```
palczuk-epa608/
├── index.html          # página única com todas as seções
├── css/styles.css       # design system (tema "manual de campo / blueprint")
├── js/app.js             # navegação, gauge animado, i18n, motor do simulado, leitura dos JSON
├── data/
│   ├── i18n.json         # dicionário de textos da interface (pt/en)
│   ├── questions.json    # banco de questões por seção e idioma (pt.core, en.core, ...)
│   └── facts.json        # ficha de fatos-chave por idioma (pt.keyDates, en.keyDates, ...)
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

- **Adicionar/editar perguntas do simulado**: edite `data/questions.json`. Estrutura: `{ "pt": { "core": [...], "type1": [...], ... }, "en": { ... } }`. Cada pergunta é `{ q, options[], answer (índice correto), explain }` — mantenha o mesmo número de perguntas em pt e en para os melhores resultados ficarem comparáveis.
- **Atualizar a ficha de fatos**: edite `data/facts.json`, também com chaves `pt`/`en`. Cada grupo é uma lista de `{ label, value }`.
- **Atualizar textos da interface**: edite `data/i18n.json` — cada chave tem `{ "pt": "...", "en": "..." }`.
- Nenhuma mudança de conteúdo exige tocar em `index.html`, `styles.css` ou `app.js` — a página lê os JSON em
  tempo de execução.

## Progresso salvo

O simulado salva a melhor pontuação e o número de tentativas por seção no `localStorage` do navegador
(chaves prefixadas com `palczuk-epa608:`). Isso é local ao navegador/dispositivo — não há backend nem conta.

## Aviso

Conteúdo de estudo pessoal, sem afiliação com a EPA ou qualquer organização certificadora. Números críticos
(datas, níveis de evacuação, percentuais de recuperação) devem ser sempre conferidos contra o material oficial
da sua organização certificadora antes do exame — regulamentos podem mudar.