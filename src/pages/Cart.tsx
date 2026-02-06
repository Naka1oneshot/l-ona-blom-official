import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, X } from 'lucide-react';

const Cart = () => {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, removeItem, updateQuantity, totalCentsEur } = useCart();

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-16">{t('cart.title')}</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body mb-6">{t('cart.empty')}</p>
              <Link
                to="/boutique"
                className="inline-block border border-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-foreground hover:text-background transition-all duration-300"
              >
                {t('cart.continue')}
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                {items.map(item => {
                  const name = language === 'fr' ? item.product.name_fr : item.product.name_en;
                  return (
                    <div key={item.product.id} className="flex gap-6 border-b border-foreground/10 pb-8">
                      <div className="w-24 h-32 bg-secondary flex-shrink-0 overflow-hidden">
                        <img src={item.product.images[0]} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <Link to={`/boutique/${item.product.slug}`} className="text-display text-lg hover:text-primary transition-colors">
                              {name}
                            </Link>
                            <button onClick={() => removeItem(item.product.id)} className="p-1 text-muted-foreground hover:text-foreground" aria-label={t('cart.remove')}>
                              <X size={16} />
                            </button>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs font-body text-muted-foreground">
                            {item.size && <span>{item.size}</span>}
                            {item.color && <span>{item.color}</span>}
                            {item.braiding && <span>{item.braiding}</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-foreground/20">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="p-2 hover:bg-secondary transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-4 text-sm font-body">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="p-2 hover:bg-secondary transition-colors"
                              aria-label="Increase"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-body">
                            {formatPrice(item.product.base_price_eur * item.quantity, {})}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="mt-12 pt-8 border-t border-foreground/20">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm font-body tracking-wider uppercase">{t('cart.subtotal')}</span>
                  <span className="text-xl font-body">{formatPrice(totalCentsEur)}</span>
                </div>
                <button className="w-full bg-foreground text-background py-4 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors duration-300">
                  {t('cart.checkout')}
                </button>
                <Link
                  to="/boutique"
                  className="block text-center mt-4 text-sm font-body text-muted-foreground luxury-link"
                >
                  {t('cart.continue')}
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default Cart;
