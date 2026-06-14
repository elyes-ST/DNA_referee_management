
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Modal } from "../../ui/Modal";
import { Form , FormField } from "../../ui/Form";
import { CATEGORY_OPTIONS, RESOURCE_TYPE_OPTIONS , REFEREE_CATEGORY_OPTIONS } from "./constants";
export const RessourceAddModal = ({showModal, setShowModal, resetForm, isEditMode, newRes, setNewRes,
     handleCategoryChange, handleTargetCategoryChange, handleAdd }: any) => {

    
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

                {/* Target Referee Categories Section */}
                <div className="mt-4 border-t border-gray-200 dark:border-flashscore-border pt-4">
                    <Input
                        type="checkbox"
                        id="targetCategories"
                        label="Catégories d'arbitres ciblées"
                        value={newRes.targetCategories}
                        options={REFEREE_CATEGORY_OPTIONS}
                        onChange={handleTargetCategoryChange}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">Optionnel - sélectionnez les niveaux d'arbitres concernés</p>
                </div>
                    
                <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-flashscore-border">
                    <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
                    <Button onClick={handleAdd}>{isEditMode ? 'Modifier' : 'Ajouter'}</Button>
                </div>
                
            </Modal>


    )
};