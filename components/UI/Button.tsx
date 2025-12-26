import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold text-lg shadow-lg transform transition active:scale-95 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 border-b-4 border-orange-700",
    secondary: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-b-4 border-yellow-600",
    danger: "bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-700",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
