export const Table= ({ headers, children }: { headers: string[], children: React.ReactNode }) => {
  return (
    <div className="overflow-x-auto w-full mb-3">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr className="bg-gray-50 dark:bg-flashscore-card border-b border-gray-200 dark:border-flashscore-border">
            {headers.map((header, index) => (
              <th key={index} className="p-3 text-left font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted whitespace-nowrap">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-flashscore-border">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children }: { children: React.ReactNode }) => {
  return (
    <tr className="hover:bg-gray-50 dark:bg-flashscore-hover dark:hover:bg-flashscore-hover transition-colors ">
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = '', colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) => {
  return (
    <td className={`p-3 ${className || 'text-gray-900 dark:text-flashscore-text'}`} colSpan={colSpan}>
      {children}
    </td>
  );
};