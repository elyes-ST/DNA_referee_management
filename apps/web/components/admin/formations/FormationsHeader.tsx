import { Plus } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

interface FormationsHeaderProps {
  onAddConvocation: () => void;
}

export const FormationsHeader = ({ onAddConvocation }: FormationsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h3 className="text-lg font-bold">Formations & Séminaires</h3>
      <Button 
        variant="primary" 
        onClick={onAddConvocation} 
        className="flex items-center justify-center w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Nouvelle Convocation
      </Button>
    </div>
  );
};
