import { apiClient } from './client';
import {
  ApiResponse,
  CustomerRecord,
  CustomerLookupData,
  PaginatedCustomersData,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddCustomerAddressInput,
  CustomerAddressRecord,
  ListCustomersQueryParams,
  CustomerLoyaltyAccountData,
  EnrollCustomerLoyaltyInput,
  DeliveryZoneRecord,
} from '@/types';

export class CustomersApi {
  /**
   * GET /api/v1/customers
   * List customers with pagination and optional name/phone search
   */
  public static async listCustomers(
    params?: ListCustomersQueryParams
  ): Promise<PaginatedCustomersData> {
    const response = await apiClient.get<ApiResponse<PaginatedCustomersData>>(
      '/customers',
      { params }
    );
    return response.data;
  }

  /**
   * GET /api/v1/customers/lookup?phone=...
   * Look up customer by exact/partial phone number
   */
  public static async lookupByPhone(
    phone: string
  ): Promise<{ customer: CustomerLookupData | null }> {
    const response = await apiClient.get<
      ApiResponse<{ customer: CustomerLookupData | null }>
    >('/customers/lookup', {
      params: { phone },
    });
    return response.data;
  }

  /**
   * POST /api/v1/customers
   * Create new customer with optional initial address
   */
  public static async createCustomer(
    payload: CreateCustomerInput
  ): Promise<{ customer: CustomerRecord }> {
    const response = await apiClient.post<
      ApiResponse<{ customer: CustomerRecord }>,
      CreateCustomerInput
    >('/customers', payload);
    return response.data;
  }

  /**
   * PATCH /api/v1/customers/:id
   * Update customer profile
   */
  public static async updateCustomer(
    id: string,
    payload: UpdateCustomerInput
  ): Promise<{ customer: CustomerRecord }> {
    const response = await apiClient.patch<
      ApiResponse<{ customer: CustomerRecord }>,
      UpdateCustomerInput
    >(`/customers/${id}`, payload);
    return response.data;
  }

  /**
   * POST /api/v1/customers/:id/addresses
   * Add a new delivery address to an existing customer
   */
  public static async addAddress(
    customerId: string,
    payload: AddCustomerAddressInput
  ): Promise<{ address: CustomerAddressRecord }> {
    const response = await apiClient.post<
      ApiResponse<{ address: CustomerAddressRecord }>,
      AddCustomerAddressInput
    >(`/customers/${customerId}/addresses`, payload);
    return response.data;
  }

  /**
   * GET /api/v1/loyalty/customers/:customerId
   * Retrieve customer's loyalty account summary and point balance
   */
  public static async getLoyaltyAccount(
    customerId: string
  ): Promise<{ account: CustomerLoyaltyAccountData | null }> {
    const response = await apiClient.get<
      ApiResponse<{ account: CustomerLoyaltyAccountData | null }>
    >(`/loyalty/customers/${customerId}`);
    return response.data;
  }

  /**
   * POST /api/v1/loyalty/enroll
   * Enroll customer in restaurant loyalty program
   */
  public static async enrollLoyalty(
    payload: EnrollCustomerLoyaltyInput
  ): Promise<{ account: CustomerLoyaltyAccountData }> {
    const response = await apiClient.post<
      ApiResponse<{ account: CustomerLoyaltyAccountData }>,
      EnrollCustomerLoyaltyInput
    >('/loyalty/enroll', payload);
    return response.data;
  }

  /**
   * GET /api/v1/delivery/zones
   * Retrieve delivery zones for address assignment
   */
  public static async listZones(): Promise<DeliveryZoneRecord[]> {
    const response =
      await apiClient.get<ApiResponse<DeliveryZoneRecord[]>>('/delivery/zones');
    return response.data;
  }
}
