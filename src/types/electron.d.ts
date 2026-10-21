export interface DesktopPrinterInfo {
  name: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  status?: number;
}

export interface DesktopPrintTextPayload {
  text: string;
  deviceName?: string;
  copies?: number;
  jobTitle?: string;
  silent?: boolean;
}

export interface DesktopPrintTextResult {
  success: true;
  deviceName: string;
  mode: 'silent' | 'dialog' | string;
}

export interface ElectronAPI {
  isDesktop: true;
  platform: string;
  version: string;
  sendMessage: (channel: string, data?: unknown) => void;
  onMessage: (
    channel: string,
    callback: (...args: unknown[]) => void
  ) => (() => void) | undefined;
  listPrinters: () => Promise<DesktopPrinterInfo[]>;
  printText: (payload: DesktopPrintTextPayload) => Promise<DesktopPrintTextResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
