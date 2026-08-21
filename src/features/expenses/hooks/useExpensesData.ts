import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExpensesApi } from '@/core/api/expensesApi';
import {
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
  CreateExpenseInput,
  UpdateExpenseInput,
  VoidExpenseInput,
  ListExpenseCategoriesQueryParams,
  ListExpensesQueryParams,
  ExpensesSummaryQueryParams,
} from '@/types';

export const EXPENSES_QUERY_KEYS = {
  CATEGORIES: (params?: ListExpenseCategoriesQueryParams) =>
    ['expenses', 'categories', params] as const,
  CATEGORY_DETAIL: (id: string) => ['expenses', 'categories', 'detail', id] as const,
  LIST: (params?: ListExpensesQueryParams) => ['expenses', 'list', params] as const,
  DETAIL: (id: string) => ['expenses', 'detail', id] as const,
  SUMMARY: (params?: ExpensesSummaryQueryParams) =>
    ['expenses', 'summary', params] as const,
};

// -----------------------------------------------------------------------------
// Category Hooks
// -----------------------------------------------------------------------------

export const useExpenseCategoriesQuery = (params?: ListExpenseCategoriesQueryParams) => {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.CATEGORIES(params),
    queryFn: () => ExpensesApi.listCategories(params),
    staleTime: 1000 * 60,
  });
};

export const useExpenseCategoryQuery = (id: string | null) => {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.CATEGORY_DETAIL(id || ''),
    queryFn: () => ExpensesApi.getCategoryById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
};

export const useCreateExpenseCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpenseCategoryInput) =>
      ExpensesApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] });
    },
  });
};

export const useUpdateExpenseCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpenseCategoryInput }) =>
      ExpensesApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] });
    },
  });
};

export const useDeleteExpenseCategoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ExpensesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'categories'] });
    },
  });
};

// -----------------------------------------------------------------------------
// Expense Hooks
// -----------------------------------------------------------------------------

export const useExpensesQuery = (params?: ListExpensesQueryParams) => {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.LIST(params),
    queryFn: () => ExpensesApi.listExpenses(params),
    staleTime: 1000 * 15,
  });
};

export const useExpenseQuery = (id: string | null) => {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.DETAIL(id || ''),
    queryFn: () => ExpensesApi.getExpenseById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
};

export const useExpensesSummaryQuery = (params?: ExpensesSummaryQueryParams) => {
  return useQuery({
    queryKey: EXPENSES_QUERY_KEYS.SUMMARY(params),
    queryFn: () => ExpensesApi.getSummary(params),
    staleTime: 1000 * 60,
  });
};

export const useCreateExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpenseInput) => ExpensesApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useUpdateExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateExpenseInput }) =>
      ExpensesApi.updateExpense(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({
        queryKey: EXPENSES_QUERY_KEYS.DETAIL(variables.id),
      });
    },
  });
};

export const useVoidExpenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VoidExpenseInput }) =>
      ExpensesApi.voidExpense(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({
        queryKey: EXPENSES_QUERY_KEYS.DETAIL(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};
