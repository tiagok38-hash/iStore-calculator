import React from 'react';

interface FormInputProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  helperText?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  prefix?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  icon,
  label,
  placeholder,
  helperText,
  value,
  onChange,
  type = "text",
  prefix
}) => {
  return (
    <div className="flex gap-4 items-start w-full">
      <div className="pt-1.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 w-full">
        <label className="block text-gray-600 text-lg font-bold mb-2 leading-tight">
          {label}
        </label>
        
        {/* Input Container with Border */}
        <div className="flex items-center w-full border-b border-gray-300 hover:border-gray-400 focus-within:border-[#7000e0] transition-colors duration-200 py-1">
          {prefix && (
            <span className="text-[#7000e0] font-medium mr-2 text-xl">
              {prefix}
            </span>
          )}
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="appearance-none bg-transparent w-full text-[#7000e0] placeholder-gray-400 py-1 leading-tight outline-none text-xl font-medium"
          />
        </div>

        {helperText && (
          <p className="text-gray-500 text-xs mt-1.5 font-normal">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};