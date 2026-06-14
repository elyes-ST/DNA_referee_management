import { useState, useEffect } from 'react'; // 1. Import hooks
import { Button } from './Button';

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void, totalItems: number }) => {
  
  // 2. Initialize with a safe default (e.g., mobile-first)
  const [maxVisible, setMaxVisible] = useState(2);

  
  useEffect(() => {
    // 3. This code only runs in the browser
    const handleResize = () => {
      setMaxVisible(window.innerWidth < 640 ? 2 : 5);
    };

    // Set initial value on mount
    handleResize();

    // Optional: Update value on window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  if (totalPages <= 1) {
    return null;
  }


  const renderPageButtons = () => {
    const buttons = [];
    // 4. Use the state value instead of direct window access
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // ... rest of your render logic remains the same ...
    if (startPage > 1) {
      buttons.push(
        <button key={1} onClick={() => onPageChange(1)} className="btn-pagination">1</button>
      );
      if (startPage > 2) buttons.push(<span key="dots1" className="px-1 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
        buttons.push(
            <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`min-w-[36px] px-3 py-2 rounded-md text-sm font-semibold transition-colors border ${
                    i === currentPage 
                    ? 'bg-[#ce1126] text-white border-[#ce1126]' 
                    : 'bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text border-gray-200 dark:border-flashscore-border hover:bg-[#ce1126] hover:text-white hover:border-[#ce1126]'
                }`}
            >
                {i}
            </button>
        );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push(<span key="dots2" className="px-1 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">...</span>);
      buttons.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="min-w-[36px] px-3 py-2 rounded-md text-sm font-semibold bg-white dark:bg-flashscore-card text-gray-900 dark:text-flashscore-text border border-gray-200 dark:border-flashscore-border hover:bg-[#ce1126] hover:text-white hover:border-[#ce1126] transition-colors">{totalPages}</button>
      );
    }
    
    return buttons;
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-5 pt-5 border-t border-gray-200 dark:border-flashscore-border min-h-[44px]">
      <div className="w-full text-center text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-2 sm:mb-0 sm:w-auto sm:mr-4 sm:order-first">
        Page {currentPage} de {totalPages} ({totalItems} éléments)
      </div>
      
      <Button 
        variant="secondary" 
        className={`px-3 py-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Précédent
      </Button>
      
      <div className="flex items-center gap-1">
        {renderPageButtons()}
      </div>

      <Button 
        variant="secondary"
        className={`px-3 py-2 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Suivant →
      </Button>
    </div>
  );
};