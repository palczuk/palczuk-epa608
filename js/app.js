/* PALCZUK EPA 608 Study Guide — app.js
   Dynamic behavior: nav, gauge, i18n language toggle (PT/EN), fact sheet render,
   quiz engine with localStorage progress.
   Data lives in data/i18n.json, data/facts.json, data/questions.json (each with
   "pt" and "en" content) so nothing needs to be duplicated in markup. */

const STORAGE_PREFIX = 'palczuk-epa608:';
const LANG_KEY = `${STORAGE_PREFIX}lang`;

let currentLang = localStorage.getItem(LANG_KEY) || 'pt';
let i18nDict = null;
let factsData = null;

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
  const needle = document.getElementById('gaugeNeedle');
  requestAnimationFrame(() => {
    setTimeout(() => { needle.style.transform = 'rotate(35deg)'; }, 300);
  });
})();

/* ---------------- i18n ---------------- */
async function loadI18n() {
  if (i18nDict) return i18nDict;
  const res = await fetch('data/i18n.json');
  i18nDict = await res.json();
  return i18nDict;
}

function t(key, vars) {
  const entry = i18nDict?.[key];
  let str = entry ? (entry[currentLang] ?? entry.pt ?? key) : key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return str;
}

function applyStaticTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18nDict[key]) {
      el.innerHTML = t(key);
    }
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    const [attr, key] = el.getAttribute('data-i18n-attr').split(':');
    if (i18nDict[key]) {
      el.setAttribute(attr, t(key));
    }
  });
  document.documentElement.setAttribute('lang', currentLang === 'pt' ? 'pt-BR' : 'en');
}

async function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });
  await loadI18n();
  applyStaticTranslations();
  renderFactSheet();
  resetQuizToPlaceholder();
}

document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.lang !== currentLang) setLanguage(btn.dataset.lang);
  });
});

/* ---------------- Facts: fetch facts.json (bilingual) ---------------- */
async function loadFactsData() {
  if (factsData) return factsData;
  const res = await fetch('data/facts.json');
  factsData = await res.json();
  return factsData;
}

async function renderFactSheet() {
  try {
    const all = await loadFactsData();
    const facts = all[currentLang] || all.pt;

    const grid = document.getElementById('examStructureGrid');
    if (grid) {
      grid.innerHTML = facts.examStructure.map(item => `
        <div class="factcard">
          <span class="factcard__label">${escapeHTML(item.label)}</span>
          <span class="factcard__value">${escapeHTML(item.value)}</span>
        </div>
      `).join('');
    }

    const sheet = document.getElementById('factSheet');
    if (sheet) {
      const groups = [
        { titleKey: 'facts.group.dates', items: facts.keyDates },
        { titleKey: 'facts.group.recoveryType1', items: facts.recoveryType1 },
        { titleKey: 'facts.group.evacuation', items: facts.evacuationLevels },
        { titleKey: 'facts.group.threeRs', items: facts.threeRs },
        { titleKey: 'facts.group.leakRepair', items: facts.leakRepair },
        { titleKey: 'facts.group.cylinders', items: facts.cylindersAndShipping },
        { titleKey: 'facts.group.safety', items: facts.safetyStandards },
        { titleKey: 'facts.group.penalties', items: facts.penalties },
        { titleKey: 'facts.group.unitTraps', items: facts.unitTraps },
        { titleKey: 'facts.group.definitions', items: facts.definitions },
      ];
      sheet.innerHTML = groups.map(g => `
        <div class="factsheet__group">
          <h4>${escapeHTML(t(g.titleKey))}</h4>
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
    console.error('Could not load data/facts.json', err);
    const grid = document.getElementById('examStructureGrid');
    if (grid) grid.innerHTML = `<p>Could not load fact data. If you opened this file directly from disk (file://), run a local server (e.g. <code>npx serve</code>) or publish it on GitHub Pages.</p>`;
  }
}

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

function sectionLabel(section) {
  return t(`js.sectionLabels.${section}`);
}

function updateBestDisplay(section) {
  const el = document.getElementById('quizBest');
  const best = getBest(section);
  const attempts = Number(localStorage.getItem(attemptsKey(section)) || 0);
  if (!el) return;
  el.textContent = best
    ? t('js.quiz.bestWithData', { section: sectionLabel(section), score: best.score, total: best.total, attempts })
    : t('js.quiz.bestEmpty', { section: sectionLabel(section) });
}

const sectionSelect = document.getElementById('sectionSelect');
const startBtn = document.getElementById('startQuiz');
const quizBody = document.getElementById('quizBody');

sectionSelect?.addEventListener('change', () => updateBestDisplay(sectionSelect.value));

function resetQuizToPlaceholder() {
  currentSection = null;
  currentSet = [];
  currentIndex = 0;
  currentScore = 0;
  if (quizBody) {
    quizBody.innerHTML = `<p class="quiz__placeholder">${escapeHTML(t('quiz.placeholder'))}</p>`;
  }
  if (sectionSelect) updateBestDisplay(sectionSelect.value);
}

startBtn?.addEventListener('click', async () => {
  currentSection = sectionSelect.value;
  const bank = await getQuestionBank();
  const pool = (bank[currentLang] && bank[currentLang][currentSection]) || [];
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
      <span class="q-card__index">${escapeHTML(t('js.quiz.questionOf', { n: currentIndex + 1, total, section: sectionLabel(currentSection) }))}</span>
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
        ${currentIndex + 1 === total ? escapeHTML(t('js.quiz.seeResult')) : escapeHTML(t('js.quiz.next'))}
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
      <div class="q-result__label">${pct}% · ${escapeHTML(sectionLabel(currentSection))} · ${escapeHTML(passed ? t('js.quiz.above') : t('js.quiz.below'))}</div>
      <p class="q-result__msg">${escapeHTML(passed ? t('js.quiz.passMsg') : t('js.quiz.failMsg'))}</p>
      <button class="btn btn--primary btn--sm" id="retryBtn">${escapeHTML(t('js.quiz.retry'))}</button>
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

/* ---------------- boot ---------------- */
(async function init() {
  await loadI18n();
  document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === currentLang);
  });
  applyStaticTranslations();
  await renderFactSheet();
  resetQuizToPlaceholder();
})();
