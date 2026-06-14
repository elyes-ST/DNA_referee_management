export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-flashscore-card rounded-lg shadow-xl w-full max-w-2xl animate-scaleIn my-8 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-flashscore-border flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 dark:text-flashscore-muted hover:text-gray-600 dark:text-gray-400 dark:text-flashscore-muted dark:hover:text-gray-300">✕</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
