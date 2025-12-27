// components/UI/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const baseStyles = "px-6 py-3 rounded-xl font-bold text-lg shadow-lg transform transition active:scale-95 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    // Đổi sang màu Cyan (Xanh Thanh Lam)
    secondary: "bg-cyan-500 text-white hover:bg-cyan-600 border-b-4 border-cyan-700",
    primary: "bg-white text-cyan-900 hover:bg-gray-50 border-b-4 border-gray-300",
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