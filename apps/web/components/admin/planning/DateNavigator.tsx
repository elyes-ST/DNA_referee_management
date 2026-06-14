import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateNavigatorProps {
  selectedDate: Date | null;
  onPrevious: () => void;
  onNext: () => void;
}

export const DateNavigator = ({ selectedDate, onPrevious, onNext }: DateNavigatorProps) => {
  const formatDateHeader = (date: Date | null) => {
    if (!date) return "Toutes les dates";
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button 
        onClick={onPrevious}
        disabled={!selectedDate}
        className={`p-2 rounded-lg transition-colors ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:bg-flashscore-border'}`}
      >
        <ChevronLeft className={`w-5 h-5 ${!selectedDate ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-flashscore-muted'}`} />
      </button>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-flashscore-text min-w-[300px] text-center capitalize">
        {formatDateHeader(selectedDate)}
      </h3>
      <button 
        onClick={onNext}
        disabled={!selectedDate}
        className={`p-2 rounded-lg transition-colors ${!selectedDate ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:bg-flashscore-border'}`}
      >
        <ChevronRight className={`w-5 h-5 ${!selectedDate ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400 dark:text-flashscore-muted'}`} />
      </button>
    </div>
  );
};
