/* Editorial content hub (/guides). Hand-written cornerstone articles targeting
   informational queries that funnel into the Catalan A1 course — NOT templated
   programmatic pages. English first; localize the winners later.

   Bodies are trusted, author-written HTML (rendered with dangerouslySetInnerHTML,
   same as course content) so we can place contextual internal links. */

export interface GuideFaq { q: string; a: string }
export interface GuideSection { h2: string; html: string }
export interface Guide {
  slug: string;
  title: string;        // <h1>
  metaTitle: string;    // document <title> (≤ ~60 chars before " — Verbadium")
  description: string;  // meta description (~150 chars)
  updated: string;      // ISO date — freshness signal
  readMins: number;
  lead: string;         // 40–60 word direct-answer intro (AI-extractable)
  sections: GuideSection[];
  faqs: GuideFaq[];
  related: string[];    // other guide slugs
}

const COURSE_CTA =
  'Verbadium’s <a href="/courses/catalan-a1">Catalan A1 course</a> takes you from zero to the official beginner level with native-speaker audio, full IPA, 108 auto-marked exercises and a timed mock exam — one-time €25, <a href="/pricing">lifetime access</a>. <a href="/courses/catalan-a1/unit/1">Unit 1 is a free preview</a>.';

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-learn-catalan',
    title: 'How to Learn Catalan from Scratch: A Beginner’s Roadmap',
    metaTitle: 'How to Learn Catalan from Scratch (Beginner Roadmap)',
    description: 'A step-by-step roadmap to learn Catalan from zero: sounds first, core grammar, high-frequency vocabulary, listening and a clear path to the A1 level.',
    updated: '2026-06-30',
    readMins: 7,
    lead: 'To learn Catalan from scratch, start with its sounds (especially the vowels and the schwa), then build a small core of high-frequency words, the present tense and basic sentence patterns. Aim for the A1 level first — roughly 150–200 hours of focused study — using short daily sessions with audio and active recall.',
    sections: [
      { h2: 'Start with the sounds, not the grammar', html: `<p>Catalan pronunciation is where most beginners (especially Spanish speakers) go wrong, because Catalan has sounds Spanish doesn’t — eight vowel sounds including the schwa (/ə/) in unstressed syllables, open and closed <em>e</em> and <em>o</em>, and final-consonant devoicing. Learn the alphabet and the IPA for each sound <strong>before</strong> you memorise lists of words, so every new word is stored with the right pronunciation. See our <a href="/guides/catalan-alphabet-pronunciation">Catalan alphabet &amp; pronunciation guide</a>.</p>` },
      { h2: 'Build a high-frequency core', html: `<p>You don’t need thousands of words to start speaking. The most common ~500 words cover the large majority of everyday conversation. Prioritise pronouns, the verbs <em>ser</em>/<em>estar</em>, <em>haver</em> and <em>tenir</em>, numbers, days, and survival phrases. Use spaced repetition and always learn words with audio, not just spelling.</p>` },
      { h2: 'Learn grammar in the order you’ll use it', html: `<p>A sensible A1 sequence: the present tense of regular verbs and the key irregulars, articles and gender, basic plurals, adjective agreement, then the near-future (<em>anar a</em> + infinitive) and the very common <em>perfet</em> (<em>he parlat</em>) past. Don’t front-load the subjunctive or every tense — at A1 you need to handle everyday situations, not pass a linguistics exam.</p>` },
      { h2: 'Train your ear early', html: `<p>Listening is the skill beginners neglect and then regret. From week one, listen to slow, clear Catalan with transcripts — even single words with native audio help. Verbadium’s exercises use real native-speaker recordings (from Lingua Libre) so you train recognition, not just reading.</p>` },
      { h2: 'Set a concrete first goal: A1', html: `<p>“Learn Catalan” is too vague to be motivating. “Reach A1” is measurable: you can introduce yourself, ask and answer simple questions, and handle basic daily situations. It’s typically 150–200 hours of study, very achievable in a few months with short daily sessions. ${COURSE_CTA}</p>` },
    ],
    faqs: [
      { q: 'How long does it take to learn Catalan?', a: 'Reaching the A1 (beginner) level typically takes 150–200 hours of focused study — a few months at 30–45 minutes a day. Speakers of another Romance language (especially Spanish, French or Italian) usually progress faster.' },
      { q: 'Is Catalan hard to learn?', a: 'Catalan is a Romance language with regular spelling and grammar, so it’s approachable for English speakers and easier still for Spanish or French speakers. The main early challenge is pronunciation — the vowel system and the schwa — which is why it pays to start with the sounds.' },
      { q: 'Can I learn Catalan if I already speak Spanish?', a: 'Yes, and you have a big head start on vocabulary and grammar. The key differences to focus on are pronunciation (Catalan’s vowels and schwa), some distinct verb forms, and false friends. See our Catalan vs Spanish guide.' },
      { q: 'Do I need a teacher to learn Catalan?', a: 'No. A structured self-study course with native audio, exercises and feedback can take you to A1 on your own. A tutor helps most later, for speaking practice once you have the basics.' },
    ],
    related: ['catalan-alphabet-pronunciation', 'catalan-a1-exam', 'catalan-vs-spanish'],
  },
  {
    slug: 'catalan-a1-exam',
    title: 'The Catalan A1 Level (Certificat de nivell inicial), Explained',
    metaTitle: 'Catalan A1 Level Explained — What to Expect',
    description: 'What the Catalan A1 (CEFR) beginner level means, what you should be able to do, how it’s assessed, and how to prepare efficiently.',
    updated: '2026-06-30',
    readMins: 6,
    lead: 'A1 is the first level of the Common European Framework (CEFR). At Catalan A1 you can understand and use familiar everyday expressions, introduce yourself, and ask and answer simple questions about personal details — as long as the other person speaks slowly and clearly. It’s the foundation every higher level builds on.',
    sections: [
      { h2: 'What “A1” actually means', html: `<p>The CEFR defines six levels, from A1 (beginner) to C2 (mastery). A1 is the entry point: you handle concrete, predictable situations — greetings, personal information, simple needs — with simple phrases. It is deliberately limited in scope, which is exactly why it’s achievable for a motivated beginner in a few months.</p>` },
      { h2: 'What you can do at Catalan A1', html: `<p>By the end of A1 you should be able to: introduce yourself and others; give basic personal details (where you live, people you know, things you have); understand slow, clear speech on familiar topics; read short, simple texts and signs; and write short, simple notes. Speaking is interactive but simple — short exchanges, with the listener’s help.</p>` },
      { h2: 'How beginner Catalan is assessed', html: `<p>Most beginner assessments mirror the four skills — reading, listening, writing and speaking — plus a grammar/vocabulary component. Official Catalan certificates are issued by bodies such as the Generalitat de Catalunya and recognised institutions; the exact format, available levels and fees change over time, so always confirm current details with the official body for your situation. A good course prepares you for the <em>skills</em>, which transfer to any specific exam.</p>` },
      { h2: 'How to prepare efficiently', html: `<p>Practise all four skills, not just reading. Do timed practice so the format doesn’t surprise you, and get exposure to native audio so listening isn’t the weak link. Verbadium’s course is built around the A1 skill set and includes a <strong>full timed mock exam</strong> plus auto-marked exercises so you know where you stand. ${COURSE_CTA}</p>` },
    ],
    faqs: [
      { q: 'Is Catalan A1 difficult?', a: 'A1 is the easiest CEFR level by design — it covers familiar, everyday language in simple phrases. The main effort is building pronunciation and a core of high-frequency vocabulary and present-tense grammar.' },
      { q: 'How long to reach Catalan A1?', a: 'Around 150–200 hours of study for most learners — a few months of short daily sessions. Romance-language speakers often get there faster.' },
      { q: 'What can I do after A1?', a: 'A1 is the foundation for A2 and beyond. After A1 you expand tenses, vocabulary and the ability to handle less predictable situations. Solidify A1 first — gaps there make every later level harder.' },
      { q: 'Where do I get an official Catalan certificate?', a: 'Official certificates are issued by bodies such as the Generalitat de Catalunya and recognised examination centres. Check the official body for current levels, dates and requirements, as these change. A skills-based course prepares you regardless of the specific exam.' },
    ],
    related: ['how-to-learn-catalan', 'catalan-alphabet-pronunciation', 'catalan-vs-spanish'],
  },
  {
    slug: 'catalan-alphabet-pronunciation',
    title: 'The Catalan Alphabet & Pronunciation Guide (with IPA)',
    metaTitle: 'Catalan Alphabet & Pronunciation Guide (with IPA)',
    description: 'The Catalan alphabet, its special letters (ç, l·l) and accents, the vowel system and the schwa, with IPA — everything a beginner needs to pronounce Catalan.',
    updated: '2026-06-30',
    readMins: 6,
    lead: 'Catalan uses the 26-letter Latin alphabet plus the special character ç and the digraph l·l (ela geminada). Its defining feature is the vowel system: Central Catalan has eight vowel sounds, including a schwa (/ə/) in unstressed syllables and a contrast between open and closed e and o — sounds Spanish does not have.',
    sections: [
      { h2: 'The letters and special characters', html: `<p>The alphabet is the familiar A–Z, but Catalan adds <strong>ç</strong> (c-trencada, a soft “s” sound) and the digraph <strong>l·l</strong> (ela geminada, a doubled L written with a middle dot, as in <em>col·legi</em>). You’ll also see accents: the grave (<em>à è ò</em>) and acute (<em>é í ó ú</em>) marking stress and vowel quality, and the dieresis (<em>ï ü</em>).</p>` },
      { h2: 'The vowel system and the schwa', html: `<p>This is what makes Catalan sound different from Spanish. In Central Catalan, unstressed <em>a</em> and <em>e</em> reduce to a schwa /ə/ (the “uh” in English <em>about</em>), and unstressed <em>o</em> often sounds like /u/. Stressed <em>e</em> and <em>o</em> can be open (è, ò) or closed (é, ó). Getting these right is the single biggest step toward sounding natural.</p>` },
      { h2: 'Consonants worth knowing early', html: `<p>A few consonant features trip up beginners: final consonants are often devoiced; <em>ix</em>/<em>x</em> can be a “sh” sound (<em>caixa</em>); <em>ny</em> is like Spanish <em>ñ</em>; and <em>tj/tg</em> and <em>l·l</em> have their own values. Learn these as sounds with audio rather than guessing from spelling.</p>` },
      { h2: 'Why IPA helps from day one', html: `<p>Catalan spelling is fairly regular, but the vowel reductions mean the written form doesn’t always tell you the sound. Learning each word with its IPA transcription and native audio stops bad pronunciation habits before they form. Verbadium teaches every entry with full IPA and native-speaker audio. ${COURSE_CTA}</p>` },
    ],
    faqs: [
      { q: 'How many letters are in the Catalan alphabet?', a: 'Catalan uses the 26 Latin letters plus the special character ç and the digraph l·l (ela geminada). Several digraphs (ny, ix, tj/tg, qu, gu) represent single sounds.' },
      { q: 'What is the schwa in Catalan?', a: 'In Central Catalan, unstressed a and e are pronounced as a schwa /ə/ — a neutral “uh” sound. It’s one of the main features that distinguishes Catalan pronunciation from Spanish, where vowels keep a full value.' },
      { q: 'What is l·l (ela geminada)?', a: 'It’s a doubled L written with a raised dot between the two Ls, as in col·legi or paral·lel. It marks a geminate (lengthened) L sound and is unique to Catalan spelling.' },
      { q: 'Is Catalan pronunciation hard?', a: 'The vowels — open/closed e and o and the schwa — are the main challenge, especially for Spanish speakers. With IPA and native audio from the start, it’s very learnable; the consonants are mostly straightforward.' },
    ],
    related: ['how-to-learn-catalan', 'catalan-vs-spanish', 'catalan-a1-exam'],
  },
  {
    slug: 'catalan-vs-spanish',
    title: 'Catalan vs Spanish: How Different Are They Really?',
    metaTitle: 'Catalan vs Spanish: How Different Are They?',
    description: 'Are Catalan and Spanish the same? No. Here’s how they differ in pronunciation, grammar and vocabulary — and why Catalan is its own language, not a dialect.',
    updated: '2026-06-30',
    readMins: 6,
    lead: 'Catalan is a distinct Romance language, not a dialect of Spanish. The two share Latin roots and look similar on paper, but they differ clearly in pronunciation (Catalan’s vowels and schwa), several grammar features, and a large amount of everyday vocabulary. Catalan is in some ways closer to Occitan and French than to Spanish.',
    sections: [
      { h2: 'Is Catalan a dialect of Spanish?', html: `<p>No. Catalan and Spanish are separate languages that both descend from Latin. Catalan has its own grammar, vocabulary and literary tradition, and is the official language of Andorra and co-official in Catalonia, the Balearic Islands and the Valencian Community (where it’s known as Valencian). Mutual intelligibility is partial at best, especially in speech.</p>` },
      { h2: 'Pronunciation: the clearest difference', html: `<p>Spanish has five clean vowel sounds; Catalan has eight, with open/closed <em>e</em> and <em>o</em> and the unstressed schwa /ə/. Catalan also devoices final consonants and has sounds like the “sh” in <em>caixa</em>. To a listener, the two languages sound noticeably different even when the words look related. See our <a href="/guides/catalan-alphabet-pronunciation">pronunciation guide</a>.</p>` },
      { h2: 'Grammar differences', html: `<p>Many structures map closely, but watch for: different forms of “to have” and the auxiliary used for the perfect tense; weak/clitic pronouns (en, hi) that Spanish lacks; contractions of articles and prepositions (del, al, pel); and some plural and gender patterns. These are exactly the points a Spanish speaker should focus on.</p>` },
      { h2: 'Vocabulary and false friends', html: `<p>A lot of vocabulary is shared or recognisable, but plenty isn’t — and there are false friends to watch (e.g. words that look Spanish but mean something else). If you already speak Spanish you’ll move quickly, provided you don’t simply “Catalanise” Spanish words. ${COURSE_CTA}</p>` },
    ],
    faqs: [
      { q: 'Are Catalan and Spanish mutually intelligible?', a: 'Only partially, and more so in writing than in speech. A Spanish speaker can guess a fair amount of written Catalan but will struggle with spoken Catalan because of the different vowel system and vocabulary.' },
      { q: 'Is Catalan closer to French or Spanish?', a: 'Catalan sits between them and shares notable features with Occitan and French (some vocabulary and grammar), while also being close to Spanish. It’s genuinely its own language, not a midpoint dialect.' },
      { q: 'Is it easier to learn Catalan if I speak Spanish?', a: 'Yes — shared Latin roots give you a big head start on vocabulary and grammar. Focus your effort on pronunciation (vowels and schwa), the distinct verb and pronoun forms, and false friends.' },
      { q: 'Where is Catalan spoken?', a: 'Catalan is the sole official language of Andorra and is co-official in Catalonia, the Balearic Islands and the Valencian Community (as Valencian), with speakers also in parts of Aragon, southern France and Alghero in Sardinia — around 10 million people.' },
    ],
    related: ['how-to-learn-catalan', 'catalan-alphabet-pronunciation', 'catalan-a1-exam'],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
