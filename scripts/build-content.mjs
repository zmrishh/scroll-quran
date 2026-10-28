// Builds src/data/quran.json from the Tanzil source files in scripts/source.
// Run: node scripts/build-content.mjs
//
// Arabic text: Tanzil Quran Text (Uthmani, v1.1), CC BY 3.0, verbatim — https://tanzil.net
// Translation: M. M. Pickthall, "The Meaning of the Glorious Koran" (1930), public domain.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { MORE_AYAT, MORE_DUAS, MORE_KEYS, MORE_SPEAKERS } from './more-content.mjs';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => join(root, 'scripts', 'source', f);

const SURAH_NAMES = [
  'Al-Fatihah', 'Al-Baqarah', "Ali 'Imran", 'An-Nisa', "Al-Ma'idah", "Al-An'am", "Al-A'raf", 'Al-Anfal',
  'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', "Ar-Ra'd", 'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf',
  'Maryam', 'Ta-Ha', 'Al-Anbiya', 'Al-Hajj', "Al-Mu'minun", 'An-Nur', 'Al-Furqan', "Ash-Shu'ara", 'An-Naml',
  'Al-Qasas', "Al-'Ankabut", 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin',
  'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar',
  'Ar-Rahman', "Al-Waqi'ah", 'Al-Hadid', 'Al-Mujadilah', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', "Al-Jumu'ah",
  'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haqqah', "Al-Ma'arij",
  'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba',
  "An-Nazi'at", "'Abasa", 'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq',
  "Al-A'la", 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha', 'Ash-Sharh', 'At-Tin',
  "Al-'Alaq", 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah', "Al-'Adiyat", "Al-Qari'ah", 'At-Takathur', "Al-'Asr",
  'Al-Humazah', 'Al-Fil', 'Quraysh', "Al-Ma'un", 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad',
  'Al-Ikhlas', 'Al-Falaq', 'An-Nas',
];

// Topics: peace, patience, gratitude, forgiveness, hope, trust, mercy, guidance
const AYAT = [
  // peace
  ['13:28', ['peace']],
  ['33:41-42', ['peace']],
  ['50:16', ['peace', 'hope']],
  ['89:27-30', ['peace']],
  ['10:62', ['peace']],
  ['36:58', ['peace']],
  ['2:255', ['peace', 'trust']],
  ['17:82', ['peace', 'mercy']],
  ['7:205', ['peace']],
  ['20:46', ['peace', 'trust']],
  ['30:21', ['mercy', 'peace']],
  // patience
  ['2:153', ['patience']],
  ['2:155-156', ['patience']],
  ['2:45', ['patience']],
  ['3:200', ['patience']],
  ['11:115', ['patience']],
  ['16:127', ['patience']],
  ['39:10', ['patience']],
  ['103:1-3', ['patience']],
  ['31:17', ['patience']],
  ['12:86', ['patience']],
  ['70:5', ['patience']],
  ['29:2', ['patience']],
  ['64:11', ['patience', 'guidance']],
  ['40:55', ['patience']],
  ['8:46', ['patience']],
  ['42:43', ['patience', 'forgiveness']],
  // gratitude
  ['14:7', ['gratitude']],
  ['2:152', ['gratitude', 'peace']],
  ['16:18', ['gratitude']],
  ['14:34', ['gratitude']],
  ['55:13', ['gratitude']],
  ['31:12', ['gratitude']],
  ['16:78', ['gratitude']],
  ['2:172', ['gratitude']],
  ['93:11', ['gratitude']],
  ['76:3', ['gratitude', 'guidance']],
  ['4:147', ['gratitude', 'mercy']],
  ['39:66', ['gratitude']],
  // forgiveness
  ['39:53', ['forgiveness', 'hope', 'mercy']],
  ['4:110', ['forgiveness']],
  ['7:199', ['forgiveness']],
  ['41:34', ['forgiveness']],
  ['24:22', ['forgiveness']],
  ['11:90', ['forgiveness']],
  ['71:10-12', ['forgiveness', 'hope']],
  ['3:133', ['forgiveness']],
  ['3:134', ['forgiveness']],
  ['25:70', ['forgiveness', 'hope']],
  ['3:135', ['forgiveness']],
  // hope
  ['94:5-6', ['hope', 'patience']],
  ['93:3-5', ['hope']],
  ['12:87', ['hope']],
  ['40:60', ['hope']],
  ['2:186', ['hope', 'peace']],
  ['15:56', ['hope']],
  ['3:139', ['hope']],
  ['2:286', ['hope', 'patience']],
  ['65:7', ['hope']],
  ['16:97', ['hope']],
  ['53:39', ['hope']],
  ['94:7-8', ['hope']],
  // trust
  ['65:3', ['trust', 'hope']],
  ['3:173', ['trust']],
  ['9:51', ['trust']],
  ['9:129', ['trust']],
  ['25:58', ['trust']],
  ['33:3', ['trust']],
  ['3:160', ['trust']],
  ['47:7', ['trust']],
  ['26:62', ['trust']],
  ['3:159', ['trust']],
  ['13:11', ['trust', 'guidance']],
  // mercy
  ['21:107', ['mercy']],
  ['7:56', ['mercy']],
  ['15:49', ['mercy', 'forgiveness']],
  ['4:28', ['mercy']],
  ['6:54', ['mercy']],
  ['7:156', ['mercy']],
  ['2:163', ['mercy']],
  ['9:128', ['mercy']],
  ['17:23', ['mercy']],
  // guidance
  ['1:1-7', ['guidance', 'mercy']],
  ['2:2', ['guidance']],
  ['6:162', ['guidance']],
  ['49:13', ['guidance']],
  ['67:2', ['guidance']],
  ['3:185', ['guidance']],
  ['29:69', ['guidance']],
  ['112:1-4', ['guidance']],
  ['10:57', ['guidance', 'peace']],
  ['2:256', ['guidance']],
  ['96:1-5', ['guidance']],
  ['16:125', ['guidance']],
  ['59:18', ['guidance']],
  ['2:269', ['guidance']],
];

// Quranic duas only — no hadith, so every word on screen is verifiable against the mushaf.
const DUAS = [
  ['2:201', 'Good in both worlds', 'For good in this life and the next.', ['hope']],
  ['2:250', 'For steadfastness', 'When you face something bigger than you.', ['patience', 'trust']],
  ['3:8', 'For a steady heart', 'When you fear drifting away from faith.', ['guidance']],
  ['7:23', "Adam's plea", 'When you have done wrong and want to return.', ['forgiveness']],
  ['14:40', 'For prayer', 'For yourself and your children to hold on to prayer.', ['guidance']],
  ['14:41', 'For your parents', 'For your parents, and for every believer.', ['forgiveness', 'mercy']],
  ['17:24', 'Mercy for parents', 'Whenever you think of your parents.', ['mercy']],
  ['18:10', 'When the way is unclear', "When you can't see the way forward.", ['guidance', 'trust']],
  ['20:25-28', 'Before a hard task', 'Before an exam, a hard conversation, or anything daunting.', ['trust']],
  ['20:114', 'For knowledge', 'Before you study or learn something new.', ['guidance']],
  ['21:83', 'In pain', 'When illness or hardship touches you.', ['patience', 'mercy']],
  ['21:87', 'From the darkness', 'When you feel trapped by your own mistakes.', ['forgiveness', 'hope']],
  ['21:89', 'For children', 'When you long for a child.', ['hope']],
  ['23:97-98', 'For protection', 'When anger or dark thoughts rise.', ['peace']],
  ['23:118', 'For mercy', 'Any time. It asks for everything at once.', ['mercy', 'forgiveness']],
  ['25:74', 'For your family', 'For a spouse and children who bring you comfort.', ['mercy', 'peace']],
  ['28:24', 'When in need', 'When you need provision, work or help.', ['trust', 'hope']],
  ['27:19', 'For gratitude', 'When blessings overwhelm you.', ['gratitude']],
  ['2:127', 'For acceptance', 'After any good deed.', ['gratitude']],
  ['7:126', 'For steadfastness to the end', 'When you are tested for your faith.', ['patience']],
  ['59:10', 'For a clean heart', 'When you hold something against someone.', ['forgiveness']],
];

// The line the card highlights. Must appear word for word in the Pickthall text (checked below).
// For duas it is the supplication itself, without the narration around it.
const KEYS = {
  '13:28': 'in the remembrance of Allah do hearts find rest!',
  '33:41-42': 'Remember Allah with much remembrance.',
  '50:16': 'We are nearer to him than his jugular vein.',
  '89:27-30': 'Return unto thy Lord, content in His good pleasure!',
  '10:62': 'on whom fear (cometh) not, nor do they grieve',
  '36:58': 'Peace!',
  '2:255': 'Neither slumber nor sleep overtaketh Him.',
  '17:82': 'a healing and a mercy for believers',
  '7:205': 'remember thy Lord within thyself humbly and with awe',
  '20:46': 'I am with you twain, Hearing and Seeing.',
  '30:21': 'He ordained between you love and mercy.',
  '2:153': 'Allah is with the steadfast.',
  '2:155-156': "Lo! we are Allah's and lo! unto Him we are returning.",
  '2:45': 'Seek help in patience and prayer',
  '3:200': 'Endure, outdo all others in endurance',
  '11:115': 'Allah loseth not the wages of the good.',
  '16:127': 'Thine endurance is only by (the help of) Allah.',
  '39:10': 'the steadfast will be paid their wages without stint.',
  '103:1-3': 'exhort one another to truth and exhort one another to endurance.',
  '31:17': 'persevere whatever may befall thee.',
  '12:86': 'I expose my distress and anguish only unto Allah',
  '70:5': 'a patience fair to see.',
  '29:2': 'will not be tested with affliction?',
  '64:11': 'whosoever believeth in Allah, He guideth his heart.',
  '40:55': 'the promise of Allah is true.',
  '8:46': 'Allah is with the steadfast.',
  '42:43': 'whoso is patient and forgiveth',
  '14:7': 'If ye give thanks, I will give you more',
  '2:152': 'remember Me, I will remember you.',
  '16:18': 'if ye would count the favour of Allah ye cannot reckon it.',
  '14:34': 'if ye would count the bounty of Allah ye cannot reckon it.',
  '55:13': 'Which is it, of the favours of your Lord, that ye deny?',
  '31:12': 'whosoever giveth thanks, he giveth thanks for (the good of) his soul.',
  '16:78': 'gave you hearing and sight and hearts that haply ye might give thanks.',
  '2:172': 'render thanks to Allah',
  '93:11': 'of the bounty of thy Lord be thy discourse.',
  '76:3': 'whether he be grateful or disbelieving.',
  '4:147': 'if ye are thankful (for His mercies) and believe (in Him)?',
  '39:66': 'be among the thankful!',
  '39:53': 'Despair not of the mercy of Allah, Who forgiveth all sins.',
  '4:110': 'will find Allah Forgiving, Merciful.',
  '7:199': 'Keep to forgiveness',
  '41:34': 'Repel the evil deed with one which is better',
  '24:22': 'Yearn ye not that Allah may forgive you?',
  '11:90': 'my Lord is Merciful, Loving.',
  '71:10-12': 'Seek pardon of your Lord. Lo! He was ever Forgiving.',
  '3:133': 'vie one with another for forgiveness from your Lord',
  '3:134': 'those who control their wrath and are forgiving toward mankind',
  '25:70': 'Allah will change their evil deeds to good deeds.',
  '3:135': 'Who forgiveth sins save Allah only?',
  '94:5-6': 'with hardship goeth ease',
  '93:3-5': 'the latter portion will be better for thee than the former',
  '12:87': 'despair not of the Spirit of Allah.',
  '40:60': 'Pray unto Me and I will hear your prayer.',
  '2:186': 'I answer the prayer of the suppliant when he crieth unto Me.',
  '15:56': 'who despaireth of the mercy of his Lord save those who are astray?',
  '3:139': 'Faint not nor grieve',
  '2:286': 'Allah tasketh not a soul beyond its scope.',
  '65:7': 'Allah will vouchsafe, after hardship, ease.',
  '16:97': 'him verily we shall quicken with good life',
  '53:39': 'man hath only that for which he maketh effort',
  '94:7-8': 'strive to please thy Lord.',
  '65:3': 'whosoever putteth his trust in Allah, He will suffice him.',
  '3:173': 'Allah is Sufficient for us! Most Excellent is He in Whom we trust!',
  '9:51': 'Naught befalleth us save that which Allah hath decreed for us.',
  '9:129': 'Allah sufficeth me.',
  '25:58': 'trust thou in the Living One Who dieth not',
  '33:3': 'put thy trust in Allah, for Allah is sufficient as Trustee.',
  '3:160': 'If Allah is your helper none can overcome you',
  '47:7': 'If ye help Allah, He will help you and will make your foothold firm.',
  '26:62': 'my Lord is with me. He will guide me.',
  '3:159': 'when thou art resolved, then put thy trust in Allah.',
  '13:11': 'Allah changeth not the condition of a folk until they (first) change that which is in their hearts',
  '21:107': 'We sent thee not save as a mercy for the peoples.',
  '7:56': 'the mercy of Allah is nigh unto the good.',
  '15:49': 'I am the Forgiving, the Merciful',
  '4:28': 'Allah would make the burden light for you',
  '6:54': 'Your Lord hath prescribed for Himself mercy',
  '7:156': 'My mercy embraceth all things',
  '2:163': 'the Beneficent, the Merciful.',
  '9:128': 'full of concern for you',
  '17:23': 'kindness to parents',
  '1:1-7': 'Show us the straight path',
  '2:2': 'a guidance unto those who ward off (evil).',
  '6:162': 'my living and my dying are for Allah, Lord of the Worlds.',
  '49:13': 'that ye may know one another.',
  '67:2': 'that He may try you which of you is best in conduct',
  '3:185': 'Every soul will taste of death.',
  '29:69': 'We surely guide them to Our paths',
  '112:1-4': 'Say: He is Allah, the One!',
  '10:57': 'a balm for that which is in the breasts',
  '2:256': 'There is no compulsion in religion.',
  '96:1-5': 'Read: In the name of thy Lord Who createth',
  '16:125': 'Call unto the way of thy Lord with wisdom and fair exhortation',
  '59:18': 'let every soul look to that which it sendeth on before for the morrow.',
  '2:269': 'he unto whom wisdom is given, he truly hath received abundant good.',
  // duas
  '2:201': 'Our Lord! Give unto us in the world that which is good and in the Hereafter that which is good, and guard us from the doom of Fire.',
  '2:250': 'Our Lord! Bestow on us endurance, make our foothold sure, and give us help against the disbelieving folk.',
  '3:8': 'Our Lord! Cause not our hearts to stray after Thou hast guided us, and bestow upon us mercy from Thy Presence. Lo! Thou, only Thou, art the Bestower.',
  '7:23': 'Our Lord! We have wronged ourselves. If thou forgive us not and have not mercy on us, surely we are of the lost!',
  '14:40': 'My Lord! Make me to establish proper worship, and some of my posterity (also); our Lord! and accept my prayer.',
  '14:41': 'Our Lord! Forgive me and my parents and believers on the day when the account is cast.',
  '17:24': 'My Lord! Have mercy on them both as they did care for me when I was little.',
  '18:10': 'Our Lord! Give us mercy from Thy presence, and shape for us right conduct in our plight.',
  '20:25-28': 'My Lord! relieve my mind And ease my task for me; And loose a knot from my tongue, That they may understand my saying.',
  '20:114': 'My Lord! Increase me in knowledge.',
  '21:83': 'Lo! adversity afflicteth me, and Thou art Most Merciful of all who show mercy.',
  '21:87': 'There is no Allah save Thee. Be Thou Glorified! Lo! I have been a wrong-doer.',
  '21:89': 'My Lord! Leave me not childless, though Thou art the Best of inheritors.',
  '23:97-98': 'My Lord! I seek refuge in Thee from suggestions of the evil ones, And I seek refuge in Thee, my Lord, lest they be present with me,',
  '23:118': 'My Lord! Forgive and have mercy, for Thou art Best of all who show mercy.',
  '25:74': 'Our Lord! Vouchsafe us comfort of our wives and of our offspring, and make us patterns for (all) those who ward off (evil).',
  '28:24': 'My Lord! I am needy of whatever good Thou sendest down for me.',
  '27:19': 'My Lord, arouse me to be thankful for Thy favour wherewith Thou hast favoured me and my parents, and to do good that shall be pleasing unto Thee, and include me in (the number of) Thy righteous slaves.',
  '2:127': 'Our Lord! Accept from us (this duty). Lo! Thou, only Thou, art the Hearer, the Knower.',
  '7:126': 'Our Lord! Vouchsafe unto us steadfastness and make us die as men who have surrendered (unto Thee).',
  '59:10': 'Our Lord! Forgive us and our brethren who were before us in the faith, and place not in our hearts any rancour toward those who believe. Our Lord! Thou art Full of Pity, Merciful.',
};

// Who is speaking in the passage, where it is a person rather than Allah addressing the reader.
const SPEAKERS = {
  '31:17': 'Luqman, to his son',
  '12:86': "Ya'qub (Jacob)",
  '12:87': "Ya'qub, to his sons",
  '26:62': 'Musa (Moses)',
  '71:10-12': 'Nuh (Noah), to his people',
  '20:46': 'Allah, to Musa and Harun',
  '15:56': 'Ibrahim (Abraham)',
  '11:90': "Shu'ayb, to his people",
  '3:173': 'The believers',
  '2:250': "Talut's (Saul's) army",
  '3:8': 'Those firm in knowledge',
  '7:23': 'Adam and Hawwa (Eve)',
  '14:40': 'Ibrahim (Abraham)',
  '14:41': 'Ibrahim (Abraham)',
  '17:24': 'Taught to every child',
  '18:10': 'The youths of the Cave',
  '20:25-28': 'Musa (Moses)',
  '20:114': 'The Prophet Muhammad ﷺ',
  '21:83': 'Ayyub (Job)',
  '21:87': 'Yunus (Jonah)',
  '21:89': 'Zakariya (Zechariah)',
  '23:97-98': 'The Prophet Muhammad ﷺ',
  '23:118': 'The Prophet Muhammad ﷺ',
  '25:74': 'The servants of the Most Merciful',
  '28:24': 'Musa (Moses)',
  '27:19': 'Sulayman (Solomon)',
  '2:127': "Ibrahim and Isma'il",
  '7:126': "Pharaoh's magicians, after believing",
  '59:10': 'The believers who came later',
};

function readTanzil(file) {
  const map = new Map();
  for (const line of readFileSync(src(file), 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = line.match(/^(\d+)\|(\d+)\|(.*)$/);
    if (m) map.set(`${m[1]}:${m[2]}`, m[3].trim());
  }
  return map;
}

const arabic = readTanzil('quran-uthmani.txt');
const english = readTanzil('en.pickthall.txt');
if (arabic.size !== 6236 || english.size !== 6236) {
  throw new Error(`Expected 6236 ayat, got ${arabic.size} Arabic / ${english.size} English`);
}
const BISMILLAH = arabic.get('1:1');

function passage(ref) {
  const [surahStr, range] = ref.split(':');
  const surah = Number(surahStr);
  const [from, to = from] = range.split('-').map(Number);
  const ayat = [];
  let bismillah = false;
  for (let a = from; a <= to; a++) {
    let ar = arabic.get(`${surah}:${a}`);
    const en = english.get(`${surah}:${a}`);
    if (!ar || !en) throw new Error(`Missing ${surah}:${a}`);
    // Tanzil prefixes the first ayah of each surah with the basmala; show it as a separate line.
    if (a === 1 && surah !== 1 && ar.startsWith(BISMILLAH + ' ')) {
      ar = ar.slice(BISMILLAH.length + 1);
      bismillah = true;
    }
    ayat.push({ n: a, ar, en });
  }
  return {
    id: `${surah}:${from}${to !== from ? `-${to}` : ''}`,
    surah,
    surahName: SURAH_NAMES[surah - 1],
    from,
    to,
    bismillah,
    ayat,
  };
}

// A short passage is its own key line; longer ones need one chosen in KEYS or MORE_KEYS.
const SHORT = 170;

function annotate(p) {
  const en = p.ayat.map((a) => a.en).join(' ');
  const key = KEYS[p.id] ?? MORE_KEYS[p.id] ?? (en.length <= SHORT ? en : undefined);
  if (!key || !en.includes(key)) throw new Error(`Key line for ${p.id} is missing or not in the translation`);
  return { ...p, key, speaker: SPEAKERS[p.id] ?? MORE_SPEAKERS[p.id] ?? null };
}

// Surah facts from Tanzil's metadata: [start, ayas, order, rukus, name, tname, ename, type].
const meta = readFileSync(src('quran-data.js'), 'utf8');
const suraBlock = meta.slice(meta.indexOf('QuranData.Sura = ['), meta.indexOf('];', meta.indexOf('QuranData.Sura = [')));
const surahs = [...suraBlock.matchAll(/\[(\d+), (\d+), (\d+), (\d+), '([^']*)', "([^"]*)", '([^']*)', '(Meccan|Medinan)'\]/g)].map(
  (m, i) => ({ n: i + 1, name: SURAH_NAMES[i], ayahs: Number(m[2]), arabic: m[5], meaning: m[7], type: m[8] }),
);
if (surahs.length !== 114) throw new Error(`Expected 114 surahs in metadata, got ${surahs.length}`);

const out = {
  _notice:
    'Arabic: Tanzil Quran Text (Uthmani, Version 1.1), Copyright (C) 2007-2026 Tanzil Project, ' +
    'CC BY 3.0, verbatim, https://tanzil.net. English: M. M. Pickthall (1930), public domain.',
  ayat: [...AYAT, ...MORE_AYAT].map(([ref, topics]) => annotate({ ...passage(ref), topics })),
  duas: [...DUAS, ...MORE_DUAS].map(([ref, title, when, topics]) => annotate({ ...passage(ref), title, when, topics })),
  surahs,
};

mkdirSync(join(root, 'src', 'data'), { recursive: true });
writeFileSync(join(root, 'src', 'data', 'quran.json'), JSON.stringify(out));

// The whole Quran for the reader: s[surah - 1][ayah - 1] = [arabic, english]. The basmala Tanzil
// prefixes to each surah's first ayah is removed here; the reader shows it as its own line.
const full = {
  _notice: out._notice,
  s: surahs.map(({ n, ayahs }) =>
    Array.from({ length: ayahs }, (_, i) => {
      let ar = arabic.get(`${n}:${i + 1}`);
      if (i === 0 && n !== 1 && ar.startsWith(BISMILLAH + ' ')) ar = ar.slice(BISMILLAH.length + 1);
      return [ar, english.get(`${n}:${i + 1}`)];
    }),
  ),
};
writeFileSync(join(root, 'src', 'data', 'quran-full.json'), JSON.stringify(full));

if (process.argv.includes('--print')) {
  for (const p of [...out.ayat, ...out.duas]) {
    const en = p.ayat.map((x) => x.en).join(' ');
    const chars = p.ayat.reduce((s, x) => s + x.ar.length, 0);
    console.log(`${p.id.padEnd(9)} [${chars}] ${en.slice(0, 150)}`);
  }
}
console.log(`Wrote ${out.ayat.length} passages and ${out.duas.length} duas.`);
