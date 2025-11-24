import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '../api/client';

export const useIssues = () => {
  return useQuery({
    queryKey: ['issues'],
    queryFn: async () => {
      const response = await issuesApi.list();
      return response.data;
    },
  });
};
