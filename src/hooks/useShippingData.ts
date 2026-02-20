import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  UserAddress, ShippingZone, ShippingZoneCountry, ShippingSizeClass,
  ShippingMethod, ShippingOption, ShippingRateRule, ShippingFreeThreshold,
  ShippingOptionPrice, TaxSettings,
} from '@/types/shipping';

export function useUserAddresses(userId: string | undefined) {
  return useQuery({
    queryKey: ['user_addresses', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as UserAddress[];
    },
  });
}

export function useShippingZones() {
  return useQuery({
    queryKey: ['shipping_zones'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as unknown as ShippingZone[];
    },
  });
}

export function useShippingZoneCountries() {
  return useQuery({
    queryKey: ['shipping_zone_countries'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_zone_countries')
        .select('*');
      if (error) throw error;
      return data as unknown as ShippingZoneCountry[];
    },
  });
}

export function useShippingSizeClasses() {
  return useQuery({
    queryKey: ['shipping_size_classes'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_size_classes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as unknown as ShippingSizeClass[];
    },
  });
}

export function useShippingMethods() {
  return useQuery({
    queryKey: ['shipping_methods'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as unknown as ShippingMethod[];
    },
  });
}

export function useShippingOptions() {
  return useQuery({
    queryKey: ['shipping_options'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_options')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as unknown as ShippingOption[];
    },
  });
}

export function useShippingRateRules() {
  return useQuery({
    queryKey: ['shipping_rate_rules'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_rate_rules')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as unknown as ShippingRateRule[];
    },
  });
}

export function useShippingFreeThresholds() {
  return useQuery({
    queryKey: ['shipping_free_thresholds'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_free_thresholds')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as unknown as ShippingFreeThreshold[];
    },
  });
}

export function useShippingOptionPrices() {
  return useQuery({
    queryKey: ['shipping_option_prices'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_option_prices')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as unknown as ShippingOptionPrice[];
    },
  });
}

export function useTaxSettings() {
  return useQuery({
    queryKey: ['tax_settings'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return data as unknown as TaxSettings;
    },
  });
}
