

import { useState } from "react";
import { Eye, EyeOff, ChevronDown, CalendarDays } from "lucide-react";
import Checkbox from "./Checkbox";
import AsyncSelect from "react-select/async";




const loadOptionsLabelMap: Record<string, Record<string, string>> = {};
const multiSelectLabelMap: Record<string, Record<string, string>> = {};
const asyncSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: '2.5rem',
    borderRadius: '0.375rem', 
    borderColor: state.isFocused ? '#ce1126' : '#e5e7eb', 
    backgroundColor: state.isDisabled ? '#f9fafb' : '#f9fafb', 
    boxShadow: 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#ce1126' : '#d1d5db', 
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '0.375rem',
    zIndex: 50,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#fce7f3' : '#fff',
    color: '#111827',
    cursor: 'pointer',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#9ca3af', 
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#111827', 
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: state.isFocused ? '#ce1126' : '#9ca3af',
    '&:hover': {
      color: '#ce1126',
    },
  }),
  clearIndicator: (provided: any) => ({
    ...provided,
    color: '#9ca3af',
    '&:hover': {
      color: '#ce1126',
    },
  }),
};
export function Input({
    icon,
    type = "text",
    id,
    placeholder = "",
    disabled = false,
    required = false,
    min,
    max,
    step,
    value,
    label,  
    options,
    other,
    onChange,
    onKeyDown,
    loadOptions,
    defaultLabel,
  }: {
    icon?: React.ReactNode;
    type?: string;
    id: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    step?: number;
    min?: number;
    max?: number;
    value: string | string[] | boolean | any;
    label?: string;
    loadOptions?: (inputValue: string) => Promise<{ value: string; label: string }[]>;
    options?: { value: string; label: string }[];
      other?: boolean;
    defaultLabel?: string;
    onChange: React.ChangeEventHandler<HTMLInputElement> | React.ChangeEventHandler<HTMLTextAreaElement> | React.ChangeEventHandler<HTMLSelectElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  } 
  )
 {
 

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  // Base classes from your new design
  const baseInputClasses = `
    w-full border border-gray-200 dark:border-flashscore-border rounded-md text-sm bg-gray-50 dark:bg-flashscore-card 
    focus:outline-none focus:border-[#ce1126] focus:bg-white dark:bg-flashscore-card dark:focus:bg-flashscore-base dark:text-flashscore-text
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400 dark:text-flashscore-muted dark:placeholder:text-flashscore-muted
  `;

  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            id={id}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            value={value}
            onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            className={`${baseInputClasses} px-3 py-2 min-h-[100px] resize-none shadow-none focus-visible:ring-0`}
          />
        );

      case "checkbox":
        // If options are provided, render multiple checkboxes
        if (options && options.length > 0) {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-flashscore-card rounded-lg border border-gray-200 dark:border-flashscore-border">
              {options.map((option: { value: string; label: string; key?: string }) => (
                <Checkbox
                  key={option.key || option.value}
                  id={`${id}-${option.value}`}
                  label={option.label}
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
                />
              ))}
            </div>
          );
        }
        // Otherwise, render a single boolean checkbox
        return (
          <Checkbox
            id={id}
            label={label || ""}
            value={id}
            checked={!!value}
            onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          />
        );

      case "select":
        return (
          <div className="relative w-full">
            <select
              id={id}
              value={value}
              onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
              disabled={disabled}
              required={required}
              className={`${baseInputClasses} appearance-none px-3 py-2 pr-10`}
            >
              <option value="" disabled>{placeholder}</option>
              {options?.map((option: { id?: string; value: string; label: string }) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-flashscore-muted pointer-events-none" />
          </div>
        );
      case "async-select":
         return (
      <AsyncSelect
      id={id}
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={
        value
          ? { value, label: loadOptionsLabelMap[id]?.[value] || defaultLabel || placeholder || "" }
          : null
      }
      onChange={async (selected: any) => {
        onChange({
          target: {
            id,
            value: selected?.value || "",            label: selected?.label || "",          },
        } as any);
        if (selected?.value && selected?.label) {
          if (!loadOptionsLabelMap[id]) loadOptionsLabelMap[id] = {};
          loadOptionsLabelMap[id][selected.value] = selected.label;
        }
      }}
      styles={asyncSelectStyles}
      isClearable
      placeholder={placeholder}
      isDisabled={disabled}
    />
  );

 case "async-multiselect":
  return (
    <AsyncSelect
      id={id}
      isMulti
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={Array.isArray(value)
        ? value.map(v =>
            typeof v === 'object' && v !== null
              ? v
              : { value: v, label: multiSelectLabelMap[id]?.[v] || "Loading..." }
          )
        : []
      }
      onChange={(selected: any) => {
        onChange({
          target: {
            id,
            value: selected ? selected : [],
          },
        } as any);

        if (selected && selected.length > 0) {
          if (!multiSelectLabelMap[id]) multiSelectLabelMap[id] = {};
          selected.forEach((s: any) => {
            if (multiSelectLabelMap[id]) {
              multiSelectLabelMap[id][s.value] = s.label;
            }
          });
        }
      }}
      styles={asyncSelectStyles}
      isClearable
      placeholder={placeholder}
      isDisabled={disabled}
    />
  );

      case "date":
      case "month":
      case "time":
        return (
          <div className="relative w-full">
            <input
              id={id}
              type={type}
              required={required}
              value={value}
              min={min}
              max={max}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              disabled={disabled}
              className={`${baseInputClasses} px-3 py-2 `}
            />
           
          </div>
        );

      default:
        return (
          <div className="relative w-full">
            {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-flashscore-muted">
                  {icon}
            </span>
             )}
            <input
              id={id}
              type={isPassword && showPassword ? "text" : type}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              value={value}
              min={min}
              max={max}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              onKeyDown={onKeyDown}
              className={`${baseInputClasses} px-3 py-2 ${isPassword ? 'pr-10' : ''} ${icon ? 'pl-9' : ''}`}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-flashscore-muted hover:text-gray-600 dark:text-gray-400 dark:text-flashscore-muted"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        );
    }
  };

  // Check if it's a single boolean checkbox (checkbox with no options)
  const isSingleCheckbox = type === "checkbox" && (!options || options.length === 0);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && !isSingleCheckbox && (
        <label htmlFor={id} className="text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
          {label}
          {required && <span className="text-[#ce1126] ml-0.5">*</span>}
        </label>
      )}
      {renderInput()}


    </div>
  );
}