import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowUpDown, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GroupWithCategories } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

interface Props {
  groups: GroupWithCategories[];
  categorySlug: string | null;
  groupSlug: string | null;
  sort: SortOption;
  onFilterChange: (params: { category?: string; group?: string }) => void;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
}

const ShopFilterBar = ({
  groups,
  categorySlug,
  groupSlug,
  sort,
  onFilterChange,
  onSortChange,
  totalCount,
}: Props) => {
  const { language } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const getName = (item: { name_fr: string; name_en: string | null }) =>
    language === 'en' && item.name_en ? item.name_en : item.name_fr;

  const activeGroups = groups.filter(g => g.is_active);
  const hasFilter = !!(categorySlug || groupSlug);

  const sortLabels: Record<SortOption, string> = {
    default: language === 'fr' ? 'Recommandés' : 'Recommended',
    'price-asc': language === 'fr' ? 'Prix croissant' : 'Price: Low to High',
    'price-desc': language === 'fr' ? 'Prix décroissant' : 'Price: High to Low',
    newest: language === 'fr' ? 'Nouveautés' : 'Newest',
  };

  const activeFilterLabel = (() => {
    if (categorySlug) {
      for (const g of activeGroups) {
        const cat = g.categories.find(c => c.slug === categorySlug);
        if (cat) return getName(cat);
      }
      return categorySlug;
    }
    if (groupSlug) {
      const g = activeGroups.find(gr => gr.slug === groupSlug);
      return g ? getName(g) : groupSlug;
    }
    return language === 'fr' ? 'Tout' : 'All';
  })();

  return (
    <div className="relative mb-8 md:mb-12">
      {/* Main bar */}
      <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
        {/* Left: filter toggle */}
        <button
          onClick={() => { setFiltersOpen(prev => !prev); setSortOpen(false); }}
          className={cn(
            "flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-body transition-colors",
            filtersOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal size={14} />
          {language === 'fr' ? 'Filtrer' : 'Filter'}
          {hasFilter && (
            <span className="ml-1 px-1.5 py-0.5 bg-foreground text-background text-[9px] tracking-wider rounded-sm">
              {activeFilterLabel}
            </span>
          )}
          <ChevronDown size={12} className={cn("transition-transform", filtersOpen && "rotate-180")} />
        </button>

        {/* Center: count */}
        <span className="hidden md:block text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-body">
          {totalCount} {totalCount === 1 ? (language === 'fr' ? 'pièce' : 'piece') : (language === 'fr' ? 'pièces' : 'pieces')}
        </span>

        {/* Right: sort toggle */}
        <button
          onClick={() => { setSortOpen(prev => !prev); setFiltersOpen(false); }}
          className={cn(
            "flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-body transition-colors",
            sortOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowUpDown size={14} />
          {sortLabels[sort]}
          <ChevronDown size={12} className={cn("transition-transform", sortOpen && "rotate-180")} />
        </button>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6 pb-4 grid grid-cols-2 md:flex md:flex-wrap gap-x-10 gap-y-6">
              {/* All */}
              <button
                onClick={() => { onFilterChange({}); setFiltersOpen(false); }}
                className={cn(
                  "text-left text-[11px] tracking-[0.15em] uppercase font-body transition-colors",
                  !hasFilter ? "text-foreground underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === 'fr' ? 'Tout voir' : 'View all'}
              </button>

              {activeGroups.map(group => (
                <div key={group.id}>
                  <button
                    onClick={() => { onFilterChange({ group: group.slug }); setFiltersOpen(false); }}
                    className={cn(
                      "text-[11px] tracking-[0.2em] uppercase font-body mb-2 transition-colors",
                      groupSlug === group.slug && !categorySlug
                        ? "text-foreground underline underline-offset-4"
                        : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {getName(group)}
                  </button>
                  <ul className="space-y-1.5">
                    {group.categories.filter(c => c.is_active).map(cat => (
                      <li key={cat.id}>
                        <button
                          onClick={() => { onFilterChange({ category: cat.slug }); setFiltersOpen(false); }}
                          className={cn(
                            "text-xs font-body transition-colors",
                            categorySlug === cat.slug
                              ? "text-foreground underline underline-offset-4"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {getName(cat)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sort panel */}
      <AnimatePresence>
        {sortOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-3 flex flex-wrap gap-x-8 gap-y-2 justify-end">
              {(Object.keys(sortLabels) as SortOption[]).map(key => (
                <button
                  key={key}
                  onClick={() => { onSortChange(key); setSortOpen(false); }}
                  className={cn(
                    "text-[11px] tracking-[0.15em] uppercase font-body transition-colors",
                    sort === key
                      ? "text-foreground underline underline-offset-4"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filter chip - quick clear */}
      {hasFilter && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground font-body">
            {activeFilterLabel}
          </span>
          <button
            onClick={() => onFilterChange({})}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopFilterBar;
