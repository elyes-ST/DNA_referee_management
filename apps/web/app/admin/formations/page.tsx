'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/Form';
import { DeleteModal } from '../../../components/ui/DeleteModel';
import { Pagination } from '../../../components/ui/Pagination';
import {
  FormationsHeader,
  FormationsFilters,
  ConvocationTable,
  ConvocationFormModal,
  GradingModal,
  EVENT_TYPE_OPTIONS,
  getTypeLabel
} from '../../../components/admin/formations';
import { useFormationsData } from '../../../hooks/useFormationsData';
import { useFormationsActions } from '../../../hooks/useFormationsActions';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';

const Formations = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: ''
  });

  // Fetch data
  const { convocations, loading, totalPages, totalItems, refetchConvocations } = useFormationsData(
    currentPage,
    itemsPerPage,
    filters
  );

  // Actions
  const {
    showEventModal,
    setShowEventModal,
    showGradeModal,
    setShowGradeModal,
    showDeleteModal,
    setShowDeleteModal,
    editMode,
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
  } = useFormationsActions(refetchConvocations, convocations, currentPage, setCurrentPage);

  // Form fields
  const eventFields: FormField[] = [
    { name: 'title', label: 'Titre', placeholder: 'Ex: Séminaire FIFA', required: true, className: "col-span-1 md:col-span-2" },
    { name: 'type', label: 'Type', type: 'select', options: EVENT_TYPE_OPTIONS, required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'description', label: 'Description', placeholder: 'Description de l\'événement', required: true, className: "col-span-1 md:col-span-2" },
    { name: 'location', label: 'Lieu', placeholder: 'Ex: Tunis', required: true, className: "col-span-1 md:col-span-2" }
  ];

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ type: '', startDate: '', endDate: '' });
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
    <AuthGuard role={[Role.ADMIN_DNA]}>
    <div className="animate-fadeIn relative">
      <Card className="mb-6">
        <FormationsHeader 
          onAddConvocation={() => {
            resetForm();
            setShowEventModal(true);
          }}
        />

        <FormationsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <ConvocationTable
          convocations={convocations}
          onGrade={openGrading}
          onEdit={openEditModal}
          onDelete={confirmDelete}
          onSendNotification={handleSendNotification}
          sendingNotificationId={sendingNotificationId}
          getTypeLabel={getTypeLabel}
        />

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={totalItems} 
        />
      </Card>

      <ConvocationFormModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          resetForm();
        }}
        title={editMode ? "Modifier la Convocation" : "Nouvelle Convocation"}
        formData={newEvent}
        onChange={(e) => setNewEvent({ ...newEvent, [e.target.id]: e.target.value })}
        onSubmit={handleCreateEvent}
        fields={eventFields}
        loadReferees={loadReferees as any}
      />

      <GradingModal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        event={selectedEvent}
        onGradeChange={handleGradeChange}
      />

      <DeleteModal
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        setEventToDelete={setEventToDelete}
        handleDelete={handleDelete}
        message="Êtes-vous sûr de vouloir supprimer cette convocation ? Cette action est irréversible."
      />
    </div>
    </AuthGuard>
    
    );
};

export default Formations;
