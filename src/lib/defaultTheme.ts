/**
 * Default theme tokens — HSL values without the hsl() wrapper.
 * Format: "H S% L%"   e.g. "320 68% 35%"
 *
 * These map 1:1 to CSS custom properties in :root.
 * The ThemeProvider applies them at runtime; index.css provides the static fallback.
 */

export interface ThemeToken {
  /** CSS variable name without -- prefix */
  cssVar: string;
  /** Human-readable label for admin UI */
  label: string;
  /** Section / group */
  group: string;
  /** Default HSL value */
  defaultValue: string;
  /** Paired token for contrast check (cssVar name) */
  contrastPair?: string;
}

export const themeGroups = [
  { key: 'brand', label: 'Marque' },
  { key: 'backgrounds', label: 'Fonds' },
  { key: 'text', label: 'Textes' },
  { key: 'borders', label: 'Bordures' },
  { key: 'buttons', label: 'Boutons / CTA' },
  { key: 'status', label: 'Statuts' },
  { key: 'footer', label: 'Pied de page' },
] as const;

export const themeTokens: ThemeToken[] = [
  // ── Brand ──
  { cssVar: 'primary', label: 'Magenta principal', group: 'brand', defaultValue: '320 68% 35%', contrastPair: 'primary-foreground' },
  { cssVar: 'primary-foreground', label: 'Texte sur magenta', group: 'brand', defaultValue: '0 0% 100%' },
  { cssVar: 'luxury-magenta', label: 'Magenta (alias)', group: 'brand', defaultValue: '320 68% 35%' },
  { cssVar: 'luxury-magenta-light', label: 'Magenta clair (hover)', group: 'brand', defaultValue: '320 68% 45%' },
  { cssVar: 'brand-gradient-dark', label: 'Dégradé sombre', group: 'brand', defaultValue: '320 50% 24%' },
  { cssVar: 'ring', label: 'Anneau focus', group: 'brand', defaultValue: '320 68% 35%' },
  { cssVar: 'accent', label: 'Accent', group: 'brand', defaultValue: '320 68% 35%' },
  { cssVar: 'accent-foreground', label: 'Texte sur accent', group: 'brand', defaultValue: '0 0% 100%' },

  // ── Backgrounds ──
  { cssVar: 'background', label: 'Fond de page', group: 'backgrounds', defaultValue: '0 0% 100%', contrastPair: 'foreground' },
  { cssVar: 'card', label: 'Fond carte', group: 'backgrounds', defaultValue: '0 0% 100%' },
  { cssVar: 'popover', label: 'Fond popover', group: 'backgrounds', defaultValue: '0 0% 100%' },
  { cssVar: 'muted', label: 'Fond atténué', group: 'backgrounds', defaultValue: '0 0% 96%' },
  { cssVar: 'secondary', label: 'Fond secondaire', group: 'backgrounds', defaultValue: '0 0% 96%' },
  { cssVar: 'luxury-cream', label: 'Crème', group: 'backgrounds', defaultValue: '40 20% 96%' },
  { cssVar: 'luxury-gray-light', label: 'Gris clair', group: 'backgrounds', defaultValue: '0 0% 92%' },

  // ── Text ──
  { cssVar: 'foreground', label: 'Texte principal', group: 'text', defaultValue: '0 0% 0%', contrastPair: 'background' },
  { cssVar: 'card-foreground', label: 'Texte carte', group: 'text', defaultValue: '0 0% 0%' },
  { cssVar: 'popover-foreground', label: 'Texte popover', group: 'text', defaultValue: '0 0% 0%' },
  { cssVar: 'muted-foreground', label: 'Texte atténué', group: 'text', defaultValue: '0 0% 45%' },
  { cssVar: 'secondary-foreground', label: 'Texte secondaire', group: 'text', defaultValue: '0 0% 9%' },
  { cssVar: 'luxury-gray', label: 'Gris texte', group: 'text', defaultValue: '0 0% 45%' },
  { cssVar: 'luxury-black', label: 'Noir profond', group: 'text', defaultValue: '0 0% 0%' },
  { cssVar: 'luxury-white', label: 'Blanc pur', group: 'text', defaultValue: '0 0% 100%' },

  // ── Borders ──
  { cssVar: 'border', label: 'Bordure par défaut', group: 'borders', defaultValue: '0 0% 90%' },
  { cssVar: 'input', label: 'Bordure champs', group: 'borders', defaultValue: '0 0% 90%' },

  // ── Buttons ──
  { cssVar: 'destructive', label: 'Erreur / supprimer', group: 'status', defaultValue: '0 84% 60%', contrastPair: 'destructive-foreground' },
  { cssVar: 'destructive-foreground', label: 'Texte sur destructive', group: 'status', defaultValue: '0 0% 100%' },

  // ── Footer ──
  { cssVar: 'footer-bg', label: 'Fond footer', group: 'footer', defaultValue: '320 68% 28%' },

  // ── Editorial ──
  { cssVar: 'collection-editorial-bg', label: 'Encart éditorial collection', group: 'brand', defaultValue: '320 68% 35%' },
];

/** Build a flat object { cssVar: hslValue } from defaults */
export function getDefaultThemeValues(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of themeTokens) {
    map[t.cssVar] = t.defaultValue;
  }
  return map;
}
