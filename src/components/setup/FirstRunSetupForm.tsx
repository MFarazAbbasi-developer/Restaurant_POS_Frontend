import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, UserRound } from 'lucide-react';
import { SetupApi } from '@/core/api/setupApi';
import { ApiError } from '@/core/api/errors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function fieldError(details: unknown, field: string): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const match = details.find(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'field' in item &&
      (item as { field: string }).field === field
  ) as { message?: string } | undefined;
  return match?.message;
}

export const FirstRunSetupForm: React.FC = () => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [taxRate, setTaxRate] = useState('0');

  const [ownerName, setOwnerName] = useState('');
  const [username, setUsername] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const localValidationError = useMemo(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      return 'Password confirmation does not match';
    }
    return null;
  }, [password, confirmPassword]);

  const handleRestaurantNameChange = (value: string) => {
    setRestaurantName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setFieldErrors({});

    if (localValidationError) {
      setError(localValidationError);
      return;
    }

    const parsedTax = Number(taxRate);
    if (Number.isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      setFieldErrors({ 'restaurant.taxRate': 'Tax rate must be a number between 0 and 100' });
      return;
    }

    setIsSubmitting(true);
    try {
      await SetupApi.completeSetup({
        restaurant: {
          name: restaurantName.trim(),
          slug: slug.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          currency: currency.trim().toUpperCase(),
          timezone: timezone.trim(),
          taxRate: parsedTax,
        },
        owner: {
          name: ownerName.trim(),
          username: username.trim(),
          phone: ownerPhone.trim() || undefined,
          pin: pin.trim(),
          password,
        },
      });

      navigate('/login', {
        replace: true,
        state: {
          setupComplete: true,
          username: username.trim(),
        },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const details =
          err.raw && typeof err.raw === 'object' && err.raw !== null && 'error' in err.raw
            ? (err.raw as { error?: { details?: unknown } }).error?.details
            : undefined;

        const nextFieldErrors: Record<string, string> = {};
        const fields = [
          'restaurant.name',
          'restaurant.slug',
          'restaurant.currency',
          'restaurant.timezone',
          'restaurant.taxRate',
          'owner.name',
          'owner.username',
          'owner.pin',
          'owner.password',
        ];
        for (const field of fields) {
          const message = fieldError(details, field);
          if (message) nextFieldErrors[field] = message;
        }
        setFieldErrors(nextFieldErrors);
      } else {
        setError('Setup failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl p-6 sm:p-8 shadow-sm border border-pos-border">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-pos-text tracking-tight">First-run setup</h2>
        <p className="mt-1 text-sm text-pos-text-muted">
          Create your restaurant profile and the initial owner account. No demo data is
          created. After sign-in: add a menu category, add products, then complete your first
          sale via Takeaway. Dine-in requires tables to be configured separately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-pos-text">
            <Building2 size={16} className="text-pos-primary" />
            Restaurant
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Restaurant name"
              value={restaurantName}
              onChange={(e) => handleRestaurantNameChange(e.target.value)}
              error={fieldErrors['restaurant.name']}
              required
              disabled={isSubmitting}
              autoComplete="organization"
            />
            <Input
              label="URL slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              error={fieldErrors['restaurant.slug']}
              required
              disabled={isSubmitting}
              placeholder="my-restaurant"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              error={fieldErrors['restaurant.currency']}
              disabled={isSubmitting}
              maxLength={3}
            />
            <Input
              label="Timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              error={fieldErrors['restaurant.timezone']}
              disabled={isSubmitting}
            />
            <Input
              label="Tax rate (%)"
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              error={fieldErrors['restaurant.taxRate']}
              disabled={isSubmitting}
            />
          </div>
          <Input
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={isSubmitting}
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-pos-text">
            <UserRound size={16} className="text-pos-primary" />
            Owner account
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              error={fieldErrors['owner.name']}
              required
              disabled={isSubmitting}
              autoComplete="name"
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={fieldErrors['owner.username']}
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
            <Input
              label="Phone"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="PIN (4–8 digits)"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              error={fieldErrors['owner.pin']}
              required
              disabled={isSubmitting}
              inputMode="numeric"
              autoComplete="off"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors['owner.password']}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={localValidationError ?? undefined}
              required
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>
        </section>

        {(error || localValidationError) && (
          <div className="flex items-start gap-2 rounded-lg border border-pos-danger/30 bg-pos-danger/5 px-3 py-2 text-sm text-pos-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error || localValidationError}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || !!localValidationError}>
          {isSubmitting ? 'Creating restaurant…' : 'Complete setup'}
        </Button>
      </form>
    </Card>
  );
};
