// 识别案例页（components/projects/custom/identity）的正文。这一页的章节不在 Sanity 里，文案放在这里。
// 不并进 dictionaries.ts：那份字典整份传给导航栏和页脚（客户端组件），会被打进每一个页面；
// 这些话只有案例页用，「墨分五色」也只该出现在那一页（手册 01、10）。
// 意大利语是草稿，上线前请母语者过一遍。英语在这一页统一用美式的 color：项目名和出处那段话是手册里的固定写法。
import type { Locale } from "./config";

export type CaseIdentityCopy = {
  origin: { title: string; name: string; reading: string; text: string };
  mark: {
    title: string;
    text: string;
    construction: string;
    both: string;
    sizes: string;
    lockup: string;
    hint: string;
    markLabel: string;
  };
  colors: {
    title: string;
    text: string;
    names: [string, string, string, string, string];
    onPaper: string;
    atNight: string;
  };
  line: {
    title: string;
    text: string;
    type: { label: string; roles: [string, string, string] };
    divide: string;
    stress: { label: string; text: string; word: string };
    circle: { label: string; text: string; word: string };
    rows: [string, string, string];
  };
  inUse: { title: string; text: string };
};

const copy: Record<Locale, CaseIdentityCopy> = {
  it: {
    origin: {
      title: "Origine",
      name: "墨分五色",
      reading: "mò fēn wǔ sè · L’inchiostro ha cinque colori.",
      text: "Nella pittura a inchiostro cinese si dice che un solo nero contenga cinque colori. Basta aggiungere acqua, e il nero si apre. Lavoro allo stesso modo: il colore è già dentro le cose ordinarie. Il design lo fa uscire.",
    },
    mark: {
      title: "Il marchio",
      text: "Il marchio è 雨, pioggia: il primo carattere del mio nome. Sei cerchi concentrici, poche linee rette, quattro tagli.",
      construction: "Costruzione",
      both: "Geometrico e a inchiostro",
      sizes: "Dimensioni",
      lockup: "Con il nome",
      hint: "Passaci sopra con il puntatore.",
      markLabel: "Il marchio, costruito con sei cerchi e poi aperto dall’acqua",
    },
    colors: {
      title: "Cinque colori",
      text: "Con l’acqua l’inchiostro si apre in cinque colori, dal nucleo al corallo. Il corallo, quello che tocca la carta, è l’unico colore usato altrove.",
      names: ["Core", "Cobalt", "Cyan", "Amber", "Coral"],
      onPaper: "Sulla carta",
      atNight: "Di notte",
    },
    line: {
      title: "Caratteri e linea",
      text: "Tre caratteri, ognuno con un solo compito. Ogni linea è disegnata a mano, salvata come tracciato e riusata: per dividere, per sottolineare una parola, per cerchiarne una.",
      type: { label: "Caratteri", roles: ["Titoli", "Testo", "Etichette e numeri"] },
      divide: "Dividere",
      stress: { label: "Sottolineare una parola", text: "Un portfolio bilingue per uno studio di Milano.", word: "bilingue" },
      circle: { label: "Cerchiare una parola", text: "Lo disegno, poi lo costruisco.", word: "disegno" },
      rows: ["Juno", "Urlo Creativo", "Impass"],
    },
    inUse: {
      title: "In uso",
      text: "Un biglietto da visita, una copertina social, un’immagine di profilo e l’immagine di condivisione.",
    },
  },
  en: {
    origin: {
      title: "Origin",
      name: "墨分五色",
      reading: "mò fēn wǔ sè · Ink holds five colors.",
      text: "In Chinese ink painting, a single black ink is said to hold five colors. Add water, and black opens up. I work the same way: the color is already in the ordinary thing. Design lets it out.",
    },
    mark: {
      title: "The mark",
      text: "The mark is 雨, rain: the first character of my given name. Six concentric circles, a few straight lines, four cuts.",
      construction: "Construction",
      both: "Geometric and ink",
      sizes: "Sizes",
      lockup: "With the name",
      hint: "Move the pointer across it.",
      markLabel: "The mark, built from six circles, then opened by water",
    },
    colors: {
      title: "Five colors",
      text: "Add water and the ink opens into five colors, from the core out to coral. Coral, the one that touches the paper, is the only color used anywhere else.",
      names: ["Core", "Cobalt", "Cyan", "Amber", "Coral"],
      onPaper: "On paper",
      atNight: "At night",
    },
    line: {
      title: "Type and line",
      text: "Three typefaces, each with one job. Every line is drawn by hand, saved as a path and reused: to divide, to stress one word, to circle one.",
      type: { label: "Typefaces", roles: ["Titles", "Text", "Labels and numbers"] },
      divide: "Divide",
      stress: { label: "Stress one word", text: "A bilingual portfolio for a Milan studio.", word: "bilingual" },
      circle: { label: "Circle one word", text: "I design it, then I build it.", word: "design" },
      rows: ["Juno", "Urlo Creativo", "Impass"],
    },
    inUse: {
      title: "In use",
      text: "A business card, a social header, a profile picture and the share image.",
    },
  },
};

export function getCaseIdentityCopy(locale: Locale): CaseIdentityCopy {
  return copy[locale];
}
