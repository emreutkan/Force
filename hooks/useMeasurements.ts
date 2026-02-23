import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMeasurements } from '@/api/Measurements';

// Body measurements query
export const useMeasurements = (page?: number, pageSize?: number) => {
  return useQuery({
    queryKey: ['measurements', page, pageSize],
    queryFn: () => getMeasurements(page, pageSize),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Utility to invalidate measurements
export const useInvalidateMeasurements = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['measurements'] });
};
