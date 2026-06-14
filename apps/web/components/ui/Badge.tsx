export type StatusKey = 'success' | 'warning' | 'error' | 'default' ;
export type Status = 'Actif' | 'Avertissement' | 'Suspendu' | 'Disponible' | 'En attente' | 'Indisponible' ;
export const Badge = ({ children, status = 'default', className = '' } : { children: React.ReactNode, status?: Status | StatusKey, className?: string }) => {
  const variants : Record<StatusKey, string> = {
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    error: "bg-red-100 text-red-600",
    default: "bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted"
  };
  const statusMap: Record<Status, StatusKey> = {
    'Actif': 'success',
    'Disponible': 'success',
    'Avertissement': 'warning',
    'En attente': 'warning',
    'Suspendu': 'error',
    'Indisponible': 'error'
  };


  const variant = variants[status as StatusKey] || variants[statusMap[status as Status]] || variants.default;

  return (
    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${variant} ${className}`}>
      {children}
    </span>
  );
};
