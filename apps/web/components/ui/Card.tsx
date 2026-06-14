export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-white dark:bg-flashscore-card border border-gray-200 dark:border-flashscore-border rounded-lg p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]  transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};