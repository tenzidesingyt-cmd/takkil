/* Тактиль — логика тренажёра */

(() => {
  'use strict';

  const STORAGE_KEY = 'tactile.v1';

  const DEFAULT_SETTINGS = {
    layout: 'ru',
    sound: false,
    keyboard: true,
    fingerColors: true,
    fontSize: 22
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[ch]));
  }

  function pick(list) {
    return list[(Math.random() * list.length) | 0];
  }

  /* ---------- Хранилище ---------- */

  function loadStore() {
    const fallback = {
      settings: Object.assign({}, DEFAULT_SETTINGS),
      progress: { lessons: {}, free: {}, totals: { sessions: 0, seconds: 0, chars: 0 } }
    };

    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (error) {
      return fallback;
    }
    if (!raw || typeof raw !== 'object') return fallback;

    const settings = Object.assign({}, DEFAULT_SETTINGS, raw.settings || {});
    if (!['ru', 'en'].includes(settings.layout)) settings.layout = 'ru';
    settings.fontSize = clamp(Number(settings.fontSize) || 22, 18, 32);
    settings.sound = Boolean(settings.sound);
    settings.keyboard = settings.keyboard !== false;
    settings.fingerColors = settings.fingerColors !== false;

    const rawProgress = raw.progress && typeof raw.progress === 'object' ? raw.progress : {};
    const progress = {
      lessons: rawProgress.lessons && typeof rawProgress.lessons === 'object' ? rawProgress.lessons : {},
      free: rawProgress.free && typeof rawProgress.free === 'object' ? rawProgress.free : {},
      totals: Object.assign({ sessions: 0, seconds: 0, chars: 0 }, rawProgress.totals || {})
    };

    return { settings, progress };
  }

  const store = loadStore();
  const settings = store.settings;
  const progress = store.progress;

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, progress }));
    } catch (error) {
      /* приватный режим или переполнение — молча продолжаем */
    }
  }

  /* ---------- Состояние ---------- */

  const state = {
    view: 'home',
    mode: 'lesson',
    lessonId: null,
    lesson: null,
    text: '',
    index: 0,
    correct: 0,
    errors: 0,
    startedAt: 0,
    timer: null,
    finished: false,
    charEls: [],
    charToKey: {},
    shiftEls: [],
    nextEls: new Set(),
    spaceEl: null,
    virtualShift: false
  };

  let audioCtx = null;
  let toastTimer = null;
  let resetTimer = null;
  let confettiFrame = 0;

  const lessonsFor = (layout) => LESSONS.filter((lesson) => lesson.layout === layout);

  /* ---------- Форматирование ---------- */

  function formatClock(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function formatDuration(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const minutes = Math.floor(sec / 60);
    if (minutes < 1) return '0 мин';
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
  }

  function elapsedSeconds() {
    return state.startedAt ? (Date.now() - state.startedAt) / 1000 : 0;
  }

  function accuracy() {
    const total = state.correct + state.errors;
    return total ? Math.round((state.correct / total) * 100) : 100;
  }

  function speed() {
    const seconds = elapsedSeconds();
    if (seconds < 1) return 0;
    return Math.round(state.correct / (seconds / 60));
  }

  /* ---------- Генерация текста ---------- */

  function buildLessonText(lesson) {
    const target = lesson.length || 200;
    const parts = [];
    let length = 0;
    let guard = 0;

    while (length < target && guard < 300) {
      guard += 1;
      let token;

      if (lesson.sentences && lesson.sentences.length) {
        token = lesson.words && Math.random() < 0.18 ? pick(lesson.words) : pick(lesson.sentences);
      } else if (lesson.words && lesson.words.length) {
        token = lesson.drills && Math.random() < 0.55 ? pick(lesson.drills) : pick(lesson.words);
      } else if (lesson.drills && lesson.drills.length) {
        token = pick(lesson.drills);
      } else {
        break;
      }

      parts.push(token);
      length += token.length + 1;
    }

    return parts.join(' ');
  }

  function buildFreeText() {
    const bank = FREE_TEXTS[settings.layout] || FREE_TEXTS.ru;
    const parts = [];
    let length = 0;
    let last = '';

    while (length < 330) {
      let sentence = pick(bank);
      if (sentence === last) sentence = pick(bank);
      last = sentence;
      parts.push(sentence);
      length += sentence.length + 1;
    }

    return parts.join(' ');
  }

  /* ---------- Главный экран ---------- */

  function renderHomeStats() {
    const list = lessonsFor(settings.layout);
    let completed = 0;
    let bestWpm = 0;
    let bestAcc = 0;

    list.forEach((lesson) => {
      const record = progress.lessons[lesson.id];
      if (!record) return;
      if (record.runs) completed += 1;
      bestWpm = Math.max(bestWpm, Number(record.wpm) || 0);
      bestAcc = Math.max(bestAcc, Number(record.acc) || 0);
    });

    const free = progress.free[settings.layout];
    if (free) {
      bestWpm = Math.max(bestWpm, Number(free.wpm) || 0);
      bestAcc = Math.max(bestAcc, Number(free.acc) || 0);
    }

    setStatValue('statBestWpm', bestWpm, '—');
    setStatValue('statBestAcc', bestAcc ? Math.round(bestAcc) : 0, '—');
    $('statLessons').textContent = `${completed} / ${list.length}`;
    $('statTime').textContent = formatDuration(Number(progress.totals.seconds) || 0);
    $('homeProgressLabel').textContent = `${completed} из ${list.length}`;
    $('homeProgress').style.width = list.length ? `${(completed / list.length) * 100}%` : '0%';
  }

  function setStatValue(id, value, fallback) {
    const element = $(id);
    const isEmpty = !value;
    element.textContent = isEmpty ? fallback : String(value);
    element.classList.toggle('is-empty', isEmpty);
  }

  function starsHtml(stars) {
    return [1, 2, 3]
      .map((n) => `<span class="${n <= stars ? 'on' : ''}">★</span>`)
      .join('');
  }

  function renderLessons() {
    const grid = $('lessonsGrid');
    const list = lessonsFor(settings.layout);
    grid.textContent = '';

    let recommendedAssigned = false;

    list.forEach((lesson, index) => {
      const record = progress.lessons[lesson.id] || {};
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lesson-card';

      if (!recommendedAssigned && !record.runs) {
        card.classList.add('recommended');
        recommendedAssigned = true;
      }

      const tags = (lesson.tags || [])
        .map((tag) => `<kbd>${escapeHtml(tag)}</kbd>`)
        .join('');

      card.innerHTML = `
        <span class="lesson-index">УРОК ${String(index + 1).padStart(2, '0')}</span>
        <span class="lesson-stars">${starsHtml(Number(record.stars) || 0)}</span>
        <h3>${escapeHtml(lesson.title)}</h3>
        <p class="lesson-sub">${escapeHtml(lesson.subtitle)}</p>
        <div class="lesson-tags">${tags}</div>
        <div class="lesson-foot">
          <span class="lesson-best">${record.runs ? `рекорд ${Number(record.wpm) || 0} зн/мин` : 'ещё не пройден'}</span>
          <span class="lesson-arrow">→</span>
        </div>
      `;

      card.addEventListener('click', () => startTrainer(lesson.id));
      grid.appendChild(card);
    });

    const free = progress.free[settings.layout] || {};
    const freeCard = document.createElement('button');
    freeCard.type = 'button';
    freeCard.className = 'lesson-card free';
    freeCard.innerHTML = `
      <span class="lesson-index">ПРАКТИКА</span>
      <h3>Свободный режим</h3>
      <p class="lesson-sub">Любой текст · без ограничений</p>
      <div class="lesson-tags"><kbd>∞</kbd><kbd>ритм</kbd><kbd>поток</kbd></div>
      <div class="lesson-foot">
        <span class="lesson-best">${free.wpm ? `рекорд ${Number(free.wpm)} зн/мин` : 'свободная практика'}</span>
        <span class="lesson-arrow">→</span>
      </div>
    `;
    freeCard.addEventListener('click', () => startTrainer('free'));
    grid.appendChild(freeCard);
  }

  function setLayout(layout, initial = false) {
    if (!['ru', 'en'].includes(layout)) layout = 'ru';

    if (!initial && state.view === 'trainer') {
      showToast('Заверши тренировку, чтобы сменить раскладку');
      return;
    }

    settings.layout = layout;
    saveStore();

    $$('.seg-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.layout === layout);
    });

    renderLessons();
    renderHomeStats();
  }

  function startRecommended() {
    const list = lessonsFor(settings.layout);
    const next = list.find((lesson) => !(progress.lessons[lesson.id] && progress.lessons[lesson.id].runs)) || list[0];
    if (next) startTrainer(next.id);
  }

  /* ---------- Тренажёр ---------- */

  function startTrainer(id) {
    const isFree = id === 'free';
    const lesson = isFree ? null : LESSONS.find((item) => item.id === id);
    if (!isFree && !lesson) return;

    closeAllModals();

    state.view = 'trainer';
    state.mode = isFree ? 'free' : 'lesson';
    state.lesson = lesson;
    state.lessonId = isFree ? null : lesson.id;
    state.text = isFree ? buildFreeText() : buildLessonText(lesson);
    state.index = 0;
    state.correct = 0;
    state.errors = 0;
    state.startedAt = 0;
    state.finished = false;
    state.virtualShift = false;

    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    $('view-home').hidden = true;
    $('view-trainer').hidden = false;

    const list = lessonsFor(settings.layout);
    const lessonIndex = isFree ? -1 : list.findIndex((item) => item.id === lesson.id);

    $('trainerKicker').textContent = isFree
      ? `Свободная практика · ${settings.layout === 'ru' ? 'русский' : 'english'}`
      : `Урок ${String(lessonIndex + 1).padStart(2, '0')} · ${settings.layout === 'ru' ? 'русский' : 'english'}`;
    $('trainerTitle').textContent = isFree ? 'Свободный режим' : lesson.title;
    $('kbLayoutLabel').textContent = LAYOUT_LABELS[settings.layout];

    $('liveTime').textContent = '0:00';
    $('liveWpm').textContent = '0';
    $('liveAcc').textContent = '100%';

    renderTypingText(state.text);
    updateProgressBar();
    buildKeyboard();
    $('keyboardPanel').hidden = !settings.keyboard;
    updateNextKey();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderTypingText(text) {
    const container = $('typingText');
    container.textContent = '';
    state.charEls = new Array(text.length);

    let i = 0;
    while (i < text.length) {
      const word = document.createElement('span');
      word.className = 'word';

      while (i < text.length && text[i] !== ' ') {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = text[i];
        state.charEls[i] = ch;
        word.appendChild(ch);
        i += 1;
      }

      if (i < text.length && text[i] === ' ') {
        const space = document.createElement('span');
        space.className = 'ch space';
        space.textContent = ' ';
        state.charEls[i] = space;
        word.appendChild(space);
        i += 1;
      }

      container.appendChild(word);
    }

    if (state.charEls[0]) state.charEls[0].classList.add('current');
  }

  function updateProgressBar() {
    const total = state.text.length || 1;
    $('lessonProgress').style.width = `${(state.index / total) * 100}%`;
  }

  function updateLiveStats() {
    $('liveTime').textContent = formatClock(elapsedSeconds());
    $('liveWpm').textContent = String(speed());
    $('liveAcc').textContent = `${accuracy()}%`;
  }

  function typeChar(char) {
    if (state.view !== 'trainer' || state.finished) return;
    if (state.index >= state.text.length) return;

    if (!state.startedAt) {
      state.startedAt = Date.now();
      state.timer = setInterval(updateLiveStats, 250);
    }

    const expected = state.text[state.index];
    const expectedEl = state.charEls[state.index];
    if (!expectedEl) return;

    if (char === expected) {
      expectedEl.classList.remove('current', 'wrong');
      expectedEl.classList.add('ok');
      state.correct += 1;
      state.index += 1;
      pressKeyVisual(char, false);
      playSound('key');

      if (state.index >= state.text.length) {
        updateLiveStats();
        updateProgressBar();
        finishRun();
        return;
      }

      const nextEl = state.charEls[state.index];
      if (nextEl) nextEl.classList.add('current');
      updateNextKey();
    } else {
      state.errors += 1;
      expectedEl.classList.add('wrong');
      pressKeyVisual(char, true);
      playSound('error');
      shakeCard();

      const errorIndex = state.index;
      window.setTimeout(() => {
        if (state.finished || state.index !== errorIndex) return;
        expectedEl.classList.remove('wrong');
      }, 320);
    }

    updateLiveStats();
    updateProgressBar();
  }

  function handleBackspace() {
    if (state.view !== 'trainer' || state.finished || state.index === 0) return;

    const currentEl = state.charEls[state.index];
    if (currentEl) currentEl.classList.remove('current');

    state.index -= 1;
    const prevEl = state.charEls[state.index];
    if (prevEl) {
      prevEl.classList.remove('ok', 'wrong');
      prevEl.classList.add('current');
    }

    updateProgressBar();
    updateNextKey();
  }

  function shakeCard() {
    const card = $('typingCard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    window.setTimeout(() => card.classList.remove('shake'), 320);
  }

  function finishRun() {
    if (state.finished) return;
    state.finished = true;

    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    const seconds = Math.max(1, elapsedSeconds());
    const acc = accuracy();
    const wpm = Math.round(state.correct / (seconds / 60));
    const target = state.mode === 'free' ? 160 : state.lesson.target || 120;
    const stars = calcStars(wpm, acc, target);
    const chars = state.text.length;

    let newRecord = false;

    if (state.mode === 'free') {
      const prev = progress.free[settings.layout] || { wpm: 0, acc: 0 };
      newRecord = wpm > (Number(prev.wpm) || 0);
      progress.free[settings.layout] = {
        wpm: Math.max(Number(prev.wpm) || 0, wpm),
        acc: Math.max(Number(prev.acc) || 0, acc)
      };
    } else {
      const prev = progress.lessons[state.lessonId] || { wpm: 0, acc: 0, stars: 0, runs: 0 };
      newRecord = wpm > (Number(prev.wpm) || 0);
      progress.lessons[state.lessonId] = {
        wpm: Math.max(Number(prev.wpm) || 0, wpm),
        acc: Math.max(Number(prev.acc) || 0, acc),
        stars: Math.max(Number(prev.stars) || 0, stars),
        runs: (Number(prev.runs) || 0) + 1
      };
    }

    progress.totals.sessions = (Number(progress.totals.sessions) || 0) + 1;
    progress.totals.seconds = (Number(progress.totals.seconds) || 0) + Math.round(seconds);
    progress.totals.chars = (Number(progress.totals.chars) || 0) + chars;

    saveStore();
    clearNextKeys();
    $('keyHint').textContent = 'Готово — посмотри результат';

    showResults({ wpm, acc, seconds, stars, newRecord, chars });
    renderHomeStats();
    renderLessons();
  }

  function calcStars(wpm, acc, target) {
    if (acc >= 95 && wpm >= target) return 3;
    if (acc >= 90 && wpm >= target * 0.75) return 2;
    if (acc >= 80 && wpm >= target * 0.5) return 1;
    return 0;
  }

  /* ---------- Клавиатура ---------- */

  function makeKey(label, finger, extraClass) {
    const key = document.createElement('div');
    key.className = 'key';
    if (extraClass) key.classList.add(extraClass);
    key.style.setProperty('--finger', settings.fingerColors ? FINGERS[finger] : 'rgba(255, 255, 255, 0.12)');

    const base = document.createElement('span');
    base.className = 'key-base';
    base.textContent = label;
    key.appendChild(base);

    return key;
  }

  function buildKeyboard() {
    const kb = $('keyboard');
    kb.textContent = '';
    state.charToKey = {};
    state.shiftEls = [];
    state.spaceEl = null;
    state.nextEls.clear();

    const rows = KEYBOARD[settings.layout];

    rows.forEach((keys) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      keys.forEach(([baseChar, finger, shiftChar]) => {
        const key = makeKey(baseChar, finger);
        key.dataset.base = baseChar;
        if (shiftChar) {
          key.dataset.shifted = shiftChar;
          const shiftLabel = document.createElement('span');
          shiftLabel.className = 'key-shift';
          shiftLabel.textContent = shiftChar;
          key.appendChild(shiftLabel);
        }

        state.charToKey[baseChar] = { el: key, finger, isShift: false };
        if (shiftChar) {
          state.charToKey[shiftChar] = { el: key, finger, isShift: true };
        }

        rowEl.appendChild(key);
      });

      kb.appendChild(rowEl);
    });

    const spaceRow = document.createElement('div');
    spaceRow.className = 'kb-row kb-space-row';

    const shiftLeft = makeKey('⇧', 'lp', 'wide');
    shiftLeft.dataset.kind = 'shift';

    const space = makeKey(settings.layout === 'ru' ? 'пробел' : 'space', 'th', 'space');
    state.spaceEl = space;

    const shiftRight = makeKey('⇧', 'rp', 'wide');
    shiftRight.dataset.kind = 'shift';

    state.shiftEls = [shiftLeft, shiftRight];

    if (state.virtualShift) {
      shiftLeft.classList.add('active-shift');
      shiftRight.classList.add('active-shift');
    }

    spaceRow.appendChild(shiftLeft);
    spaceRow.appendChild(space);
    spaceRow.appendChild(shiftRight);
    kb.appendChild(spaceRow);
  }

  function keyInfo(char) {
    if (char === ' ') {
      return state.spaceEl
        ? { el: state.spaceEl, finger: 'th', shift: false }
        : null;
    }

    const lower = char.toLowerCase();
    const upper = char.toUpperCase();
    const entry = state.charToKey[char] || state.charToKey[lower];
    if (!entry) return null;

    const isLetter = lower !== upper;
    const needsShift = entry.isShift || (isLetter && char === upper);
    return { el: entry.el, finger: entry.finger, shift: needsShift };
  }

  function clearNextKeys() {
    state.nextEls.forEach((el) => el.classList.remove('next', 'shift-next'));
    state.nextEls.clear();
  }

  function displayChar(char) {
    return char === ' ' ? 'пробел' : char;
  }

  function setKeyHint(char, info) {
    const hint = $('keyHint');
    if (!info) {
      hint.textContent = 'Печатай в спокойном ритме';
      return;
    }
    hint.innerHTML = `
      <span class="hint-dot" style="--finger:${FINGERS[info.finger]}"></span>
      <span><b>${escapeHtml(displayChar(char))}</b> · ${FINGER_NAMES[info.finger]}${info.shift ? ' · Shift' : ''}</span>
    `;
  }

  function updateNextKey() {
    clearNextKeys();
    if (state.view !== 'trainer' || state.finished || !state.text) return;

    const char = state.text[state.index];
    if (char === undefined) return;

    const info = keyInfo(char);
    if (info) {
      info.el.classList.add('next');
      state.nextEls.add(info.el);

      if (info.shift) {
        state.shiftEls.forEach((shiftEl) => {
          shiftEl.classList.add('shift-next');
          state.nextEls.add(shiftEl);
        });
      }
    }

    setKeyHint(char, info);
  }

  function pressKeyVisual(char, isError) {
    const info = keyInfo(char);
    if (!info) return;

    const cls = isError ? 'wrong-key' : 'pressed';
    const timeout = isError ? 220 : 110;

    info.el.classList.add(cls);
    window.setTimeout(() => info.el.classList.remove(cls), timeout);

    if (info.shift) {
      state.shiftEls.forEach((shiftEl) => {
        shiftEl.classList.add(cls);
        window.setTimeout(() => shiftEl.classList.remove(cls), timeout);
      });
    }
  }

  function toggleVirtualShift() {
    state.virtualShift = !state.virtualShift;
    state.shiftEls.forEach((el) => el.classList.toggle('active-shift', state.virtualShift));
  }

  function resetVirtualShift() {
    if (!state.virtualShift) return;
    state.virtualShift = false;
    state.shiftEls.forEach((el) => el.classList.remove('active-shift'));
  }

  /* ---------- Результаты ---------- */

  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function subtitleFor(acc, stars, isFree) {
    if (isFree) return 'Свободный текст, спокойный ритм. Дальше — только ровнее.';
    if (stars === 3) return 'Точность и скорость на месте. Отличный результат.';
    if (acc >= 98) return 'Почти безупречная точность. Добавь немного скорости.';
    if (stars === 2) return 'Хороший ритм. Ещё пара попыток — и будет отлично.';
    if (stars === 1) return 'Основа заложена. Не спеши, следи за ошибками.';
    return 'Не гонись за скоростью — сначала ровные и точные нажатия.';
  }

  function showResults(run) {
    const { wpm, acc, seconds, stars, newRecord, chars } = run;

    $('resStars').innerHTML = [1, 2, 3]
      .map((n) => `<span class="${n <= stars ? 'on' : ''}" style="animation-delay:${(n - 1) * 0.12}s">★</span>`)
      .join('');

    $('resBadge').hidden = !newRecord;
    $('resTitle').textContent = state.mode === 'free'
      ? 'Свободный забег'
      : stars === 3
        ? 'Безупречно'
        : stars === 2
          ? 'Отличная работа'
          : 'Урок пройден';

    $('resSubtitle').textContent = subtitleFor(acc, stars, state.mode === 'free');

    const wpmEl = $('resWpm');
    wpmEl.textContent = String(wpm);
    wpmEl.classList.remove('value-pop');
    void wpmEl.offsetWidth;
    wpmEl.classList.add('value-pop');

    $('resAcc').textContent = `${acc}%`;
    $('resTime').textContent = formatClock(seconds);
    $('resErrors').textContent = String(state.errors);
    $('resErrorsLabel').textContent = plural(state.errors, 'ошибка', 'ошибки', 'ошибок');
    $('resChars').textContent = String(chars);
    $('resCharsLabel').textContent = plural(chars, 'знак', 'знака', 'знаков');

    const list = lessonsFor(settings.layout);
    const index = state.lessonId ? list.findIndex((lesson) => lesson.id === state.lessonId) : -1;
    const next = index >= 0 ? list[index + 1] : null;
    const nextBtn = $('nextBtn');
    nextBtn.hidden = !next;
    nextBtn.dataset.next = next ? next.id : '';

    $('againBtn').textContent = state.mode === 'free' ? 'Ещё забег' : 'Ещё раз';

    openModal($('resultsModal'));

    if (newRecord || stars >= 2) fireConfetti();
  }

  /* ---------- Модальные окна и тосты ---------- */

  function openModal(modal) {
    closeAllModals();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal.open')) {
      document.body.style.overflow = '';
    }
  }

  function closeAllModals() {
    $$('.modal.open').forEach((modal) => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function goHome() {
    closeAllModals();
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    state.startedAt = 0;
    state.finished = false;
    state.view = 'home';
    state.text = '';
    state.charEls = [];

    $('view-trainer').hidden = true;
    $('view-home').hidden = false;

    renderHomeStats();
    renderLessons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Звук ---------- */

  function playSound(kind) {
    if (!settings.sound) return;

    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;

      if (kind === 'key') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540 + Math.random() * 110, now);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
        return;
      }

      if (kind === 'error') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(210, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.17);
      }
    } catch (error) {
      /* звук не критичен */
    }
  }

  function updateSoundButton() {
    const button = $('soundBtn');
    button.classList.toggle('is-muted', !settings.sound);
    button.title = settings.sound ? 'Звук включён' : 'Звук выключен';
  }

  function syncSound() {
    $('soundToggle').checked = settings.sound;
    updateSoundButton();
  }

  /* ---------- Настройки ---------- */

  function syncSettingsForm() {
    $('soundToggle').checked = settings.sound;
    $('keyboardToggle').checked = settings.keyboard;
    $('colorsToggle').checked = settings.fingerColors;
    $('fontRange').value = String(settings.fontSize);
    $('fontValue').textContent = String(settings.fontSize);
    document.documentElement.style.setProperty('--typing-size', `${settings.fontSize}px`);
    updateSoundButton();
  }

  function applySettings() {
    document.documentElement.style.setProperty('--typing-size', `${settings.fontSize}px`);
    $$('.seg-btn').forEach((button) => {
      button.classList.toggle('active', button.dataset.layout === settings.layout);
    });
    updateSoundButton();
  }

  function toggleSound() {
    settings.sound = !settings.sound;
    saveStore();
    syncSound();
    if (settings.sound) playSound('key');
    showToast(settings.sound ? 'Звук включён' : 'Звук выключен');
  }

  /* ---------- Конфетти ---------- */

  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ['#8b5cf6', '#22d3ee', '#f2c879', '#ff7d95', '#7ce38b', '#ffffff'];
    const count = Math.min(150, Math.round(width / 9));
    const originX = width / 2;
    const originY = Math.min(height * 0.4, 380);
    const particles = [];

    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7;
      const velocity = 4 + Math.random() * 9;
      particles.push({
        x: originX + (Math.random() - 0.5) * 70,
        y: originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        w: 4 + Math.random() * 6,
        h: 6 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }

    const start = performance.now();
    const duration = 2400;

    cancelAnimationFrame(confettiFrame);

    function frame(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      const fade = elapsed > duration - 500 ? Math.max(0, (duration - elapsed) / 500) : 1;
      ctx.globalAlpha = fade;

      particles.forEach((p) => {
        p.vy += 0.16;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.y > height + 30) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (elapsed < duration) {
        confettiFrame = requestAnimationFrame(frame);
      } else {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, width, height);
      }
    }

    confettiFrame = requestAnimationFrame(frame);
  }

  /* ---------- События ---------- */

  function bindEvents() {
    $('quickStart').addEventListener('click', startRecommended);
    $('freeMode').addEventListener('click', () => startTrainer('free'));
    $('backBtn').addEventListener('click', goHome);
    $('brandLink').addEventListener('click', (event) => {
      event.preventDefault();
      goHome();
    });

    $('restartBtn').addEventListener('click', () => {
      if (state.mode === 'free') startTrainer('free');
      else if (state.lessonId) startTrainer(state.lessonId);
    });

    $('againBtn').addEventListener('click', () => {
      closeAllModals();
      if (state.mode === 'free') startTrainer('free');
      else if (state.lessonId) startTrainer(state.lessonId);
    });

    $('nextBtn').addEventListener('click', () => {
      const nextId = $('nextBtn').dataset.next;
      if (nextId) startTrainer(nextId);
    });

    $('homeBtn').addEventListener('click', goHome);

    $$('[data-close]').forEach((element) => {
      element.addEventListener('click', () => {
        const modal = element.closest('.modal');
        if (modal) closeModal(modal);
      });
    });

    $$('.seg-btn').forEach((button) => {
      button.addEventListener('click', () => setLayout(button.dataset.layout));
    });

    $('soundBtn').addEventListener('click', toggleSound);

    $('settingsBtn').addEventListener('click', () => {
      syncSettingsForm();
      openModal($('settingsModal'));
    });

    $('soundToggle').addEventListener('change', (event) => {
      settings.sound = event.target.checked;
      saveStore();
      updateSoundButton();
      if (settings.sound) playSound('key');
      showToast(settings.sound ? 'Звук включён' : 'Звук выключен');
    });

    $('keyboardToggle').addEventListener('change', (event) => {
      settings.keyboard = event.target.checked;
      saveStore();
      $('keyboardPanel').hidden = !settings.keyboard;
      if (settings.keyboard && state.view === 'trainer') {
        buildKeyboard();
        updateNextKey();
      }
    });

    $('colorsToggle').addEventListener('change', (event) => {
      settings.fingerColors = event.target.checked;
      saveStore();
      if (state.view === 'trainer') {
        buildKeyboard();
        updateNextKey();
      }
    });

    $('fontRange').addEventListener('input', (event) => {
      const size = clamp(Number(event.target.value) || 22, 18, 32);
      $('fontValue').textContent = String(size);
      document.documentElement.style.setProperty('--typing-size', `${size}px`);
    });

    $('fontRange').addEventListener('change', (event) => {
      settings.fontSize = clamp(Number(event.target.value) || 22, 18, 32);
      saveStore();
    });

    $('resetProgress').addEventListener('click', () => {
      const button = $('resetProgress');

      if (button.dataset.confirm === '1') {
        progress.lessons = {};
        progress.free = {};
        progress.totals = { sessions: 0, seconds: 0, chars: 0 };
        saveStore();
        button.dataset.confirm = '0';
        button.textContent = 'Сбросить прогресс';
        if (resetTimer) clearTimeout(resetTimer);
        renderLessons();
        renderHomeStats();
        showToast('Прогресс сброшен');
        return;
      }

      button.dataset.confirm = '1';
      button.textContent = 'Нажми ещё раз';
      resetTimer = window.setTimeout(() => {
        button.dataset.confirm = '0';
        button.textContent = 'Сбросить прогресс';
      }, 3000);
    });

    $('keyboard').addEventListener('click', (event) => {
      const key = event.target.closest('.key');
      if (!key || state.view !== 'trainer' || state.finished) return;

      if (key.dataset.kind === 'shift') {
        toggleVirtualShift();
        return;
      }

      if (key === state.spaceEl) {
        typeChar(' ');
        return;
      }

      const base = key.dataset.base;
      if (!base) return;

      if (state.virtualShift) {
        const shifted = key.dataset.shifted || base.toUpperCase();
        typeChar(shifted);
        resetVirtualShift();
      } else {
        typeChar(base);
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const open = document.querySelector('.modal.open');
        if (open) {
          closeModal(open);
          return;
        }
        if (state.view === 'trainer') goHome();
        return;
      }

      if (document.querySelector('.modal.open')) return;
      if (state.view !== 'trainer' || state.finished) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.isComposing) return;

      if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (event.key.length !== 1) return;

      event.preventDefault();
      typeChar(event.key);
    });
  }

  /* ---------- Старт ---------- */

  function init() {
    applySettings();
    syncSettingsForm();
    bindEvents();
    setLayout(settings.layout, true);
    renderHomeStats();
  }

  init();
})();
