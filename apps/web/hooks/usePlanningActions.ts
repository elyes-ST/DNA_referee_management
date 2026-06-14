import { useState } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { validateForm } from '../utils/helpers/form-validator';
import { getSaisonFromDate } from '../utils/helpers/season-from-date';
import { allowedCategoriesForRole, allowedLeaguesForRole } from '../utils/helpers/permissions';
import {useUser} from "./useUser";


export const usePlanningActions = (
  refetchMatches: () => Promise<void>, 
  teams: any[],
  matches: any[],
  currentPage: number,
  setCurrentPage: (page: number) => void
) => {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newMatch, setNewMatch] = useState({
    matchNumber: '',
    journee: 1,
    saison: getSaisonFromDate(),
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    stadium: '',
    competition: allowedLeaguesForRole(user?.role)?.[0] ?? undefined,
    category: allowedCategoriesForRole(user?.role)?.[0] ?? undefined,
    hasVAR: false
  });

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.matches.import(formData);
        const result = response.data;
        
        await refetchMatches();
        
        if (result.failed > 0) {
          console.error("Erreurs d'import:", result.errors);
          const firstError = result.errors[0]?.error || "Erreur inconnue";
          toast.error(`${result.failed} matchs n'ont pas pu être importés. (ex: ${firstError})`);
        }
        
        if (result.success > 0) {
          toast.success(`${result.success} matchs importés avec succès`);
        } else if (result.failed === 0) {
          toast.info("Aucun match à importer ou format invalide.");
        }
      } catch (err) {
        let errorMessage = "Une erreur est survenue lors de l'import du fichier CSV.";
        if (err && typeof err === "object" && "response" in err) {
          const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
          if (maybeResponse?.data?.message) {
            errorMessage = maybeResponse.data.message;
          }
        }
        toast.error(errorMessage);
      }
    };
    input.click();
  };

  const startEdit = (match: any) => {
    setEditingId(match._id);
    // homeTeam/awayTeam may be a populated object or a plain string
    const homeTeamName = typeof match.homeTeam === 'object' ? match.homeTeam?.name : match.homeTeam;
    const awayTeamName = typeof match.awayTeam === 'object' ? match.awayTeam?.name : match.awayTeam;
    // homeTeamId/awayTeamId may be a populated object or a plain ObjectId string
    const homeTeamId = typeof match.homeTeamId === 'object' ? match.homeTeamId?._id : match.homeTeamId;
    const awayTeamId = typeof match.awayTeamId === 'object' ? match.awayTeamId?._id : match.awayTeamId;
    setEditForm({
      date: match.date.split('T')[0],
      time: match.time,
      stadium: match.stadium,
      matchNumber: match.matchNumber,
      journee: match.journee,
      homeTeamId,
      awayTeamId,
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      competition: match.competition,
      category: match.category,
      hasVAR: match.hasVAR,
      status: match.status || 'SCHEDULED',
      homeScore: match?.score?.homeScore || 0,
      awayScore: match?.score?.awayScore || 0
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    try {
      if (!validateForm(editForm, ['matchNumber', 'homeTeam', 'awayTeam', 'date', 'time', 'stadium'])) {
        return;
      }
      
      const { homeScore, awayScore, ...restForm } = editForm;
      const updateData = {
        ...restForm,
        score: {
          homeScore: parseInt(homeScore) || 0,
          awayScore: parseInt(awayScore) || 0
        }
      };
      
      await api.matches.update(editingId!, updateData);
      await refetchMatches();
      setEditingId(null);
      setIsEditModalOpen(false);
      toast.success('Match mis à jour avec succès');
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de la mise à jour du match.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const confirmDeleteMatch = (matchId: string) => {
    setMatchToDelete(matchId);
    setShowDeleteModal(true);
  };

  const handleDeleteMatch = async () => {
    if (!matchToDelete) return;
    try {
      await api.matches.delete(matchToDelete);
      const isLastItemOnPage = matches.length === 1;
      if (isLastItemOnPage && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      else {
        await refetchMatches();
      }
      setShowDeleteModal(false);
      setMatchToDelete(null);
      toast.success('Match supprimé avec succès');
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de la suppression du match.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleAddMatch = async () => {
    try {
      const { hasVAR, ...rest } = newMatch;
      if (!validateForm(rest, ['matchNumber', 'homeTeamId', 'awayTeamId', 'date', 'time', 'stadium'])) {
        return;
      }

      await api.matches.create(newMatch);
      await refetchMatches();
      setNewMatch({
        matchNumber: '',
        journee: 1,
        saison: getSaisonFromDate(),
        homeTeamId: '',
        awayTeamId: '',
        date: '',
        time: '',
        stadium: '',
        competition: allowedLeaguesForRole(user?.role)?.[0] ?? undefined,
        category: allowedCategoriesForRole(user?.role)?.[0] ?? undefined,
        hasVAR: false
      });
      setIsModalOpen(false);
      toast.success('Match ajouté avec succès');
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors de l'ajout du match.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
    }
  };

  const handleEditFormChange = (e: any) => {
    if (e.target.extraData) {
      setEditForm({ ...editForm, [e.target.id]: e.target.value, ...e.target.extraData });
    } else if (e.target.id === 'hasVAR') {
      setEditForm({ ...editForm, hasVAR: e.target.value });
    } else {
      setEditForm({ ...editForm, [e.target.id]: e.target.value });
    }
  };

  const handleNewMatchChange = (e: any) => {
    if (e.target.id === 'hasVAR') {
      setNewMatch({ ...newMatch, hasVAR: e.target.value });
    } else {
      setNewMatch({ ...newMatch, [e.target.id]: e.target.value });
    }
  };

  return {
    // Modal states
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    showDeleteModal,
    setShowDeleteModal,
    matchToDelete,
    setMatchToDelete,
    
    // Form states
    editingId,
    editForm,
    newMatch,
    
    // Actions
    handleImport,
    startEdit,
    saveEdit,
    confirmDeleteMatch,
    handleDeleteMatch,
    handleAddMatch,
    handleEditFormChange,
    handleNewMatchChange
  };
};
