import { useQuery } from '@tanstack/react-query';
import { deploymentsApi } from '../api/client';

export const useDeployments = () => {
  return useQuery({
    queryKey: ['deployments'],
    queryFn: async () => {
      const response = await deploymentsApi.list();
      return response.data;
    },
  });
};
