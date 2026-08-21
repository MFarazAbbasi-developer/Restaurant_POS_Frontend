import { apiClient } from './client';
import {
  ApiResponse,
  ExpenseCategoryRecord,
  PaginatedExpenseCategoriesData,
  ExpenseRecord,
  PaginatedExpensesData,
  ExpensesSummaryData,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  VoidExpenseInput,
  ListExpenseCategoriesQueryParams,
  ListExpensesQueryParams,
  ExpensesSummaryQueryParams,
} from '@/types';

export class ExpensesApi {
  // ===========================================================================
  // 1. Expense Categories
  // ===========================================================================

  public static async listCategories(
    params?: ListExpenseCategoriesQueryParams
  ): Promise<PaginatedExpenseCategoriesData> {
    const response = await apiClient.get<ApiResponse<PaginatedExpenseCategoriesData>>(
      '/expenses/categories',
      { params }
    );
    return response.data;
  }

  public static async createCategory(
    payload: CreateExpenseCategoryInput
  ): Promise<ExpenseCategoryRecord> {
    const response = await apiClient.post<
      ApiResponse<ExpenseCategoryRecord>,
      CreateExpenseCategoryInput
    >('/expenses/categories', payload);
    return response.data;
  }

  public static async getCategoryById(id: string): Promise<ExpenseCategoryRecord> {
    const response = await apiClient.get<ApiResponse<ExpenseCategoryRecord>>(
      `/expenses/categories/${id}`
    );
    return response.data;
  }

  public static async updateCategory(
    id: string,
    payload: UpdateExpenseCategoryInput
  ): Promise<ExpenseCategoryRecord> {
    const response = await apiClient.put<
      ApiResponse<ExpenseCategoryRecord>,
      UpdateExpenseCategoryInput
    >(`/expenses/categories/${id}`, payload);
    return response.data;
  }

  public static async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/expenses/categories/${id}`
    );
    return response.data;
  }

  // ===========================================================================
  // 2. Expenses Operations
  // ===========================================================================

  public static async listExpenses(
    params?: ListExpensesQueryParams
  ): Promise<PaginatedExpensesData> {
    const response = await apiClient.get<ApiResponse<PaginatedExpensesData>>(
      '/expenses',
      { params }
    );
    return response.data;
  }

  public static async createExpense(payload: CreateExpenseInput): Promise<ExpenseRecord> {
    const response = await apiClient.post<ApiResponse<ExpenseRecord>, CreateExpenseInput>(
      '/expenses',
      payload
    );
    return response.data;
  }

  public static async getExpenseById(id: string): Promise<ExpenseRecord> {
    const response = await apiClient.get<ApiResponse<ExpenseRecord>>(`/expenses/${id}`);
    return response.data;
  }

  public static async updateExpense(
    id: string,
    payload: UpdateExpenseInput
  ): Promise<ExpenseRecord> {
    const response = await apiClient.put<ApiResponse<ExpenseRecord>, UpdateExpenseInput>(
      `/expenses/${id}`,
      payload
    );
    return response.data;
  }

  public static async voidExpense(
    id: string,
    payload: VoidExpenseInput
  ): Promise<ExpenseRecord> {
    const response = await apiClient.post<ApiResponse<ExpenseRecord>, VoidExpenseInput>(
      `/expenses/${id}/void`,
      payload
    );
    return response.data;
  }

  // ===========================================================================
  // 3. Summary Analytics
  // ===========================================================================

  public static async getSummary(
    params?: ExpensesSummaryQueryParams
  ): Promise<ExpensesSummaryData> {
    const response = await apiClient.get<ApiResponse<ExpensesSummaryData>>(
      '/expenses/summary',
      { params }
    );
    return response.data;
  }
}
