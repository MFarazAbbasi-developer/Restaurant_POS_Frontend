import React, { useState, useEffect } from 'react';
import {
  useRestaurantConfigQuery,
  useUpdateRestaurantConfigMutation,
  useReceiptPreviewQuery,
} from '@/features/settings/hooks/useRestaurantSettingsData';
import { useKitchenStationsQuery } from '@/features/kitchen/hooks/useKitchenData';
import { usePosTablesQuery } from '@/features/orders/hooks/usePosData';
import { useDeliveryZonesQuery } from '@/features/delivery/hooks/useDeliveryData';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  Settings,
  Store,
  DollarSign,
  Receipt,
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { cn } from '@/utils/cn';

type SettingsTab = 'profile' | 'taxes' | 'channels' | 'receipts' | 'hardware';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'PKR', name: 'Pakistani Rupee (Rs)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
];

const TIMEZONES = [
  'UTC',
  'Asia/Karachi',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: restaurant, isLoading: isRestaurantLoading } = useRestaurantConfigQuery();

  const updateMutation = useUpdateRestaurantConfigMutation();
  const { data: receiptPreview, isLoading: isReceiptLoading } =
    useReceiptPreviewQuery(paperWidth);

  const { data: kitchenStations = [] } = useKitchenStationsQuery();
  const { data: floorData } = usePosTablesQuery();
  const floorZones = floorData?.zones || [];
  const { data: deliveryZones = [] } = useDeliveryZonesQuery();

  // Local form state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState('0');
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [dineInEnabled, setDineInEnabled] = useState(true);
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');

  // Sync state when data loads
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setLegalName(restaurant.legalName || '');
      setPhone(restaurant.phone || '');
      setAddress(restaurant.address || '');
      setLogo(restaurant.logo || '');
      setCurrency(restaurant.currency || 'USD');
      setTimezone(restaurant.timezone || 'UTC');
      setTaxNumber(restaurant.taxNumber || '');
      setTaxRate((restaurant.taxRate || 0).toString());
      setTaxInclusive(Boolean(restaurant.taxInclusive));
      setServiceChargeRate((restaurant.serviceChargeRate || 0).toString());
      setServiceChargeEnabled(Boolean(restaurant.serviceChargeEnabled));
      setDineInEnabled(restaurant.dineInEnabled !== false);
      setTakeawayEnabled(restaurant.takeawayEnabled !== false);
      setDeliveryEnabled(restaurant.deliveryEnabled !== false);
      setReceiptHeader(restaurant.receiptHeader || '');
      setReceiptFooter(restaurant.receiptFooter || '');
    }
  }, [restaurant]);

  const handleReset = () => {
    if (restaurant) {
      setName(restaurant.name || '');
      setLegalName(restaurant.legalName || '');
      setPhone(restaurant.phone || '');
      setAddress(restaurant.address || '');
      setLogo(restaurant.logo || '');
      setCurrency(restaurant.currency || 'USD');
      setTimezone(restaurant.timezone || 'UTC');
      setTaxNumber(restaurant.taxNumber || '');
      setTaxRate((restaurant.taxRate || 0).toString());
      setTaxInclusive(Boolean(restaurant.taxInclusive));
      setServiceChargeRate((restaurant.serviceChargeRate || 0).toString());
      setServiceChargeEnabled(Boolean(restaurant.serviceChargeEnabled));
      setDineInEnabled(restaurant.dineInEnabled !== false);
      setTakeawayEnabled(restaurant.takeawayEnabled !== false);
      setDeliveryEnabled(restaurant.deliveryEnabled !== false);
      setReceiptHeader(restaurant.receiptHeader || '');
      setReceiptFooter(restaurant.receiptFooter || '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Restaurant name is required.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateMutation.mutateAsync({
        name: name.trim(),
        legalName: legalName.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        logo: logo.trim() || null,
        currency: currency.trim().toUpperCase(),
        timezone: timezone.trim(),
        taxNumber: taxNumber.trim() || null,
        taxRate: parseFloat(taxRate) || 0,
        taxInclusive,
        serviceChargeRate: parseFloat(serviceChargeRate) || 0,
        serviceChargeEnabled,
        dineInEnabled,
        takeawayEnabled,
        deliveryEnabled,
        receiptHeader: receiptHeader.trim() || null,
        receiptFooter: receiptFooter.trim() || null,
      });

      setSuccessMessage('Restaurant configuration successfully updated!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      setErrorMessage(msg);
    }
  };

  const isPending = updateMutation.isPending;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col overflow-hidden select-none -m-4 md:-m-6 p-3 sm:p-4 bg-pos-bg">
      <div className="flex-1 flex flex-col min-w-0 bg-pos-surface border border-pos-border rounded-lg overflow-hidden shadow-xs">
        {/* =========================================================================
            TOP HEADER BAR: Store Status & Save Action
        ========================================================================= */}
        <div className="p-3 sm:p-3.5 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pos-text">
                  Restaurant Settings & Configuration
                </h2>
                {restaurant && (
                  <Badge variant="default" size="sm" className="text-[10px] font-mono">
                    {restaurant.currency} • {restaurant.timezone}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-pos-text-muted mt-0.5 font-medium">
                Store profile, currency, tax rates, dining channels, and thermal receipt
                template
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="min-h-[34px] px-3 text-xs font-medium"
            >
              Revert
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isPending}
              disabled={!name.trim() || isPending}
              className="min-h-[34px] text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save size={14} />
              <span>Save Settings</span>
            </Button>
          </div>
        </div>

        {/* =========================================================================
          ALERTS / TOASTS BAR
      ========================================================================= */}
        {successMessage && (
          <div className="p-2.5 bg-pos-success-soft border-b border-pos-success/30 text-pos-success text-xs font-semibold flex items-center gap-2 animate-in fade-in shrink-0">
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-pos-danger-soft border-b border-pos-danger/30 text-pos-danger text-xs font-semibold flex items-center gap-2 animate-in fade-in shrink-0">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* =========================================================================
          SETTINGS TABS NAVIGATION
      ========================================================================= */}
        <div className="p-3 border-b border-pos-border bg-pos-surface flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="p-1 rounded-md bg-pos-surface-subtle border border-pos-border flex items-center gap-1 text-xs overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'profile'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Store size={13} />
              <span>Store Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('taxes')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'taxes'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <DollarSign size={13} />
              <span>Taxes & Charges</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('channels')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'channels'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <UtensilsCrossed size={13} />
              <span>Dining Channels</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('receipts')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'receipts'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Receipt size={13} />
              <span>Receipt & Printing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hardware')}
              className={cn(
                'px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap',
                activeTab === 'hardware'
                  ? 'bg-pos-primary text-white shadow-xs'
                  : 'text-pos-text-secondary hover:text-pos-text'
              )}
            >
              <Printer size={13} />
              <span>Kitchen & Stations</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
          MAIN SETTINGS CONTENT
      ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-pos-bg text-xs">
          {isRestaurantLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-pos-text-muted">
              <Spinner size="lg" />
              <span>Loading Restaurant Configuration...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 max-w-4xl mx-auto">
              {/* TAB 1: STORE PROFILE & IDENTITY */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <Store size={16} className="text-pos-primary" />
                      <span>Restaurant Identity & Business Information</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Restaurant Display Name{' '}
                          <span className="text-pos-danger">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Faraz Fine Dining"
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Legal Business Entity Name
                        </label>
                        <input
                          type="text"
                          value={legalName}
                          onChange={e => setLegalName(e.target.value)}
                          placeholder="e.g. Faraz Foods & Hospitality (Pvt) Ltd"
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-normal focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Primary Contact Phone
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="e.g. +92 300 1234567"
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Store Logo URL
                        </label>
                        <input
                          type="text"
                          value={logo}
                          onChange={e => setLogo(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                        Physical Store Address
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder="e.g. Plot 4-C, 10th Commercial Street, DHA Phase 5, Karachi"
                        className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-normal focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                      />
                    </div>
                  </div>

                  {/* Currency & Timezone */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <Clock size={16} className="text-pos-primary" />
                      <span>Currency & Regional Localization</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1.5">
                          Operating Currency (ISO 3-Letter)
                        </label>
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        >
                          {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code} - {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1.5">
                          Operational Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={e => setTimezone(e.target.value)}
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TAXES & SERVICE CHARGES */}
              {activeTab === 'taxes' && (
                <div className="space-y-4">
                  {/* Sales Tax */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <DollarSign size={16} className="text-pos-primary" />
                      <span>Sales Tax Configuration</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Sales Tax Rate (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={taxRate}
                            onChange={e => setTaxRate(e.target.value)}
                            placeholder="13.0"
                            className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-pos-text-muted">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Tax Number / NTN / STRN
                        </label>
                        <input
                          type="text"
                          value={taxNumber}
                          onChange={e => setTaxNumber(e.target.value)}
                          placeholder="e.g. 1234567-8"
                          className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-md bg-pos-surface-subtle border border-pos-border cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={taxInclusive}
                        onChange={e => setTaxInclusive(e.target.checked)}
                        className="h-4 w-4 rounded accent-pos-primary mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-pos-text block">
                          Tax-Inclusive Menu Pricing
                        </span>
                        <span className="text-[11px] text-pos-text-muted">
                          When enabled, menu item prices already include sales tax in
                          their base price.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Service Charges */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <UtensilsCrossed size={16} className="text-pos-primary" />
                      <span>Dine-In Service Charge</span>
                    </h3>

                    <label className="flex items-start gap-2.5 p-3 rounded-md bg-pos-surface-subtle border border-pos-border cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={serviceChargeEnabled}
                        onChange={e => setServiceChargeEnabled(e.target.checked)}
                        className="h-4 w-4 rounded accent-pos-primary mt-0.5"
                      />
                      <div>
                        <span className="font-semibold text-pos-text block">
                          Enable Automatic Service Charge
                        </span>
                        <span className="text-[11px] text-pos-text-muted">
                          Automatically adds a service charge percentage on Dine-In
                          orders.
                        </span>
                      </div>
                    </label>

                    {serviceChargeEnabled && (
                      <div>
                        <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                          Service Charge Rate (%)
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={serviceChargeRate}
                            onChange={e => setServiceChargeRate(e.target.value)}
                            placeholder="5.0"
                            className="w-full px-3 py-2 rounded-md bg-pos-surface border border-pos-border text-pos-text font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-pos-text-muted">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DINING CHANNELS */}
              {activeTab === 'channels' && (
                <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                    <ShoppingBag size={16} className="text-pos-primary" />
                    <span>Active Order Fulfillment Channels</span>
                  </h3>

                  <p className="text-xs text-pos-text-muted">
                    Toggle which order fulfillment modes are active on this POS terminal.
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3.5 rounded-md bg-pos-surface-subtle border border-pos-border cursor-pointer select-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
                          <UtensilsCrossed size={18} />
                        </div>
                        <div>
                          <span className="font-semibold text-pos-text block text-sm">
                            Dine-In Table Orders
                          </span>
                          <span className="text-[11px] text-pos-text-muted">
                            Floor tables, seat management, and table service billing
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={dineInEnabled}
                        onChange={e => setDineInEnabled(e.target.checked)}
                        className="h-5 w-5 rounded accent-pos-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-md bg-pos-surface-subtle border border-pos-border cursor-pointer select-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
                          <ShoppingBag size={18} />
                        </div>
                        <div>
                          <span className="font-semibold text-pos-text block text-sm">
                            Takeaway / Counter Orders
                          </span>
                          <span className="text-[11px] text-pos-text-muted">
                            Quick pickup token orders and counter checkout
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={takeawayEnabled}
                        onChange={e => setTakeawayEnabled(e.target.checked)}
                        className="h-5 w-5 rounded accent-pos-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3.5 rounded-md bg-pos-surface-subtle border border-pos-border cursor-pointer select-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-pos-primary-soft border border-pos-primary/20 text-pos-primary flex items-center justify-center">
                          <Truck size={18} />
                        </div>
                        <div>
                          <span className="font-semibold text-pos-text block text-sm">
                            Delivery & Rider Dispatch
                          </span>
                          <span className="text-[11px] text-pos-text-muted">
                            Direct phone orders, delivery address tracking, and rider
                            dispatch
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={deliveryEnabled}
                        onChange={e => setDeliveryEnabled(e.target.checked)}
                        className="h-5 w-5 rounded accent-pos-primary"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 4: RECEIPT LAYOUT & LIVE PREVIEW */}
              {activeTab === 'receipts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Form Controls */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <Receipt size={16} className="text-pos-primary" />
                      <span>Customer Receipt Message Layout</span>
                    </h3>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                        Receipt Header Message (Greeting)
                      </label>
                      <textarea
                        rows={3}
                        value={receiptHeader}
                        onChange={e => setReceiptHeader(e.target.value)}
                        placeholder="e.g. Welcome to Faraz POS! Specializing in Traditional & Continental Delights."
                        className="w-full p-2.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-normal"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1">
                        Receipt Footer Note / WiFi Info
                      </label>
                      <textarea
                        rows={3}
                        value={receiptFooter}
                        onChange={e => setReceiptFooter(e.target.value)}
                        placeholder="e.g. Thank you for dining with us! Free WiFi: FarazGuest / Pass: welcome123"
                        className="w-full p-2.5 rounded-md bg-pos-surface border border-pos-border text-pos-text text-xs focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary resize-none font-normal"
                      />
                    </div>

                    <div className="pt-2 border-t border-pos-border">
                      <label className="block font-semibold uppercase tracking-wider text-[11px] text-pos-text-secondary mb-1.5">
                        Thermal Paper Roll Width
                      </label>
                      <div className="flex items-center gap-2">
                        {(['80mm', '58mm'] as const).map(w => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setPaperWidth(w)}
                            className={cn(
                              'flex-1 py-2 rounded-md border font-semibold text-xs transition-colors',
                              paperWidth === w
                                ? 'bg-pos-primary text-white border-pos-primary shadow-xs'
                                : 'bg-pos-surface text-pos-text-secondary border-pos-border hover:text-pos-text'
                            )}
                          >
                            {w} {w === '80mm' ? '(Standard POS)' : '(Compact Roll)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Thermal Receipt Visual Preview */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs flex flex-col items-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted mb-2">
                      Live Thermal Printer Preview ({paperWidth})
                    </span>

                    {isReceiptLoading ? (
                      <div className="py-20 flex justify-center">
                        <Spinner size="md" />
                      </div>
                    ) : receiptPreview ? (
                      <div
                        className={cn(
                          'bg-white text-pos-text p-4 rounded-md shadow-sm font-mono text-[11px] leading-tight select-text space-y-2 border border-pos-border',
                          paperWidth === '80mm' ? 'w-72' : 'w-56'
                        )}
                      >
                        {/* Store Header */}
                        <div className="text-center space-y-0.5 border-b border-dashed border-pos-border-strong pb-2">
                          <p className="font-bold text-sm uppercase">
                            {receiptPreview.restaurant.name}
                          </p>
                          {receiptPreview.restaurant.address && (
                            <p className="text-[10px] text-pos-text-secondary">
                              {receiptPreview.restaurant.address}
                            </p>
                          )}
                          {receiptPreview.restaurant.phone && (
                            <p className="text-[10px] text-pos-text-secondary">
                              Tel: {receiptPreview.restaurant.phone}
                            </p>
                          )}
                          {receiptHeader && (
                            <p className="text-[10px] italic mt-1 text-pos-text-muted">
                              {receiptHeader}
                            </p>
                          )}
                        </div>

                        {/* Order Info */}
                        <div className="text-[10px] space-y-0.5 border-b border-dashed border-pos-border-strong pb-1.5">
                          <div className="flex justify-between font-bold">
                            <span>Check #{receiptPreview.order.orderCode}</span>
                            <span>{receiptPreview.order.orderType}</span>
                          </div>
                          <div className="flex justify-between text-pos-text-muted">
                            <span>{receiptPreview.order.formattedDate}</span>
                            <span>{receiptPreview.order.formattedTime}</span>
                          </div>
                          <div className="text-pos-text-muted">
                            Cashier: {receiptPreview.order.cashierName}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 border-b border-dashed border-pos-border-strong pb-2">
                          {receiptPreview.order.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="truncate pr-1">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="font-bold shrink-0">
                                {item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Financial Totals */}
                        <div className="space-y-0.5 text-[10px] border-b border-dashed border-pos-border-strong pb-1.5">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{receiptPreview.order.totals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-1">
                            <span>TOTAL ({receiptPreview.restaurant.currency}):</span>
                            <span>
                              {receiptPreview.order.totals.grandTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Footer Note */}
                        <div className="text-center pt-1 text-[10px] text-pos-text-secondary">
                          {receiptFooter ? (
                            <p className="italic">{receiptFooter}</p>
                          ) : (
                            <p>Thank you for your visit!</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* TAB 5: HARDWARE, STATIONS & ZONES */}
              {activeTab === 'hardware' && (
                <div className="space-y-4">
                  {/* Kitchen Stations */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <Flame size={16} className="text-pos-primary" />
                      <span>
                        Configured Kitchen Display Stations ({kitchenStations.length})
                      </span>
                    </h3>

                    {kitchenStations.length === 0 ? (
                      <div className="p-4 text-center text-pos-text-muted">
                        No kitchen stations configured.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {kitchenStations.map(st => (
                          <div
                            key={st.id}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-pos-text">
                                {st.name}
                              </span>
                              <Badge
                                variant={st.isActive ? 'success' : 'default'}
                                size="sm"
                                className="text-[9px]"
                              >
                                {st.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-pos-text-muted block font-mono">
                              Code: {st.code || 'KDS-01'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Floor Dining Zones */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <MapPin size={16} className="text-pos-primary" />
                      <span>Dining Floor Zones ({floorZones.length})</span>
                    </h3>

                    {floorZones.length === 0 ? (
                      <div className="p-4 text-center text-pos-text-muted">
                        No dining zones configured.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {floorZones.map(z => (
                          <div
                            key={z.id}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1"
                          >
                            <span className="font-semibold text-pos-text block">
                              {z.name}
                            </span>
                            <span className="text-[11px] text-pos-text-muted">
                              {z.tables?.length || 0} Tables registered
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delivery Zones */}
                  <div className="p-4 sm:p-5 rounded-lg bg-pos-surface border border-pos-border shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-pos-text flex items-center gap-2 border-b border-pos-border pb-3">
                      <Truck size={16} className="text-pos-primary" />
                      <span>Delivery Coverage Zones ({deliveryZones.length})</span>
                    </h3>

                    {deliveryZones.length === 0 ? (
                      <div className="p-4 text-center text-pos-text-muted">
                        No delivery zones configured.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {deliveryZones.map(dz => (
                          <div
                            key={dz.id}
                            className="p-3 rounded-md bg-pos-surface-subtle border border-pos-border space-y-1"
                          >
                            <span className="font-semibold text-pos-text block">
                              {dz.name}
                            </span>
                            <div className="flex items-center justify-between text-[11px] text-pos-text-muted pt-1">
                              <span>Fee: {dz.deliveryCharge}</span>
                              <span>{dz.estimatedMinutes || 30} mins</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
