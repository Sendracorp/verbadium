/* Lightweight i18n for the localized MARKETING surface (home + course landing
   + shell). English stays at root; ca/es/fr are SEO landing pages that funnel
   into the (English-taught) course. No dependency — just typed dictionaries. */

export const LOCALES = ['en', 'ca', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_LABEL: Record<Locale, string> = { en: 'English', ca: 'Català', es: 'Español', fr: 'Français' };

/* Canonical paths per page, per locale (localized slugs carry the keyword). */
export const PATHS = {
  home: { en: '/', ca: '/ca', es: '/es', fr: '/fr' },
  course: {
    en: '/courses/catalan-a1',
    ca: '/ca/curs-de-catala',
    es: '/es/curso-de-catalan',
    fr: '/fr/cours-de-catalan',
  },
} as const;
export type PageKey = keyof typeof PATHS;

/** hreflang map for next/metadata `alternates.languages` (+ x-default = English). */
export function hreflang(page: PageKey): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of LOCALES) out[l] = PATHS[page][l];
  out['x-default'] = PATHS[page].en;
  return out;
}

export interface Dict {
  nav: { course: string; pricing: string; login: string; signup: string };
  langLabel: string;                 // a11y label for the language switcher
  home: { badge: string; h1: string; sub: string; seeCourse: string };
  card: { level: string; buy: string; preview: string; lifetime: string };
  course: {
    name: string; tagline: string; metaTitle: string; metaDesc: string;
    salesHeading: string;            // uses {price}
    bullets: string[];               // uses {units} {exercises} {glossary}
    taughtInEnglish: string;
    previewLead: string; previewLink: string;   // previewLink uses {n}
    alreadyBought: string;
  };
  footer: { tagline: string; learn: string; legal: string; help: string;
    terms: string; refunds: string; privacy: string; contact: string; mor: string };
}

const en: Dict = {
  nav: { course: 'Course', pricing: 'Pricing', login: 'Log in', signup: 'Sign up' },
  langLabel: 'Language',
  home: { badge: 'INTERACTIVE LANGUAGE COURSES', h1: 'Learn Catalan, properly',
    sub: 'Exam-focused Catalan courses with full IPA pronunciation, native-speaker audio, auto-marked exercises and real mock exams.',
    seeCourse: 'See the course' },
  card: { level: 'Beginner · A1', buy: 'Get the course', preview: 'Free preview', lifetime: 'One payment · lifetime access' },
  course: {
    name: 'Catalan from Scratch (A1)',
    tagline: 'A complete beginner’s course in Central Catalan, built to pass the official A1 exam.',
    metaTitle: 'Catalan Course Online (A1) — exam prep with audio & exercises',
    metaDesc: 'Learn Catalan online: an interactive A1 course for the official exam (Certificat de nivell inicial de català), the official language of Andorra. Native audio, full IPA, 100+ exercises, mock exam. Free preview.',
    salesHeading: 'Get the full course — {price}, yours forever',
    bullets: [
      'All {units} units with {exercises} interactive, auto-marked exercises',
      'Full mock A1 exam with timers and attempt history',
      'Complete glossary ({glossary} entries) with native-speaker audio and IPA',
      'Listening, dictation and translation drills',
      'Progress saved to your account — continue on any device',
    ],
    taughtInEnglish: 'Taught in English (explanations and translations in English).',
    previewLead: 'Try before you buy:', previewLink: 'Unit {n} is free — no account needed.',
    alreadyBought: 'Already bought it? Log in',
  },
  footer: { tagline: 'Learn Catalan, properly — interactive courses with full IPA, native-speaker audio, auto-marked exercises and real mock exams.',
    learn: 'Learn', legal: 'Legal', help: 'Help', terms: 'Terms', refunds: 'Refunds', privacy: 'Privacy', contact: 'Contact',
    mor: 'Payments & VAT handled by Paddle.com, our merchant of record.' },
};

const ca: Dict = {
  nav: { course: 'Curs', pricing: 'Preus', login: 'Inicia sessió', signup: 'Crea un compte' },
  langLabel: 'Idioma',
  home: { badge: 'CURSOS D’IDIOMES INTERACTIUS', h1: 'Aprèn català, com cal',
    sub: 'Curs de català enfocat a l’examen, amb pronunciació AFI completa, àudio de parlants nadius, exercicis autocorregits i un examen de mostra real.',
    seeCourse: 'Veure el curs' },
  card: { level: 'Principiant · A1', buy: 'Aconsegueix el curs', preview: 'Prova gratuïta', lifetime: 'Un sol pagament · accés de per vida' },
  course: {
    name: 'Català des de zero (A1)',
    tagline: 'Un curs complet per a principiants de català central, fet per aprovar l’examen oficial d’A1.',
    metaTitle: 'Curs de català en línia (A1) — preparació de l’examen oficial',
    metaDesc: 'Aprèn català en línia: curs interactiu d’A1 per a l’examen oficial (Certificat de nivell inicial de català), la llengua oficial d’Andorra. Àudio nadiu, AFI complet, més de 100 exercicis i examen de mostra. Prova gratuïta.',
    salesHeading: 'Aconsegueix el curs complet — {price}, per sempre',
    bullets: [
      'Les {units} unitats amb {exercises} exercicis interactius i autocorregits',
      'Examen de mostra d’A1 complet amb cronòmetres i historial d’intents',
      'Glossari complet ({glossary} entrades) amb àudio de parlants nadius i AFI',
      'Exercicis d’escolta, dictat i traducció',
      'El progrés es desa al teu compte — continua des de qualsevol dispositiu',
    ],
    taughtInEnglish: 'El curs s’imparteix en anglès (explicacions i traduccions en anglès).',
    previewLead: 'Prova-ho abans de comprar:', previewLink: 'la unitat {n} és gratuïta, sense compte.',
    alreadyBought: 'Ja l’has comprat? Inicia sessió',
  },
  footer: { tagline: 'Aprèn català, com cal — cursos interactius amb AFI complet, àudio de parlants nadius, exercicis autocorregits i exàmens de mostra reals.',
    learn: 'Aprèn', legal: 'Legal', help: 'Ajuda', terms: 'Condicions', refunds: 'Devolucions', privacy: 'Privadesa', contact: 'Contacte',
    mor: 'Pagaments i IVA gestionats per Paddle.com, el nostre venedor oficial.' },
};

const es: Dict = {
  nav: { course: 'Curso', pricing: 'Precios', login: 'Iniciar sesión', signup: 'Crear cuenta' },
  langLabel: 'Idioma',
  home: { badge: 'CURSOS DE IDIOMAS INTERACTIVOS', h1: 'Aprende catalán, de verdad',
    sub: 'Curso de catalán enfocado al examen, con pronunciación AFI completa, audio de hablantes nativos, ejercicios autocorregidos y un examen de prueba real.',
    seeCourse: 'Ver el curso' },
  card: { level: 'Principiante · A1', buy: 'Consigue el curso', preview: 'Prueba gratis', lifetime: 'Un solo pago · acceso de por vida' },
  course: {
    name: 'Catalán desde cero (A1)',
    tagline: 'Un curso completo para principiantes de catalán central, diseñado para aprobar el examen oficial de A1.',
    metaTitle: 'Curso de catalán online (A1) — preparación del examen oficial',
    metaDesc: 'Aprende catalán online: curso interactivo de A1 para el examen oficial (Certificat de nivell inicial de català), la lengua oficial de Andorra. Audio nativo, AFI completo, más de 100 ejercicios y examen de prueba. Prueba gratis.',
    salesHeading: 'Consigue el curso completo — {price}, para siempre',
    bullets: [
      'Las {units} unidades con {exercises} ejercicios interactivos y autocorregidos',
      'Examen de prueba de A1 completo con cronómetros e historial de intentos',
      'Glosario completo ({glossary} entradas) con audio de hablantes nativos y AFI',
      'Ejercicios de escucha, dictado y traducción',
      'El progreso se guarda en tu cuenta — continúa desde cualquier dispositivo',
    ],
    taughtInEnglish: 'El curso se imparte en inglés (explicaciones y traducciones en inglés).',
    previewLead: 'Pruébalo antes de comprar:', previewLink: 'la unidad {n} es gratis, sin cuenta.',
    alreadyBought: '¿Ya lo compraste? Inicia sesión',
  },
  footer: { tagline: 'Aprende catalán, de verdad — cursos interactivos con AFI completo, audio de hablantes nativos, ejercicios autocorregidos y exámenes de prueba reales.',
    learn: 'Aprende', legal: 'Legal', help: 'Ayuda', terms: 'Términos', refunds: 'Reembolsos', privacy: 'Privacidad', contact: 'Contacto',
    mor: 'Pagos e IVA gestionados por Paddle.com, nuestro vendedor oficial.' },
};

const fr: Dict = {
  nav: { course: 'Cours', pricing: 'Tarifs', login: 'Se connecter', signup: 'Créer un compte' },
  langLabel: 'Langue',
  home: { badge: 'COURS DE LANGUES INTERACTIFS', h1: 'Apprenez le catalan, vraiment',
    sub: 'Cours de catalan axé sur l’examen, avec prononciation API complète, audio de locuteurs natifs, exercices autocorrigés et un examen blanc réel.',
    seeCourse: 'Voir le cours' },
  card: { level: 'Débutant · A1', buy: 'Obtenir le cours', preview: 'Aperçu gratuit', lifetime: 'Un seul paiement · accès à vie' },
  course: {
    name: 'Le catalan à partir de zéro (A1)',
    tagline: 'Un cours complet pour débutants en catalan central, conçu pour réussir l’examen officiel A1.',
    metaTitle: 'Cours de catalan en ligne (A1) — préparation à l’examen officiel',
    metaDesc: 'Apprenez le catalan en ligne : cours interactif A1 pour l’examen officiel (Certificat de nivell inicial de català), la langue officielle de l’Andorre. Audio natif, API complet, plus de 100 exercices et examen blanc. Aperçu gratuit.',
    salesHeading: 'Obtenez le cours complet — {price}, pour toujours',
    bullets: [
      'Les {units} unités avec {exercises} exercices interactifs et autocorrigés',
      'Examen blanc A1 complet avec minuteurs et historique des tentatives',
      'Glossaire complet ({glossary} entrées) avec audio de locuteurs natifs et API',
      'Exercices d’écoute, de dictée et de traduction',
      'La progression est enregistrée sur votre compte — continuez sur n’importe quel appareil',
    ],
    taughtInEnglish: 'Cours dispensé en anglais (explications et traductions en anglais).',
    previewLead: 'Essayez avant d’acheter :', previewLink: 'l’unité {n} est gratuite, sans compte.',
    alreadyBought: 'Déjà acheté ? Connectez-vous',
  },
  footer: { tagline: 'Apprenez le catalan, vraiment — des cours interactifs avec API complet, audio de locuteurs natifs, exercices autocorrigés et examens blancs réels.',
    learn: 'Apprendre', legal: 'Légal', help: 'Aide', terms: 'Conditions', refunds: 'Remboursements', privacy: 'Confidentialité', contact: 'Contact',
    mor: 'Paiements et TVA gérés par Paddle.com, notre revendeur officiel.' },
};

const DICTS: Record<Locale, Dict> = { en, ca, es, fr };
export function getDict(locale: Locale): Dict { return DICTS[locale] ?? en; }

/** Fill {key} placeholders. */
export function t(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
