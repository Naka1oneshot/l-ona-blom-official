export interface UserAddress {
  id: string;
  user_id: string;
  type: 'billing' | 'shipping';
  is_default: boolean;
  label: string | null;
  first_name: string;
  last_name: string;
  company: string | null;
  vat_number: string | null;
  address1: string;
  address2: string | null;
  city: string;
  postal_code: string;
  region: string | null;
  country_code: string;
  phone: string | null;
  created_at: string;
}

export interface ShippingZone {
  id: string;
  name_fr: string;
  name_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  customs_notice: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ShippingZoneCountry {
  zone_id: string;
  country_code: string;
}

export interface ShippingSizeClass {
  code: string;
  label_fr: string;
  label_en: string | null;
  weight_points: number;
  is_active: boolean;
  sort_order: number;
}

export interface ShippingMethod {
  id: string;
  code: string;
  name_fr: string;
  name_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  is_active: boolean;
  supports_insurance: boolean;
  supports_signature: boolean;
  supports_gift_wrap: boolean;
  eta_min_days: number | null;
  eta_max_days: number | null;
  sort_order: number;
}

export interface ShippingOption {
  id: string;
  code: 'insurance' | 'signature' | 'gift_wrap';
  name_fr: string;
  name_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  is_active: boolean;
}

export interface ShippingRateRule {
  id: string;
  zone_id: string;
  method_id: string;
  min_subtotal_eur: number;
  max_subtotal_eur: number | null;
  min_weight_points: number;
  max_weight_points: number | null;
  price_eur: number;
  is_active: boolean;
  priority: number;
}

export interface ShippingFreeThreshold {
  id: string;
  zone_id: string;
  method_id: string | null;
  threshold_eur: number;
  is_active: boolean;
}

export interface ShippingOptionPrice {
  id: string;
  option_id: string;
  zone_id: string | null;
  method_id: string | null;
  price_eur: number;
  is_active: boolean;
}

export interface TaxSettings {
  id: number;
  vat_enabled: boolean;
  vat_rate: number;
}

export type ShipmentPreference = 'single' | 'split';

export interface SelectedShippingOptions {
  insurance: boolean;
  signature: boolean;
  gift_wrap: boolean;
}

export interface ShippingCalcInput {
  cartItems: {
    productId: string;
    quantity: number;
    priceEurCents: number;
    madeToOrder: boolean;
    leadTimeDays: number | null;
    sizeClassCode: string | null;
  }[];
  countryCode: string;
  methodId: string;
  selectedOptions: SelectedShippingOptions;
  shipmentPreference: ShipmentPreference;
}

export interface ShippingCalcResult {
  shippingPriceEur: number; // in EUR cents
  zone: ShippingZone | null;
  method: ShippingMethod | null;
  isFreeShipping: boolean;
  optionsPriceEur: number;
  customsNotice: boolean;
  etaMinDays: number;
  etaMaxDays: number;
  leadTimeDays: number;
  // For split shipments
  splitDetails?: {
    readyShipment: { etaMinDays: number; etaMaxDays: number; shippingPriceEur: number };
    madeToOrderShipment: { leadTimeDays: number; etaMinDays: number; etaMaxDays: number; shippingPriceEur: number };
  };
  error?: string;
}

export interface CheckoutShippingState {
  shippingAddressId: string | null;
  billingAddressId: string | null;
  billingSameAsShipping: boolean;
  methodId: string | null;
  options: SelectedShippingOptions;
  shipmentPreference: ShipmentPreference;
}

// Country list for forms
export const COUNTRY_OPTIONS = [
  { code: 'FR', label_fr: 'France', label_en: 'France' },
  { code: 'BE', label_fr: 'Belgique', label_en: 'Belgium' },
  { code: 'CH', label_fr: 'Suisse', label_en: 'Switzerland' },
  { code: 'LU', label_fr: 'Luxembourg', label_en: 'Luxembourg' },
  { code: 'DE', label_fr: 'Allemagne', label_en: 'Germany' },
  { code: 'IT', label_fr: 'Italie', label_en: 'Italy' },
  { code: 'ES', label_fr: 'Espagne', label_en: 'Spain' },
  { code: 'PT', label_fr: 'Portugal', label_en: 'Portugal' },
  { code: 'NL', label_fr: 'Pays-Bas', label_en: 'Netherlands' },
  { code: 'GB', label_fr: 'Royaume-Uni', label_en: 'United Kingdom' },
  { code: 'US', label_fr: 'États-Unis', label_en: 'United States' },
  { code: 'CA', label_fr: 'Canada', label_en: 'Canada' },
  { code: 'AT', label_fr: 'Autriche', label_en: 'Austria' },
  { code: 'IE', label_fr: 'Irlande', label_en: 'Ireland' },
  { code: 'DK', label_fr: 'Danemark', label_en: 'Denmark' },
  { code: 'SE', label_fr: 'Suède', label_en: 'Sweden' },
  { code: 'NO', label_fr: 'Norvège', label_en: 'Norway' },
  { code: 'FI', label_fr: 'Finlande', label_en: 'Finland' },
  { code: 'PL', label_fr: 'Pologne', label_en: 'Poland' },
  { code: 'CZ', label_fr: 'République tchèque', label_en: 'Czech Republic' },
  { code: 'GR', label_fr: 'Grèce', label_en: 'Greece' },
  { code: 'JP', label_fr: 'Japon', label_en: 'Japan' },
  { code: 'AU', label_fr: 'Australie', label_en: 'Australia' },
] as const;
