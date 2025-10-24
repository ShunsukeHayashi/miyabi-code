import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '../api/client';

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await agentsApi.list();
      return response.data;
    },
  });
};
