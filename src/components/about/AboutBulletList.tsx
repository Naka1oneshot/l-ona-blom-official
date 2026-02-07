import React from 'react';
import { motion } from 'framer-motion';
import EditableText from '@/components/EditableText';

interface AboutBulletListProps {
  items: string[];
  badge?: string;
  variant?: 'light' | 'dark' | 'magenta';
  editKeyPrefix?: string;
}

const AboutBulletList = ({ items, badge, variant = 'light', editKeyPrefix }: AboutBulletListProps) => {
  const dotColor = variant === 'light' ? 'bg-primary' : 'bg-background';
  const textColor = variant === 'light' ? 'text-foreground' : 'text-background';

  return (
    <div>
      {badge && (
        <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-body px-4 py-1.5 border border-primary/40 text-primary mb-6">
          {badge}
        </span>
      )}
      <ul className="space-y-4">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="flex items-start gap-4"
          >
            <span className={`w-2 h-2 ${dotColor} rounded-full mt-2 flex-shrink-0`} />
            {editKeyPrefix ? (
              <EditableText
                settingsKey={`${editKeyPrefix}_${i}`}
                defaultText={item}
                as="span"
                className={`text-base sm:text-lg font-body leading-7 ${textColor}`}
              />
            ) : (
              <span className={`text-base sm:text-lg font-body leading-7 ${textColor}`}>
                {item}
              </span>
            )}
          </motion.li>
        ))}
      </ul>
    </div>
  );
};

export default AboutBulletList;
