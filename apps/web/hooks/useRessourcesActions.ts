import { useState, useCallback } from 'react';
import { debounce } from '../utils/helpers/debounce';
import { api } from '../services/api';
import { toast } from 'sonner';
import { validateForm } from '../utils/helpers/form-validator';

export const useRessourcesActions = (
  refetchResources: () => Promise<void>,
  currentPage: number,
  setCurrentPage: (page: number) => void,
  resources: any[]
) => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingNotificationId, setSendingNotificationId] = useState<string | null>(null);
  
  const [newRes, setNewRes] = useState({ 
    title: '', 
    url: '', 
    description: '',
    type: 'VIDEO',
    categories: [] as string[],
    thumbnailUrl: '',
    duration: 0,
    targetCategories: [] as string[],
    targetRefereeIds: [] as any[]
  });

  const handleAdd = async () => {
    try {
      if (!validateForm(newRes, ['title', 'url', 'description', 'type'])) {
        return;
      }

      if (newRes.categories.length === 0) {
        toast.error('Veuillez sélectionner au moins une catégorie');
        return;
      }
      
      const resourceData = {
        title: newRes.title,
        url: newRes.url,
        description: newRes.description,
        type: newRes.type,
        categories: newRes.categories,
        ...(newRes.thumbnailUrl && { thumbnailUrl: newRes.thumbnailUrl }),
        ...(newRes.duration > 0 && { duration: newRes.duration }),
        ...(newRes.targetCategories.length > 0 && { targetCategories: newRes.targetCategories }),
        ...(newRes.targetRefereeIds.length > 0 && { 
          targetRefereeIds: newRes.targetRefereeIds.map((r: any) => r.value || r),
          isPersonal: true 
        })
      };
      
      if (isEditMode && editingId) {
        await api.trainingResources.update(editingId, resourceData);
        toast.success('Ressource modifiée avec succès');
      } else {
        await api.trainingResources.create(resourceData);
        toast.success('Ressource ajoutée avec succès');
      }
      
      await refetchResources();
      setShowModal(false);
      resetForm();
    } catch (err) {
      let errorMessage = isEditMode && editingId 
        ? "Une erreur est survenue lors de la modification de la ressource." 
        : "Une erreur est survenue lors de la création de la ressource.";
      
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setNewRes({ 
      title: '', 
      url: '', 
      description: '',
      type: 'VIDEO',
      categories: [],
      thumbnailUrl: '',
      duration: 0,
      targetCategories: [],
      targetRefereeIds: []
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleEdit = async (resource: any) => {
    setIsEditMode(true);
    setEditingId(resource._id);
    
    // Default empty
    let populatedReferees: any[] = [];
    
    if (resource.targetRefereeIds && resource.targetRefereeIds.length > 0) {
      try {
        const promises = resource.targetRefereeIds.map((id: string) => 
          api.referees.getOne(id).then(res => {
            const referee = res.data.data || res.data;
            return {
              value: referee._id,
              label: `${referee.userId.firstName} ${referee.userId.lastName} - ${referee.category || 'N/A'} (${referee.matricule || 'N/A'})`
            };
          }).catch(() => ({ value: id, label: id }))
        );
        populatedReferees = await Promise.all(promises);
      } catch (error) {
        console.error("Erreur lors du chargement des arbitres", error);
      }
    }

    setNewRes({
      title: resource.title,
      url: resource.url,
      description: resource.description,
      type: resource.type,
      categories: resource.categories || [],
      thumbnailUrl: resource.thumbnailUrl || '',
      duration: resource.duration || 0,
      targetCategories: resource.targetCategories || [],
      targetRefereeIds: populatedReferees
    });
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setResourceToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      await api.trainingResources.delete(resourceToDelete);
      const isLastItemOnPage = resources.length === 1;
      const shouldGoBack = currentPage > 1 && isLastItemOnPage;

      if (shouldGoBack) {
        setCurrentPage(currentPage - 1);
      } else {
        await refetchResources();
      }
      setShowDeleteModal(false);
      setResourceToDelete(null);
      toast.success('Ressource supprimée avec succès');
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de la suppression de la ressource.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const category = e.target.value;
    const updatedCategories = newRes.categories.includes(category)
      ? newRes.categories.filter(c => c !== category)
      : [...newRes.categories, category];
    setNewRes({ ...newRes, categories: updatedCategories });
  };

  const handleTargetCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const category = e.target.value;
    const updatedTargets = newRes.targetCategories.includes(category)
      ? newRes.targetCategories.filter(c => c !== category)
      : [...newRes.targetCategories, category];
    setNewRes({ ...newRes, targetCategories: updatedTargets });
  };

  const handleIncrementView = (id: string) => {
    api.trainingResources.incrementView(id).catch(console.error);
  };
  const sendNotification = async (ressource:any) => {
    setSendingNotificationId(ressource._id);
    try {
      await api.trainingResources.notifyReferees(ressource._id,{targetAudience: ressource.targetCategories.length > 0 ? ressource.targetCategories : undefined, message: `Une nouvelle ressource a été ajoutée : ${ressource.title}`});
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
    
  const debouncedLoadReferees = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
      try {
        const response = await api.referees.getAll({
          search: inputValue,
          limit: 100
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
    new Promise<{ value: string; label: string }[]>((resolve) => {
      debouncedLoadReferees(inputValue, resolve);
    });
    
  return {
    showModal,
    setShowModal,
    showDeleteModal,
    setShowDeleteModal,
    resourceToDelete,
    setResourceToDelete,
    isEditMode,
    editingId,
    newRes,
    setNewRes,
    handleAdd,
    resetForm,
    handleEdit,
    confirmDelete,
    handleDelete,
    sendNotification,
    sendingNotificationId,
    handleCategoryChange,
    handleTargetCategoryChange,
    handleIncrementView,
    loadReferees
  };
};
