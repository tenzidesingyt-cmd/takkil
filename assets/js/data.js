/* Тактиль — данные уроков, раскладок и текстов */

const FINGERS = {
  lp: '#ff7d95',
  lr: '#ffb36b',
  lm: '#ffe066',
  li: '#7ce38b',
  th: '#8f96ad',
  ri: '#7ce38b',
  rm: '#ffe066',
  rr: '#ffb36b',
  rp: '#ff7d95'
};

const FINGER_NAMES = {
  lp: 'левый мизинец',
  lr: 'левый безымянный',
  lm: 'левый средний',
  li: 'левый указательный',
  th: 'большой палец',
  ri: 'правый указательный',
  rm: 'правый средний',
  rr: 'правый безымянный',
  rp: 'правый мизинец'
};

/* [базовый символ, палец, символ с Shift] */
const KEYBOARD = {
  ru: [
    [['ё', 'lp', 'Ё'], ['1', 'lp', '!'], ['2', 'lr', '"'], ['3', 'lm', '№'], ['4', 'li', ';'], ['5', 'li', '%'], ['6', 'ri', ':'], ['7', 'ri', '?'], ['8', 'rm', '*'], ['9', 'rr', '('], ['0', 'rp', ')'], ['-', 'rp', '_'], ['=', 'rp', '+']],
    [['й', 'lp'], ['ц', 'lr'], ['у', 'lm'], ['к', 'li'], ['е', 'li'], ['н', 'ri'], ['г', 'ri'], ['ш', 'rm'], ['щ', 'rr'], ['з', 'rp'], ['х', 'rp'], ['ъ', 'rp'], ['\\', 'rp', '/']],
    [['ф', 'lp'], ['ы', 'lr'], ['в', 'lm'], ['а', 'li'], ['п', 'li'], ['р', 'ri'], ['о', 'ri'], ['л', 'rm'], ['д', 'rr'], ['ж', 'rp'], ['э', 'rp']],
    [['я', 'lp'], ['ч', 'lr'], ['с', 'lm'], ['м', 'li'], ['и', 'li'], ['т', 'ri'], ['ь', 'ri'], ['б', 'rm'], ['ю', 'rr'], ['.', 'rp', ',']]
  ],
  en: [
    [['`', 'lp', '~'], ['1', 'lp', '!'], ['2', 'lr', '@'], ['3', 'lm', '#'], ['4', 'li', '$'], ['5', 'li', '%'], ['6', 'ri', '^'], ['7', 'ri', '&'], ['8', 'rm', '*'], ['9', 'rr', '('], ['0', 'rp', ')'], ['-', 'rp', '_'], ['=', 'rp', '+']],
    [['q', 'lp'], ['w', 'lr'], ['e', 'lm'], ['r', 'li'], ['t', 'li'], ['y', 'ri'], ['u', 'ri'], ['i', 'rm'], ['o', 'rr'], ['p', 'rp'], ['[', 'rp', '{'], [']', 'rp', '}'], ['\\', 'rp', '|']],
    [['a', 'lp'], ['s', 'lr'], ['d', 'lm'], ['f', 'li'], ['g', 'li'], ['h', 'ri'], ['j', 'ri'], ['k', 'rm'], ['l', 'rr'], [';', 'rp', ':'], ["'", 'rp', '"']],
    [['z', 'lp'], ['x', 'lr'], ['c', 'lm'], ['v', 'li'], ['b', 'li'], ['n', 'ri'], ['m', 'ri'], [',', 'rm', '<'], ['.', 'rr', '>'], ['/', 'rp', '?']]
  ]
};

const LAYOUT_LABELS = { ru: 'ЙЦУКЕН', en: 'QWERTY' };

const LESSONS = [
  /* ————— Русская раскладка ————— */
  {
    id: 'ru-1', layout: 'ru', title: 'Домашний ряд', subtitle: 'ФЫВА · ОЛДЖ',
    tags: ['ф', 'ы', 'в', 'а', 'о', 'л', 'д', 'ж'], target: 90, length: 170,
    drills: ['фыва', 'олдж', 'фываолдж', 'фы', 'ва', 'ол', 'дж', 'ыв', 'ао', 'лавд', 'жфыв', 'аоыв', 'олдж', 'дал', 'лад'],
    words: ['вал', 'дал', 'лад', 'лов', 'вол', 'дол', 'овод', 'олово', 'вода', 'два', 'жало', 'жал', 'овал', 'вдова']
  },
  {
    id: 'ru-2', layout: 'ru', title: 'Шире домашний ряд', subtitle: 'добавляем П Р Э',
    tags: ['п', 'р', 'э', 'ф', 'ы', 'в', 'а', 'о'], target: 100, length: 180,
    drills: ['фывапролджэ', 'прол', 'фыва', 'пп', 'рр', 'ээ', 'эра', 'пор', 'рад', 'плод', 'фываолджэ'],
    words: ['провал', 'правда', 'поле', 'повар', 'довод', 'порода', 'провод', 'выдра', 'пора', 'парад', 'право', 'плов', 'порвал', 'эра', 'дрова', 'жара', 'фара', 'лапа', 'пара', 'водопад']
  },
  {
    id: 'ru-3', layout: 'ru', title: 'Верхний ряд слева', subtitle: 'ЙЦУКЕН',
    tags: ['й', 'ц', 'у', 'к', 'е', 'н'], target: 110, length: 190,
    drills: ['йцукен', 'цук', 'кен', 'йцу', 'неку', 'йцукенфыва', 'кк', 'уу', 'нн'],
    words: ['кукла', 'луна', 'рука', 'урок', 'кран', 'наука', 'канал', 'укол', 'йод', 'экран', 'кулон', 'кулер', 'планер', 'пенал', 'край', 'плед', 'наклон', 'депо']
  },
  {
    id: 'ru-4', layout: 'ru', title: 'Верхний ряд справа', subtitle: 'ГШЩЗХЪ',
    tags: ['г', 'ш', 'щ', 'з', 'х', 'ъ'], target: 120, length: 200,
    drills: ['йцукенгшщзхъ', 'фывапролджэ', 'гг', 'шш', 'щщ', 'зз', 'ххъъ', 'гшщ', 'зхъ'],
    words: ['гроза', 'шорох', 'щенок', 'шкура', 'горох', 'худой', 'звук', 'груз', 'шов', 'эхо', 'хвощ', 'звонок', 'узник', 'шнурок', 'прогноз', 'дозор', 'рожок', 'порошок', 'жук', 'ёж', 'ёрш', 'нож']
  },
  {
    id: 'ru-5', layout: 'ru', title: 'Нижний ряд', subtitle: 'ЯЧСМИ ТЬБЮ',
    tags: ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'], target: 130, length: 220,
    drills: ['ячсмитьбю', 'яя', 'чч', 'сс', 'мм', 'ии', 'тть', 'бб', 'юю', 'ячсми', 'тьбю'],
    words: ['любовь', 'мышь', 'мечта', 'сила', 'чай', 'очки', 'юбка', 'счастье', 'вечность', 'билет', 'семья', 'тишина', 'машина', 'облако', 'ветер', 'музыка', 'дорога', 'вокзал', 'радость', 'победа', 'молния', 'встреча', 'история', 'вселенная', 'учитель', 'яблоко', 'человек', 'секунда', 'задача', 'клавиатура']
  },
  {
    id: 'ru-6', layout: 'ru', title: 'Всё вместе', subtitle: 'весь алфавит',
    tags: ['все буквы'], target: 150, length: 240,
    sentences: [
      'ровный ритм важнее высокой скорости',
      'смотри только на текст а не на клавиши',
      'пальцы сами запомнят дорогу к каждой букве',
      'каждый день по десять минут даёт больше чем час раз в неделю',
      'слепая печать экономит время и внимание',
      'не гонись за скоростью сначала появится точность',
      'держи спину прямо и расслабь плечи',
      'ошибки это просто ступени к мастерству',
      'чем спокойнее дыхание тем ровнее печать',
      'доверяй пальцам и не смотри на руки'
    ]
  },
  {
    id: 'ru-7', layout: 'ru', title: 'Заглавные', subtitle: 'Shift и имена',
    tags: ['А', 'Б', 'В', 'Shift'], target: 150, length: 220,
    words: ['Москва', 'Анна', 'Пётр', 'Иван', 'Сибирь', 'Волга', 'Байкал', 'Россия', 'Пушкин', 'Гагарин', 'Париж', 'Лондон'],
    sentences: [
      'Анна и Иван любят тихие вечера',
      'Москва стоит на семи холмах',
      'Пётр читает книгу о звёздах',
      'Байкал самое глубокое озеро мира',
      'Россия богата лесами и реками',
      'Пушкин писал ясно и просто',
      'Гагарин первым увидел Землю из космоса',
      'Волга впадает в Каспийское море'
    ]
  },
  {
    id: 'ru-8', layout: 'ru', title: 'Знаки препинания', subtitle: 'точка · запятая · ? !',
    tags: ['.', ',', '?', '!', ':', ';'], target: 140, length: 230,
    words: ['точка', 'запятая', 'тире', 'знаки', 'предложение'],
    sentences: [
      'Печатай внимательно, а не быстро.',
      'Точка ставится в конце предложения.',
      'Где ошибка? Проверь ещё раз!',
      'Запятая, точка и тире - знаки препинания.',
      'Это просто: держи ритм, смотри вперёд.',
      'Не спеши: скорость придёт сама.',
      'Сначала точность, потом скорость.',
      'Проверь: пальцы не должны напрягаться.'
    ]
  },
  {
    id: 'ru-9', layout: 'ru', title: 'Цифры', subtitle: 'верхний числовой ряд',
    tags: ['1', '2', '3', '4', '5', '…'], target: 120, length: 200,
    words: ['цифры', 'ряд', 'счёт', 'минута', 'рекорд'],
    sentences: [
      '1 2 3 4 5 6 7 8 9 0',
      '10 25 40 60 75 90 100',
      'В 2026 году я начал печатать вслепую.',
      'Мой рекорд 62 знака в минуту.',
      'Нажми 1, затем 2, затем 3 и 4.',
      'Цифры живут в верхнем ряду.',
      '7 14 21 28 35 42 49 56 63 70',
      'Скорость 80 знаков уже близко.'
    ]
  },
  {
    id: 'ru-10', layout: 'ru', title: 'Скорость', subtitle: 'длинный текст',
    tags: ['поток', 'ритм'], target: 160, length: 340,
    sentences: [
      'Скорость приходит из спокойствия.',
      'Когда ты перестаёшь искать глазами клавиши, руки начинают двигаться сами.',
      'Ритм важнее рывка: ровные удары дают больше, чем спешка.',
      'Ошибка не провал, а подсказка.',
      'Замедлись там, где трудно, и ускорься там, где легко.',
      'Через неделю ты заметишь, что текст идёт легче, а мысли не отстают от пальцев.',
      'Слепая печать становится привычкой, как письмо от руки.',
      'Главное - возвращаться к практике каждый день, хотя бы на десять минут.'
    ]
  },

  /* ————— English layout ————— */
  {
    id: 'en-1', layout: 'en', title: 'Home row', subtitle: 'A S D F · J K L ;',
    tags: ['a', 's', 'd', 'f', 'j', 'k', 'l'], target: 90, length: 170,
    drills: ['asdf', 'jkl', 'asdfjkl', 'as', 'df', 'jk', 'kl', 'sad', 'fad', 'lad'],
    words: ['ask', 'lad', 'sad', 'fad', 'add', 'all', 'fall', 'flask', 'salad', 'alas', 'dads', 'flak']
  },
  {
    id: 'en-2', layout: 'en', title: 'Index reach', subtitle: 'добавляем G H E I R U',
    tags: ['g', 'h', 'e', 'i', 'r', 'u'], target: 110, length: 190,
    drills: ['gh', 'eiru', 'asdfgh', 'jkl', 'ghe', 'iru', 'hh', 'gg'],
    words: ['large', 'huge', 'guide', 'field', 'shield', 'figure', 'reader', 'dark', 'heard', 'sheer', 'eager', 'jerk', 'health', 'faith', 'useful']
  },
  {
    id: 'en-3', layout: 'en', title: 'Full keyboard', subtitle: 'Q W E R T Y · Z X C V B N M',
    tags: ['q', 'w', 'e', 'r', 't', 'y'], target: 130, length: 210,
    drills: ['qwertyuiop', 'zxcvbnm', 'qwerty', 'zxcv', 'brown', 'quick', 'jumps', 'over', 'lazy', 'fox'],
    words: ['quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'keyboard', 'type', 'word', 'practice', 'music', 'window', 'coffee', 'paper', 'notebook', 'language', 'morning', 'evening', 'question', 'answer']
  },
  {
    id: 'en-4', layout: 'en', title: 'Every letter', subtitle: 'whole alphabet',
    tags: ['a–z'], target: 160, length: 240,
    sentences: [
      'the quick brown fox jumps over the lazy dog',
      'practice makes progress not perfection',
      'look at the screen not at your hands',
      'keep a steady rhythm and let your fingers fly',
      'accuracy first speed will follow',
      'every day a little practice goes a long way',
      'trust your hands and breathe slowly',
      'mistakes are steps on the way to mastery'
    ]
  },
  {
    id: 'en-5', layout: 'en', title: 'Capital letters', subtitle: 'Shift и имена',
    tags: ['A', 'B', 'C', 'Shift'], target: 160, length: 220,
    words: ['London', 'Paris', 'Anna', 'Monday', 'Maria', 'Friday', 'Rome', 'Earth'],
    sentences: [
      'Anna and Ivan love quiet evenings',
      'London is a city of many stories',
      'Monday starts a brand new week',
      'Paris and Rome are beautiful in spring',
      'Maria reads books about the stars',
      'The Pacific Ocean is the largest on Earth',
      'On Friday we will meet at noon',
      'Big Ben stands in the heart of London'
    ]
  },
  {
    id: 'en-6', layout: 'en', title: 'Punctuation & digits', subtitle: 'точки, запятые, числа',
    tags: ['.', ',', '?', '!', ':', ';'], target: 140, length: 220,
    words: ['type', 'words', 'practice', 'accuracy', 'speed'],
    sentences: [
      'Type 10 words, then 20, then 30.',
      "Don't rush: accuracy comes first!",
      'Is this easy? Yes, it is.',
      'My best result - 45 words per minute.',
      'Practice daily; progress will come.',
      'Numbers: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0.',
      'Check your posture and relax your shoulders.',
      'Slow down: speed follows accuracy.'
    ]
  },
  {
    id: 'en-7', layout: 'en', title: 'Speed', subtitle: 'длинный текст',
    tags: ['flow', 'rhythm'], target: 180, length: 340,
    sentences: [
      'Speed comes from calm.',
      'When you stop searching for keys with your eyes, your hands begin to move on their own.',
      'Rhythm beats rushing: steady strokes give more than a sudden sprint.',
      'A mistake is not a failure, it is a hint.',
      'Slow down where it is hard and speed up where it is easy.',
      'In a week you will notice that the text flows easier and your thoughts no longer lag behind your fingers.',
      'Touch typing becomes a habit, like writing by hand.',
      'The main thing is to return to practice every day, even for ten minutes.'
    ]
  }
];

const FREE_TEXTS = {
  ru: [
    'Слепая печать освобождает внимание для мыслей.',
    'Каждый день немного практики делает руки увереннее.',
    'Смотри на текст, а не на клавиатуру.',
    'Ровный ритм важнее высокой скорости.',
    'Ошибки показывают, где нужно замедлиться.',
    'Через месяц ты будешь печатать почти не думая.',
    'Хорошая осанка и расслабленные плечи помогают.',
    'Пальцы находят клавиши сами, если им доверять.',
    'Читай на два слова вперёд и не спеши.',
    'Терпение медленно превращается в навык.',
    'В тишине слышно, как складывается ритм.',
    'Не бойся медленного начала, бойся остановки.',
    'Текст идёт ровно, когда дыхание спокойно.',
    'Сегодня достаточно десяти честных минут.',
    'Скорость приходит как награда за точность.',
    'Держи запястья прямо и не поднимай плечи.',
    'Каждая ошибка делает следующую попытку точнее.',
    'Слово за словом, строка за строкой.',
    'Пусть пальцы думают быстрее, чем глаза.',
    'Маленький шаг каждый день важнее редкого рывка.'
  ],
  en: [
    'Touch typing frees your attention for ideas.',
    'A little practice every day makes your hands more confident.',
    'Look at the text, not at the keyboard.',
    'A steady rhythm matters more than raw speed.',
    'Mistakes show you where to slow down.',
    'In a month you will type almost without thinking.',
    'Good posture and relaxed shoulders help.',
    'Your fingers find the keys if you trust them.',
    'Read two words ahead and do not rush.',
    'Patience slowly turns into skill.',
    'In silence you can hear the rhythm come together.',
    'Do not fear a slow start, fear stopping.',
    'Text flows when your breathing is calm.',
    'Ten honest minutes are enough for today.',
    'Speed arrives as a reward for accuracy.',
    'Keep your wrists straight and shoulders down.',
    'Every mistake makes the next attempt sharper.',
    'Word by word, line by line.',
    'Let your fingers think faster than your eyes.',
    'A small step every day beats a rare sprint.'
  ]
};
