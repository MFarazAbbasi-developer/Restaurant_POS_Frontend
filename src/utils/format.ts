/**
 * Centralized formatting utilities localized for Pakistan (PKR / Rs, PKT time)
 */

export interface FormatPriceOptions {
  showCurrency?: boolean;
  currency?: string;
  decimals?: number;
}

/**
 * Format numerical amount into standard Pakistani Rupee representation.
 * Example: formatPrice(1250) => "Rs. 1,250" or "Rs. 1,250.00"
 */
export const formatPrice = (
  val: number | string | null | undefined,
  currency: string = 'PKR',
  decimals: number = 2
): string => {
  const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);
  if (isNaN(num)) return 'Rs. 0.00';

  const effectiveCurrency = (currency || 'PKR').toUpperCase();

  // For Pakistani Rupee, standard prefix is Rs.
  if (effectiveCurrency === 'PKR') {
    const formatted = new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
    return `Rs. ${formatted}`;
  }

  // Fallback for foreign multi-currency if configured
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: effectiveCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch {
    return `${effectiveCurrency} ${num.toFixed(decimals)}`;
  }
};

/**
 * Format date & time localized to Asia/Karachi (PKT, UTC+5).
 */
export const formatPKDateTime = (
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '—';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '—';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  return new Intl.DateTimeFormat('en-PK', defaultOptions).format(date);
};

/**
 * Format time only localized to Asia/Karachi.
 */
export const formatPKTime = (dateInput: string | Date | null | undefined): string => {
  return formatPKDateTime(dateInput, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date only localized to Asia/Karachi.
 */
export const formatPKDate = (dateInput: string | Date | null | undefined): string => {
  return formatPKDateTime(dateInput, {
    hour: undefined,
    minute: undefined,
  });
};

/**
 * Format Pakistani phone numbers into standard readable format (e.g. 0300 1234567 or +92 300 1234567)
 */
export const formatPakistaniPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+92') && cleaned.length === 13) {
    return `+92 ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  return phone;
};
