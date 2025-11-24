import { useQuery } from '@tanstack/react-query';
import { logsApi } from '../api/client';

export const useLogs = () => {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const response = await logsApi.list();
      return response.data;
    },
  });
};
