'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { DeleteModal } from '../../../components/ui/DeleteModel';
import { Pagination } from '../../../components/ui/Pagination';
import { RessourceAddModal } from '../../../components/admin/ressources/RessourceAddModel';
import {
  RessourcesHeader,
  RessourcesFilters,
  ResourceGrid,
  CATEGORY_OPTIONS
} from '../../../components/admin/ressources';
import { useRessourcesData } from '../../../hooks/useRessourcesData';
import { useRessourcesActions } from '../../../hooks/useRessourcesActions';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';

const Ressources = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    targetAudience: '',
    search: ''
  });

  // Fetch data
  const { resources, loading, totalPages, totalItems, refetchResources } = useRessourcesData(
    currentPage,
    itemsPerPage,
    filters
  );

  // Actions
  const {
    showModal,
    setShowModal,
    showDeleteModal,
    setShowDeleteModal,
    resourceToDelete,
    setResourceToDelete,
    isEditMode,
    newRes,
    setNewRes,
    handleAdd,
    resetForm,
    handleEdit,
    confirmDelete,
    handleDelete,
    handleCategoryChange,
    handleTargetCategoryChange,
    sendNotification,
    sendingNotificationId,
    handleIncrementView,
    loadReferees
  } = useRessourcesActions(refetchResources, currentPage, setCurrentPage, resources);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ type: '', category: '', targetAudience: '', search: '' });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="animate-fadeIn flex justify-center items-center h-64">
        <div className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Chargement...</div>
      </div>
    );
  }

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA]}>
    <div className="animate-fadeIn relative">
      <Card className="mb-6">
        <RessourcesHeader 
          onAddResource={() => {
            resetForm();
            setShowModal(true);
          }}
        />

        <RessourcesFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <ResourceGrid 
          resources={resources}
          loading={loading}
          categoryOptions={CATEGORY_OPTIONS}
          onEdit={handleEdit}
          onDelete={confirmDelete}
          onSendNotification={sendNotification}
          sendingNotificationId={sendingNotificationId}
          onIncrementView={handleIncrementView}
        />
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={totalItems} 
        />
      </Card>

      <RessourceAddModal
        showModal={showModal}
        setShowModal={setShowModal}
        resetForm={resetForm}
        isEditMode={isEditMode}
        newRes={newRes}
        setNewRes={setNewRes}
        handleCategoryChange={handleCategoryChange}
        handleTargetCategoryChange={handleTargetCategoryChange}
        handleAdd={handleAdd}
        loadReferees={loadReferees}
      />

      <DeleteModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setEventToDelete={setResourceToDelete}
        handleDelete={handleDelete}
        message="Êtes-vous sûr de vouloir supprimer cette ressource ? Cette action est irréversible."
      />
    </div>
    </AuthGuard>
    );
    
};

export default Ressources;
