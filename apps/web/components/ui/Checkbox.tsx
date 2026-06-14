

const Checkbox = ({
  id,
  label,
  value,
  checked,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  value: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
}) => (
  <div className={`flex items-center gap-2 group cursor-pointer hover:bg-gray-50 dark:bg-flashscore-hover p-2 rounded-md transition-colors ${className}`}>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      value={value}
      className="h-4 w-4 rounded border-gray-300 dark:border-flashscore-border text-[#ce1126] focus:ring-[#ce1126] focus:ring-offset-0 cursor-pointer transition-colors"
    />
    <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none group-hover:text-gray-900 dark:text-flashscore-text font-medium">
      {label}
    </label>
  </div>
);

export default Checkbox;