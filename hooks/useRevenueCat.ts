import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  checkProStatus,
  getCustomerInfo,
  addCustomerInfoUpdateListener,
} from '@/services/revenueCat';
import type { PurchasesOffering, CustomerInfo } from 'react-native-purchases';

/**
 * Hook to fetch available offerings
 */
export const useOfferings = () => {
  return useQuery({
    queryKey: ['offerings'],
    queryFn: getOfferings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to check Pro subscription status
 */
export const useProStatus = () => {
  return useQuery({
    queryKey: ['proStatus'],
    queryFn: checkProStatus,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook to get customer info
 */
export const useCustomerInfo = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initial fetch
    getCustomerInfo().then(setCustomerInfo);

    // Listen for updates
    addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['proStatus'] });
    });

    // Note: RevenueCat listener cleanup is handled automatically
  }, [queryClient]);

  return customerInfo;
};

/**
 * Hook to purchase a package
 */
export const usePurchasePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchasePackage,
    onSuccess: (customerInfo) => {
      // Invalidate pro status query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['proStatus'] });
    },
  });
};

/**
 * Hook to restore purchases
 */
export const useRestorePurchases = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restorePurchases,
    onSuccess: () => {
      // Invalidate pro status query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['proStatus'] });
    },
  });
};
