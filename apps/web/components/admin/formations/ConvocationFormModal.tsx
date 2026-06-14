import { Modal } from '../../ui/Modal';
import { Form, FormField } from '../../ui/Form';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

interface ConvocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: any;
  onChange: (e: any) => void;
  onSubmit: () => void;
  fields: FormField[];
  loadReferees: (inputValue: string) => Promise<{ value: string; label: string }[]>;
}

export const ConvocationFormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  formData, 
  onChange, 
  onSubmit, 
  fields,
  loadReferees
}: ConvocationFormModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <Form
          fields={fields}
          formData={formData}
          onChange={onChange}
        />
        
        <div className="mt-4">
          <Input
            id="referees"
            type="async-multiselect"
            label="Participants (Arbitres)"
            value={formData.referees}
            loadOptions={loadReferees}
            placeholder="Rechercher des arbitres..."
            onChange={onChange}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-flashscore-border">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={onSubmit}>Valider</Button>
        </div>
      </div>
    </Modal>
  );
};
