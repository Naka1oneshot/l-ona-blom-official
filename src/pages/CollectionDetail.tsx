import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { mockCollections, mockProducts } from '@/lib/mockData';
import ProductCard from '@/components/ProductCard';
import AdminEditButton from '@/components/AdminEditButton';
import EditableDBField from '@/components/EditableDBField';

const CollectionDetail = () => {
  const { slug } = useParams();
  const { language, t } = useLanguage();

  const collection = mockCollections.find(c => c.slug === slug);

  if (!collection) {
    return (
      <div className="pt-20 luxury-container luxury-section text-center">
        <p className="text-muted-foreground font-body">Collection introuvable.</p>
      </div>
    );
  }

  const titleField = language === 'fr' ? 'title_fr' : 'title_en';
  const subtitleField = language === 'fr' ? 'subtitle_fr' : 'subtitle_en';
  const narrativeField = language === 'fr' ? 'narrative_fr' : 'narrative_en';
  const title = language === 'fr' ? collection.title_fr : collection.title_en;
  const subtitle = language === 'fr' ? collection.subtitle_fr : collection.subtitle_en;
  const narrative = language === 'fr' ? collection.narrative_fr : collection.narrative_en;
  const collectionProducts = mockProducts.filter(p => collection.product_ids.includes(p.id));

  return (
    <div className="pt-20 md:pt-24">
      {/* Cover */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={collection.cover_image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/40" />
        </div>
        <div className="relative z-10 text-center text-background px-6">
          <AdminEditButton
            to={`/admin/collections?edit=${collection.id}`}
            className="absolute top-4 right-4"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <EditableDBField
              table="collections"
              id={collection.id}
              field={titleField}
              value={title}
              as="h1"
              className="text-display text-4xl md:text-6xl tracking-[0.15em] mb-4"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <EditableDBField
              table="collections"
              id={collection.id}
              field={subtitleField}
              value={subtitle}
              as="p"
              className="text-sm font-body tracking-[0.1em] opacity-70"
            />
          </motion.div>
        </div>
      </section>

      {/* Narrative */}
      <section className="luxury-container luxury-section max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <EditableDBField
            table="collections"
            id={collection.id}
            field={narrativeField}
            value={narrative}
            as="div"
            className="text-base md:text-lg font-body text-muted-foreground leading-relaxed whitespace-pre-line"
            multiline
          />
        </motion.div>
      </section>

      {/* Gallery */}
      {collection.gallery_images.length > 0 && (
        <section className="luxury-container pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {collection.gallery_images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="aspect-[3/4] bg-secondary overflow-hidden"
              >
                <img src={img} alt={`Look ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {collectionProducts.length > 0 && (
        <section className="luxury-container pb-20 md:pb-32">
          <h2 className="text-display text-2xl md:text-3xl text-center mb-12">
            {t('collections.shop_collection')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {collectionProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CollectionDetail;
