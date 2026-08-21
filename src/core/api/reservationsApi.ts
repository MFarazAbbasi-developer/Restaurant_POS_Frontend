import { apiClient } from './client';
import {
  ApiResponse,
  ReservationRecord,
  PaginatedReservationsData,
  ReservationAvailabilityData,
  CreateReservationInput,
  UpdateReservationInput,
  UpdateReservationStatusInput,
  AssignReservationTableInput,
  CheckReservationAvailabilityQueryParams,
  ListReservationsQueryParams,
} from '@/types';

export class ReservationsApi {
  /**
   * GET /api/v1/reservations
   * List reservations with pagination, date filters, status, and search
   */
  public static async listReservations(
    params?: ListReservationsQueryParams
  ): Promise<PaginatedReservationsData> {
    const response = await apiClient.get<ApiResponse<PaginatedReservationsData>>(
      '/reservations',
      { params }
    );
    return response.data;
  }

  /**
   * GET /api/v1/reservations/availability
   * Check floor table availability for date, time, duration & guest count
   */
  public static async checkAvailability(
    params: CheckReservationAvailabilityQueryParams
  ): Promise<ReservationAvailabilityData> {
    const response = await apiClient.get<ApiResponse<ReservationAvailabilityData>>(
      '/reservations/availability',
      { params }
    );
    return response.data;
  }

  /**
   * GET /api/v1/reservations/:id
   * Get single reservation details
   */
  public static async getReservationById(id: string): Promise<ReservationRecord> {
    const response = await apiClient.get<ApiResponse<ReservationRecord>>(
      `/reservations/${id}`
    );
    return response.data;
  }

  /**
   * POST /api/v1/reservations
   * Create a new reservation
   */
  public static async createReservation(
    payload: CreateReservationInput
  ): Promise<ReservationRecord> {
    const response = await apiClient.post<
      ApiResponse<ReservationRecord>,
      CreateReservationInput
    >('/reservations', payload);
    return response.data;
  }

  /**
   * PUT /api/v1/reservations/:id
   * Update reservation details (timing, guests, requests)
   */
  public static async updateReservation(
    id: string,
    payload: UpdateReservationInput
  ): Promise<ReservationRecord> {
    const response = await apiClient.put<
      ApiResponse<ReservationRecord>,
      UpdateReservationInput
    >(`/reservations/${id}`, payload);
    return response.data;
  }

  /**
   * PUT /api/v1/reservations/:id/assign-table
   * Assign or move reservation to a floor table
   */
  public static async assignTable(
    id: string,
    payload: AssignReservationTableInput
  ): Promise<ReservationRecord> {
    const response = await apiClient.put<
      ApiResponse<ReservationRecord>,
      AssignReservationTableInput
    >(`/reservations/${id}/assign-table`, payload);
    return response.data;
  }

  /**
   * PATCH /api/v1/reservations/:id/status
   * Transition status (CONFIRMED, SEATED, COMPLETED, CANCELLED, NO_SHOW)
   */
  public static async updateStatus(
    id: string,
    payload: UpdateReservationStatusInput
  ): Promise<ReservationRecord> {
    const response = await apiClient.patch<
      ApiResponse<ReservationRecord>,
      UpdateReservationStatusInput
    >(`/reservations/${id}/status`, payload);
    return response.data;
  }
}
