'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

// label mapping based on backend enums
const availabilityTypes = [
  { value: 'UNAVAILABLE', label: 'Indisponibilité' },
  { value: 'INJURED', label: 'Blessure' },
  { value: 'EXCUSED', label: 'Excuse' },
  { value: 'SUSPENDED', label: 'Suspension' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'PERSONAL', label: 'Raison personnelle' },
];

const statusMap: Record<string, { label: string; status: string }> = {
  PENDING: { label: 'En attente', status: 'warning' },
  APPROVED: { label: 'Actif', status: 'success' },
  REJECTED: { label: 'Rejeté', status: 'error' },
};

interface Period {
  id: string;
  dateDebut: string;
  dateFin: string;
  type: string;
  reason?: string;
  status: string;
}

const initialPeriods: Period[] = [];

export default function page() {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [form, setForm] = useState({
    dateDebut: '',
    dateFin: '',
    type: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // helper to transform API object to local period
  const mapAvailability = (a: any): Period => ({
    id: a._id,
    dateDebut: new Date(a.dateFrom).toLocaleDateString('fr-FR'),
    dateFin: new Date(a.dateTo).toLocaleDateString('fr-FR'),
    type: a.type,
    reason: a.reason,
    status: a.status,
  });

  // pagination slice
  const paginatedPeriods = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return periods.slice(start, start + itemsPerPage);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.availability.getMy();
        const data = res.data;
        const items = Array.isArray(data) ? data : data.availabilities || [];
        setPeriods(items.map(mapAvailability));
      } catch (err: any) {
        console.error('Failed to load availabilities', err);
        toast.error(err?.response?.data?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


  const handleAdd = async () => {
    if (!form.dateDebut || !form.dateFin || !form.type || !form.reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      const res = await api.availability.report({
        dateFrom: form.dateDebut,
        dateTo: form.dateFin,
        type: form.type,
        reason: form.reason,
      });
      
      const newItem = mapAvailability(res.data);
      setPeriods((prev) => [newItem, ...prev]);
      setForm({ dateDebut: '', dateFin: '', type: '', reason: '' });
      toast.success('Disponibilité enregistrée');
    } catch (err: any) {
      console.error('Add availability failed', err);
      toast.error(err?.response?.data?.message || 'Erreur lors de l’ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.availability.delete(id);
      setPeriods((prev) => prev.filter((p) => p.id !== id));
      toast.success('Période supprimée');
    } catch (err: any) {
      console.error('Delete failure', err);
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">Gestion de Disponibilité</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Indiquez vos périodes de disponibilité pour les matchs</p>
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h4 className="text-base font-semibold text-gray-900 dark:text-flashscore-text mb-4">Déclarer une indisponibilité</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de Début</label>
            <input
              type="date"
              value={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de Fin</label>
            <input
              type="date"
              value={form.dateFin}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          >
            <option value="">--Sélectionner--</option>
            {availabilityTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Raison</label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
            rows={3}
          />
        </div>

        <button
          onClick={handleAdd}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#ce1126] text-white text-sm font-medium rounded-lg hover:bg-[#a50e1f] transition-colors disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          Déclarer
        </button>
      </Card>

      {/* Periods Table */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-4">Mes déclarations</h3>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-flashscore-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Début</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Fin</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Raison</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPeriods().map((p) => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-flashscore-text">{p.dateDebut}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-flashscore-text">{p.dateFin}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-flashscore-text">
                    {availabilityTypes.find(t => t.value === p.type)?.label || p.type}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{p.reason || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge status={statusMap[p.status]?.status as any || 'default'}>
                      {statusMap[p.status]?.label || p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {periods.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400 dark:text-flashscore-muted">
                    Aucune période de disponibilité enregistrée.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400 dark:text-flashscore-muted">
                    Chargement…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(periods.length / itemsPerPage)}
          totalItems={periods.length}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>
    </div>
  );
}