import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '', 
  error,
  ...props 
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          block w-full rounded-lg border border-gray-300 dark:border-dark-600 
          bg-white dark:bg-dark-700 
          px-3 py-2 
          text-gray-900 dark:text-gray-100 
          placeholder-gray-500 dark:placeholder-gray-400
          focus:border-primary-500 focus:ring-primary-500 
          dark:focus:border-primary-500 dark:focus:ring-primary-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;
