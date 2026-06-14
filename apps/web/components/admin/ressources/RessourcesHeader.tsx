import { Plus, Video } from 'lucide-react';
import { Button } from '../../ui/Button';

interface RessourcesHeaderProps {
  onAddResource: () => void;
}

export const RessourcesHeader = ({ onAddResource }: RessourcesHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-300 dark:border-flashscore-border pb-3">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Video className="w-6 h-6 text-[#ce1126]" />
        Ressources Pédagogiques
      </h3>
      <Button onClick={onAddResource} className="flex items-center justify-center w-full sm:w-auto">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter Ressource
      </Button>
    </div>
  );
};
