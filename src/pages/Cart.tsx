import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserAddresses, useShippingMethods, useShippingOptions } from '@/hooks/useShippingData';
import { getUnitPriceEurCents } from '@/lib/pricing';
import { Minus, Plus, X, Package, Clock, Loader2, MapPin, Truck, Gift, Shield, PenLine, ChevronDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddressForm from '@/components/cart/AddressForm';
import type { UserAddress, ShippingMethod } from '@/types/shipping';

const Cart = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items, removeItem, updateQuantity, totalCentsEur } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const {
    state, setShippingAddressId, setBillingAddressId, setBillingSameAsShipping,
    setMethodId, setOption, setShipmentPreference, shippingResult, isReady,
  } = useCheckout();

  const addresses = useUserAddresses(user?.id);
  const methods = useShippingMethods();
  const shippingOptions = useShippingOptions();

  const shippingAddresses = addresses.data?.filter(a => a.type === 'shipping') ?? [];
  const billingAddress = addresses.data?.find(a => a.type === 'billing') ?? null;

  const [showAddressForm, setShowAddressForm] = useState<'shipping' | 'billing' | null>(null);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const t = (fr: string, en: string) => language === 'fr' ? fr : en;

  // Auto-select default shipping address
  useEffect(() => {
    if (!state.shippingAddressId && shippingAddresses.length > 0) {
      const def = shippingAddresses.find(a => a.is_default) ?? shippingAddresses[0];
      setShippingAddressId(def.id);
    }
  }, [shippingAddresses, state.shippingAddressId, setShippingAddressId]);

  // Auto-select first method
  useEffect(() => {
    if (!state.methodId && methods.data && methods.data.length > 0) {
      setMethodId(methods.data[0].id);
    }
  }, [methods.data, state.methodId, setMethodId]);

  const hasMadeToOrder = items.some(i => i.product.made_to_order);
  const selectedMethod = methods.data?.find(m => m.id === state.methodId);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/connexion');
      return;
    }
    if (!state.shippingAddressId) {
      toast.error(t('Veuillez sélectionner une adresse de livraison', 'Please select a shipping address'));
      return;
    }
    if (!state.methodId) {
      toast.error(t('Veuillez sélectionner un mode de livraison', 'Please select a shipping method'));
      return;
    }
    if (shippingResult?.error) {
      toast.error(t('Livraison non disponible pour cette configuration', 'Shipping unavailable for this configuration'));
      return;
    }

    setCheckoutLoading(true);
    try {
      const shippingAddr = addresses.data?.find(a => a.id === state.shippingAddressId);
      const billingAddr = state.billingSameAsShipping ? shippingAddr : (billingAddress ?? shippingAddr);

      const cartItems = items.map(item => {
        const name = language === 'fr' ? item.product.name_fr : item.product.name_en;
        const unitPrice = item.unit_price_eur_cents ?? getUnitPriceEurCents(item.product, item.size);
        return {
          name,
          unit_price_cents: unitPrice,
          quantity: item.quantity,
          image_url: item.product.images[0] || undefined,
          size: item.size,
          color: item.color,
          braiding: item.braiding,
        };
      });

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items: cartItems,
          currency: 'EUR',
          locale: language,
          shipping: {
            price_eur_cents: shippingResult?.shippingPriceEur ?? 0,
            method_id: state.methodId,
            method_code: selectedMethod?.code,
            options: state.options,
            shipment_preference: state.shipmentPreference,
            shipping_address: shippingAddr ? {
              first_name: shippingAddr.first_name,
              last_name: shippingAddr.last_name,
              address1: shippingAddr.address1,
              address2: shippingAddr.address2,
              city: shippingAddr.city,
              postal_code: shippingAddr.postal_code,
              country_code: shippingAddr.country_code,
              phone: shippingAddr.phone,
            } : null,
            billing_address: billingAddr ? {
              first_name: billingAddr.first_name,
              last_name: billingAddr.last_name,
              company: billingAddr.company,
              vat_number: billingAddr.vat_number,
              address1: billingAddr.address1,
              address2: billingAddr.address2,
              city: billingAddr.city,
              postal_code: billingAddr.postal_code,
              country_code: billingAddr.country_code,
            } : null,
            zone_id: shippingResult?.zone?.id,
            customs_notice: shippingResult?.customsNotice ?? false,
            estimated_lead_days: shippingResult?.leadTimeDays ?? 0,
            estimated_eta_min: shippingResult?.etaMinDays ?? 0,
            estimated_eta_max: shippingResult?.etaMaxDays ?? 0,
          },
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(t('Erreur lors du paiement', 'Checkout error'));
    } finally {
      setCheckoutLoading(false);
    }
  };

  // If not logged in, show login prompt
  if (!user && items.length > 0) {
    return (
      <div className="pt-20 md:pt-24">
        <section className="luxury-container luxury-section max-w-3xl mx-auto text-center">
          <h1 className="text-display text-4xl md:text-5xl mb-8">{t('Panier', 'Cart')}</h1>
          <p className="text-muted-foreground font-body mb-6">
            {t('Connectez-vous pour finaliser votre commande.', 'Log in to complete your order.')}
          </p>
          <Link
            to="/connexion"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-colors"
          >
            {t('Se connecter', 'Log in')}
          </Link>
        </section>
      </div>
    );
  }

  const shippingPriceCents = shippingResult?.shippingPriceEur ?? 0;
  const grandTotalCents = totalCentsEur + shippingPriceCents;

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-display text-4xl md:text-5xl text-center mb-12">{t('Panier', 'Cart')}</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground font-body mb-6">{t('Votre panier est vide.', 'Your cart is empty.')}</p>
              <Link to="/boutique" className="inline-block border border-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-foreground hover:text-background transition-all duration-300">
                {t('Continuer mes achats', 'Continue shopping')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* LEFT: Cart items */}
              <div className="lg:col-span-3 space-y-6">
                {items.map(item => {
                  const name = language === 'fr' ? item.product.name_fr : item.product.name_en;
                  return (
                    <div key={item.product.id} className="flex gap-4 border-b border-foreground/10 pb-6">
                      <div className="w-20 h-28 bg-secondary flex-shrink-0 overflow-hidden">
                        <img src={item.product.images[0]} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between">
                            <Link to={`/boutique/${item.product.slug}`} className="text-display text-sm hover:text-primary transition-colors line-clamp-2">{name}</Link>
                            <button onClick={() => removeItem(item.product.id)} className="p-1 text-muted-foreground hover:text-foreground"><X size={14} /></button>
                          </div>
                          <div className="flex gap-3 mt-1 text-[11px] font-body text-muted-foreground">
                            {item.size && <span>{item.size}</span>}
                            {item.color && <span>{item.color}</span>}
                            {item.braiding_color ? <span>{t('Tressage', 'Braiding')}: {item.braiding_color}</span> : item.braiding && <span>{item.braiding}</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-foreground/20">
                            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-secondary"><Minus size={11} /></button>
                            <span className="px-3 text-xs font-body">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-secondary"><Plus size={11} /></button>
                          </div>
                          <span className="text-sm font-body">
                            {formatPrice((item.unit_price_eur_cents ?? getUnitPriceEurCents(item.product, item.size)) * item.quantity, {})}
                          </span>
                        </div>
                        {item.product.stock_qty != null && item.quantity > 0 && (
                          <div className="flex flex-wrap gap-x-3 mt-1.5">
                            {Math.min(item.quantity, item.product.stock_qty) > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-body text-green-700">
                                <Package size={10} /> {Math.min(item.quantity, item.product.stock_qty)} {t('en stock', 'in stock')}
                              </span>
                            )}
                            {item.quantity > item.product.stock_qty && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                                <Clock size={10} /> {item.quantity - item.product.stock_qty} {t('sur commande', 'made to order')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT: Shipping + Summary */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address */}
                <div className="border border-foreground/10 p-4 space-y-3">
                  <h3 className="text-xs tracking-[0.15em] uppercase font-body flex items-center gap-2">
                    <MapPin size={14} /> {t('Adresse de livraison', 'Shipping address')}
                  </h3>
                  {showAddressForm === 'shipping' ? (
                    <AddressForm
                      type="shipping"
                      existing={editingAddress}
                      onSaved={(addr) => {
                        setShowAddressForm(null);
                        setEditingAddress(null);
                        setShippingAddressId(addr.id);
                      }}
                      onCancel={() => { setShowAddressForm(null); setEditingAddress(null); }}
                    />
                  ) : (
                    <>
                      {shippingAddresses.length > 0 ? (
                        <div className="space-y-2">
                          {shippingAddresses.map(a => (
                            <label key={a.id} className={`flex items-start gap-2 p-2 border cursor-pointer transition-colors ${state.shippingAddressId === a.id ? 'border-primary bg-primary/5' : 'border-foreground/10 hover:border-foreground/30'}`}>
                              <input type="radio" name="shipping_addr" checked={state.shippingAddressId === a.id} onChange={() => setShippingAddressId(a.id)} className="mt-1" />
                              <div className="text-xs font-body flex-1">
                                <span className="font-medium">{a.label || `${a.first_name} ${a.last_name}`}</span>
                                <br />
                                <span className="text-muted-foreground">{a.address1}, {a.postal_code} {a.city}, {a.country_code}</span>
                              </div>
                              <button onClick={(e) => { e.preventDefault(); setEditingAddress(a); setShowAddressForm('shipping'); }} className="p-1 text-muted-foreground hover:text-foreground">
                                <PenLine size={12} />
                              </button>
                            </label>
                          ))}
                        </div>
                      ) : null}
                      {shippingAddresses.length < 3 && (
                        <button onClick={() => { setEditingAddress(null); setShowAddressForm('shipping'); }} className="text-xs font-body text-primary underline">
                          + {t('Ajouter une adresse', 'Add an address')}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Billing Address */}
                <div className="border border-foreground/10 p-4 space-y-3">
                  <h3 className="text-xs tracking-[0.15em] uppercase font-body">{t('Adresse de facturation', 'Billing address')}</h3>
                  <label className="flex items-center gap-2 text-xs font-body cursor-pointer">
                    <input type="checkbox" checked={state.billingSameAsShipping} onChange={e => setBillingSameAsShipping(e.target.checked)} />
                    {t('Identique à l\'adresse de livraison', 'Same as shipping address')}
                  </label>
                  {!state.billingSameAsShipping && (
                    showAddressForm === 'billing' ? (
                      <AddressForm
                        type="billing"
                        existing={billingAddress}
                        onSaved={(addr) => {
                          setShowAddressForm(null);
                          setBillingAddressId(addr.id);
                        }}
                        onCancel={() => setShowAddressForm(null)}
                      />
                    ) : billingAddress ? (
                      <div className="text-xs font-body text-muted-foreground p-2 border border-foreground/10">
                        {billingAddress.company && <span className="font-medium">{billingAddress.company}<br /></span>}
                        {billingAddress.first_name} {billingAddress.last_name}<br />
                        {billingAddress.address1}, {billingAddress.postal_code} {billingAddress.city}
                        <button onClick={() => setShowAddressForm('billing')} className="ml-2 text-primary underline">{t('Modifier', 'Edit')}</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddressForm('billing')} className="text-xs font-body text-primary underline">
                        + {t('Ajouter l\'adresse de facturation', 'Add billing address')}
                      </button>
                    )
                  )}
                </div>

                {/* Shipping Method */}
                <div className="border border-foreground/10 p-4 space-y-3">
                  <h3 className="text-xs tracking-[0.15em] uppercase font-body flex items-center gap-2">
                    <Truck size={14} /> {t('Mode de livraison', 'Shipping method')}
                  </h3>
                  {methods.data?.map((m: ShippingMethod) => (
                    <label key={m.id} className={`flex items-start gap-2 p-2 border cursor-pointer transition-colors ${state.methodId === m.id ? 'border-primary bg-primary/5' : 'border-foreground/10 hover:border-foreground/30'}`}>
                      <input type="radio" name="shipping_method" checked={state.methodId === m.id} onChange={() => setMethodId(m.id)} className="mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs font-body font-medium">{language === 'fr' ? m.name_fr : (m.name_en || m.name_fr)}</span>
                        {(m.eta_min_days != null || m.eta_max_days != null) && (
                          <span className="text-[10px] font-body text-muted-foreground ml-2">
                            {m.eta_min_days ?? 0}–{m.eta_max_days ?? 0} {t('jours', 'days')}
                          </span>
                        )}
                        {m.description_fr && (
                          <p className="text-[10px] font-body text-muted-foreground mt-0.5">
                            {language === 'fr' ? m.description_fr : (m.description_en || m.description_fr)}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Shipping Options */}
                {selectedMethod && shippingOptions.data && shippingOptions.data.length > 0 && (
                  <div className="border border-foreground/10 p-4 space-y-2">
                    <h3 className="text-xs tracking-[0.15em] uppercase font-body">{t('Options', 'Options')}</h3>
                    {shippingOptions.data.map(opt => {
                      const supported =
                        (opt.code === 'insurance' && selectedMethod.supports_insurance) ||
                        (opt.code === 'signature' && selectedMethod.supports_signature) ||
                        (opt.code === 'gift_wrap' && selectedMethod.supports_gift_wrap);
                      if (!supported) return null;
                      return (
                        <label key={opt.id} className="flex items-center gap-2 text-xs font-body cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state.options[opt.code as keyof typeof state.options] ?? false}
                            onChange={e => setOption(opt.code as any, e.target.checked)}
                          />
                          <span className="flex items-center gap-1">
                            {opt.code === 'insurance' && <Shield size={12} />}
                            {opt.code === 'gift_wrap' && <Gift size={12} />}
                            {opt.code === 'signature' && <PenLine size={12} />}
                            {language === 'fr' ? opt.name_fr : (opt.name_en || opt.name_fr)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Shipment Preference */}
                {hasMadeToOrder && (
                  <div className="border border-foreground/10 p-4 space-y-2">
                    <h3 className="text-xs tracking-[0.15em] uppercase font-body">{t('Préférence d\'expédition', 'Shipment preference')}</h3>
                    <label className="flex items-start gap-2 text-xs font-body cursor-pointer">
                      <input type="radio" name="ship_pref" checked={state.shipmentPreference === 'single'} onChange={() => setShipmentPreference('single')} className="mt-0.5" />
                      <div>
                        <span className="font-medium">{t('Un seul envoi', 'Single shipment')}</span>
                        <span className="text-muted-foreground ml-1">({t('recommandé', 'recommended')})</span>
                        <p className="text-[10px] text-muted-foreground">{t('Tout envoyé quand la dernière pièce est prête', 'Everything sent when the last piece is ready')}</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-2 text-xs font-body cursor-pointer">
                      <input type="radio" name="ship_pref" checked={state.shipmentPreference === 'split'} onChange={() => setShipmentPreference('split')} className="mt-0.5" />
                      <div>
                        <span className="font-medium">{t('Envois séparés', 'Split shipments')}</span>
                        <p className="text-[10px] text-muted-foreground">{t('Les pièces en stock sont envoyées immédiatement', 'In-stock items shipped immediately')}</p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Customs notice */}
                {shippingResult?.customsNotice && (
                  <div className="flex items-start gap-2 text-xs font-body text-amber-700 bg-amber-50 p-3 border border-amber-200 rounded-sm">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <p>{t(
                      'Droits de douane et taxes locales éventuels à la charge du destinataire.',
                      'Customs duties and local taxes, if applicable, are the responsibility of the recipient.'
                    )}</p>
                  </div>
                )}

                {/* Error */}
                {shippingResult?.error && (
                  <div className="text-xs font-body text-destructive p-3 border border-destructive/20 bg-destructive/5 rounded-sm">
                    {shippingResult.error === 'NO_ZONE' && t('Livraison non disponible dans ce pays.', 'Shipping unavailable to this country.')}
                    {shippingResult.error === 'NO_RATE_RULE' && t('Aucune règle de livraison configurée pour cette destination.', 'No shipping rate configured for this destination.')}
                    {shippingResult.error === 'NO_METHOD' && t('Méthode de livraison non disponible.', 'Shipping method unavailable.')}
                  </div>
                )}

                {/* Summary */}
                <div className="border-t border-foreground/20 pt-6 space-y-3">
                  <div className="flex justify-between text-xs font-body">
                    <span className="tracking-wider uppercase">{t('Sous-total', 'Subtotal')}</span>
                    <span>{formatPrice(totalCentsEur)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="tracking-wider uppercase">{t('Livraison', 'Shipping')}</span>
                    <span>
                      {shippingResult?.isFreeShipping
                        ? <span className="text-green-700">{t('Offerte', 'Free')}</span>
                        : shippingPriceCents > 0
                        ? formatPrice(shippingPriceCents)
                        : '—'}
                    </span>
                  </div>
                  {shippingResult && !shippingResult.error && (
                    <div className="text-[10px] font-body text-muted-foreground">
                      {shippingResult.leadTimeDays > 0 && (
                        <p>{t('Confection', 'Crafting')}: ~{shippingResult.leadTimeDays} {t('jours', 'days')}</p>
                      )}
                      <p>{t('Livraison estimée', 'Estimated delivery')}: {shippingResult.etaMinDays}–{shippingResult.etaMaxDays} {t('jours', 'days')}</p>
                    </div>
                  )}
                  {shippingResult?.splitDetails && (
                    <div className="text-[10px] font-body text-muted-foreground bg-secondary/30 p-2 rounded-sm">
                      <p className="font-medium">{t('Deux envois prévus :', 'Two shipments planned:')}</p>
                      <p>1. {t('Pièces en stock', 'In-stock items')}: {shippingResult.splitDetails.readyShipment.etaMinDays}–{shippingResult.splitDetails.readyShipment.etaMaxDays} {t('jours', 'days')}</p>
                      <p>2. {t('Sur commande', 'Made to order')}: ~{shippingResult.splitDetails.madeToOrderShipment.leadTimeDays} + {shippingResult.splitDetails.madeToOrderShipment.etaMinDays}–{shippingResult.splitDetails.madeToOrderShipment.etaMaxDays} {t('jours', 'days')}</p>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-body font-medium pt-2 border-t border-foreground/10">
                    <span className="tracking-wider uppercase">{t('Total', 'Total')}</span>
                    <span className="text-base">{formatPrice(grandTotalCents)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || !!shippingResult?.error || !state.shippingAddressId || !state.methodId}
                    className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                    {checkoutLoading && <Loader2 size={14} className="animate-spin" />}
                    {t('Passer commande', 'Checkout')}
                  </button>
                  <Link to="/boutique" className="block text-center text-xs font-body text-muted-foreground luxury-link mt-2">
                    {t('Continuer mes achats', 'Continue shopping')}
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default Cart;
