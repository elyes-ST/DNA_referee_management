import React from "react";
import { Input } from "./Input";

export interface FormField {
  name: string; 
  label?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  loadOptions?: (inputValue: string) => Promise<{ value: string; label: string }[]>;
  options?: { value: string; label: string }[];
  icon?: React.ReactNode;
  other?: boolean;
  className?: string;
  defaultLabel?: string;
}

export interface FormProps {
  fields: FormField[];
  formData: Record<string, any>;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  className?: string;
}

export function Form({ fields, formData, onChange, className = "" }: FormProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {fields.map((field) => (
        <div key={field.name} className={field.className}>
          <Input
            id={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            min={field.min}
            max={field.max}
            step={field.step}
            value={formData[field.name] ?? (field.type === 'checkbox' ? (field.options ? [] : false) : "")}
            onChange={onChange}
            loadOptions={field.loadOptions}
            options={field.options}
            icon={field.icon}
            other={field.other}
            defaultLabel={field.defaultLabel}
          />
        </div>
      ))}
    </div>
  );
}

export default Form;
