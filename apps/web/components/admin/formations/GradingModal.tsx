import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

interface GradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  referees?: any[];
  onGradeChange: (notes: Record<string, number>) => Promise<void>;
}

export const GradingModal = ({ 
  isOpen, 
  onClose, 
  event, 
  referees,
  onGradeChange 
}: GradingModalProps) => {
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [originalNotes, setOriginalNotes] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event?.attendanceList) {
      const notes: Record<string, string> = {};
      const original: Record<string, number> = {};
      event.attendanceList.forEach((attendance: any) => {
        const refereeId = typeof attendance.refereeId === 'string' 
          ? attendance.refereeId 
          : attendance.refereeId._id;
        if (attendance.note !== undefined && attendance.note !== null) {
          notes[refereeId] = attendance.note.toString();
          original[refereeId] = attendance.note;
        }
      });
      setLocalNotes(notes);
      setOriginalNotes(original);
    } else {
      setLocalNotes({});
      setOriginalNotes({});
    }
  }, [event]);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      const notesToSubmit: Record<string, number> = {};
      
      // Only include notes that have changed or are new
      Object.entries(localNotes).forEach(([refereeId, note]) => {
        if (note && note.trim() !== '') {
          const newNote = parseFloat(note);
          const oldNote = originalNotes[refereeId];
          
          // Check if the note is new or has changed
          if (oldNote === undefined || oldNote !== newNote) {
            notesToSubmit[refereeId] = newNote;
          }
        }
      });
      
      // Only call the API if there are actually changed notes
      if (Object.keys(notesToSubmit).length > 0) {
        await onGradeChange(notesToSubmit);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Noter: ${event?.title || ''}`}
    >
      <div className="space-y-3">
        {(!event?.referees || event.referees.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm text-center py-4">Aucun participant à noter.</p>
        )}
        {event?.referees?.map((ref: any) => {
          const refereeId = typeof ref === 'string' ? ref : ref._id;
          const referee = typeof ref === 'string' 
            ? referees?.find((r: any) => r._id === ref)
            : ref;
          
          if (!referee) return null;
          
          const firstName = referee.userId?.firstName || referee.firstName || '';
          const lastName = referee.userId?.lastName || referee.lastName || '';
          const category = referee.category || referee.grade || '';
          
          const currentNote = localNotes[refereeId] || '';
          
          return (
            <div key={refereeId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-flashscore-hover rounded-md border border-gray-100 dark:border-flashscore-border">
              <div className="flex flex-col">
                <span className="font-medium text-sm text-gray-900 dark:text-flashscore-text">{firstName} {lastName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Arbitre {category}</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="border border-gray-400  rounded-md w-16 p-1.5 text-center text-sm focus:outline-none focus:border-[#ce1126]" 
                  placeholder=""
                  step="0.5"
                  min="0"
                  max="20"
                  value={currentNote}
                  onChange={(e) => setLocalNotes({ ...localNotes, [refereeId]: e.target.value })}
                />
                <span className="text-xs text-gray-400 dark:text-flashscore-muted font-medium">/20</span>
              </div>
            </div>
          );
        })}
        <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-gray-300 dark:border-flashscore-border">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? 'Enregistrement...' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
