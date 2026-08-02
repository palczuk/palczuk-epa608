/* PALCZUK EPA 608 Study Guide — app.js
   Dynamic behavior: nav, gauge, fact sheet render, quiz engine with localStorage progress.
   Data lives in /data/questions.json and /data/facts.json so content can be updated
   without touching markup or logic. */

const STORAGE_PREFIX = 'palczuk-epa608:';

/* ---------------- Mobile nav ---------------- */
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');
navToggle?.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
document.querySelectorAll('.topbar__nav a').forEach(a => {
  a.addEventListener('click', () => siteNav.classList.remove('is-open'));
});

/* Active-link highlight on scroll */
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.topbar__nav a')];
const highlightNav = () => {
  let current = sections[0]?.id;
  const y = window.scrollY + 120;
  for (const s of sections) {
    if (s.offsetTop <= y) current = s.id;
  }
  navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${current}`));
};
window.addEventListener('scroll', highlightNav, { passive: true });
highlightNav();

/* ---------------- Gauge: draw ticks + animate needle on load ---------------- */
(function buildGauge() {
  const ticksGroup = document.querySelector('.gauge__ticks');
  if (!ticksGroup) return;
  const cx = 150, cy = 150, rOuter = 132, rInner = 122;
  // sweep from -120deg to +120deg (240deg total), 4 sections => 5 major ticks
  const startAngle = -120, endAngle = 120, steps = 16;
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + ((endAngle - startAngle) * i) / steps;
    const rad = (angle * Math.PI) / 180;
    const isMajor = i % 4 === 0;
    const rIn = isMajor ? rInner - 10 : rInner;
    const x1 = cx + rIn * Math.sin(rad), y1 = cy - rIn * Math.cos(rad);
    const x2 = cx + rOuter * Math.sin(rad), y2 = cy - rOuter * Math.cos(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke-width', isMajor ? 2.5 : 1.2);
    ticksGroup.appendChild(line);
  }
  // Animate needle from resting (-120deg equiv, pointing left-ish) to a "4 sections ready" position
  const needle = document.getElementById('gaugeNeedle');
  requestAnimationFrame(() => {
    setTimeout(() => { needle.style.transform = 'rotate(35deg)'; }, 300);
  });
})();

/* ---------------- Fact sheet + exam structure: fetch facts.json ---------------- */
async function loadFacts() {
  try {
    const res = await fetch('data/facts.json');
    const facts = await res.json();

    // exam structure cards (top summary)
    const grid = document.getElementById('examStructureGrid');
    if (grid) {
      grid.innerHTML = facts.examStructure.map(item => `
        <div class="factcard">
          <span class="factcard__label">${escapeHTML(item.label)}</span>
          <span class="factcard__value">${escapeHTML(item.value)}</span>
        </div>
      `).join('');
    }

    // fact sheet groups
    const sheet = document.getElementById('factSheet');
    if (sheet) {
      const groups = [
        { title: 'Datas-chave', items: facts.keyDates },
        { title: 'Recuperação — Type I', items: facts.recoveryType1 },
        { title: 'Níveis de evacuação', items: facts.evacuationLevels },
        { title: 'Os três Rs', items: facts.threeRs },
        { title: 'Reparo de vazamentos', items: facts.leakRepair },
        { title: 'Armadilhas de unidade', items: facts.unitTraps },
      ];
      sheet.innerHTML = groups.map(g => `
        <div class="factsheet__group">
          <h4>${escapeHTML(g.title)}</h4>
          <dl>
            ${g.items.map(it => `
              <div class="factsheet__row">
                <dt>${escapeHTML(it.label)}</dt>
                <dd>${escapeHTML(it.value)}</dd>
              </div>
            `).join('')}
          </dl>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Não foi possível carregar data/facts.json', err);
    const grid = document.getElementById('examStructureGrid');
    if (grid) grid.innerHTML = `<p>Não foi possível carregar os fatos. Se você abriu este arquivo direto do disco (file://), rode um servidor local (ex: <code>npx serve</code>) ou publique no GitHub Pages.</p>`;
  }
}
loadFacts();

/* ---------------- Tabs (Type I/II/III) ---------------- */
document.querySelectorAll('.tabs__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tabs__btn').forEach(b => b.classList.toggle('is-active', b === btn));
    document.querySelectorAll('.tabs__panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === target));
  });
});

/* ---------------- Quiz engine ---------------- */
let questionBank = null;
let currentSection = null;
let currentSet = [];
let currentIndex = 0;
let currentScore = 0;
let answeredThisQuestion = false;

const sectionLabels = { core: 'Core', type1: 'Type I', type2: 'Type II', type3: 'Type III' };

async function getQuestionBank() {
  if (questionBank) return questionBank;
  const res = await fetch('data/questions.json');
  questionBank = await res.json();
  return questionBank;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bestScoreKey(section) { return `${STORAGE_PREFIX}best:${section}`; }
function attemptsKey(section) { return `${STORAGE_PREFIX}attempts:${section}`; }

function getBest(section) {
  const raw = localStorage.getItem(bestScoreKey(section));
  return raw ? JSON.parse(raw) : null;
}

function updateBestDisplay(section) {
  const el = document.getElementById('quizBest');
  const best = getBest(section);
  const attempts = Number(localStorage.getItem(attemptsKey(section)) || 0);
  if (!el) return;
  el.textContent = best
    ? `Melhor resultado (${sectionLabels[section]}): ${best.score}/${best.total} · tentativas: ${attempts}`
    : `Sem tentativas salvas para ${sectionLabels[section]} ainda.`;
}

const sectionSelect = document.getElementById('sectionSelect');
const startBtn = document.getElementById('startQuiz');
const quizBody = document.getElementById('quizBody');

sectionSelect?.addEventListener('change', () => updateBestDisplay(sectionSelect.value));
updateBestDisplay(sectionSelect?.value || 'core');

startBtn?.addEventListener('click', async () => {
  currentSection = sectionSelect.value;
  const bank = await getQuestionBank();
  const pool = bank[currentSection] || [];
  currentSet = shuffle(pool);
  currentIndex = 0;
  currentScore = 0;
  updateBestDisplay(currentSection);
  renderQuestion();
});

function renderQuestion() {
  answeredThisQuestion = false;
  const total = currentSet.length;
  if (currentIndex >= total) {
    renderResult();
    return;
  }
  const q = currentSet[currentIndex];
  const pct = Math.round((currentIndex / total) * 100);

  quizBody.innerHTML = `
    <div class="q-progress"><div class="q-progress__bar" style="width:${pct}%"></div></div>
    <div class="q-card">
      <span class="q-card__index">Questão ${currentIndex + 1} de ${total} · ${sectionLabels[currentSection]}</span>
      <p class="q-card__question">${escapeHTML(q.q)}</p>
      <div class="q-card__options">
        ${q.options.map((opt, i) => `
          <button class="q-option" data-idx="${i}">${escapeHTML(opt)}</button>
        `).join('')}
      </div>
      <div class="q-explain" id="qExplain">${escapeHTML(q.explain)}</div>
    </div>
    <div class="quiz__nextwrap">
      <button class="btn btn--primary btn--sm" id="nextBtn" style="display:none;">
        ${currentIndex + 1 === total ? 'Ver resultado' : 'Próxima pergunta'}
      </button>
    </div>
  `;

  const optionButtons = quizBody.querySelectorAll('.q-option');
  optionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (answeredThisQuestion) return;
      answeredThisQuestion = true;
      const chosen = Number(btn.dataset.idx);
      const correctIdx = q.answer;
      optionButtons.forEach(b => b.setAttribute('disabled', 'true'));
      if (chosen === correctIdx) {
        btn.classList.add('is-correct');
        currentScore++;
      } else {
        btn.classList.add('is-wrong');
        optionButtons[correctIdx].classList.add('is-correct');
      }
      document.getElementById('qExplain').classList.add('is-visible');
      document.getElementById('nextBtn').style.display = 'inline-block';
    });
  });

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    currentIndex++;
    renderQuestion();
  });
}

function renderResult() {
  const total = currentSet.length;
  const pct = Math.round((currentScore / total) * 100);
  const passed = pct >= 70;

  // persist best + attempts
  const best = getBest(currentSection);
  if (!best || currentScore > best.score) {
    localStorage.setItem(bestScoreKey(currentSection), JSON.stringify({ score: currentScore, total, pct }));
  }
  const attempts = Number(localStorage.getItem(attemptsKey(currentSection)) || 0) + 1;
  localStorage.setItem(attemptsKey(currentSection), String(attempts));
  updateBestDisplay(currentSection);

  quizBody.innerHTML = `
    <div class="q-result">
      <div class="q-result__score">${currentScore}/${total}</div>
      <div class="q-result__label">${pct}% · ${sectionLabels[currentSection]} · ${passed ? 'ACIMA da linha de corte (70%)' : 'ABAIXO da linha de corte (70%)'}</div>
      <p class="q-result__msg">${passed
        ? 'Bom sinal — revise as questões erradas na ficha de fatos e mantenha a prática distribuída ao longo da semana.'
        : 'Ainda não é hora do exame real nesta seção. Volte à ficha de fatos e ao Core/Type correspondente antes de tentar de novo.'}</p>
      <button class="btn btn--primary btn--sm" id="retryBtn">Tentar novamente</button>
    </div>
  `;
  document.getElementById('retryBtn')?.addEventListener('click', () => startBtn.click());
}

/* ---------------- utils ---------------- */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
