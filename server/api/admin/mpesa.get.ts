// =============================================================================
// server/api/admin/mpesa.get.ts
// Proxies retrieval of store's M-Pesa credentials and verification status.
// =============================================================================

import { sokoClient } from '../../utils/sokoClient';

export interface MpesaCredentialsStatus {
  id?: string;
  org_id?: string;
  till_type: 'till' | 'paybill';
  shortcode: string;
  store_number: string | null;
  environment: 'sandbox' | 'production';
  status: 'pending' | 'verified' | 'failed';
  last_verified_at: string | null;
  last_error: string | null;
}

export default defineEventHandler(async () => {
  try {
    return await sokoClient<MpesaCredentialsStatus | null>('/mpesa-credentials');
  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || 'Failed to fetch M-Pesa credentials',
    });
  }
});