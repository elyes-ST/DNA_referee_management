export const Avatar = ({ name, size = 'md', className = '' }: { name: string, size?: 'sm' | 'md' | 'lg', className?: string }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base"
  };

  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#ce1126] to-[#e8384d] flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};
