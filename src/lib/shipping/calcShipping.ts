import type {
  ShippingCalcInput,
  ShippingCalcResult,
  ShippingZone,
  ShippingZoneCountry,
  ShippingSizeClass,
  ShippingMethod,
  ShippingRateRule,
  ShippingFreeThreshold,
  ShippingOptionPrice,
  ShippingOption,
} from '@/types/shipping';

interface ShippingDataContext {
  zones: ShippingZone[];
  zoneCountries: ShippingZoneCountry[];
  sizeClasses: ShippingSizeClass[];
  methods: ShippingMethod[];
  rateRules: ShippingRateRule[];
  freeThresholds: ShippingFreeThreshold[];
  optionPrices: ShippingOptionPrice[];
  options: ShippingOption[];
}

const DEFAULT_WEIGHT_POINTS = 2; // MEDIUM fallback

function findZone(countryCode: string, ctx: ShippingDataContext): ShippingZone | null {
  const mapping = ctx.zoneCountries.find(zc => zc.country_code === countryCode);
  if (!mapping) return null;
  return ctx.zones.find(z => z.id === mapping.zone_id && z.is_active) ?? null;
}

function calcWeightPoints(items: ShippingCalcInput['cartItems'], sizeClasses: ShippingSizeClass[]): number {
  const classMap = new Map(sizeClasses.map(sc => [sc.code, sc.weight_points]));
  return items.reduce((sum, item) => {
    const wp = item.sizeClassCode ? (classMap.get(item.sizeClassCode) ?? DEFAULT_WEIGHT_POINTS) : DEFAULT_WEIGHT_POINTS;
    return sum + item.quantity * wp;
  }, 0);
}

function findBestRule(
  zoneId: string,
  methodId: string,
  subtotalEurCents: number,
  weightPoints: number,
  rules: ShippingRateRule[]
): ShippingRateRule | null {
  const subtotalEur = subtotalEurCents / 100;
  const matching = rules.filter(r =>
    r.zone_id === zoneId &&
    r.method_id === methodId &&
    r.is_active &&
    subtotalEur >= r.min_subtotal_eur &&
    (r.max_subtotal_eur == null || subtotalEur <= r.max_subtotal_eur) &&
    weightPoints >= r.min_weight_points &&
    (r.max_weight_points == null || weightPoints <= r.max_weight_points)
  );
  if (matching.length === 0) return null;
  // lowest priority number = highest priority
  matching.sort((a, b) => a.priority - b.priority);
  return matching[0];
}

function checkFreeShipping(
  zoneId: string,
  methodId: string,
  subtotalEurCents: number,
  thresholds: ShippingFreeThreshold[]
): boolean {
  const subtotalEur = subtotalEurCents / 100;
  return thresholds.some(ft =>
    ft.is_active &&
    ft.zone_id === zoneId &&
    (ft.method_id == null || ft.method_id === methodId) &&
    subtotalEur >= ft.threshold_eur
  );
}

function calcOptionsPriceEurCents(
  selectedOptions: ShippingCalcInput['selectedOptions'],
  method: ShippingMethod,
  zoneId: string,
  ctx: ShippingDataContext
): number {
  let total = 0;
  const entries: [string, boolean][] = [
    ['insurance', selectedOptions.insurance],
    ['signature', selectedOptions.signature],
    ['gift_wrap', selectedOptions.gift_wrap],
  ];
  for (const [code, selected] of entries) {
    if (!selected) continue;
    // Check method supports it
    if (code === 'insurance' && !method.supports_insurance) continue;
    if (code === 'signature' && !method.supports_signature) continue;
    if (code === 'gift_wrap' && !method.supports_gift_wrap) continue;

    const option = ctx.options.find(o => o.code === code);
    if (!option) continue;

    // Find best matching price (zone+method > zone > global)
    const prices = ctx.optionPrices.filter(p => p.option_id === option.id && p.is_active);
    const specific = prices.find(p => p.zone_id === zoneId && p.method_id === method.id)
      ?? prices.find(p => p.zone_id === zoneId && p.method_id == null)
      ?? prices.find(p => p.zone_id == null && p.method_id == null);
    if (specific) {
      total += Math.round(specific.price_eur * 100);
    }
  }
  return total;
}

export function calculateShipping(
  input: ShippingCalcInput,
  ctx: ShippingDataContext
): ShippingCalcResult {
  // 1) Find zone
  const zone = findZone(input.countryCode, ctx);
  if (!zone) {
    return {
      shippingPriceEur: 0, zone: null, method: null, isFreeShipping: false,
      optionsPriceEur: 0, customsNotice: false, etaMinDays: 0, etaMaxDays: 0, leadTimeDays: 0,
      error: 'NO_ZONE',
    };
  }

  // 2) Find method
  const method = ctx.methods.find(m => m.id === input.methodId && m.is_active);
  if (!method) {
    return {
      shippingPriceEur: 0, zone, method: null, isFreeShipping: false,
      optionsPriceEur: 0, customsNotice: zone.customs_notice, etaMinDays: 0, etaMaxDays: 0, leadTimeDays: 0,
      error: 'NO_METHOD',
    };
  }

  // 3) Subtotal EUR cents
  const subtotalEurCents = input.cartItems.reduce((s, i) => s + i.priceEurCents * i.quantity, 0);

  // 4) Weight points
  const weightPoints = calcWeightPoints(input.cartItems, ctx.sizeClasses);

  // 5) Lead time
  const allLeadTimes = input.cartItems.map(i => (i.madeToOrder && i.leadTimeDays) ? i.leadTimeDays : 0);
  const maxLeadTime = Math.max(0, ...allLeadTimes);

  const etaMin = method.eta_min_days ?? 0;
  const etaMax = method.eta_max_days ?? 0;

  // 6) Free shipping check
  const isFree = checkFreeShipping(zone.id, method.id, subtotalEurCents, ctx.freeThresholds);

  // 7) Find rate rule
  let basePriceEurCents = 0;
  if (!isFree) {
    if (input.shipmentPreference === 'split') {
      // Split: calculate for ready items + made-to-order items separately
      const readyItems = input.cartItems.filter(i => !i.madeToOrder || !i.leadTimeDays);
      const mtoItems = input.cartItems.filter(i => i.madeToOrder && i.leadTimeDays);

      const calcForGroup = (items: typeof input.cartItems) => {
        if (items.length === 0) return 0;
        const subCents = items.reduce((s, i) => s + i.priceEurCents * i.quantity, 0);
        const wp = calcWeightPoints(items, ctx.sizeClasses);
        const isFreeGroup = checkFreeShipping(zone.id, method.id, subCents, ctx.freeThresholds);
        if (isFreeGroup) return 0;
        const rule = findBestRule(zone.id, method.id, subCents, wp, ctx.rateRules);
        return rule ? Math.round(rule.price_eur * 100) : 0;
      };

      const readyPrice = calcForGroup(readyItems);
      const mtoPrice = calcForGroup(mtoItems);
      const mtoLeadTime = Math.max(0, ...mtoItems.map(i => i.leadTimeDays ?? 0));

      const optionsPrice = calcOptionsPriceEurCents(input.selectedOptions, method, zone.id, ctx);

      return {
        shippingPriceEur: readyPrice + mtoPrice + optionsPrice,
        zone,
        method,
        isFreeShipping: false,
        optionsPriceEur: optionsPrice,
        customsNotice: zone.customs_notice,
        etaMinDays: etaMin,
        etaMaxDays: etaMax,
        leadTimeDays: maxLeadTime,
        splitDetails: {
          readyShipment: { etaMinDays: etaMin, etaMaxDays: etaMax, shippingPriceEur: readyPrice },
          madeToOrderShipment: { leadTimeDays: mtoLeadTime, etaMinDays: etaMin, etaMaxDays: etaMax, shippingPriceEur: mtoPrice },
        },
      };
    }

    const rule = findBestRule(zone.id, method.id, subtotalEurCents, weightPoints, ctx.rateRules);
    if (!rule) {
      return {
        shippingPriceEur: 0, zone, method, isFreeShipping: false,
        optionsPriceEur: 0, customsNotice: zone.customs_notice, etaMinDays: etaMin, etaMaxDays: etaMax, leadTimeDays: maxLeadTime,
        error: 'NO_RATE_RULE',
      };
    }
    basePriceEurCents = Math.round(rule.price_eur * 100);
  }

  // 8) Options pricing
  const optionsPriceEurCents = calcOptionsPriceEurCents(input.selectedOptions, method, zone.id, ctx);

  return {
    shippingPriceEur: basePriceEurCents + optionsPriceEurCents,
    zone,
    method,
    isFreeShipping: isFree,
    optionsPriceEur: optionsPriceEurCents,
    customsNotice: zone.customs_notice,
    etaMinDays: etaMin,
    etaMaxDays: etaMax,
    leadTimeDays: maxLeadTime,
  };
}
