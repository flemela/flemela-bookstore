// =============================================================================
// utils/phone.ts
// Centralized Kenyan phone normalization, carrier detection, and validation.
// =============================================================================

export type KenyanCarrier = 'safaricom' | 'airtel' | 'telkom' | null;

/**
 * Normalizes input to 10-digit local format: 07XXXXXXXX or 01XXXXXXXX.
 */
export function normalizeKenyanPhone(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) {
    return `0${digits.slice(3, 12)}`;
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `0${digits}`;
  }
  return digits.slice(0, 10);
}

/**
 * Validates that the number matches Kenyan mobile prefixes.
 */
export function isValidKenyanPhone(input: string): boolean {
  const normalized = normalizeKenyanPhone(input);
  return /^(07|01)\d{8}$/.test(normalized);
}

/**
 * Formats phone number for Safaricom Daraja API (254XXXXXXXXX).
 */
export function formatDarajaPhone(input: string): string {
  const normalized = normalizeKenyanPhone(input);
  if (normalized.startsWith('0') && normalized.length === 10) {
    return `254${normalized.slice(1)}`;
  }
  return normalized;
}

/**
 * Identifies carrier network based on Safaricom, Airtel, and Telkom prefixes.
 */
export function detectKenyanCarrier(input: string): KenyanCarrier {
  const digits = normalizeKenyanPhone(input);
  if (digits.length < 3) return null;

  const prefix3 = digits.slice(0, 3);
  const prefix4 = digits.slice(0, 4);

  // Safaricom (070, 071, 072, 079, 074x, 0110-0115)
  if (
    ['070', '071', '072', '079'].includes(prefix3) ||
    ['0740', '0741', '0742', '0743', '0745', '0746', '0748', '0757', '0758', '0759', '0768', '0769'].includes(prefix4) ||
    ['0110', '0111', '0112', '0113', '0114', '0115'].includes(prefix4)
  ) {
    return 'safaricom';
  }

  // Airtel (073, 078, 075x, 0100-0106)
  if (
    ['073', '078'].includes(prefix3) ||
    ['0750', '0751', '0752', '0753', '0754', '0755', '0756'].includes(prefix4) ||
    ['0100', '0101', '0102', '0103', '0104', '0105', '0106'].includes(prefix4)
  ) {
    return 'airtel';
  }

  // Telkom (077)
  if (prefix3 === '077') {
    return 'telkom';
  }

  return null;
}