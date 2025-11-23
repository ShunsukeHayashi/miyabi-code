import { useQuery } from '@tanstack/react-query';
import { prsApi } from '../api/client';

export const usePRs = () => {
  return useQuery({
    queryKey: ['prs'],
    queryFn: async () => {
      const response = await prsApi.list();
      return response.data;
    },
  });
};
