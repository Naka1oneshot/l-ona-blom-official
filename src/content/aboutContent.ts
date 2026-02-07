export interface AboutSection {
  id: string;
  eyebrow?: string;
  title?: string;
  bodyParagraphs?: string[];
  highlightQuote?: string;
  bullets?: string[];
  callouts?: { label: string; text: string }[];
}

export interface AboutMaterial {
  name: string;
  values: string[];
}

export interface AboutTimelineStep {
  label: string;
}

export interface AboutContent {
  hero: {
    quote: string;
    author: string;
    cta_shop: string;
    cta_collections: string;
  };
  tresor: AboutSection;
  bloom: {
    id: string;
    eyebrow: string;
    title: string;
    bodyParagraphs: string[];
    timeline: AboutTimelineStep[];
  };
  mouvement: AboutSection;
  fusion: AboutSection & { callouts: { label: string; text: string }[] };
  matieres: {
    id: string;
    eyebrow: string;
    title: string;
    materials: AboutMaterial[];
  };
  audience: AboutSection;
  honneur: AboutSection & { bullets: string[]; badge: string };
  elevation: AboutSection & { cta_collections: string };
}

export const aboutContent: Record<string, AboutContent> = {
  fr: {
    hero: {
      quote: "L'histoire d'une femme, pour une femme, par une autre.",
      author: "Orlane Léona Elisabeth — créatrice franco-camerounaise",
      cta_shop: "Découvrir la boutique",
      cta_collections: "Découvrir les collections",
    },
    tresor: {
      id: "tresor",
      eyebrow: "Philosophie",
      title: "Trésor à porter",
      bodyParagraphs: [
        "Orlane Léona Elisabeth, créatrice franco-camerounaise, je transforme mes passions en univers.",
        "LÉONA BLOM est une marque où chaque pièce est pensée comme un Trésor à porter précieux, chargé de sens, et créé pour sublimer celles qui les portent.",
      ],
      callouts: [
        { label: "Précieux", text: "Chaque pièce, un trésor" },
        { label: "Chargé de sens", text: "Une histoire dans chaque création" },
        { label: "Sublimer", text: "Révéler la beauté de celles qui portent" },
      ],
    },
    bloom: {
      id: "bloom",
      eyebrow: "Identité",
      title: "LÉONA BLOM — Bloom",
      bodyParagraphs: [
        "Le nom de ma marque est l'acronyme de mon identité, mais aussi un clin d'œil au mot anglais \"Bloom\" qui signifie \"la floraison\".",
        "Ma marque symbolise un parcours, celui de la renaissance, de l'ouverture, de la transformation et de la révélation de soi.",
        "LÉONA BLOM est une marque en mouvement, qui n'a pas peur de changer, d'oser, de grandir à l'image des femmes qu'elle représente.",
      ],
      timeline: [
        { label: "Renaissance" },
        { label: "Ouverture" },
        { label: "Transformation" },
        { label: "Révélation" },
      ],
    },
    mouvement: {
      id: "mouvement",
      eyebrow: "Élan",
      title: "Marque en mouvement",
      highlightQuote: "Une créatrice qui vit l'art, le mélange, le mouvement.",
      bodyParagraphs: [
        "LÉONA BLOM est une marque en mouvement, qui n'a pas peur de changer, d'oser, de grandir à l'image des femmes qu'elle représente.",
      ],
    },
    fusion: {
      id: "fusion",
      eyebrow: "Création",
      title: "Fusion : art, technique, tradition",
      bodyParagraphs: [
        "Je mêle naturellement mes passions : le dessin, la musique, la mode, le sport, tout ce qui nourrit mon imaginaire.",
        "C'est cette envie de fusionner l'art, la technique et la tradition qui guide ma main et mon regard.",
        "Fière de mon héritage et de mon métissage culturel, je transmets dans chaque pièce une vision ambitieuse, audacieuse et profondément personnelle.",
      ],
      callouts: [
        { label: "Art", text: "Le dessin, la musique, tout ce qui nourrit l'imaginaire" },
        { label: "Technique", text: "L'envie de fusionner savoir-faire et modernité" },
        { label: "Tradition", text: "Un héritage et un métissage culturel transmis dans chaque pièce" },
      ],
    },
    matieres: {
      id: "matieres",
      eyebrow: "Savoir-faire",
      title: "Matières & Noblesse",
      materials: [
        { name: "Lin", values: ["Authenticité", "Naturel", "Élégance"] },
        { name: "Coton", values: ["Douceur", "Confort", "Noblesse"] },
        { name: "Soie", values: ["Raffinement", "Sensualité", "Intemporalité"] },
        { name: "Pierres précieuses", values: ["Éclat", "Unicité", "Préciosité"] },
      ],
    },
    audience: {
      id: "audience",
      eyebrow: "Pour qui",
      title: "À qui s'adresse la marque",
      bodyParagraphs: [
        "Une marque née de l'élan d'une jeune femme afro-descendante de se reconnecter à sa culture et de célébrer son identité plurielle, aujourd'hui conçue pour une audience cosmopolite.",
        "Créée pour accompagner celles qui construisent encore leur rapport au corps, à leur féminité, à leur identité.",
      ],
    },
    honneur: {
      id: "honneur",
      eyebrow: "Engagement",
      title: "Ce que les pièces honorent",
      bodyParagraphs: [],
      bullets: [
        "Leur histoire",
        "Leur métissage",
        "Leurs savoir-faire d'origine",
        "Leur puissance intérieure",
      ],
      badge: "Haut de gamme",
    },
    elevation: {
      id: "elevation",
      eyebrow: "Vision",
      title: "Élévation",
      bodyParagraphs: [
        "Du vêtement à l'accessoire, puis de l'accessoire à la pièce maîtresse, la marque réinvente, modernise et élève.",
      ],
      cta_collections: "Voir les collections",
    },
  },
  en: {
    hero: {
      quote: "The story of a woman, for a woman, by another.",
      author: "Orlane Léona Elisabeth — Franco-Cameroonian designer",
      cta_shop: "Discover the shop",
      cta_collections: "Discover the collections",
    },
    tresor: {
      id: "tresor",
      eyebrow: "Philosophy",
      title: "A treasure to wear",
      bodyParagraphs: [],
    },
    bloom: {
      id: "bloom",
      eyebrow: "Identity",
      title: "LÉONA BLOM — Bloom",
      bodyParagraphs: [],
      timeline: [
        { label: "Rebirth" },
        { label: "Openness" },
        { label: "Transformation" },
        { label: "Revelation" },
      ],
    },
    mouvement: {
      id: "mouvement",
      eyebrow: "Momentum",
      title: "A brand in motion",
      highlightQuote: "A designer who lives art, blending, and movement.",
      bodyParagraphs: [],
    },
    fusion: {
      id: "fusion",
      eyebrow: "Creation",
      title: "Fusion: art, technique, tradition",
      bodyParagraphs: [],
      callouts: [
        { label: "Art", text: "" },
        { label: "Technique", text: "" },
        { label: "Tradition", text: "" },
      ],
    },
    matieres: {
      id: "matieres",
      eyebrow: "Craftsmanship",
      title: "Materials & Nobility",
      materials: [
        { name: "Linen", values: ["Authenticity", "Natural", "Elegance"] },
        { name: "Cotton", values: ["Softness", "Comfort", "Nobility"] },
        { name: "Silk", values: ["Refinement", "Sensuality", "Timelessness"] },
        { name: "Precious stones", values: ["Radiance", "Uniqueness", "Preciousness"] },
      ],
    },
    audience: {
      id: "audience",
      eyebrow: "For whom",
      title: "Who the brand is for",
      bodyParagraphs: [],
    },
    honneur: {
      id: "honneur",
      eyebrow: "Commitment",
      title: "What the pieces honor",
      bodyParagraphs: [],
      bullets: [
        "Their history",
        "Their cultural blend",
        "Their ancestral know-how",
        "Their inner strength",
      ],
      badge: "High-end",
    },
    elevation: {
      id: "elevation",
      eyebrow: "Vision",
      title: "Elevation",
      bodyParagraphs: [],
      cta_collections: "View the collections",
    },
  },
};

/**
 * Get content with EN→FR fallback: if EN field is empty, show FR version.
 */
export function getAboutContent(language: string): AboutContent {
  const content = aboutContent[language] || aboutContent.fr;
  if (language === 'en') {
    return deepFallback(content, aboutContent.fr) as AboutContent;
  }
  return content;
}

function deepFallback(target: any, fallback: any): any {
  if (typeof target === 'string' && target === '') return fallback;
  if (Array.isArray(target)) {
    if (target.length === 0 && Array.isArray(fallback) && fallback.length > 0) return fallback;
    return target.map((item, i) => deepFallback(item, fallback?.[i]));
  }
  if (target && typeof target === 'object') {
    const result: any = {};
    for (const key of Object.keys(target)) {
      result[key] = deepFallback(target[key], fallback?.[key]);
    }
    return result;
  }
  return target;
}
