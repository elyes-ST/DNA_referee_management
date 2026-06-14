import { Card } from '../ui/Card';
export const StatCard = ({ title, value, trend, trendType = 'positive', icon } : { title: string, value: string, trend?: string, trendType?: string, icon: React.ReactNode }) => {
  return (
    <Card className="flex justify-between items-start hover:border-[#ce1126]">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{title}</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-flashscore-text">{value}</div>
        {trend && (
          <span className={`text-xs px-2 py-1 rounded font-semibold w-fit ${
            trendType === 'positive' 
              ? 'text-emerald-600 bg-emerald-50' 
              : 'text-red-600 bg-red-50'
          }`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl opacity-70 grayscale">{icon}</div>
    </Card>
  );
};