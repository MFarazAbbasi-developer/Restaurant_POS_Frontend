/**
 * Desktop / browser thermal slip printing helpers.
 * Desktop: allowlisted Electron IPC (OS printers).
 * Browser/dev: temporary print window with monospace slip (fallback).
 */

export type PrintSlipResult = {
  mode: 'desktop' | 'browser';
  success: boolean;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isDesktopPrintingAvailable(): boolean {
  return Boolean(window.electronAPI?.isDesktop && window.electronAPI.printText);
}

/**
 * Print ASCII slip text. Prefer configured desktop printer; fall back to browser print.
 */
export async function printThermalSlip(options: {
  text: string;
  deviceName?: string | null;
  jobTitle?: string;
  /** When true on desktop and no deviceName, show OS print dialog instead of silent default */
  preferDialogWhenNoDevice?: boolean;
}): Promise<PrintSlipResult> {
  const text = options.text?.trim();
  if (!text) {
    throw new Error('Nothing to print — slip text is empty.');
  }

  const api = window.electronAPI;
  if (api?.isDesktop && typeof api.printText === 'function') {
    try {
      const deviceName = options.deviceName?.trim() || '';
      // Configured device → silent. Otherwise show OS dialog unless caller opts out.
      const silent = deviceName
        ? true
        : options.preferDialogWhenNoDevice === false;

      await api.printText({
        text: options.text,
        deviceName: deviceName || undefined,
        jobTitle: options.jobTitle || 'FARMAX POS Slip',
        silent,
      });

      return {
        mode: 'desktop',
        success: true,
        message: deviceName
          ? `Sent to printer “${deviceName}”.`
          : silent
            ? 'Sent to the default printer.'
            : 'Print dialog opened — select a printer to continue.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Desktop print failed.';
      // Fall through to browser print so development/desktop misconfig still works.
      try {
        printViaBrowserWindow(options.text, options.jobTitle);
        return {
          mode: 'browser',
          success: true,
          message: `Desktop print failed (${message}). Opened browser print fallback.`,
        };
      } catch {
        throw new Error(message);
      }
    }
  }

  printViaBrowserWindow(options.text, options.jobTitle);
  return {
    mode: 'browser',
    success: true,
    message: 'Opened browser print dialog (desktop printer bridge unavailable).',
  };
}

export async function listDesktopPrinters() {
  const api = window.electronAPI;
  if (!api?.isDesktop || typeof api.listPrinters !== 'function') {
    return [];
  }
  return api.listPrinters();
}

function printViaBrowserWindow(text: string, jobTitle = 'FARMAX POS Slip') {
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=420,height=640');
  if (!popup) {
    // Popup blocked — last resort: copy guidance via throwing so UI can show message
    throw new Error(
      'Could not open print window. Allow pop-ups for this site, or use Copy Text and print manually.'
    );
  }

  const safeTitle = escapeHtml(jobTitle);
  const safeBody = escapeHtml(text);
  popup.document.open();
  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page { margin: 4mm; }
    body { margin: 0; background: #fff; color: #000; }
    pre {
      margin: 8px;
      font-family: Consolas, "Courier New", monospace;
      font-size: 12px;
      line-height: 1.25;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <pre>${safeBody}</pre>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`);
  popup.document.close();
}
