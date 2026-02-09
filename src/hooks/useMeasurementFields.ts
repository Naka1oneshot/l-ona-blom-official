import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MeasurementFieldDef {
  key: string;
  label_fr: string;
  label_en: string;
  required: boolean;
  help_fr: string;
  help_en: string;
  unit: string;
}

export const DEFAULT_MEASUREMENT_FIELDS: MeasurementFieldDef[] = [
  {
    key: 'bust',
    label_fr: 'Tour de poitrine',
    label_en: 'Bust',
    required: true,
    help_fr: 'Mesurez autour de la partie la plus large de votre poitrine, en passant le mètre ruban sous les bras et sur les omoplates. Gardez le ruban horizontal et respirez normalement.',
    help_en: 'Measure around the fullest part of your chest, passing the tape under your arms and across the shoulder blades. Keep the tape horizontal and breathe normally.',
    unit: 'cm',
  },
  {
    key: 'waist',
    label_fr: 'Tour de taille',
    label_en: 'Waist',
    required: true,
    help_fr: 'Mesurez autour de la partie la plus étroite de votre taille, généralement au-dessus du nombril. Penchez-vous sur le côté pour identifier le pli naturel — c\'est votre taille.',
    help_en: 'Measure around the narrowest part of your waist, usually above your navel. Bend to the side to find the natural crease — that\'s your waist.',
    unit: 'cm',
  },
  {
    key: 'hips',
    label_fr: 'Tour de hanches',
    label_en: 'Hips',
    required: true,
    help_fr: 'Mesurez autour de la partie la plus large de vos hanches, en passant le mètre ruban sur les fesses. Gardez les pieds joints et le ruban horizontal.',
    help_en: 'Measure around the widest part of your hips, passing the tape over your buttocks. Keep your feet together and the tape horizontal.',
    unit: 'cm',
  },
  {
    key: 'shoulder_width',
    label_fr: 'Largeur des épaules',
    label_en: 'Shoulder width',
    required: false,
    help_fr: 'Mesurez d\'une extrémité d\'épaule à l\'autre en passant par la nuque. Le point de mesure est l\'articulation de l\'épaule, là où le bras commence.',
    help_en: 'Measure from one shoulder point to the other across the back of your neck. The measuring point is the shoulder joint where the arm begins.',
    unit: 'cm',
  },
  {
    key: 'arm_length',
    label_fr: 'Longueur de bras',
    label_en: 'Arm length',
    required: false,
    help_fr: 'Pliez légèrement le coude. Mesurez du haut de l\'épaule (articulation) jusqu\'au poignet en suivant l\'extérieur du bras.',
    help_en: 'Slightly bend your elbow. Measure from the top of the shoulder joint down to your wrist, following the outside of the arm.',
    unit: 'cm',
  },
  {
    key: 'total_length',
    label_fr: 'Longueur totale souhaitée',
    label_en: 'Desired total length',
    required: false,
    help_fr: 'Mesurez du point le plus haut de l\'épaule jusqu\'à l\'ourlet souhaité. Pour une robe, mesurez jusqu\'aux genoux ou chevilles selon la longueur désirée.',
    help_en: 'Measure from the highest point of the shoulder to the desired hemline. For a dress, measure to the knees or ankles depending on your preferred length.',
    unit: 'cm',
  },
];

export function useMeasurementFields() {
  const [fields, setFields] = useState<MeasurementFieldDef[]>(DEFAULT_MEASUREMENT_FIELDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'measurement_fields')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setFields(data.value as unknown as MeasurementFieldDef[]);
        }
        setLoading(false);
      });
  }, []);

  return { fields, loading };
}
