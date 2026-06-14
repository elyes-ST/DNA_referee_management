export const Button = ({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) => {
  const baseStyles = "px-5 py-2.5 rounded-md font-semibold text-sm transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-[#ce1126] text-white hover:bg-[#a20e1f] hover:shadow-lg hover:shadow-[#ce1126]/20 focus:ring-[#ce1126]",
    secondary: "bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text border border-gray-200 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover hover:border-[#ce1126] dark:hover:border-[#ce1126] focus:ring-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    ghost: "bg-transparent text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-100 dark:bg-flashscore-border dark:hover:bg-flashscore-hover hover:text-[#ce1126] dark:hover:text-[#ce1126]"
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
