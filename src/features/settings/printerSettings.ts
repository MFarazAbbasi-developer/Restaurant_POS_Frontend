/**
 * Printer preferences stored in Restaurant.settings JSON (no schema migration).
 */
export type PrinterSettings = {
  receiptPrinterName?: string;
  kitchenPrinterName?: string;
  paperWidth?: '80mm' | '58mm';
};

const PRINTERS_KEY = 'printers';

export function readPrinterSettings(
  settings: Record<string, unknown> | null | undefined
): PrinterSettings {
  if (!settings || typeof settings !== 'object') return {};
  const raw = settings[PRINTERS_KEY];
  if (!raw || typeof raw !== 'object') return {};
  const printers = raw as Record<string, unknown>;
  const paperWidth =
    printers.paperWidth === '58mm' || printers.paperWidth === '80mm'
      ? printers.paperWidth
      : undefined;

  return {
    receiptPrinterName:
      typeof printers.receiptPrinterName === 'string'
        ? printers.receiptPrinterName
        : undefined,
    kitchenPrinterName:
      typeof printers.kitchenPrinterName === 'string'
        ? printers.kitchenPrinterName
        : undefined,
    paperWidth,
  };
}

export function mergePrinterSettings(
  existing: Record<string, unknown> | null | undefined,
  printers: PrinterSettings
): Record<string, unknown> {
  const base = { ...(existing || {}) };
  const current = readPrinterSettings(base);
  base[PRINTERS_KEY] = {
    ...current,
    ...printers,
    receiptPrinterName: printers.receiptPrinterName?.trim() || undefined,
    kitchenPrinterName: printers.kitchenPrinterName?.trim() || undefined,
  };
  return base;
}
