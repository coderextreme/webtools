/**
 * InterViews IV-look Component Library
 * Ported from src/IV-look/ (bevel.c, button.c, slider.c, stepper.c, feditor.c, menu.c, dialog.c)
 * Provides authentic workstation GUI components modernized for high-contrast, responsive,
 * and touch-first web use (touch targets >= 44px).
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';

/* =========================================================================
   1. BEVEL CONTAINER
   Classic workstation 3D bevel (Raised, Inset, Flat, Chiseled)
   ========================================================================= */
export interface BevelProps {
  styleType?: 'raised' | 'inset' | 'flat' | 'chiseled';
  depth?: number;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Bevel: React.FC<BevelProps> = ({
  styleType = 'raised',
  depth = 2,
  className = '',
  children,
  onClick,
}) => {
  let borderStyle = '';
  switch (styleType) {
    case 'raised':
      borderStyle =
        'border-t-[#E2E8F0]/30 border-l-[#E2E8F0]/30 border-b-[#0B0F17]/60 border-r-[#0B0F17]/60 shadow-sm';
      break;
    case 'inset':
      borderStyle =
        'border-t-[#0B0F17]/60 border-l-[#0B0F17]/60 border-b-[#E2E8F0]/20 border-r-[#E2E8F0]/20 bg-black/15';
      break;
    case 'chiseled':
      borderStyle = 'border-[#475569]/40 shadow-inner';
      break;
    case 'flat':
    default:
      borderStyle = 'border-slate-700/60';
      break;
  }

  return (
    <div
      onClick={onClick}
      style={{ borderWidth: `${depth}px` }}
      className={`border rounded-sm transition-all duration-150 ${borderStyle} ${className}`}
    >
      {children}
    </div>
  );
};

/* =========================================================================
   2. PUSH BUTTON (InterViews Button)
   ========================================================================= */
export interface IVButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const IVButton: React.FC<IVButtonProps> = ({
  children,
  onClick,
  disabled = false,
  active = false,
  variant = 'secondary',
  size = 'md',
  className = '',
  title,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 min-h-[38px] text-xs gap-1.5',
    md: 'px-4 py-2 min-h-[44px] text-sm gap-2',
    lg: 'px-6 py-3 min-h-[48px] text-base gap-2.5',
  }[size];

  let variantClasses = '';
  if (variant === 'primary') {
    variantClasses = 'bg-sky-600 text-white hover:bg-sky-500 border-sky-400/40 active:bg-sky-700';
  } else if (variant === 'danger') {
    variantClasses = 'bg-red-600/90 text-white hover:bg-red-500 border-red-400/40 active:bg-red-700';
  } else {
    variantClasses =
      'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-600/60 active:bg-slate-900';
  }

  const bevelClass =
    isPressed || active
      ? 'border-t-black/60 border-l-black/60 border-b-white/20 border-r-white/20 translate-y-0.5'
      : 'border-t-white/20 border-l-white/20 border-b-black/60 border-r-black/60';

  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`inline-flex items-center justify-center font-medium select-none cursor-pointer rounded-xs border-2 transition-transform duration-75 whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${bevelClass} ${className}`}
    >
      {children}
    </button>
  );
};

/* =========================================================================
   3. CHECKBOX (InterViews CheckBox)
   ========================================================================= */
export interface IVCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const IVCheckbox: React.FC<IVCheckboxProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 text-sm select-none cursor-pointer min-h-[44px] py-1 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-sky-400'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="sr-only"
        disabled={disabled}
      />
      <div
        className={`w-5 h-5 rounded-xs border-2 flex items-center justify-center transition-colors shrink-0 ${
          checked
            ? 'bg-sky-500 border-sky-400 text-slate-950'
            : 'bg-slate-900 border-t-black/70 border-l-black/70 border-b-white/20 border-r-white/20 text-transparent'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <span className="font-medium text-slate-200">{label}</span>
    </label>
  );
};

/* =========================================================================
   4. RADIO BUTTON (InterViews RadioButton)
   ========================================================================= */
export interface IVRadioProps {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const IVRadio: React.FC<IVRadioProps> = ({
  label,
  name,
  value,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 text-sm select-none cursor-pointer min-h-[44px] py-1 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:text-sky-400'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        className="sr-only"
        disabled={disabled}
      />
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
          checked
            ? 'border-sky-400 bg-slate-900'
            : 'border-slate-600 bg-slate-950 border-t-black/70 border-l-black/70'
        }`}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />}
      </div>
      <span className="font-medium text-slate-200">{label}</span>
    </label>
  );
};

/* =========================================================================
   5. SLIDER (InterViews Slider with groove & thumb)
   ========================================================================= */
export interface IVSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export const IVSlider: React.FC<IVSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  unit = '',
  className = '',
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-400">{label}</span>
          <span className="font-mono tabular-nums text-sky-400">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative flex items-center h-8 select-none group touch-none">
        {/* Track groove with inset bevel */}
        <div className="w-full h-2.5 rounded-xs bg-slate-950 border border-t-black/80 border-l-black/80 border-b-slate-700/50 border-r-slate-700/50 relative overflow-hidden pointer-events-none">
          <div
            className="h-full bg-sky-500/70"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* HTML range input over top for native dragging & touch */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
        />
        {/* Raised workstation thumb indicator */}
        <div
          className="absolute w-5 h-5 bg-slate-200 rounded-xs border-2 border-t-white border-l-white border-b-black/80 border-r-black/80 pointer-events-none shadow-md -ml-2.5"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/* =========================================================================
   6. STEPPER (InterViews Stepper)
   ========================================================================= */
export interface IVStepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
}

export const IVStepper: React.FC<IVStepperProps> = ({
  value,
  min = 0,
  max = 1000,
  step = 1,
  onChange,
  label,
  unit = '',
}) => {
  const increment = () => {
    if (value + step <= max) onChange(value + step);
  };

  const decrement = () => {
    if (value - step >= min) onChange(value - step);
  };

  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      {label && <span className="font-medium text-slate-400">{label}</span>}
      <div className="flex items-center border border-slate-700 rounded-xs bg-slate-950 overflow-hidden min-h-[38px]">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="w-16 px-2.5 py-1 text-right font-mono tabular-nums text-slate-100 bg-transparent outline-hidden text-xs"
        />
        {unit && <span className="pr-1.5 text-slate-500 font-mono text-[10px]">{unit}</span>}
        <div className="flex flex-col border-l border-slate-800">
          <button
            onClick={increment}
            disabled={value >= max}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border-b border-slate-800 disabled:opacity-30 cursor-pointer min-h-[19px] flex items-center justify-center"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={decrement}
            disabled={value <= min}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-30 cursor-pointer min-h-[19px] flex items-center justify-center"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   7. FIELD EDITOR (InterViews FieldEditor)
   ========================================================================= */
export interface IVFieldEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
}

export const IVFieldEditor: React.FC<IVFieldEditorProps> = ({
  value,
  onChange,
  placeholder,
  label,
  multiline = false,
  rows = 3,
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
      <div className="relative rounded-xs border-2 border-t-black/70 border-l-black/70 border-b-slate-700/50 border-r-slate-700/50 bg-slate-950 p-1">
        {multiline ? (
          <textarea
            value={value}
            rows={rows}
            enterKeyHint="enter"
            autoCapitalize="sentences"
            wrap="soft"
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-100 font-mono outline-hidden resize-y min-h-[60px] p-1.5 placeholder:text-slate-600"
          />
        ) : (
          <input
            type="text"
            value={value}
            enterKeyHint="done"
            onKeyDown={(e) => e.stopPropagation()}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-slate-100 font-mono outline-hidden px-2 py-1.5 placeholder:text-slate-600"
          />
        )}
        {value && !multiline && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-2 p-1 text-slate-500 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   8. PULLDOWN MENU (InterViews PulldownMenu)
   ========================================================================= */
export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
  action?: () => void;
}

export interface IVPulldownProps {
  title: string;
  items: MenuItem[];
}

export const IVPulldown: React.FC<IVPulldownProps> = ({ title, items }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-2 min-h-[36px] text-xs font-medium cursor-pointer transition-colors rounded-xs ${
          open
            ? 'bg-sky-600 text-white'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {title}
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-56 rounded-xs bg-slate-900 border-2 border-t-slate-600 border-l-slate-600 border-b-black border-r-black shadow-2xl z-50 py-1.5">
          {items.map((item, idx) => {
            if (item.separator) {
              return <div key={`sep-${idx}`} className="my-1 border-t border-slate-700/60" />;
            }
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  item.action?.();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2 min-h-[38px] text-xs text-left text-slate-200 hover:bg-sky-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-slate-400 group-hover:text-slate-200 font-mono">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   9. WORKSTATION DIALOG (InterViews Dialog)
   ========================================================================= */
export interface IVDialogProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export const IVDialog: React.FC<IVDialogProps> = ({
  title,
  isOpen,
  onClose,
  children,
  width = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div
        className={`w-full ${width} bg-slate-900 border-2 border-t-white/30 border-l-white/30 border-b-black/90 border-r-black/90 shadow-2xl rounded-xs overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Title Bar with classic workstation gradient */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-sky-950 via-slate-800 to-slate-900 border-b border-slate-700 select-none shrink-0">
          <span className="text-xs font-semibold tracking-wide text-sky-200 uppercase">
            {title}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-xs border border-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Dialog Body */}
        <div className="p-4 overflow-y-auto max-h-[80vh] text-slate-200">{children}</div>
      </div>
    </div>
  );
};
