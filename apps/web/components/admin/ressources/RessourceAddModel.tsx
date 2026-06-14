
import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";
import { Form , FormField } from "../../ui/Form";
import { X, Search, Loader2 } from "lucide-react";
import { CATEGORY_OPTIONS, RESOURCE_TYPE_OPTIONS , REFEREE_CATEGORY_OPTIONS } from "./constants";

export const RessourceAddModal = ({showModal, setShowModal, resetForm, isEditMode, newRes, setNewRes,
     handleCategoryChange, handleTargetCategoryChange, handleAdd, loadReferees }: any) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{value: string, label: string}[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!showModal) {
            setSearchTerm('');
            setSearchResults([]);
            return;
        }

        let isActive = true;
        const fetchReferees = async () => {
            setIsSearching(true);
            const results = await loadReferees(searchTerm);
            if (isActive) {
                setSearchResults(results);
                setIsSearching(false);
            }
        };
        
        const timeoutId = setTimeout(() => {
            fetchReferees();
        }, 300);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [searchTerm, loadReferees, showModal]);

    const handleSelectReferee = (referee: {value: string, label: string}) => {
        const existing = newRes.targetRefereeIds || [];
        if (!existing.find((r: any) => (r.value || r) === referee.value)) {
            setNewRes({ ...newRes, targetRefereeIds: [...existing, referee] });
        }
        setSearchTerm('');
    };

    const handleRemoveReferee = (valToRemove: string) => {
        const existing = newRes.targetRefereeIds || [];
        setNewRes({
            ...newRes,
            targetRefereeIds: existing.filter((r: any) => (r.value || r) !== valToRemove)
        });
    };
    
    const resourceFields: FormField[] = [
            { name: 'title', label: 'Titre', placeholder: 'Ex: Analyse Vidéo...', required: true, className: "col-span-1 md:col-span-2" },
            { name: 'type', label: 'Type', type: 'select', options: RESOURCE_TYPE_OPTIONS, required: true },
            { name: 'duration', label: 'Durée (minutes)', type: 'number', placeholder: 'Pour les vidéos/webinaires' },
            { name: 'url', label: 'URL', type: 'url', placeholder: 'https://...', required: true, className: "col-span-1 md:col-span-2" },
            { name: 'thumbnailUrl', label: 'URL Miniature', type: 'url', placeholder: 'https://...', className: "col-span-1 md:col-span-2" },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brève description du contenu...', required: true, className: "col-span-1 md:col-span-2" }
        ];

    return (
        <Modal
            isOpen={showModal}
            onClose={() => { setShowModal(false); resetForm(); }}
            title={isEditMode ? "Modifier la Ressource" : "Ajouter une Ressource"}
        >
            <Form 
                fields={resourceFields}
                formData={newRes}
                onChange={(e) => setNewRes({...newRes, [e.target.id]: e.target.value})}
            />
            
            {/* Categories Section */}
            <div className="mt-4 border-t border-gray-200 dark:border-flashscore-border pt-4">
                <Input
                    type="checkbox"
                    id="categories"
                    label="Catégories"
                    required={true}
                    value={newRes.categories}
                    options={CATEGORY_OPTIONS}
                    onChange={handleCategoryChange}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">Au moins une catégorie requise</p>
            </div>

            {/* Target Audience Section */}
            <div className="mt-4 border-t border-gray-200 dark:border-flashscore-border pt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-flashscore-text mb-3">Audience cible (Optionnel)</h4>
                
                <div className="space-y-4">
                    <div>
                        <Input
                            type="checkbox"
                            id="targetCategories"
                            label="Catégories d'arbitres ciblées"
                            value={newRes.targetCategories}
                            options={REFEREE_CATEGORY_OPTIONS}
                            onChange={handleTargetCategoryChange}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arbitres spécifiques</label>
                        
                        {/* Selected Referees Badges */}
                        {newRes.targetRefereeIds && newRes.targetRefereeIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {newRes.targetRefereeIds.map((r: any) => (
                                    <div key={r.value || r} className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-[#ce1126] dark:text-red-400 px-2.5 py-1 rounded-full text-xs font-medium border border-red-100 dark:border-red-900/30">
                                        <span>{r.label || r}</span>
                                        <button type="button" onClick={() => handleRemoveReferee(r.value || r)} className="hover:text-red-700 dark:hover:text-red-300">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher un arbitre par nom ou matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-flashscore-border rounded-md text-sm bg-gray-50 dark:bg-flashscore-card focus:outline-none focus:border-[#ce1126] focus:bg-white dark:focus:bg-flashscore-base transition-colors"
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </div>

                        {/* Search Results Inline List */}
                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-flashscore-border rounded-md bg-white dark:bg-flashscore-card">
                            {searchResults.length === 0 && !isSearching ? (
                                <div className="p-3 text-sm text-gray-500 text-center">Aucun arbitre trouvé</div>
                            ) : (
                                <ul className="divide-y divide-gray-100 dark:divide-flashscore-border">
                                    {searchResults.map((referee) => {
                                        const isSelected = newRes.targetRefereeIds?.find((r: any) => (r.value || r) === referee.value);
                                        return (
                                            <li key={referee.value}>
                                                <button
                                                    type="button"
                                                    onClick={() => !isSelected && handleSelectReferee(referee)}
                                                    disabled={isSelected}
                                                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                                                        isSelected 
                                                            ? 'bg-gray-50 dark:bg-flashscore-base text-gray-400 cursor-not-allowed' 
                                                            : 'hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-700 dark:text-gray-200'
                                                    }`}
                                                >
                                                    <span>{referee.label}</span>
                                                    {isSelected && <span className="text-xs text-gray-400">Déjà ajouté</span>}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-2">Cliquez sur un arbitre dans la liste pour l'ajouter.</p>
                    </div>
                </div>
            </div>
                
            <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-flashscore-border">
                <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                <Button onClick={handleAdd}>{isEditMode ? 'Modifier' : 'Ajouter'}</Button>
            </div>
            
        </Modal>
    )
};