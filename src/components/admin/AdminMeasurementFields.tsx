import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEFAULT_MEASUREMENT_FIELDS, MeasurementFieldDef } from '@/hooks/useMeasurementFields';

const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors rounded-lg";
const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

const AdminMeasurementFields: React.FC = () => {
  const [fields, setFields] = useState<MeasurementFieldDef[]>([]);
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
        } else {
          setFields([...DEFAULT_MEASUREMENT_FIELDS]);
        }
        setLoading(false);
      });
  }, []);

  const save = async () => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'measurement_fields')
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from('site_settings').update({ value: fields as any }).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('site_settings').insert({ key: 'measurement_fields', value: fields as any }));
    }
    if (error) toast.error(error.message);
    else toast.success('Champs de mesure enregistrés');
  };

  const addField = () => {
    setFields([...fields, {
      key: `custom_${Date.now()}`,
      label_fr: '',
      label_en: '',
      required: false,
      help_fr: '',
      help_en: '',
      unit: 'cm',
    }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<MeasurementFieldDef>) => {
    setFields(fields.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFields(updated);
  };

  const resetToDefaults = () => {
    if (confirm('Réinitialiser tous les champs aux valeurs par défaut ?')) {
      setFields([...DEFAULT_MEASUREMENT_FIELDS]);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-xl">Champs de mesure sur-mesure</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="px-3 py-1.5 text-[10px] tracking-wider uppercase font-body border border-border hover:border-foreground transition-colors rounded-lg"
          >
            Par défaut
          </button>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-body text-primary border border-primary hover:bg-primary hover:text-primary-foreground transition-colors rounded-lg"
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
      </div>

      <p className="text-xs font-body text-muted-foreground">
        Configurez les champs qui apparaissent dans l'overlay de prise de mesures pour les articles sur-mesure.
      </p>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.key} className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted-foreground" />
                <span className="text-xs font-body text-muted-foreground">
                  {field.label_fr || `Champ ${index + 1}`}
                </span>
                {field.required && (
                  <span className="text-[9px] tracking-wider uppercase font-body px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                    Requis
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveField(index, -1)} disabled={index === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => removeField(index)}
                  className="p-1 text-destructive/60 hover:text-destructive transition-colors ml-2">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Clé technique</label>
                <input value={field.key} onChange={e => updateField(index, { key: e.target.value })}
                  className={inputClass} placeholder="ex: bust" />
              </div>
              <div>
                <label className={labelClass}>Unité</label>
                <input value={field.unit} onChange={e => updateField(index, { unit: e.target.value })}
                  className={inputClass} placeholder="cm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Label FR</label>
                <input value={field.label_fr} onChange={e => updateField(index, { label_fr: e.target.value })}
                  className={inputClass} placeholder="Tour de poitrine" />
              </div>
              <div>
                <label className={labelClass}>Label EN</label>
                <input value={field.label_en} onChange={e => updateField(index, { label_en: e.target.value })}
                  className={inputClass} placeholder="Bust" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Aide FR</label>
                <textarea value={field.help_fr} onChange={e => updateField(index, { help_fr: e.target.value })}
                  className={`${inputClass} min-h-[60px] resize-none`}
                  placeholder="Instructions pour prendre cette mesure..." />
              </div>
              <div>
                <label className={labelClass}>Aide EN</label>
                <textarea value={field.help_en} onChange={e => updateField(index, { help_en: e.target.value })}
                  className={`${inputClass} min-h-[60px] resize-none`}
                  placeholder="Instructions for this measurement..." />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required}
                onChange={e => updateField(index, { required: e.target.checked })}
                className="accent-primary"
              />
              <span className="text-xs font-body">Champ obligatoire</span>
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        className="flex items-center gap-2 bg-foreground text-background px-6 py-3 text-[10px] tracking-wider uppercase font-body hover:bg-primary transition-colors rounded-xl"
      >
        <Save size={14} /> Enregistrer les champs de mesure
      </button>
    </div>
  );
};

export default AdminMeasurementFields;
