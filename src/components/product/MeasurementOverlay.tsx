import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, ChevronUp, Ruler, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MeasurementData } from '@/types';
import { useMeasurementFields, MeasurementFieldDef } from '@/hooks/useMeasurementFields';

interface Props {
  open: boolean;
  onClose: () => void;
  measurements: MeasurementData;
  onChange: (m: MeasurementData) => void;
}

const MeasurementOverlay: React.FC<Props> = ({ open, onClose, measurements, onChange }) => {
  const { language } = useLanguage();
  const { fields } = useMeasurementFields();
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);

  const update = (key: string, value: string) => {
    onChange({ ...measurements, [key]: value } as MeasurementData);
  };

  const filledCount = fields.filter(f => {
    const val = (measurements as any)[f.key];
    return val && val !== '';
  }).length;

  const requiredFields = fields.filter(f => f.required);
  const requiredFilled = requiredFields.filter(f => {
    const val = (measurements as any)[f.key];
    return val && val !== '';
  }).length;

  const allRequiredFilled = requiredFilled === requiredFields.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden bg-background rounded-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Ruler size={18} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-display text-xl">
                      {language === 'fr' ? 'Vos mesures' : 'Your Measurements'}
                    </h2>
                    <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground mt-0.5">
                      {language === 'fr' ? 'Confection sur mesure' : 'Made to measure'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground mb-2">
                  <span>{filledCount}/{fields.length} {language === 'fr' ? 'renseignées' : 'filled'}</span>
                  {allRequiredFilled && (
                    <span className="text-primary flex items-center gap-1">
                      <Check size={10} />
                      {language === 'fr' ? 'Prêt' : 'Ready'}
                    </span>
                  )}
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(filledCount / fields.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Info banner */}
            <div className="px-6 pt-4">
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                <p className="text-[11px] font-body text-foreground/70 leading-relaxed">
                  {language === 'fr'
                    ? '✨ Munissez-vous d\'un mètre ruban souple. Prenez vos mesures sur peau nue ou en sous-vêtements fins, sans serrer. Cliquez sur l\'aide pour chaque mesure.'
                    : '✨ Use a soft measuring tape. Take measurements on bare skin or thin underwear, without tightening. Click the help icon for guidance on each measurement.'}
                </p>
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {fields.map((field) => (
                <MeasurementFieldRow
                  key={field.key}
                  field={field}
                  value={(measurements as any)[field.key] || ''}
                  onChange={(v) => update(field.key, v)}
                  lang={language}
                  helpExpanded={expandedHelp === field.key}
                  onToggleHelp={() => setExpandedHelp(expandedHelp === field.key ? null : field.key)}
                />
              ))}

              {/* Notes */}
              <div className="pt-2">
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2 text-muted-foreground">
                  {language === 'fr' ? 'Notes / précisions' : 'Notes / details'}
                </label>
                <textarea
                  value={measurements.notes}
                  onChange={e => update('notes', e.target.value)}
                  className="w-full border border-border bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors rounded-xl min-h-[70px] resize-none"
                  maxLength={500}
                  placeholder={language === 'fr' ? 'Précisions supplémentaires...' : 'Additional details...'}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border/50">
              <p className="text-[10px] font-body text-muted-foreground mb-3 text-center">
                {language === 'fr'
                  ? 'Article non retournable sauf défaut de fabrication.'
                  : 'Item is non-returnable except for manufacturing defects.'}
              </p>
              <button
                onClick={onClose}
                className="w-full bg-primary text-primary-foreground py-3.5 text-xs tracking-[0.2em] uppercase font-body rounded-xl hover:bg-luxury-magenta-light transition-colors duration-300"
              >
                {allRequiredFilled
                  ? (language === 'fr' ? 'Confirmer les mesures' : 'Confirm measurements')
                  : (language === 'fr' ? 'Fermer' : 'Close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ────────── Single field row ────────── */

const MeasurementFieldRow: React.FC<{
  field: MeasurementFieldDef;
  value: string;
  onChange: (v: string) => void;
  lang: 'fr' | 'en';
  helpExpanded: boolean;
  onToggleHelp: () => void;
}> = ({ field, value, onChange, lang, helpExpanded, onToggleHelp }) => {
  const label = lang === 'fr' ? field.label_fr : field.label_en;
  const help = lang === 'fr' ? field.help_fr : field.help_en;
  const isFilled = value !== '';

  return (
    <div className="group">
      <div className={`border rounded-xl p-4 transition-all ${
        isFilled
          ? 'border-primary/30 bg-primary/5'
          : 'border-border hover:border-foreground/20'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] tracking-[0.2em] uppercase font-body text-foreground/80">
              {label}
              {field.required && <span className="text-primary ml-1">*</span>}
            </label>
            {isFilled && <Check size={12} className="text-primary" />}
          </div>
          <button
            type="button"
            onClick={onToggleHelp}
            className="flex items-center gap-1 text-[9px] tracking-wider uppercase font-body text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle size={12} />
            {helpExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="300"
            step="0.5"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 border-0 border-b border-foreground/15 bg-transparent px-0 py-2 text-lg font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
            placeholder="—"
          />
          <span className="text-xs font-body text-muted-foreground">{field.unit}</span>
        </div>

        <AnimatePresence>
          {helpExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <p className="text-[11px] font-body text-muted-foreground leading-relaxed mt-3 pt-3 border-t border-border/50">
                💡 {help}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MeasurementOverlay;
