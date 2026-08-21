import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  KeyRound,
  Lock,
  User as UserIcon,
  AlertCircle,
  Delete,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuthStore } from '@/core/auth/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

interface PresetStaff {
  label: string;
  username: string;
  role: string;
  defaultPin: string;
}

const PRESET_STAFF: PresetStaff[] = [
  {
    label: 'Cashier Sarah',
    username: 'cashier_sarah',
    role: 'Cashier',
    defaultPin: '4321',
  },
  {
    label: 'Manager John',
    username: 'manager_john',
    role: 'Manager',
    defaultPin: '2233',
  },
  { label: 'Owner Admin', username: 'owner_admin', role: 'Owner', defaultPin: '1234' },
];

export const StaffLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState('cashier_sarah');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [restaurantId, setRestaurantId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Clear previous errors when user changes inputs
  useEffect(() => {
    if (error) clearError();
  }, [username, pin, password, isPasswordMode, clearError, error]);

  const handleFormSubmit = React.useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!username.trim()) return;
      if (!isPasswordMode && !pin.trim()) return;
      if (isPasswordMode && !password.trim()) return;

      try {
        await login({
          username: username.trim(),
          pin: !isPasswordMode && pin ? pin : undefined,
          password: isPasswordMode && password ? password : undefined,
          restaurantId: restaurantId.trim() || undefined,
        });

        // Redirect to target path or dashboard
        const from =
          (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
        navigate(from, { replace: true });
      } catch {
        // Error is caught and stored in authStore.error
      }
    },
    [
      username,
      isPasswordMode,
      pin,
      password,
      restaurantId,
      login,
      location.state,
      navigate,
    ]
  );

  // Handle keyboard numpad input when PIN mode is active
  useEffect(() => {
    if (isPasswordMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if focus is in a standard text input other than the numpad
      if (
        document.activeElement?.tagName === 'INPUT' &&
        (document.activeElement as HTMLInputElement).id !== 'pin-hidden'
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 8) {
          setPin(prev => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleFormSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isPasswordMode, handleFormSubmit]);

  const handleNumpadPress = (digit: string) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
    }
  };

  const handleNumpadClear = () => {
    setPin('');
  };

  const handleNumpadBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSelectPreset = (staff: PresetStaff) => {
    setUsername(staff.username);
    setPin(staff.defaultPin);
    setIsPasswordMode(false);
  };

  return (
    <Card className="w-full max-w-md bg-pos-surface border-pos-border shadow-2xl p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-pos-accent/10 border border-pos-accent/20 text-pos-accent mb-3">
          <KeyRound size={28} />
        </div>
        <h2 className="text-2xl font-bold text-pos-text">Terminal Staff Sign-In</h2>
        <p className="text-xs text-pos-text-muted mt-1">
          Enter your staff credentials or PIN to access this register
        </p>
      </div>

      {/* Quick Staff Selectors */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-pos-text-muted mb-2">
          <span className="font-medium">Quick Staff Select:</span>
          <span className="flex items-center gap-1 text-[11px] text-pos-accent font-medium">
            <Sparkles size={12} /> Seeded Users
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_STAFF.map(staff => (
            <button
              key={staff.username}
              type="button"
              onClick={() => handleSelectPreset(staff)}
              className={cn(
                'p-2 rounded-lg border text-left transition-all text-xs select-none',
                username === staff.username
                  ? 'border-pos-accent bg-pos-accent/10 text-pos-text font-semibold ring-1 ring-pos-accent'
                  : 'border-pos-border bg-pos-bg/60 text-pos-text-muted hover:border-pos-border-focus hover:text-pos-text'
              )}
            >
              <p className="truncate font-medium">
                {staff.label.split(' ')[1] || staff.label}
              </p>
              <p className="text-[10px] text-pos-text-muted capitalize">{staff.role}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-lg bg-pos-danger/10 border border-pos-danger/30 text-pos-danger flex items-start gap-2.5 text-xs animate-shake">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Authentication Error</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Username Input */}
        <div>
          <label className="block text-xs font-semibold text-pos-text-muted mb-1.5 uppercase tracking-wider">
            Staff Username
          </label>
          <div className="relative">
            <UserIcon
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. cashier_sarah"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent focus:border-transparent font-medium"
            />
          </div>
        </div>

        {/* PIN or Password Mode Switcher */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-semibold text-pos-text-muted uppercase tracking-wider">
            {isPasswordMode ? 'Password' : 'Touch PIN Code'}
          </span>
          <button
            type="button"
            onClick={() => setIsPasswordMode(prev => !prev)}
            className="text-xs text-pos-accent hover:underline font-medium focus:outline-none"
          >
            {isPasswordMode ? 'Use PIN Numpad' : 'Use Password'}
          </button>
        </div>

        {/* Mode 1: PIN Pad */}
        {!isPasswordMode ? (
          <div className="space-y-3">
            {/* PIN Display Visualizer */}
            <div className="h-14 rounded-xl bg-pos-bg border border-pos-border flex items-center justify-center px-4">
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={cn(
                      'h-3.5 w-3.5 rounded-full transition-all duration-150',
                      pin.length > index
                        ? 'bg-pos-accent scale-110 shadow-sm shadow-pos-accent/50'
                        : 'bg-pos-border'
                    )}
                  />
                ))}
                {pin.length > 4 && (
                  <span className="text-xs font-mono text-pos-accent ml-2">
                    +{pin.length - 4} digits
                  </span>
                )}
              </div>
            </div>

            {/* Tactile Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="h-13 py-3 rounded-xl bg-pos-bg/80 hover:bg-pos-surface border border-pos-border/80 active:scale-95 font-bold text-xl text-pos-text transition-all duration-100 shadow-sm flex items-center justify-center select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleNumpadClear}
                aria-label="Clear PIN"
                className="h-13 py-3 rounded-xl bg-pos-bg/50 hover:bg-pos-danger/10 hover:text-pos-danger border border-pos-border text-pos-text-muted active:scale-95 transition-all text-xs font-semibold flex items-center justify-center gap-1 select-none"
              >
                <RotateCcw size={16} />
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="h-13 py-3 rounded-xl bg-pos-bg/80 hover:bg-pos-surface border border-pos-border/80 active:scale-95 font-bold text-xl text-pos-text transition-all duration-100 shadow-sm flex items-center justify-center select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumpadBackspace}
                aria-label="Backspace PIN"
                className="h-13 py-3 rounded-xl bg-pos-bg/50 hover:bg-pos-surface border border-pos-border text-pos-text-muted active:scale-95 transition-all flex items-center justify-center select-none"
              >
                <Delete size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Password Input */
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pos-text-muted"
            />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter account password"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-pos-bg border border-pos-border text-pos-text placeholder-pos-text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-pos-accent focus:border-transparent font-medium"
            />
          </div>
        )}

        {/* Collapsible Advanced Tenant Option */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(prev => !prev)}
            className="flex items-center gap-1 text-[11px] text-pos-text-muted hover:text-pos-text font-medium"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced Restaurant UUID
          </button>
          {showAdvanced && (
            <div className="mt-2">
              <Input
                placeholder="Optional Restaurant ID"
                value={restaurantId}
                onChange={e => setRestaurantId(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={
            !username ||
            (!isPasswordMode && pin.length === 0) ||
            (isPasswordMode && password.length === 0)
          }
          className="w-full mt-2 font-bold tracking-wide shadow-md"
        >
          Authorize & Open Register
        </Button>
      </form>
    </Card>
  );
};
