export type Affiliate = {
  id: string;
  name: string;
  code: string;
  whatsapp: string | null;
  email: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: Date | string | null;
  active_events_count?: number;
  total_sales?: number;
  total_commission?: number;
};

export type AffiliateLog = {
  id: string;
  created_at: Date | string | null;
  buyer_name: string;
  event_name: string;
  affiliate_code: string;
  total_amount: number;
};
