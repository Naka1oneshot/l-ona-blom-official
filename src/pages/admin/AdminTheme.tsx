import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { themeTokens, themeGroups, getDefaultThemeValues } from '@/lib/defaultTheme';
import { parseHSL, hslToHex, hexToHSL, contrastRatio, contrastLevel } from '@/lib/colorUtils';
import { toast } from 'sonner';
import { Save, RotateCcw, AlertTriangle, Check, Copy } from 'lucide-react';

const AdminTheme = () => {
  const { values, save, reset, loaded } = useTheme();
  const defaults = getDefaultThemeValues();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loaded) setDraft({ ...values });
  }, [loaded]);

  const handleHexChange = (cssVar: string, hex: string) => {
    try {
      const hsl = hexToHSL(hex);
      setDraft(prev => ({ ...prev, [cssVar]: hsl }));
    } catch {}
  };

  const handleHslInput = (cssVar: string, val: string) => {
    setDraft(prev => ({ ...prev, [cssVar]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(draft);
      toast.success('Thème enregistré');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!confirm('Réinitialiser toutes les couleurs aux valeurs par défaut ?')) return;
    setSaving(true);
    try {
      await reset();
      setDraft({ ...defaults });
      toast.success('Thème réinitialisé');
    } catch {
      toast.error('Erreur');
    }
    setSaving(false);
  };

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast.success('Copié !');
  };

  const getHex = (hsl: string) => {
    const parsed = parseHSL(hsl);
    return parsed ? hslToHex(...parsed) : '#000000';
  };

  const isModified = (cssVar: string) => draft[cssVar] !== defaults[cssVar];

  if (!loaded) return <div className="text-sm text-muted-foreground">Chargement…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Thème</h1>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors"
          >
            <RotateCcw size={12} /> Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 text-[10px] tracking-wider uppercase font-body hover:bg-primary transition-colors"
          >
            <Save size={12} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="border border-border p-6 mb-8">
        <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground mb-4">Aperçu en direct</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Surface preview */}
          <div className="p-4 rounded" style={{ background: `hsl(${draft['background'] || defaults['background']})` }}>
            <p className="text-sm font-body mb-1" style={{ color: `hsl(${draft['foreground'] || defaults['foreground']})` }}>
              Texte principal
            </p>
            <p className="text-xs font-body" style={{ color: `hsl(${draft['muted-foreground'] || defaults['muted-foreground']})` }}>
              Texte atténué sur fond page
            </p>
          </div>
          {/* Brand preview */}
          <div className="p-4 rounded" style={{ background: `hsl(${draft['primary'] || defaults['primary']})` }}>
            <p className="text-sm font-body mb-1" style={{ color: `hsl(${draft['primary-foreground'] || defaults['primary-foreground']})` }}>
              CTA Principal
            </p>
            <p className="text-xs font-body opacity-80" style={{ color: `hsl(${draft['primary-foreground'] || defaults['primary-foreground']})` }}>
              Texte sur magenta
            </p>
          </div>
          {/* Footer preview */}
          <div className="p-4 rounded" style={{ background: `hsl(${draft['footer-bg'] || defaults['footer-bg']})` }}>
            <p className="text-sm font-body mb-1" style={{ color: `hsl(${draft['luxury-white'] || defaults['luxury-white']})` }}>
              Pied de page
            </p>
            <p className="text-xs font-body opacity-80" style={{ color: `hsl(${draft['luxury-white'] || defaults['luxury-white']})` }}>
              Liens footer
            </p>
          </div>
        </div>

        {/* Button previews */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            className="px-6 py-2.5 text-xs tracking-wider uppercase font-body transition-colors"
            style={{
              background: `hsl(${draft['primary'] || defaults['primary']})`,
              color: `hsl(${draft['primary-foreground'] || defaults['primary-foreground']})`,
            }}
          >
            Bouton CTA
          </button>
          <button
            className="px-6 py-2.5 text-xs tracking-wider uppercase font-body border transition-colors"
            style={{
              borderColor: `hsl(${draft['border'] || defaults['border']})`,
              color: `hsl(${draft['foreground'] || defaults['foreground']})`,
              background: `hsl(${draft['background'] || defaults['background']})`,
            }}
          >
            Bouton Outline
          </button>
          <button
            className="px-6 py-2.5 text-xs tracking-wider uppercase font-body transition-colors"
            style={{
              background: `hsl(${draft['destructive'] || defaults['destructive']})`,
              color: `hsl(${draft['destructive-foreground'] || defaults['destructive-foreground']})`,
            }}
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Token groups */}
      <div className="space-y-6">
        {themeGroups.map(group => {
          const tokens = themeTokens.filter(t => t.group === group.key);
          if (tokens.length === 0) return null;
          return (
            <div key={group.key} className="border border-border">
              <div className="px-4 py-3 bg-muted/30 border-b border-border">
                <h2 className="text-xs tracking-[0.15em] uppercase font-body font-medium">{group.label}</h2>
              </div>
              <div className="divide-y divide-border">
                {tokens.map(token => {
                  const currentHsl = draft[token.cssVar] || token.defaultValue;
                  const hex = getHex(currentHsl);
                  const modified = isModified(token.cssVar);

                  // Contrast check
                  let contrast: { ratio: number; level: 'pass' | 'warn' | 'fail' } | null = null;
                  if (token.contrastPair) {
                    const pairHsl = draft[token.contrastPair] || defaults[token.contrastPair];
                    if (pairHsl) {
                      const ratio = contrastRatio(currentHsl, pairHsl);
                      if (ratio !== null) {
                        contrast = { ratio, level: contrastLevel(ratio) };
                      }
                    }
                  }

                  return (
                    <div key={token.cssVar} className="flex items-center gap-3 px-4 py-3">
                      {/* Color swatch + picker */}
                      <div className="relative flex-shrink-0">
                        <input
                          type="color"
                          value={hex}
                          onChange={e => handleHexChange(token.cssVar, e.target.value)}
                          className="w-9 h-9 border border-border cursor-pointer rounded-sm appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0"
                        />
                      </div>

                      {/* Label + var name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-body font-medium truncate">{token.label}</p>
                          {modified && (
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" title="Modifié" />
                          )}
                        </div>
                        <p className="text-[10px] tracking-wider text-muted-foreground font-mono">--{token.cssVar}</p>
                      </div>

                      {/* HSL input */}
                      <input
                        type="text"
                        value={currentHsl}
                        onChange={e => handleHslInput(token.cssVar, e.target.value)}
                        className="w-36 border border-border bg-transparent px-2 py-1 text-xs font-mono focus:outline-none focus:border-primary transition-colors hidden sm:block"
                        placeholder="H S% L%"
                      />

                      {/* Hex display + copy */}
                      <button
                        onClick={() => copyHex(hex)}
                        className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        title="Copier hex"
                      >
                        {hex} <Copy size={10} />
                      </button>

                      {/* Contrast badge */}
                      {contrast && (
                        <div
                          className={`flex items-center gap-1 text-[10px] font-body flex-shrink-0 px-2 py-0.5 ${
                            contrast.level === 'pass'
                              ? 'text-green-700 bg-green-50'
                              : contrast.level === 'warn'
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-red-700 bg-red-50'
                          }`}
                          title={`Contraste: ${contrast.ratio.toFixed(1)}:1 (WCAG AA requiert 4.5:1)`}
                        >
                          {contrast.level === 'pass' ? <Check size={10} /> : <AlertTriangle size={10} />}
                          {contrast.ratio.toFixed(1)}:1
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTheme;
