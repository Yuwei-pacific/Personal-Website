import type { Locale } from "./config";

type Dictionary = {
  navigation: {
    home: string;
    about: string;
    work: string;
    homeAria: string;
    aboutAria: string;
    workAria: string;
    menu: string;
    close: string;
    openMenu: string;
    closeMenu: string;
    headerAria: string;
    noItems: string;
    socials: string;
    socialLinksAria: string;
    language: string;
    switchLanguage: string;
    theme: string;
    themeLight: string;
    themeDark: string;
  };
  common: {
    skipToMain: string;
    portraitAlt: string;
  };
  home: {
    hero: {
      basedIn: string;
      /** 口号拆成四段：before + 化开的 accent + after 是第一行，end 是第二行 */
      slogan: { before: string; accent: string; after: string; end: string };
      /** 身份段：lead 用墨色（谁、做什么、现在在哪），rest 用淡墨（给谁做） */
      identity: { lead: string; rest: string };
      cta: string;
      /** 接外部项目：首屏联系方式旁边和页脚各说一次 */
      availability: string;
    };
    aboutPreview: {
      title: string;
      body: string;
      cta: string;
    };
    projects: {
      title: string;
      empty: string;
      /** 标题旁计数的量词，供辅助技术拼出可读的标签（如 "5 progetti"） */
      countLabel: string;
      /** 精选之外其余项目的目录标题 */
      index: string;
    };
  };
  about: {
    eyebrow: string;
    roleLabel: string;
    locationLabel: string;
    languagesLabel: string;
    languages: string[];
    /**
     * 第一屏的两层文字：intro.lead 是大标题（我是谁、从哪来）；intro.body 是现状（在哪工作、接项目、在读什么）。
     * intro.body 不重复首页那句「先设计、再自己做出来」（首屏和首页 About 已经各说过一次）。
     * 出处「墨分五色」不在这页讲了（用户 2026-11-16）：留给将来的视觉识别案例，文案在品牌手册 10 里
     */
    /** leadStress：大标题里用手画线划出来的那个词（手册 06：一个标题最多一个） */
    intro: { lead: string; leadStress: string; body: string };
    education: string;
    experience: string;
    capabilities: string;
    capabilitiesEmpty: string;
    resumeEmpty: string;
  };
  project: {
    back: string;
    type: string;
    year: string;
    client: string;
    location: string;
    visitOfficial: string;
    visitProject: string;
    credits: string;
    contributors: string;
    roles: string;
    skills: string;
    gallery: string;
    links: string;
    nextProject: string;
    playVideo: string;
    pauseVideo: string;
    playGalleryVideo: string;
    viewGalleryImage: string;
  };
  footer: {
    getInTouch: string;
    site: string;
    elsewhere: string;
    basedIn: string;
    workingInternationally: string;
    rights: string;
    aria: string;
  };
  errors: {
    notFoundTitle: string;
    /** 404 标题里划线的那个词 */
    notFoundStress: string;
    notFoundBody: string;
    backHome: string;
    errorEyebrow: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
  };
  metadata: {
    siteTitle: string;
    siteDescription: string;
    keywords: string[];
    aboutTitle: string;
    aboutDescription: string;
    projectNotFound: string;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  it: {
    navigation: {
      home: "Home",
      about: "Chi sono",
      work: "Progetti",
      homeAria: "Vai alla home",
      aboutAria: "Scopri Yuwei Li",
      workAria: "Vedi i progetti selezionati",
      menu: "Menu",
      close: "Chiudi",
      openMenu: "Apri menu",
      closeMenu: "Chiudi menu",
      headerAria: "Navigazione principale",
      noItems: "Nessuna voce",
      socials: "Social",
      socialLinksAria: "Link social",
      language: "Lingua",
      switchLanguage: "Passa all’inglese",
      theme: "Tema",
      themeLight: "Chiaro",
      themeDark: "Scuro",
    },
    common: {
      skipToMain: "Vai al contenuto principale",
      portraitAlt: "Ritratto di Yuwei Li",
    },
    home: {
      hero: {
        basedIn: "Lavoro da Milano con clienti internazionali",
        slogan: { before: "Dare ", accent: "colore", after: "", end: "all’ordinario." },
        identity: {
          lead: "Yuwei Li è communication designer e frontend developer a Milano, oggi a POLI.design.",
          rest: " Identità visive, interfacce e siti web per studi creativi e organizzazioni orientate al design.",
        },
        cta: "Parliamone →",
        availability: "Disponibile per progetti freelance",
      },
      aboutPreview: {
        title: "Lo disegno, poi lo costruisco.",
        body:
          "La maggior parte dei miei progetti passa dal primo frame in Figma al sito online restando nelle stesse mani. Tra il design e il codice non si perde niente.",
        cta: "Scopri di più →",
      },
      projects: {
        title: "Progetti",
        empty: "I progetti appariranno qui dopo la pubblicazione in Sanity.",
        countLabel: "progetti",
        index: "Indice",
      },
    },
    about: {
      eyebrow: "Chi sono",
      roleLabel: "Ruolo",
      locationLabel: "Luogo",
      languagesLabel: "Lingue",
      languages: ["Cinese — madrelingua", "Inglese — B2", "Italiano — B2"],
      // 意大利语文案是草稿，上线前请母语者过一遍（品牌手册 10）。
      // 句子特意写成不带性别变化的（没有 arrivato / arrivata 这类过去分词）
      intro: {
        lead: "Sono Yuwei Li. Dalla Cina a Firenze per dipingere, poi a Milano per progettare.",
        leadStress: "dipingere",
        body:
          "Oggi lavoro come UX designer a POLI.design e seguo progetti freelance di communication design e sviluppo frontend. Sto completando la laurea magistrale in Communication Design al Politecnico di Milano.",
      },
      education: "Formazione",
      experience: "Esperienza",
      capabilities: "Competenze",
      capabilitiesEmpty:
        "Le competenze appariranno qui dopo la pubblicazione in Sanity.",
      resumeEmpty: "Le voci appariranno qui dopo la pubblicazione in Sanity.",
    },
    project: {
      back: "← Torna ai progetti",
      type: "Tipologia",
      year: "Anno",
      client: "Cliente",
      location: "Luogo",
      visitOfficial: "Visita il sito ufficiale",
      visitProject: "Visita il progetto",
      credits: "Crediti del progetto",
      contributors: "Collaboratori",
      roles: "I miei ruoli",
      skills: "Competenze",
      gallery: "Galleria",
      links: "Link",
      nextProject: "Prossimo progetto",
      playVideo: "Riproduci il video di copertina",
      pauseVideo: "Metti in pausa il video di copertina",
      playGalleryVideo: "Riproduci video",
      viewGalleryImage: "Apri immagine",
    },
    footer: {
      getInTouch: "Contatti",
      site: "Sito",
      elsewhere: "Altrove",
      basedIn: "Dove lavoro",
      workingInternationally: "Lavoro a livello internazionale",
      rights: "Tutti i diritti riservati",
      aria: "Navigazione nel footer",
    },
    errors: {
      notFoundTitle: "Pagina non trovata",
      notFoundStress: "non",
      notFoundBody:
        "La pagina che cerchi non esiste oppure è stata spostata.",
      backHome: "← Torna alla home",
      errorEyebrow: "Qualcosa è andato storto",
      errorTitle: "Impossibile caricare la pagina",
      errorBody:
        "Si è verificato un errore imprevisto. Riprova. Se il problema persiste, la pagina potrebbe essere temporaneamente non disponibile.",
      retry: "Riprova",
    },
    metadata: {
      siteTitle: "Yuwei Li | Communication Designer e Frontend Developer",
      siteDescription:
        "Communication Designer & Frontend Developer con base a Milano. Progetto identità visive, interfacce digitali e siti web su misura per studi e organizzazioni.",
      keywords: [
        "Yuwei Li",
        "portfolio design Milano",
        "communication designer",
        "frontend developer",
        "UX UI design",
        "sviluppo web",
      ],
      aboutTitle: "Chi sono",
      aboutDescription:
        "Portfolio di Yuwei Li, Communication Designer & Frontend Developer a Milano: identità visive, interfacce digitali e siti web su misura.",
      projectNotFound: "Progetto non trovato",
    },
  },
  en: {
    navigation: {
      home: "Home",
      about: "About",
      work: "Work",
      homeAria: "Go to homepage",
      aboutAria: "About Yuwei Li",
      workAria: "View selected work",
      menu: "Menu",
      close: "Close",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      headerAria: "Main navigation",
      noItems: "No items",
      socials: "Social",
      socialLinksAria: "Social links",
      language: "Language",
      switchLanguage: "Switch to Italian",
      theme: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
    },
    common: {
      skipToMain: "Skip to main content",
      portraitAlt: "Portrait of Yuwei Li",
    },
    home: {
      hero: {
        basedIn: "Based in Milan, working with international clients",
        slogan: { before: "Bring ", accent: "color", after: " to the", end: "ordinary." },
        identity: {
          lead: "Yuwei Li is a communication designer and frontend developer in Milan, currently at POLI.design.",
          rest: " Visual identities, interfaces and websites for creative studios and design-led organisations.",
        },
        cta: "Get in touch →",
        availability: "Available for freelance",
      },
      aboutPreview: {
        title: "I design it, then I build it.",
        body:
          "Most of my projects go from the first Figma frame to the live site in the same hands. Nothing gets lost between the design and the code.",
        cta: "More about me →",
      },
      projects: {
        title: "Work",
        empty: "Projects will appear here once they are published in Sanity.",
        countLabel: "projects",
        index: "Index",
      },
    },
    about: {
      eyebrow: "About me",
      roleLabel: "Role",
      locationLabel: "Location",
      languagesLabel: "Languages",
      languages: ["Chinese — native", "English — B2", "Italian — B2"],
      intro: {
        lead: "I’m Yuwei Li. I came from China to Florence to paint, then moved to Milan to design.",
        leadStress: "paint",
        body:
          "Today I work as a UX designer at POLI.design and take on freelance projects in communication design and frontend development. I’m completing an MSc in Communication Design at Politecnico di Milano.",
      },
      education: "Education",
      experience: "Experience",
      capabilities: "Capabilities",
      capabilitiesEmpty:
        "Capabilities will appear here once they are published in Sanity.",
      resumeEmpty: "Entries will appear here once they are published in Sanity.",
    },
    project: {
      back: "← Back to projects",
      type: "Type",
      year: "Year",
      client: "Client",
      location: "Location",
      visitOfficial: "Visit the official website",
      visitProject: "View project",
      credits: "Project credits",
      contributors: "Contributors",
      roles: "My roles",
      skills: "Skills",
      gallery: "Gallery",
      links: "Links",
      nextProject: "Next project",
      playVideo: "Play cover video",
      pauseVideo: "Pause cover video",
      playGalleryVideo: "Play video",
      viewGalleryImage: "View image",
    },
    footer: {
      getInTouch: "Get in touch",
      site: "Site",
      elsewhere: "Elsewhere",
      basedIn: "Based in",
      workingInternationally: "Working internationally",
      rights: "All rights reserved",
      aria: "Footer navigation",
    },
    errors: {
      notFoundTitle: "Page not found",
      notFoundStress: "not",
      notFoundBody:
        "The page you are looking for doesn’t exist or may have been moved.",
      backHome: "← Back home",
      errorEyebrow: "Something went wrong",
      errorTitle: "This page failed to load",
      errorBody:
        "An unexpected error occurred. Try again. If the problem persists, the page may be temporarily unavailable.",
      retry: "Try again",
    },
    metadata: {
      siteTitle: "Yuwei Li | Communication Designer & Frontend Developer",
      siteDescription:
        "Milan-based Communication Designer & Frontend Developer creating visual identities, digital interfaces and custom websites for studios and organisations.",
      keywords: [
        "Yuwei Li",
        "portfolio",
        "communication designer",
        "frontend developer",
        "UX/UI design",
        "interaction design",
        "web development",
      ],
      aboutTitle: "About",
      aboutDescription:
        "Meet Yuwei Li, a Milan-based Communication Designer and Frontend Developer working across visual identity, digital interfaces and custom websites.",
      projectNotFound: "Project not found",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
