import { useQuery } from '@tanstack/react-query';
import { worktreesApi } from '../api/client';

export const useWorktrees = () => {
  return useQuery({
    queryKey: ['worktrees'],
    queryFn: async () => {
      const response = await worktreesApi.list();
      return response.data;
    },
  });
};
