import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, RotateCcw, Save, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { getDefaultThemeValues, themeGroups, themeTokens } from '@/lib/defaultTheme';
import { parseHSL, hslToHex, hexToHSL } from '@/lib/colorUtils';
import { toast } from 'sonner';

const groupLabels: Record<string, string> = Object.fromEntries(
  themeGroups.map(g => [g.key, g.label])
);

const FloatingThemeEditor = () => {
  const { editMode } = useEditMode();
  const { values, save, reset, loaded } = useTheme();
  const defaults = getDefaultThemeValues();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (loaded) setDraft({ ...values });
  }, [loaded, values]);

  const toggleGroup = (key: string) =>
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  if (!editMode || !loaded) return null;

  const getHex = (hsl: string) => {
    const parsed = parseHSL(hsl);
    return parsed ? hslToHex(...parsed) : '#000000';
  };

  const handleHexChange = (cssVar: string, hex: string) => {
    try {
      const hsl = hexToHSL(hex);
      setDraft(prev => ({ ...prev, [cssVar]: hsl }));
      document.documentElement.style.setProperty(`--${cssVar}`, hsl);
    } catch (_e) {}
  };

  const handleHexInput = (cssVar: string, raw: string) => {
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      handleHexChange(cssVar, normalized);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await save(draft); toast.success('Thème enregistré'); }
    catch (_e) { toast.error('Erreur'); }
    setSaving(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try { await reset(); setDraft({ ...defaults }); toast.success('Thème réinitialisé'); }
    catch (_e) { toast.error('Erreur'); }
    setSaving(false);
  };

  const isModified = (cssVar: string) => draft[cssVar] !== defaults[cssVar];

  // Filter tokens then group them
  const filtered = themeTokens.filter(t =>
    !search.trim() ||
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.cssVar.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = themeGroups
    .map(g => ({
      key: g.key,
      label: g.label,
      tokens: filtered.filter(t => t.group === g.key),
    }))
    .filter(g => g.tokens.length > 0);

  const TokenRow = ({ cssVar, label }: { cssVar: string; label: string }) => {
    const currentHsl = draft[cssVar] || defaults[cssVar] || '0 0% 50%';
    const hex = getHex(currentHsl);
    const modified = isModified(cssVar);
    return (
      <div className="flex items-center gap-2 px-4 py-1.5 hover:bg-muted/30 transition-colors">
        <input
          type="color"
          value={hex}
          onChange={e => handleHexChange(cssVar, e.target.value)}
          className="w-6 h-6 border border-border cursor-pointer rounded-sm appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-body truncate">{label}</span>
            {modified && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
          </div>
        </div>
        <input
          type="text"
          value={hex.toUpperCase()}
          onChange={e => handleHexInput(cssVar, e.target.value)}
          className="w-[72px] border border-border bg-transparent px-1.5 py-0.5 text-[10px] font-mono text-center focus:outline-none focus:border-primary transition-colors rounded-sm"
          spellCheck={false}
        />
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
            title="Éditeur de thème"
          >
            <Palette size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            data-theme-editor
            className="fixed top-0 right-0 bottom-0 z-[9999] w-[320px] bg-background text-foreground border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-primary" />
                <span className="text-xs tracking-[0.15em] uppercase font-body font-medium">Thème</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="relative px-4 py-2 border-b border-border">
              <Search size={13} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full pl-6 pr-2 py-1.5 text-[11px] font-body bg-transparent border border-border rounded focus:outline-none focus:border-primary transition-colors"
                spellCheck={false}
              />
            </div>

            {/* Grouped token list */}
            <div className="flex-1 overflow-y-auto">
              {grouped.map(group => {
                const collapsed = collapsedGroups[group.key];
                return (
                  <div key={group.key}>
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-[0.12em] uppercase font-body font-medium text-muted-foreground hover:text-foreground bg-muted/40 border-b border-border transition-colors"
                    >
                      {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                      {group.label}
                      <span className="ml-auto text-[9px] opacity-60">{group.tokens.length}</span>
                    </button>
                    {!collapsed && group.tokens.map(t => (
                      <TokenRow key={t.cssVar} cssVar={t.cssVar} label={t.label} />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 px-4 py-3 border-t border-border">
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors"
              >
                <RotateCcw size={11} /> Réinitialiser
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] tracking-wider uppercase font-body bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Save size={11} /> {saving ? '…' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingThemeEditor;
