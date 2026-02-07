import React from 'react';
import { motion } from 'framer-motion';

interface MaterialItem {
  name: string;
  values: string[];
}

interface AboutMaterialsGridProps {
  materials: MaterialItem[];
}

const AboutMaterialsGrid = ({ materials }: AboutMaterialsGridProps) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
    {materials.map((mat, i) => (
      <motion.div
        key={mat.name}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: i * 0.1 }}
        className="bg-background/8 border border-background/15 rounded-2xl p-5 sm:p-7 text-center"
      >
        <h3 className="text-display text-lg sm:text-xl tracking-wide text-background mb-3 sm:mb-4">
          {mat.name}
        </h3>
        <div className="w-8 h-px bg-background/20 mx-auto mb-3 sm:mb-4" />
        <div className="space-y-1">
          {mat.values.map((v) => (
            <p key={v} className="text-xs sm:text-sm font-body text-background/70">
              {v}
            </p>
          ))}
        </div>
      </motion.div>
    ))}
  </div>
);

export default AboutMaterialsGrid;
