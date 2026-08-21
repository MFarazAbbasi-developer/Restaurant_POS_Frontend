import { apiClient } from './client';
import { ApiResponse, ReceiptPreviewData } from '@/types';

export class ReceiptsApi {
  /**
   * GET /api/v1/receipts/preview
   * Get preview customer receipt formatted DTO
   */
  public static async getPreviewReceipt(
    paperWidth: '80mm' | '58mm' = '80mm'
  ): Promise<ReceiptPreviewData> {
    const response = await apiClient.get<ApiResponse<ReceiptPreviewData>>(
      '/receipts/preview',
      { params: { paperWidth } }
    );
    return response.data;
  }
}
