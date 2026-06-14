
import { Modal } from "./Modal";
import { Button } from "./Button";

interface DeleteModalProps {
    showDeleteModal: boolean;
    setShowDeleteModal: (show: boolean) => void;
    setEventToDelete: (id: string | null) => void;
    handleDelete: () => void;
    title?: string;
    message?: string;
}

export const DeleteModal = ({
    showDeleteModal,
    setShowDeleteModal,
    setEventToDelete,
    handleDelete,
    title = "Confirmer la suppression",
    message = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
}: DeleteModalProps) => {
    return (
        <Modal
            isOpen={showDeleteModal}
            onClose={() => {
                setShowDeleteModal(false);
                setEventToDelete(null);
            }}
            title={title}
        >
            <div>
                <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            setShowDeleteModal(false);
                            setEventToDelete(null);
                        }}
                    >
                        Annuler
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleDelete}
                        
                    >
                        Supprimer
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
