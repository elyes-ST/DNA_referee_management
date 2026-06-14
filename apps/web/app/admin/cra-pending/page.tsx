'use client';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { Modal } from '../../../components/ui/Modal';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';
import { toast } from 'sonner';
import {
  AlertCircle, CheckCircle, XCircle, Calendar, User, Clock, MapPin, FileText,
} from 'lucide-react';

const TYPE_LABELS: Record<string, { label: string; color: 'error' | 'warning' | 'default' | 'success' }> = {
  UNAVAILABLE: { label: 'Indisponible',     color: 'default'  },
  INJURED:     { label: 'Blessure',         color: 'error'    },
  EXCUSED:     { label: 'Excuse',           color: 'warning'  },
  SUSPENDED:   { label: 'Suspension',       color: 'error'    },
  SICK:        { label: 'Maladie',          color: 'warning'  },
  PERSONAL:    { label: 'Raison personnelle', color: 'default' },
};

const STATUS_LABELS: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  PENDING:  { label: 'En attente', color: 'warning' },
  APPROVED: { label: 'Approuvé',   color: 'success' },
  REJECTED: { label: 'Rejeté',     color: 'error'   },
};

const CraPendingPage = () => {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter) params.status = statusFilter;

      // Use the dedicated CRA endpoint to get pending reports for their region
      const response = await api.availability.getCraPending(params);
      const data = response.data;
      const items = Array.isArray(data) ? data : (data?.data || data?.availabilities || []);
      setAvailabilities(items);
      setTotalItems(data?.total || items.length);
      setTotalPages(data?.totalPages || Math.ceil((data?.total || items.length) / itemsPerPage) || 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du chargement des disponibilités');
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailabilities();
  }, [currentPage, statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.availability.approve(id);
      toast.success('Disponibilité approuvée');
      fetchAvailabilities();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    if (!rejectReason.trim()) {
      toast.error('Veuillez saisir une raison de rejet');
      return;
    }
    setActionLoading(true);
    try {
      await api.availability.reject(selectedRecord._id, { reason: rejectReason });
      toast.success('Disponibilité rejetée');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRecord(null);
      fetchAvailabilities();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthGuard role={[Role.ADMIN_DNA, Role.CRA]}>
      <div className="animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-[#ce1126]" />
            Excuses & Blessures des Arbitres
          </h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">
            Consultez et traitez les déclarations d'indisponibilité soumises par les arbitres de votre région.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <Card className="mb-6">
          <div className="flex gap-2 border-b border-gray-100 dark:border-flashscore-border pb-4">
            {[
              { id: 'PENDING',  label: 'En attente' },
              { id: 'APPROVED', label: 'Approuvées' },
              { id: 'REJECTED', label: 'Rejetées'   },
              { id: '',         label: 'Toutes'      },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-[#ce1126] text-white'
                    : 'text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:bg-flashscore-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ce1126]" />
            </div>
          ) : (
            <>
              <Table headers={['Arbitre', 'Type', 'Période', 'Raison', 'Statut', 'Actions']}>
                {availabilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 dark:text-flashscore-muted py-12">
                      Aucune déclaration trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  availabilities.map((item: any) => {
                    const referee = item.refereeId;
                    const fullName = referee?.userId
                      ? `${referee.userId.firstName} ${referee.userId.lastName}`
                      : referee?.firstName
                        ? `${referee.firstName} ${referee.lastName}`
                        : 'N/A';
                    const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'default' as const };
                    const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'default' as const };
                    const dateFrom = item.dateFrom ? new Date(item.dateFrom).toLocaleDateString('fr-FR') : '-';
                    const dateTo   = item.dateTo   ? new Date(item.dateTo).toLocaleDateString('fr-FR')   : '-';

                    return (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-flashscore-text">{fullName}</div>
                          {referee?.matricule && (
                            <div className="text-xs text-gray-400 dark:text-flashscore-muted font-mono">{referee.matricule}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge status={typeInfo.color}>{typeInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                            <Calendar className="w-3 h-3 text-gray-400 dark:text-flashscore-muted" />
                            {dateFrom} → {dateTo}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted max-w-xs truncate">{item.reason || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge status={statusInfo.color}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* View details */}
                            <button
                              onClick={() => { setSelectedRecord(item); setShowDetailModal(true); }}
                              className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Voir les détails"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Approve — only for PENDING */}
                            {item.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(item._id)}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                                  title="Approuver"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => { setSelectedRecord(item); setShowRejectModal(true); }}
                                  disabled={actionLoading}
                                  className="p-1.5 rounded-lg bg-transparent border-none cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  title="Rejeter"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                  />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setSelectedRecord(null); }}
          title="Détail de la déclaration"
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide mb-1">Arbitre</p>
                  <p className="font-semibold text-gray-900 dark:text-flashscore-text">
                    {selectedRecord.refereeId?.userId
                      ? `${selectedRecord.refereeId.userId.firstName} ${selectedRecord.refereeId.userId.lastName}`
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-flashscore-muted font-mono">{selectedRecord.refereeId?.matricule}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide mb-1">Type</p>
                  <Badge status={TYPE_LABELS[selectedRecord.type]?.color || 'default'}>
                    {TYPE_LABELS[selectedRecord.type]?.label || selectedRecord.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide mb-1">Période</p>
                  <p className="font-semibold text-gray-900 dark:text-flashscore-text flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-flashscore-muted" />
                    {selectedRecord.dateFrom ? new Date(selectedRecord.dateFrom).toLocaleDateString('fr-FR') : '-'}
                    {' → '}
                    {selectedRecord.dateTo ? new Date(selectedRecord.dateTo).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide mb-1">Statut</p>
                  <Badge status={STATUS_LABELS[selectedRecord.status]?.color || 'default'}>
                    {STATUS_LABELS[selectedRecord.status]?.label || selectedRecord.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-flashscore-muted uppercase tracking-wide mb-1">Raison</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-flashscore-hover rounded-lg p-3">{selectedRecord.reason || 'Non précisée'}</p>
              </div>

              {selectedRecord.rejectionReason && (
                <div>
                  <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-1">Motif de rejet</p>
                  <p className="text-sm text-red-700 bg-red-50 rounded-lg p-3">{selectedRecord.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                {selectedRecord.status === 'PENDING' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                    >
                      Rejeter
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => { handleApprove(selectedRecord._id); setShowDetailModal(false); }}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Approuver
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Fermer</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => { setShowRejectModal(false); setRejectReason(''); }}
          title="Rejeter la déclaration"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
              Veuillez indiquer la raison du rejet de cette déclaration d'indisponibilité.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motif de rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ex: Pièce justificative manquante..."
                className="w-full px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>
                Annuler
              </Button>
              <Button variant="primary" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
                <XCircle className="w-4 h-4 mr-1" /> Confirmer le rejet
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthGuard>
  );
};

export default CraPendingPage;
