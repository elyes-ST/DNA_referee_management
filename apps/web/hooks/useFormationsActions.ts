import { useCallback, useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { validateForm } from '../utils/helpers/form-validator';
import { debounce } from '../utils/helpers/debounce';

export const useFormationsActions = (
  refetchConvocations: () => Promise<void>,
  convocations: any[],
  currentPage: number,
  setCurrentPage: (page: number) => void
) => {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [sendingNotificationId, setSendingNotificationId] = useState<string | null>(null);
  
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    type: 'SEMINAR', 
    date: '', 
    location: '', 
    description: '', 
    referees: [] as { value: string; label: string }[] | string[]
  });

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        type: newEvent.type,
        date: newEvent.date,
        location: newEvent.location,
        description: newEvent.description,
        referees: newEvent.referees.map((r: any) => typeof r === 'string' ? r : r.value)
      };
      
      if(!validateForm(eventData, ['title', 'type','date', 'location', 'description'])) {
        return;
      }

      if (editMode && editingId) {
        await api.convocations.update(editingId, eventData);
        toast.success('Convocation modifiée avec succès');
      } else {
        await api.convocations.create(eventData);
        toast.success('Convocation créée avec succès');
      }
      
      await refetchConvocations();
      setShowEventModal(false);
      resetForm();
    } catch (err) {
      let errorMessage = editMode && editingId 
        ? "Une erreur est survenue lors de la modification de la convocation." 
        : "Une erreur est survenue lors de la création de la convocation.";
      
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const openEditModal = (event: any) => {
    setEditMode(true);
    setEditingId(event._id);
    
    const refereeOptions = (event.referees || []).map((r: any) => {
      if (typeof r === 'string') return { value: r, label: r };
      return {
        value: r._id,
        label: `${r.userId?.firstName || ''} ${r.userId?.lastName || ''} - ${r.category || 'N/A'} (${r.matricule || 'N/A'})`
      };
    }).filter((r: any) => r.value);
    
    setNewEvent({
      title: event.title,
      type: event.type,
      date: event.date.split('T')[0],
      location: event.location,
      description: event.description,
      referees: refereeOptions
    });
    setShowEventModal(true);
  };

  const resetForm = () => {
    setEditMode(false);
    setEditingId(null);
    setNewEvent({ 
      title: '', 
      type: 'SEMINAR', 
      date: '', 
      location: '', 
      description: '', 
      referees: [] 
    });
  };

  const confirmDelete = (id: string) => {
    setEventToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await api.convocations.delete(eventToDelete);
      const isLastItemOnPage = (convocations.length === 1);
      if (isLastItemOnPage && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      else {
        await refetchConvocations();
      }
      setShowDeleteModal(false);
      setEventToDelete(null);
      toast.success('Convocation supprimée avec succès');
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de la suppression de la convocation.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleRefereeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const refereeIds = e.target.value;
    setNewEvent({ ...newEvent, referees: Array.isArray(refereeIds) ? refereeIds : [] });
  };

  const debouncedLoadReferees = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
      try {
        const response = await api.referees.getAll({
          search: inputValue,
          limit: 10
        });
      callback(response.data.data.map((referee: any) => ({
        value: referee._id,
        label: `${referee.userId.firstName} ${referee.userId.lastName} - ${referee.category || 'N/A'} (${referee.matricule || 'N/A'})`
      })));
    } catch (error) {
      console.error('Error loading referees:', error);
      callback([]);
    }
  }, 500), []
);
 const loadReferees = (inputValue: string) => 
  new Promise((resolve) => {
    debouncedLoadReferees(inputValue, resolve);
  });

  const openGrading = (event: any) => {
    setSelectedEvent(event);
    setShowGradeModal(true);
  };

  const handleGradeChange = async (notes: Record<string, number>) => {
    try {
      // Send all notes in sequence
      for (const [refereeId, note] of Object.entries(notes)) {
        await api.convocations.addNote(selectedEvent._id, {
          refereeId,
          note
        });
      }
      await refetchConvocations();
      toast.success('Notes enregistrées avec succès');
    } catch (error) {
      console.error('Error updating grades:', error);
      toast.error('Erreur lors de l\'enregistrement des notes');
    }
  };

  const handleSendNotification = async (convocationId: string) => {
    setSendingNotificationId(convocationId);
    try {
      await api.convocations.sendNotifications(convocationId);
      toast.success('Notifications envoyées avec succès');
    } catch (error) {
      console.error('Error sending notifications:', error);
      let errorMessage = 'Erreur lors de l\'envoi des notifications';
      if (error && typeof error === 'object' && 'response' in error) {
        const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setSendingNotificationId(null);
    }
  };

  return {
    showEventModal,
    setShowEventModal,
    showGradeModal,
    setShowGradeModal,
    showDeleteModal,
    setShowDeleteModal,
    editMode,
    editingId,
    eventToDelete,
    setEventToDelete,
    selectedEvent,
    newEvent,
    setNewEvent,
    handleCreateEvent,
    openEditModal,
    resetForm,
    confirmDelete,
    handleDelete,
    handleRefereeChange,
    openGrading,
    handleGradeChange,
    handleSendNotification,
    sendingNotificationId,
    loadReferees
  };
};
