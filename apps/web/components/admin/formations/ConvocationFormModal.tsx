import { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Form, FormField } from '../../ui/Form';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';

interface ConvocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: any;
  onChange: (e: any) => void;
  onSubmit: () => void;
  fields: FormField[];
  loadReferees: (inputValue: string) => Promise<{ value: string; label: string }[]>;
  searchBulkReferees?: (filters: any) => Promise<{ value: string; label: string }[]>;
}

export const ConvocationFormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  formData, 
  onChange, 
  onSubmit, 
  fields,
  loadReferees,
  searchBulkReferees
}: ConvocationFormModalProps) => {
  const [showBulk, setShowBulk] = useState(false);
  const [bulkFilters, setBulkFilters] = useState({ category: '', region: '', maxAge: '', minAge: '' });
  const [bulkResults, setBulkResults] = useState<{ value: string; label: string }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleBulkSearch = async () => {
    if (searchBulkReferees) {
      setIsSearching(true);
      const results = await searchBulkReferees(bulkFilters);
      setBulkResults(results);
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  const handleBulkAddAll = () => {
    if (bulkResults.length === 0) return;

    // Merge without duplicates
    const existingIds = new Set(formData.referees.map((r: any) => r.value || r));
    const newReferees = bulkResults.filter(r => !existingIds.has(r.value));
    
    // Create a fake event object to pass to onChange
    onChange({
      target: {
        id: 'referees',
        value: [...formData.referees, ...newReferees]
      }
    });

    setBulkResults([]);
    setHasSearched(false);
    setBulkFilters({ category: '', region: '', maxAge: '', minAge: '' });
    setShowBulk(false);
  };

  const CATEGORIES = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'A', label: 'Catégorie A' },
    { value: 'B', label: 'Catégorie B' },
    { value: 'C1', label: 'Catégorie C1' },
    { value: 'C2', label: 'Catégorie C2' },
    { value: 'JEUNE', label: 'Jeune' },
    { value: 'FEMININE', label: 'Féminine' },
    { value: 'REGIONAL', label: 'Régionale' },
  ];

  const REGIONS = [
    { value: '', label: 'Toutes les régions' },
    { value: 'Tunis', label: 'Tunis' },
    { value: 'Sfax', label: 'Sfax' },
    { value: 'Sousse', label: 'Sousse' },
    { value: 'Gabes', label: 'Gabes' },
    { value: 'Bizerte', label: 'Bizerte' },
    { value: 'Nabeul', label: 'Nabeul' },
    { value: 'Kairouan', label: 'Kairouan' },
    { value: 'Gafsa', label: 'Gafsa' },
    { value: 'Monastir', label: 'Monastir' },
    { value: 'Mahdia', label: 'Mahdia' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <Form
          fields={fields}
          formData={formData}
          onChange={onChange}
        />
        
        {/* Bulk Selection Section */}
        <div className="mt-6 border border-gray-200 dark:border-flashscore-border rounded-xl overflow-hidden">
          <button 
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-flashscore-bg hover:bg-gray-100 dark:hover:bg-flashscore-border/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-flashscore-text">
              <Users className="w-4 h-4 text-[#ce1126]" />
              Sélection Groupée Avancée
            </div>
            {showBulk ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          
          {showBulk && (
            <div className="p-4 bg-white dark:bg-flashscore-card border-t border-gray-200 dark:border-flashscore-border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="bulk-category"
                  type="select"
                  label="Catégorie"
                  options={CATEGORIES}
                  value={bulkFilters.category}
                  onChange={(e: any) => setBulkFilters({ ...bulkFilters, category: e.target.value })}
                />
                <Input
                  id="bulk-region"
                  type="select"
                  label="Région"
                  options={REGIONS}
                  value={bulkFilters.region}
                  onChange={(e: any) => setBulkFilters({ ...bulkFilters, region: e.target.value })}
                />
                <Input
                  id="bulk-minAge"
                  type="number"
                  label="Âge Min"
                  placeholder="Ex: 18"
                  value={bulkFilters.minAge}
                  onChange={(e: any) => setBulkFilters({ ...bulkFilters, minAge: e.target.value })}
                />
                <Input
                  id="bulk-maxAge"
                  type="number"
                  label="Âge Max"
                  placeholder="Ex: 23"
                  value={bulkFilters.maxAge}
                  onChange={(e: any) => setBulkFilters({ ...bulkFilters, maxAge: e.target.value })}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="primary" onClick={handleBulkSearch} className="text-[13px]" disabled={isSearching}>
                  {isSearching ? 'Recherche...' : 'Rechercher'}
                </Button>
              </div>

              {/* Preview Results */}
              {hasSearched && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-flashscore-text">
                      Résultats trouvés : <span className="font-bold">{bulkResults.length}</span>
                    </span>
                    {bulkResults.length > 0 && (
                      <Button variant="primary" onClick={handleBulkAddAll} className="text-[12px] px-3 py-1.5 h-auto">
                        Ajouter ces {bulkResults.length} arbitres
                      </Button>
                    )}
                  </div>
                  
                  {bulkResults.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-flashscore-bg border border-gray-200 dark:border-flashscore-border rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {bulkResults.map((r) => (
                          <span key={r.value} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-white dark:bg-flashscore-card border border-gray-200 dark:border-flashscore-border text-gray-700 dark:text-flashscore-text">
                            {r.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[13px] text-gray-500">
                      Aucun arbitre trouvé pour ces critères.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Input
            id="referees"
            type="async-multiselect"
            label="Ajout manuel (Arbitres)"
            value={formData.referees}
            loadOptions={loadReferees}
            placeholder="Rechercher des arbitres..."
            onChange={onChange}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-flashscore-border">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={onSubmit}>Valider la Convocation</Button>
        </div>
      </div>
    </Modal>
  );
};
