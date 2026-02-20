import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { CheckoutShippingState, SelectedShippingOptions, ShipmentPreference, ShippingCalcResult } from '@/types/shipping';
import { calculateShipping } from '@/lib/shipping/calcShipping';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useUserAddresses,
  useShippingZones,
  useShippingZoneCountries,
  useShippingSizeClasses,
  useShippingMethods,
  useShippingOptions,
  useShippingRateRules,
  useShippingFreeThresholds,
  useShippingOptionPrices,
} from '@/hooks/useShippingData';

interface CheckoutContextType {
  state: CheckoutShippingState;
  setShippingAddressId: (id: string | null) => void;
  setBillingAddressId: (id: string | null) => void;
  setBillingSameAsShipping: (same: boolean) => void;
  setMethodId: (id: string | null) => void;
  setOption: (key: keyof SelectedShippingOptions, value: boolean) => void;
  setShipmentPreference: (pref: ShipmentPreference) => void;
  shippingResult: ShippingCalcResult | null;
  selectedCountryCode: string | null;
  isReady: boolean; // all data loaded
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { items } = useCart();

  const [state, setState] = useState<CheckoutShippingState>({
    shippingAddressId: null,
    billingAddressId: null,
    billingSameAsShipping: true,
    methodId: null,
    options: { insurance: false, signature: false, gift_wrap: false },
    shipmentPreference: 'single',
  });

  const addresses = useUserAddresses(user?.id);
  const zones = useShippingZones();
  const zoneCountries = useShippingZoneCountries();
  const sizeClasses = useShippingSizeClasses();
  const methods = useShippingMethods();
  const options = useShippingOptions();
  const rateRules = useShippingRateRules();
  const freeThresholds = useShippingFreeThresholds();
  const optionPrices = useShippingOptionPrices();

  const isReady = !!(
    zones.data && zoneCountries.data && sizeClasses.data &&
    methods.data && options.data && rateRules.data &&
    freeThresholds.data && optionPrices.data
  );

  // Derive country from selected shipping address
  const selectedCountryCode = useMemo(() => {
    if (!state.shippingAddressId || !addresses.data) return null;
    const addr = addresses.data.find(a => a.id === state.shippingAddressId);
    return addr?.country_code ?? null;
  }, [state.shippingAddressId, addresses.data]);

  // Calculate shipping
  const shippingResult = useMemo<ShippingCalcResult | null>(() => {
    if (!isReady || !selectedCountryCode || !state.methodId || items.length === 0) return null;

    const cartItemsForCalc = items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      priceEurCents: item.unit_price_eur_cents ?? item.product.base_price_eur,
      madeToOrder: item.product.made_to_order ?? false,
      leadTimeDays: (item.product as any).lead_time_days ?? item.product.made_to_order_max_days ?? null,
      sizeClassCode: (item.product as any).shipping_size_class_code ?? null,
    }));

    return calculateShipping(
      {
        cartItems: cartItemsForCalc,
        countryCode: selectedCountryCode,
        methodId: state.methodId,
        selectedOptions: state.options,
        shipmentPreference: state.shipmentPreference,
      },
      {
        zones: zones.data!,
        zoneCountries: zoneCountries.data!,
        sizeClasses: sizeClasses.data!,
        methods: methods.data!,
        rateRules: rateRules.data!,
        freeThresholds: freeThresholds.data!,
        optionPrices: optionPrices.data!,
        options: options.data!,
      }
    );
  }, [isReady, selectedCountryCode, state, items, zones.data, zoneCountries.data, sizeClasses.data, methods.data, rateRules.data, freeThresholds.data, optionPrices.data, options.data]);

  const setShippingAddressId = useCallback((id: string | null) => setState(s => ({ ...s, shippingAddressId: id })), []);
  const setBillingAddressId = useCallback((id: string | null) => setState(s => ({ ...s, billingAddressId: id })), []);
  const setBillingSameAsShipping = useCallback((same: boolean) => setState(s => ({ ...s, billingSameAsShipping: same })), []);
  const setMethodId = useCallback((id: string | null) => setState(s => ({ ...s, methodId: id })), []);
  const setOption = useCallback((key: keyof SelectedShippingOptions, value: boolean) =>
    setState(s => ({ ...s, options: { ...s.options, [key]: value } })), []);
  const setShipmentPreference = useCallback((pref: ShipmentPreference) => setState(s => ({ ...s, shipmentPreference: pref })), []);

  return (
    <CheckoutContext.Provider value={{
      state, setShippingAddressId, setBillingAddressId, setBillingSameAsShipping,
      setMethodId, setOption, setShipmentPreference, shippingResult, selectedCountryCode, isReady,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}
