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
  };
  common: {
    skipToMain: string;
    portraitAlt: string;
  };
  home: {
    hero: {
      basedIn: string;
      description: string;
      emphasizedTerms: string[];
      cta: string;
    };
    aboutPreview: {
      title: string;
      body: string;
      cta: string;
    };
    projects: {
      title: string;
      empty: string;
    };
  };
  about: {
    eyebrow: string;
    intro: string;
    roleLabel: string;
    locationLabel: string;
    languagesLabel: string;
    languages: string[];
    education: string;
    experience: string;
    capabilities: string;
    capabilitiesEmpty: string;
    resumeEmpty: string;
  };
  project: {
    back: string;
    eyebrow: string;
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
    projectCover: string;
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
    notFoundBody: string;
    backHome: string;
    errorEyebrow: string;
    errorTitle: string;
    errorBody: string;
    retry: string;
  };
  metadata: {
    siteDescription: string;
    keywords: string[];
    aboutTitle: string;
    aboutDescription: string;
    projectNotFound: string;
    portfolio: string;
    basedInMilan: string;
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
      switchLanguage: "Passa a English",
    },
    common: {
      skipToMain: "Vai al contenuto principale",
      portraitAlt: "Ritratto di Yuwei Li",
    },
    home: {
      hero: {
        basedIn: "A Milano, lavoro con clienti internazionali",
        description:
          "Creo identità visive, interfacce digitali e siti web su misura per studi creativi e organizzazioni orientate al design.",
        emphasizedTerms: [
          "identità visive",
          "interfacce digitali",
          "siti web su misura",
        ],
        cta: "Parliamone >",
      },
      aboutPreview: {
        title: "Dall’idea al lancio.",
        body:
          "Mi muovo tra sistemi visivi, progettazione di interfacce e sviluppo frontend, accompagnando le idee dalla direzione iniziale a risultati curati e facili da mantenere.",
        cta: "Scopri di più >",
      },
      projects: {
        title: "Progetti",
        empty: "I progetti appariranno qui dopo la pubblicazione in Sanity.",
      },
    },
    about: {
      eyebrow: "Chi sono",
      intro:
        "Unisco design della comunicazione e sviluppo frontend per trasformare le idee in esperienze digitali chiare, espressive e facili da mantenere.",
      roleLabel: "Ruolo",
      locationLabel: "Luogo",
      languagesLabel: "Lingue",
      languages: ["Cinese — madrelingua", "Inglese — B2", "Italiano — B2"],
      education: "Formazione",
      experience: "Esperienza",
      capabilities: "Competenze",
      capabilitiesEmpty:
        "Le competenze appariranno qui dopo la pubblicazione in Sanity.",
      resumeEmpty: "Le voci appariranno qui dopo la pubblicazione in Sanity.",
    },
    project: {
      back: "← Torna ai progetti",
      eyebrow: "Progetto",
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
      projectCover: "Copertina del progetto",
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
      notFoundBody:
        "La pagina che cerchi non esiste oppure è stata spostata.",
      backHome: "← Torna alla home",
      errorEyebrow: "Qualcosa è andato storto",
      errorTitle: "Impossibile caricare la pagina",
      errorBody:
        "Si è verificato un errore imprevisto. Riprova; se il problema continua, la pagina potrebbe essere temporaneamente non disponibile.",
      retry: "Riprova",
    },
    metadata: {
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
      aboutTitle: "Chi è Yuwei Li",
      aboutDescription:
        "Scopri Yuwei Li, Communication Designer & Frontend Developer con base a Milano, tra identità visive, interfacce digitali e siti web su misura.",
      projectNotFound: "Progetto non trovato",
      portfolio: "Portfolio",
      basedInMilan: "A Milano",
    },
  },
  en: {
    navigation: {
      home: "Home",
      about: "About",
      work: "Work",
      homeAria: "Go to home",
      aboutAria: "About Yuwei Li",
      workAria: "View selected work",
      menu: "Menu",
      close: "Close",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      headerAria: "Main navigation",
      noItems: "No items",
      socials: "Socials",
      socialLinksAria: "Social links",
      language: "Language",
      switchLanguage: "Switch to Italiano",
    },
    common: {
      skipToMain: "Skip to main content",
      portraitAlt: "Portrait of Yuwei Li",
    },
    home: {
      hero: {
        basedIn: "Based in Milan and working internationally",
        description:
          "I create visual identities, digital interfaces and custom websites for creative studios and design-led organisations.",
        emphasizedTerms: [
          "visual identities",
          "digital interfaces",
          "custom websites",
        ],
        cta: "Get in touch >",
      },
      aboutPreview: {
        title: "From concept to launch.",
        body:
          "I move between visual systems, interface design and frontend development, carrying ideas from early direction to polished, maintainable outcomes.",
        cta: "More about me >",
      },
      projects: {
        title: "Work",
        empty: "Projects will appear here once they are published in Sanity.",
      },
    },
    about: {
      eyebrow: "About me",
      intro:
        "I connect communication design and frontend development to turn ideas into clear, expressive, and maintainable digital experiences.",
      roleLabel: "Role",
      locationLabel: "Location",
      languagesLabel: "Languages",
      languages: ["Chinese — Native", "English — B2", "Italiano — B2"],
      education: "Education",
      experience: "Experience",
      capabilities: "Capabilities",
      capabilitiesEmpty:
        "Capabilities will appear here once they are published in Sanity.",
      resumeEmpty: "Entries will appear here once they are published in Sanity.",
    },
    project: {
      back: "← Back to projects",
      eyebrow: "Project",
      type: "Type",
      year: "Year",
      client: "Client",
      location: "Location",
      visitOfficial: "Visit official website",
      visitProject: "Visit project",
      credits: "Project credits",
      contributors: "Contributors",
      roles: "My roles",
      skills: "Skills",
      gallery: "Gallery",
      projectCover: "Project cover",
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
      notFoundBody:
        "The page you are looking for doesn’t exist or may have been moved.",
      backHome: "← Back to home",
      errorEyebrow: "Something went wrong",
      errorTitle: "This page failed to load",
      errorBody:
        "An unexpected error occurred. Trying again usually helps; if it keeps happening, the page may be temporarily unavailable.",
      retry: "Try again",
    },
    metadata: {
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
      aboutTitle: "About Yuwei Li",
      aboutDescription:
        "Meet Yuwei Li, a Milan-based Communication Designer and Frontend Developer working across visual identity, digital interfaces and custom websites.",
      projectNotFound: "Project not found",
      portfolio: "Portfolio",
      basedInMilan: "Based in Milan",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
