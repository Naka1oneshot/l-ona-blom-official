import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

const PaymentSuccess = () => {
  const { language } = useLanguage();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-20"
        >
          <CheckCircle className="mx-auto mb-6 text-green-600" size={56} strokeWidth={1.5} />
          <h1 className="text-display text-3xl md:text-4xl mb-4">
            {language === 'fr' ? 'Merci pour votre commande !' : 'Thank you for your order!'}
          </h1>
          <p className="font-body text-muted-foreground mb-10 max-w-md mx-auto">
            {language === 'fr'
              ? 'Votre paiement a été confirmé. Vous recevrez un email de confirmation sous peu.'
              : 'Your payment has been confirmed. You will receive a confirmation email shortly.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/boutique"
              className="inline-block border border-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-foreground hover:text-background transition-all duration-300"
            >
              {language === 'fr' ? 'Continuer mes achats' : 'Continue shopping'}
            </Link>
            <Link
              to="/compte"
              className="inline-block bg-foreground text-background px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-all duration-300"
            >
              {language === 'fr' ? 'Mon compte' : 'My account'}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default PaymentSuccess;
