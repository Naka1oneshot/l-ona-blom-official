import { useLanguage } from '@/contexts/LanguageContext';
import { MeasurementData } from '@/types';

export type { MeasurementData };

interface MeasurementFormProps {
  measurements: MeasurementData;
  onChange: (m: MeasurementData) => void;
}

const fields: { key: keyof Omit<MeasurementData, 'notes'>; fr: string; en: string }[] = [
  { key: 'bust', fr: 'Tour de poitrine (cm)', en: 'Bust (cm)' },
  { key: 'waist', fr: 'Tour de taille (cm)', en: 'Waist (cm)' },
  { key: 'hips', fr: 'Tour de hanches (cm)', en: 'Hips (cm)' },
  { key: 'shoulder_width', fr: 'Largeur épaules (cm)', en: 'Shoulder width (cm)' },
  { key: 'arm_length', fr: 'Longueur bras (cm)', en: 'Arm length (cm)' },
  { key: 'total_length', fr: 'Longueur totale souhaitée (cm)', en: 'Desired total length (cm)' },
];

const MeasurementForm = ({ measurements, onChange }: MeasurementFormProps) => {
  const { language, t } = useLanguage();

  const update = (key: keyof MeasurementData, value: string) => {
    onChange({ ...measurements, [key]: value });
  };

  const inputClass = "w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="border border-primary/30 bg-primary/5 p-6 mb-6">
      <h3 className="text-display text-lg mb-2">
        {language === 'fr' ? 'Mesures sur-mesure' : 'Made-to-Measure'}
      </h3>
      <p className="text-xs font-body text-muted-foreground mb-4">
        {language === 'fr'
          ? 'Cette pièce est confectionnée sur mesure. Veuillez renseigner vos mensurations. Article non retournable sauf défaut de fabrication.'
          : 'This piece is made-to-measure. Please provide your measurements. Item is non-returnable except for manufacturing defects.'}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">
              {language === 'fr' ? f.fr : f.en}
            </label>
            <input
              type="number"
              min="0"
              max="300"
              step="0.5"
              value={measurements[f.key]}
              onChange={e => update(f.key, e.target.value)}
              className={inputClass}
              required
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">
          {language === 'fr' ? 'Notes / précisions' : 'Notes / details'}
        </label>
        <textarea
          value={measurements.notes}
          onChange={e => update('notes', e.target.value)}
          className={`${inputClass} min-h-[80px] resize-none`}
          maxLength={500}
        />
      </div>
    </div>
  );
};

export default MeasurementForm;
