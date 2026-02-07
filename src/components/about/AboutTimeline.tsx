import React from 'react';
import { motion } from 'framer-motion';

interface AboutTimelineProps {
  steps: { label: string }[];
  variant?: 'light' | 'dark';
}

const AboutTimeline = ({ steps, variant = 'light' }: AboutTimelineProps) => {
  const lineColor = variant === 'light' ? 'bg-primary/20' : 'bg-background/20';
  const dotColor = variant === 'light' ? 'bg-primary' : 'bg-background';
  const textColor = variant === 'light' ? 'text-foreground' : 'text-background';
  const numColor = variant === 'light' ? 'text-primary/40' : 'text-background/30';

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className={`absolute left-4 sm:left-5 top-2 bottom-2 w-px ${lineColor}`} />

      <div className="space-y-8 sm:space-y-10">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="flex items-center gap-4 sm:gap-6 relative"
          >
            {/* Dot */}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${dotColor}/10 flex items-center justify-center flex-shrink-0 relative z-10`}>
              <div className={`w-3 h-3 rounded-full ${dotColor}`} />
            </div>
            
            {/* Step label */}
            <div>
              <span className={`text-[10px] font-body ${numColor} tracking-widest`}>
                0{i + 1}
              </span>
              <h4 className={`text-display text-lg sm:text-xl tracking-wide ${textColor}`}>
                {step.label}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AboutTimeline;
