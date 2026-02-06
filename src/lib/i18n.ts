import { Language } from '@/types';

type TranslationKeys = {
  [key: string]: string;
};

const translations: Record<Language, TranslationKeys> = {
  fr: {
    // Nav
    'nav.home': 'Accueil',
    'nav.shop': 'Boutique',
    'nav.collections': 'Collections',
    'nav.about': 'À propos',
    'nav.news': 'Actualités',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.cart': 'Panier',
    'nav.account': 'Mon Compte',

    // Hero
    'hero.tagline': "L'histoire d'une femme, pour une femme, par une autre.",
    'hero.subtitle': 'Luxe narratif — Chaque pièce est un trésor à porter.',
    'hero.cta': 'Découvrir la collection',
    'hero.shop': 'Explorer la boutique',

    // Home
    'home.philosophy.title': 'Notre Philosophie',
    'home.philosophy.text': 'Parce que la beauté rayonne de l\'intérieur, vers l\'extérieur. Chaque création LÉONA BLOM est une invitation à la renaissance, à l\'ouverture, à la transformation.',
    'home.values.selflove': 'Selflove',
    'home.values.selflove.desc': "S'aimer entièrement",
    'home.values.selfcare': 'Selfcare',
    'home.values.selfcare.desc': 'Se chérir profondément',
    'home.values.selfplace': 'Selfplace',
    'home.values.selfplace.desc': 'Trouver sa place',
    'home.featured': 'Pièces Signature',
    'home.collections': 'Collections',
    'home.materials.title': 'Matières Nobles',
    'home.materials.text': 'Lin, coton, soie, pierres précieuses — chaque matière est choisie pour sa noblesse et sa capacité à sublimer celle qui la porte.',
    'home.newsletter.title': 'Rejoignez l\'univers LÉONA BLOM',
    'home.newsletter.placeholder': 'Votre adresse email',
    'home.newsletter.cta': 'S\'inscrire',

    // Shop
    'shop.title': 'Boutique',
    'shop.all': 'Tout',
    'shop.dresses': 'Robes',
    'shop.sets': 'Ensembles',
    'shop.tops': 'Hauts',
    'shop.skirts': 'Jupes',
    'shop.pants': 'Pantalons',
    'shop.accessories': 'Accessoires',
    'shop.made_to_order': 'Sur commande',
    'shop.in_stock': 'En stock',
    'shop.preorder': 'Précommande',
    'shop.add_to_cart': 'Ajouter au panier',
    'shop.preorder_cta': 'Précommander',
    'shop.crafting_time': 'Confection : {min} à {max} jours',
    'shop.from': 'À partir de',

    // Product
    'product.story': 'Trésor à porter',
    'product.materials': 'Matières',
    'product.care': 'Entretien',
    'product.braiding': 'Tressage',
    'product.size_guide': 'Guide des tailles',
    'product.measure_guide': 'Guide de prise de mesures',
    'product.select_size': 'Sélectionnez une taille',
    'product.select_color': 'Sélectionnez une couleur',

    // Collections
    'collections.title': 'Collections',
    'collections.discover': 'Découvrir',
    'collections.shop_collection': 'Shop the Collection',

    // About
    'about.title': 'À propos',
    'about.heritage': 'Héritage',
    'about.vision': 'Vision',
    'about.creator': 'La Créatrice',
    'about.name_meaning': 'LÉONA BLOM — acronyme de l\'identité, clin d\'œil à « Bloom », la floraison. Chaque création est une invitation à éclore.',

    // Contact
    'contact.title': 'Contact',
    'contact.name': 'Nom',
    'contact.email': 'Email',
    'contact.subject': 'Sujet',
    'contact.message': 'Message',
    'contact.send': 'Envoyer',
    'contact.success': 'Message envoyé avec succès.',

    // Cart
    'cart.title': 'Panier',
    'cart.empty': 'Votre panier est vide.',
    'cart.subtotal': 'Sous-total',
    'cart.checkout': 'Passer commande',
    'cart.continue': 'Continuer mes achats',
    'cart.remove': 'Retirer',

    // FAQ
    'faq.title': 'Questions Fréquentes',

    // Footer
    'footer.rights': 'Tous droits réservés.',
    'footer.legal': 'Mentions légales',
    'footer.cgv': 'CGV',
    'footer.privacy': 'Confidentialité',
    'footer.cookies': 'Cookies',

    // General
    'general.language': 'Langue',
    'general.currency': 'Devise',
  },

  en: {
    // Nav
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.collections': 'Collections',
    'nav.about': 'About',
    'nav.news': 'News',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.cart': 'Cart',
    'nav.account': 'My Account',

    // Hero
    'hero.tagline': "A woman's story, for a woman, by another.",
    'hero.subtitle': 'Narrative luxury — Each piece is a treasure to wear.',
    'hero.cta': 'Discover the collection',
    'hero.shop': 'Explore the shop',

    // Home
    'home.philosophy.title': 'Our Philosophy',
    'home.philosophy.text': 'Because beauty radiates from within, outward. Each LÉONA BLOM creation is an invitation to rebirth, openness, and transformation.',
    'home.values.selflove': 'Selflove',
    'home.values.selflove.desc': 'Love yourself entirely',
    'home.values.selfcare': 'Selfcare',
    'home.values.selfcare.desc': 'Cherish yourself deeply',
    'home.values.selfplace': 'Selfplace',
    'home.values.selfplace.desc': 'Find your place',
    'home.featured': 'Signature Pieces',
    'home.collections': 'Collections',
    'home.materials.title': 'Noble Materials',
    'home.materials.text': 'Linen, cotton, silk, precious stones — each material is chosen for its nobility and its ability to elevate the woman who wears it.',
    'home.newsletter.title': 'Join the LÉONA BLOM universe',
    'home.newsletter.placeholder': 'Your email address',
    'home.newsletter.cta': 'Subscribe',

    // Shop
    'shop.title': 'Shop',
    'shop.all': 'All',
    'shop.dresses': 'Dresses',
    'shop.sets': 'Sets',
    'shop.tops': 'Tops',
    'shop.skirts': 'Skirts',
    'shop.pants': 'Pants',
    'shop.accessories': 'Accessories',
    'shop.made_to_order': 'Made to order',
    'shop.in_stock': 'In stock',
    'shop.preorder': 'Preorder',
    'shop.add_to_cart': 'Add to cart',
    'shop.preorder_cta': 'Preorder',
    'shop.crafting_time': 'Crafting: {min} to {max} days',
    'shop.from': 'From',

    // Product
    'product.story': 'A Treasure to Wear',
    'product.materials': 'Materials',
    'product.care': 'Care',
    'product.braiding': 'Braiding',
    'product.size_guide': 'Size Guide',
    'product.measure_guide': 'Measurement Guide',
    'product.select_size': 'Select a size',
    'product.select_color': 'Select a color',

    // Collections
    'collections.title': 'Collections',
    'collections.discover': 'Discover',
    'collections.shop_collection': 'Shop the Collection',

    // About
    'about.title': 'About',
    'about.heritage': 'Heritage',
    'about.vision': 'Vision',
    'about.creator': 'The Creator',
    'about.name_meaning': 'LÉONA BLOM — an acronym of identity, a nod to "Bloom," the blossoming. Each creation is an invitation to flourish.',

    // Contact
    'contact.title': 'Contact',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send',
    'contact.success': 'Message sent successfully.',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty.',
    'cart.subtotal': 'Subtotal',
    'cart.checkout': 'Checkout',
    'cart.continue': 'Continue shopping',
    'cart.remove': 'Remove',

    // FAQ
    'faq.title': 'Frequently Asked Questions',

    // Footer
    'footer.rights': 'All rights reserved.',
    'footer.legal': 'Legal Notice',
    'footer.cgv': 'Terms & Conditions',
    'footer.privacy': 'Privacy Policy',
    'footer.cookies': 'Cookies',

    // General
    'general.language': 'Language',
    'general.currency': 'Currency',
  },
};

export function t(key: string, lang: Language, params?: Record<string, string | number>): string {
  let value = translations[lang][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, String(v));
    });
  }
  return value;
}

export default translations;
