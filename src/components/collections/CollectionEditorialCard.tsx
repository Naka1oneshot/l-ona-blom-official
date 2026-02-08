import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface CollectionEditorialCardProps {
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverImage?: string;
  featuredImages: string[];
  href: string;
}

const CollectionEditorialCard = ({
  title,
  subtitle,
  excerpt,
  coverImage,
  featuredImages,
  href,
}: CollectionEditorialCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={href} className="group block">
        {/* Cover image */}
        {coverImage && (
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm mb-5">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-500" />
          </div>
        )}

        {/* Text block */}
        <div className="space-y-2 mb-4">
          <h2 className="text-display text-lg md:text-xl tracking-[0.08em] uppercase group-hover:underline underline-offset-4 decoration-1 transition-all duration-300">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground font-body">
              {subtitle}
            </p>
          )}
          {excerpt && (
            <p className="text-sm font-body text-muted-foreground leading-relaxed line-clamp-3 pt-1">
              {excerpt}
            </p>
          )}
        </div>

        {/* Featured images */}
        {featuredImages.length > 0 && (
          <div className={`grid gap-2 ${featuredImages.length === 1 ? 'grid-cols-1 max-w-[50%]' : 'grid-cols-2'}`}>
            {featuredImages.map((img, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                <img
                  src={img}
                  alt={`${title} – ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  );
};

export default CollectionEditorialCard;
