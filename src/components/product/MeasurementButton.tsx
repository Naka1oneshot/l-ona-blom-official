import React from 'react';
import { Ruler, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MeasurementData } from '@/types';
import { useMeasurementFields } from '@/hooks/useMeasurementFields';

interface Props {
  measurements: MeasurementData;
  onClick: () => void;
}

const MeasurementButton: React.FC<Props> = ({ measurements, onClick }) => {
  const { language } = useLanguage();
  const { fields } = useMeasurementFields();

  const filledCount = fields.filter(f => {
    const val = (measurements as any)[f.key];
    return val && val !== '';
  }).length;

  const requiredFields = fields.filter(f => f.required);
  const requiredFilled = requiredFields.filter(f => {
    const val = (measurements as any)[f.key];
    return val && val !== '';
  }).length;

  const allRequiredDone = requiredFilled === requiredFields.length;
  const remaining = fields.length - filledCount;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all group mb-6 ${
        allRequiredDone
          ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
          : 'border-foreground/10 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5'
      }`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
        allRequiredDone ? 'bg-primary/15 text-primary' : 'bg-foreground/5 text-foreground/40 group-hover:text-primary group-hover:bg-primary/10'
      }`}>
        <Ruler size={18} />
      </div>

      <div className="flex-1 text-left">
        <p className="text-sm font-body font-medium tracking-wide">
          {allRequiredDone
            ? (language === 'fr' ? 'Mesures renseignées' : 'Measurements provided')
            : (language === 'fr' ? 'Renseigner vos mesures' : 'Enter your measurements')}
        </p>
        <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground mt-0.5">
          {allRequiredDone
            ? `${filledCount}/${fields.length} ${language === 'fr' ? 'complétées' : 'completed'}`
            : `${remaining} ${language === 'fr' ? 'restantes' : 'remaining'}`}
        </p>
      </div>

      {/* Progress ring */}
      <div className="relative w-9 h-9 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray={`${(filledCount / fields.length) * 94.25} 94.25`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-body font-medium">
          {filledCount}
        </span>
      </div>

      <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
};

export default MeasurementButton;
