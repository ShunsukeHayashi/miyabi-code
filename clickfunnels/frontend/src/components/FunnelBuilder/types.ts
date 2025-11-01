import { PageType, PageStatus } from '@/types';

export interface PageNodeData {
  id: string;
  name: string;
  title: string;
  pageType: PageType;
  status: PageStatus;
  conversions: number;
  visits: number;
  conversionRate: number;
}
