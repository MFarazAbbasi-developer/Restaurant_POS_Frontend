import React, { useState } from 'react';
import {
  useExpensesQuery,
  useExpenseCategoriesQuery,
  useExpensesSummaryQuery,
  useDeleteExpenseCategoryMutation,
} from '@/features/expenses/hooks/useExpensesData';
import { useSuppliersQuery } from '@/features/purchasing/hooks/usePurchasingData';
import { useAuthStore } from '@/core/auth/authStore';
import {
  ExpenseRecord,
  ExpenseCategoryRecord,
  ExpensePaymentMethod,
  ExpenseStatus,
} from '@/types';
import { ExpenseFormModal } from '@/features/expenses/components/ExpenseFormModal';
import { ExpenseCategoryModal } from '@/features/expenses/components/ExpenseCategoryModal';
import { VoidExpenseModal } from '@/features/expenses/components/VoidExpenseModal';
import { ExpenseDetailsDrawer } from '@/features/expenses/components/ExpenseDetailsDrawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Receipt,
  Tag,
  RotateCw,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Building2,
  TrendingUp,
  Edit2,
  Trash2,
  Ban,
  Link2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type ActiveTab = 'expenses' | 'categories' | 'analytics';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuthStore();
  const currency =
    user && 'restaurant' in user && user.restaurant?.currency
      ? user.restaurant.currency
      : 'USD';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');

  // Filters for Expenses
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    ExpensePaymentMethod | 'ALL'
  >('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawer State
  const [expenseModal, setExpenseModal] = useState<{
    open: boolean;
    expense?: ExpenseRecord | null;
  }>({ open: false });

  const [categoryModal, setCategoryModal] = useState<{
    open: boolean;
    category?: ExpenseCategoryRecord | null;
  }>({ open: false });

  const [voidModalExpense, setVoidModalExpense] = useState<ExpenseRecord | null>(null);

  const [selectedExpenseForDrawer, setSelectedExpenseForDrawer] =
    useState<ExpenseRecord | null>(null);

  // Queries
  const {
    data: expensesData,
    isLoading: isExpensesLoading,
    isRefetching: isExpensesRefetching,
    refetch: refetchExpenses,
  } = useExpensesQuery({
    categoryId: selectedCategory || undefined,
    paymentMethod: selectedPaymentMethod !== 'ALL' ? selectedPaymentMethod : undefined,
    status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
    limit: 100,
  });

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useExpenseCategoriesQuery({ limit: 100 });

  const { data: suppliersData } = useSuppliersQuery({ limit: 100 });

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useExpensesSummaryQuery();

  const deleteCategoryMutation = useDeleteExpenseCategoryMutation();

  const expenses = expensesData?.items || [];
  const categories = categoriesData?.items || [];
  const suppliers = suppliersData?.items || [];
  const totalActiveAmount = expensesData?.summary?.totalActiveExpensesAmount || 0;

  const handleRefreshAll = () => {
    refetchExpenses();
    refetchCategories();
    refetchSummary();
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleDeleteCategory = async (cat: ExpenseCategoryRecord) => {
    if (
      !window.confirm(`Are you sure you want to delete expense category "${cat.name}"?`)
    ) {
      return;
    }
    try {
      await deleteCategoryMutation.mutateAsync(cat.id);
    } catch {
      // handled
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      {/* =========================================================================
          TOP HEADER BAR: Metrics & Quick Action CTAs
      ========================================================================= */}
      <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface rounded-t-lg flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
            <Receipt size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-pos-text">
                Expenses & Petty Cash Management
              </h2>
              <Badge variant="default" size="sm" className="text-[10px] font-mono">
                {expenses.length} Records
              </Badge>
            </div>
            <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
              Operational expenses, petty cash disbursements, category management, and
              void audit trails
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isExpensesRefetching}
            className="min-h-[36px] px-3 font-medium flex items-center gap-1.5"
          >
            <RotateCw size={14} className={isExpensesRefetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {activeTab === 'categories' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCategoryModal({ open: true, category: null })}
              className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} />
              <span>+ New Category</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setExpenseModal({ open: true, expense: null })}
              className="min-h-[36px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={16} />
              <span>+ Record Expense</span>
            </Button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUMMARY METRICS TILES
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 border-b border-pos-border bg-pos-surface-subtle shrink-0">
        <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted block">
            Total Recorded
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-pos-text mt-0.5 block">
            {summaryData?.totalExpensesCount || expenses.length}
          </span>
        </div>

        <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-danger block">
            Active Expenditure
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-pos-danger mt-0.5 block">
            {formatPrice(totalActiveAmount || summaryData?.totalExpensesAmount || 0)}
          </span>
        </div>

        <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-primary block">
            Shift Payouts
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-pos-primary mt-0.5 block">
            {expenses.filter(e => e.paymentMethod === 'CASH' && e.shift).length} Shift
            Payouts
          </span>
        </div>

        <div className="p-2.5 rounded-md bg-pos-surface border border-pos-border">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-secondary block">
            Categories
          </span>
          <span className="text-sm sm:text-base font-mono font-bold text-pos-text mt-0.5 block">
            {categories.filter(c => c.isActive).length} Active Categories
          </span>
        </div>
      </div>

      {/* =========================================================================
          TAB NAVIGATION & FILTERS TOOLBAR
      ========================================================================= */}
      <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Navigation Tabs */}
        <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
              activeTab === 'expenses'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'text-pos-text-secondary hover:text-pos-text'
            )}
          >
            <Receipt size={13} />
            <span>Expense Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
              activeTab === 'categories'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'text-pos-text-secondary hover:text-pos-text'
            )}
          >
            <Tag size={13} />
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5',
              activeTab === 'analytics'
                ? 'bg-pos-primary text-white shadow-xs'
                : 'text-pos-text-secondary hover:text-pos-text'
            )}
          >
            <TrendingUp size={13} />
            <span>Analytics</span>
          </button>
        </div>

        {/* Tab Specific Filters */}
        {activeTab === 'expenses' && (
          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary max-w-[140px]"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={selectedPaymentMethod}
              onChange={e =>
                setSelectedPaymentMethod(e.target.value as ExpensePaymentMethod | 'ALL')
              }
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash Drawer</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank</option>
              <option value="DIGITAL_WALLET">Wallet</option>
              <option value="OTHER">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as ExpenseStatus | 'ALL')}
              className="px-2.5 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text font-medium focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
            >
              <option value="ALL">All Status</option>
              <option value="RECORDED">Recorded</option>
              <option value="VOIDED">Voided</option>
            </select>

            {/* Search Bar */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search description, ref..."
                className="pl-8 pr-3 py-1.5 rounded-md bg-pos-surface border border-pos-border text-xs text-pos-text placeholder-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary w-40 sm:w-48 font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CONTENT AREA PER TAB
      ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg border-x border-b border-pos-border rounded-b-lg">
        {/* TAB 1: EXPENSE LOGS */}
        {activeTab === 'expenses' && (
          <div>
            {isExpensesLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                <Spinner size="lg" />
                <span>Loading Expenses...</span>
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                <Receipt size={40} className="text-pos-text-muted/40" />
                <p className="font-bold text-base text-pos-text">No Expenses Found</p>
                <p className="text-xs max-w-sm text-pos-text-secondary">
                  {searchQuery || selectedCategory || selectedStatus !== 'ALL'
                    ? 'No expense records match your active category, status, or search query.'
                    : 'No operational expenses recorded yet. Click below to record your first expense.'}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setExpenseModal({ open: true, expense: null })}
                  className="font-bold mt-2"
                >
                  + Record Expense
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {expenses.map(exp => {
                  const isVoided = exp.status === 'VOIDED';

                  return (
                    <div
                      key={exp.id}
                      className={cn(
                        'p-3.5 rounded-lg bg-pos-surface border shadow-xs transition-colors flex flex-col justify-between',
                        isVoided
                          ? 'border-[#FECACA] bg-pos-danger-soft/20 opacity-70'
                          : 'border-pos-border hover:border-pos-border-strong'
                      )}
                    >
                      <div>
                        {/* Top Row: Code, Status & Amount */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-pos-text">
                              #{exp.expenseNumber}
                            </span>
                            <Badge
                              size="sm"
                              variant={isVoided ? 'danger' : 'success'}
                              className="text-[9px]"
                            >
                              {isVoided ? 'Voided' : 'Recorded'}
                            </Badge>
                          </div>

                          <span
                            className={cn(
                              'font-mono font-bold text-sm',
                              isVoided
                                ? 'line-through text-pos-text-muted'
                                : 'text-pos-danger'
                            )}
                          >
                            {formatPrice(exp.amount)}
                          </span>
                        </div>

                        {/* Description & Category */}
                        <div className="mb-2.5">
                          <h4 className="font-bold text-pos-text text-xs line-clamp-1">
                            {exp.description}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-pos-text-muted mt-1">
                            <Badge variant="default" size="sm" className="text-[10px]">
                              {exp.category.name}
                            </Badge>
                            <span className="font-mono text-[11px] flex items-center gap-1">
                              <Calendar size={11} />{' '}
                              {new Date(exp.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Payment & Shift Info */}
                        <div className="p-2.5 rounded-md bg-pos-surface-subtle border border-pos-border text-xs space-y-1 mb-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-pos-text-muted flex items-center gap-1">
                              <CreditCard size={11} /> {exp.paymentMethod}
                            </span>
                            {exp.reference && (
                              <span className="font-mono text-pos-primary font-semibold">
                                Ref: {exp.reference}
                              </span>
                            )}
                          </div>

                          {exp.shift && (
                            <div className="flex items-center gap-1 text-[10px] text-pos-primary font-semibold pt-1 border-t border-pos-border">
                              <Link2 size={11} />
                              <span>Shift Payout: {exp.shift.registerName}</span>
                            </div>
                          )}

                          {exp.supplier && (
                            <div className="flex items-center gap-1 text-[10px] text-pos-text-muted pt-1 border-t border-pos-border">
                              <Building2 size={11} />
                              <span>Vendor: {exp.supplier.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2.5 border-t border-pos-border flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {!isVoided && (
                            <button
                              type="button"
                              onClick={() => setVoidModalExpense(exp)}
                              className="px-2 py-1 rounded-md bg-pos-surface border border-pos-border text-pos-danger hover:bg-pos-danger-soft font-semibold text-[11px] transition-colors flex items-center gap-1"
                            >
                              <Ban size={11} />
                              <span>Void</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!isVoided && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpenseModal({ open: true, expense: exp })
                              }
                              className="p-1 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                              title="Edit expense"
                              aria-label="Edit expense"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedExpenseForDrawer(exp)}
                            className="text-xs font-semibold flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ChevronRight size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPENSE CATEGORIES */}
        {activeTab === 'categories' && (
          <div>
            {isCategoriesLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                <Spinner size="lg" />
                <span>Loading Categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-24 text-center text-xs text-pos-text-muted flex flex-col items-center gap-3">
                <Tag size={40} className="text-pos-text-muted/40" />
                <p className="font-bold text-base text-pos-text">No Categories Defined</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCategoryModal({ open: true, category: null })}
                  className="font-bold mt-2"
                >
                  + Create First Category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-lg bg-pos-surface border border-pos-border shadow-xs hover:border-pos-border-strong transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-pos-text text-sm">
                              {cat.name}
                            </h4>
                            <Badge
                              size="sm"
                              variant={cat.isActive ? 'success' : 'default'}
                              className="text-[9px]"
                            >
                              {cat.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {cat.description && (
                            <p className="text-xs text-pos-text-secondary font-medium mt-1">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryModal({ open: true, category: cat })
                            }
                            className="p-1 rounded-md text-pos-text-muted hover:text-pos-text hover:bg-pos-surface-subtle transition-colors"
                            aria-label="Edit category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1 rounded-md text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-soft transition-colors"
                            aria-label="Delete category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-pos-border flex items-center justify-between text-[11px] text-pos-text-muted">
                      <span>{cat._count?.expenses || 0} Recorded Expenses</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSE ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {isSummaryLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted text-xs">
                <Spinner size="lg" />
                <span>Loading Expense Analytics...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Spend Breakdown */}
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border space-y-3 shadow-xs">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <Tag size={14} className="text-pos-primary" />
                    <span>Expenditure by Category</span>
                  </h4>

                  {summaryData?.byCategory && summaryData.byCategory.length > 0 ? (
                    <div className="space-y-2.5">
                      {summaryData.byCategory.map(cat => {
                        const percent =
                          summaryData.totalExpensesAmount > 0
                            ? Math.round(
                                (cat.totalAmount / summaryData.totalExpensesAmount) * 100
                              )
                            : 0;

                        return (
                          <div key={cat.categoryId} className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-pos-text">
                                {cat.name} ({cat.count} records)
                              </span>
                              <span className="font-mono font-bold text-pos-danger">
                                {formatPrice(cat.totalAmount)} ({percent}%)
                              </span>
                            </div>

                            <div className="h-1.5 w-full bg-pos-surface-subtle rounded-full overflow-hidden border border-pos-border">
                              <div
                                className="h-full bg-pos-primary transition-all rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-pos-text-muted">
                      No expense data available for analytics.
                    </div>
                  )}
                </div>

                {/* Payment Method Breakdown */}
                <div className="p-4 rounded-lg bg-pos-surface border border-pos-border space-y-3 shadow-xs">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-pos-text-secondary flex items-center gap-1.5">
                    <CreditCard size={14} className="text-pos-primary" />
                    <span>Expenditure by Payment Method</span>
                  </h4>

                  {summaryData?.byPaymentMethod &&
                  summaryData.byPaymentMethod.length > 0 ? (
                    <div className="space-y-2">
                      {summaryData.byPaymentMethod.map(pm => (
                        <div
                          key={pm.paymentMethod}
                          className="p-3 rounded-lg bg-pos-surface-subtle border border-pos-border text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-pos-text block">
                              {pm.paymentMethod}
                            </span>
                            <span className="text-[10px] text-pos-text-muted font-mono">
                              {pm.count} Transactions
                            </span>
                          </div>

                          <span className="font-mono font-bold text-pos-danger">
                            {formatPrice(pm.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-pos-text-muted">
                      No payment method data available yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS & DRAWERS
      ========================================================================= */}
      {expenseModal.open && (
        <ExpenseFormModal
          expense={expenseModal.expense}
          categories={categories}
          suppliers={suppliers}
          currency={currency}
          onClose={() => setExpenseModal({ open: false, expense: null })}
          onSuccess={() => refetchExpenses()}
        />
      )}

      {categoryModal.open && (
        <ExpenseCategoryModal
          category={categoryModal.category}
          onClose={() => setCategoryModal({ open: false, category: null })}
          onSuccess={() => refetchCategories()}
        />
      )}

      {voidModalExpense && (
        <VoidExpenseModal
          expense={voidModalExpense}
          currency={currency}
          onClose={() => setVoidModalExpense(null)}
          onSuccess={() => refetchExpenses()}
        />
      )}

      {selectedExpenseForDrawer && (
        <ExpenseDetailsDrawer
          expense={selectedExpenseForDrawer}
          currency={currency}
          onClose={() => setSelectedExpenseForDrawer(null)}
          onEdit={exp => {
            setSelectedExpenseForDrawer(null);
            setExpenseModal({ open: true, expense: exp });
          }}
          onVoid={exp => {
            setSelectedExpenseForDrawer(null);
            setVoidModalExpense(exp);
          }}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
