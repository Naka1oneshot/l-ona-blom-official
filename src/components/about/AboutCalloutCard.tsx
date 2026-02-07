import React from 'react';
import { motion } from 'framer-motion';

interface AboutCalloutCardProps {
  label: string;
  text: string;
  index?: number;
  variant?: 'light' | 'dark';
}

const AboutCalloutCard = ({ label, text, index = 0, variant = 'light' }: AboutCalloutCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className={`p-6 sm:p-8 rounded-2xl border ${
      variant === 'dark'
        ? 'border-background/10 bg-background/5'
        : 'border-foreground/8 bg-secondary/50'
    }`}
  >
    <h3 className={`text-display text-lg sm:text-xl tracking-wide mb-2 ${
      variant === 'dark' ? 'text-background' : 'text-primary'
    }`}>
      {label}
    </h3>
    {text && (
      <p className={`text-sm font-body leading-relaxed ${
        variant === 'dark' ? 'text-background/70' : 'text-muted-foreground'
      }`}>
        {text}
      </p>
    )}
  </motion.div>
);

export default AboutCalloutCard;
