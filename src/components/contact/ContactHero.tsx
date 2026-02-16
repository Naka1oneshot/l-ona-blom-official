import { motion } from 'framer-motion';

interface Props {
  imageUrl: string;
  title: string;
  subtitle: string;
}

const ContactHero = ({ imageUrl, title, subtitle }: Props) => {
  const hasImage = imageUrl && imageUrl.length > 5;

  return (
    <section className="relative w-full -mt-16 md:-mt-20" style={{ height: hasImage ? '60vh' : '35vh', minHeight: hasImage ? 400 : 220 }}>
      {hasImage && (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className={`absolute inset-0 ${hasImage ? 'bg-foreground/40' : 'bg-foreground'}`} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full pt-16 md:pt-20 text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-display text-4xl md:text-6xl lg:text-7xl text-background tracking-wider"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-4 md:mt-6 text-sm md:text-base font-body text-background/80 max-w-lg tracking-wide"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </section>
  );
};

export default ContactHero;
