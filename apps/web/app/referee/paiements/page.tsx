'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import useApi from '../../../services/useApi';
import { api } from '../../../services/api';

const PAYMENT_STATUS: Record<string, { label: string; status: 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING: { label: 'En attente', status: 'warning' },
  VALIDATED: { label: 'Validé', status: 'info' },
  PAID: { label: 'Payé', status: 'success' },
  REJECTED: { label: 'Rejeté', status: 'error' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Virement Bancaire',
  CASH: 'Espèces',
  CHECK: 'Chèque',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 }).format(amount || 0);
}

function PaymentDetailModal({ payment, onClose }: { payment: any; onClose: () => void }) {
  const s = PAYMENT_STATUS[payment.status] || { label: payment.status, status: 'info' };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-flashscore-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-flashscore-border">
          <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Détail du Paiement</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-flashscore-border transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Period */}
          <div className="bg-gray-50 dark:bg-flashscore-hover rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {payment.label || `${formatDate(payment.startDate)} – ${formatDate(payment.endDate)}`}
              </p>
              <Badge status={s.status as any}>{s.label}</Badge>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Du {formatDate(payment.startDate)}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Au {formatDate(payment.endDate)}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Détail Financier</p>
            {[
              { label: 'Matchs arbitrés', value: `${payment.totalMatches} match(s)`, mono: false },
              { label: 'Montant de base', value: formatCurrency(payment.baseAmount), mono: true },
              { label: 'Bonus', value: `+ ${formatCurrency(payment.bonuses)}`, mono: true, positive: true },
              { label: 'Déductions', value: `- ${formatCurrency(payment.deductions)}`, mono: true, negative: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-flashscore-border">
                <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{row.label}</span>
                <span className={`text-sm font-medium ${row.positive ? 'text-green-600' : row.negative ? 'text-red-500' : 'text-gray-900 dark:text-flashscore-text'}`}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-3 bg-gray-50 dark:bg-flashscore-hover rounded-xl px-3 mt-2">
              <span className="text-sm font-bold text-gray-900 dark:text-flashscore-text">Total Net</span>
              <span className="text-lg font-bold text-[#ce1126]">{formatCurrency(payment.totalAmount)}</span>
            </div>
          </div>

          {/* Payment info */}
          {(payment.paymentMethod || payment.paidAt || payment.referenceNumber) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Informations de Paiement</p>
              {payment.paymentMethod && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Méthode</span>
                  <span className="font-medium text-gray-900 dark:text-flashscore-text">{PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Date de paiement</span>
                  <span className="font-medium text-gray-900 dark:text-flashscore-text">{formatDate(payment.paidAt)}</span>
                </div>
              )}
              {payment.referenceNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Référence</span>
                  <span className="font-medium text-gray-900 dark:text-flashscore-text font-mono">{payment.referenceNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
              <p className="text-sm text-amber-700">{payment.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaiementsPage() {
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: profileData } = useApi(() => api.referees.getMyProfile());
  const refereeId = (profileData as any)?._id;

  const { data: rawPayments, loading, error } = useApi(
    () => api.payments.getByReferee(refereeId),
    [refereeId],
  );

  const payments: any[] = Array.isArray(rawPayments) ? rawPayments : [];

  const totalPaid = payments.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalPending = payments.filter((p) => p.status === 'PENDING' || p.status === 'VALIDATED').reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const totalMatches = payments.reduce((acc, p) => acc + (p.totalMatches || 0), 0);

  const filtered = payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  return (
    <Card>
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">Mes Paiements</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Consultez l'historique et l'état de vos paiements</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Perçu',
            value: formatCurrency(totalPaid),
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-50',
            text: 'text-green-700',
          },
          {
            label: 'En Attente',
            value: formatCurrency(totalPending),
            icon: <Clock className="w-5 h-5 text-amber-500" />,
            bg: 'bg-amber-50',
            text: 'text-amber-700',
          },
          {
            label: 'Matchs Comptabilisés',
            value: totalMatches.toString(),
            icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
            text: 'text-blue-700',
          },
          {
            label: 'Bulletins',
            value: payments.length.toString(),
            icon: <FileText className="w-5 h-5 text-purple-500" />,
            bg: 'bg-purple-50',
            text: 'text-purple-700',
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className="flex-shrink-0">{s.icon}</div>
            <div>
              <div className={`text-xl font-bold ${s.text}`}>{s.value}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Card>
        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(['all', 'PENDING', 'VALIDATED', 'PAID', 'REJECTED'] as const).map((f) => {
            const label = f === 'all' ? 'Tous' : (PAYMENT_STATUS[f]?.label || f);
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f ? 'bg-[#ce1126] text-white' : 'bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-200 dark:bg-flashscore-border'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#ce1126] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-flashscore-muted">Chargement des paiements…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-flashscore-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Période</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Matchs</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Montant Base</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Bonus</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Total Net</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Payé le</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment: any) => {
                  const pStatus = PAYMENT_STATUS[payment.status] || { label: payment.status, status: 'info' };
                  return (
                    <tr key={payment._id} className="border-b border-gray-100 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-flashscore-text">
                          {payment.label || `${formatDate(payment.startDate)}`}
                        </div>
                        {!payment.label && (
                          <div className="text-xs text-gray-400 dark:text-flashscore-muted">→ {formatDate(payment.endDate)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-center">{payment.totalMatches}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{formatCurrency(payment.baseAmount)}</td>
                      <td className="py-3 px-4 text-sm">
                        {payment.bonuses > 0 && (
                          <span className="text-green-600">+{formatCurrency(payment.bonuses)}</span>
                        )}
                        {payment.deductions > 0 && (
                          <span className="text-red-500 ml-1">-{formatCurrency(payment.deductions)}</span>
                        )}
                        {!payment.bonuses && !payment.deductions && <span className="text-gray-400 dark:text-flashscore-muted">—</span>}
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-flashscore-text">{formatCurrency(payment.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <Badge status={pStatus.status as any}>{pStatus.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                        {payment.paidAt ? formatDate(payment.paidAt) : <span className="text-gray-400 dark:text-flashscore-muted">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(payment)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-[#ce1126] rounded-lg hover:bg-[#a50e1f] transition-colors"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-flashscore-muted">
                        <DollarSign className="w-8 h-8" />
                        <span className="text-sm">Aucun paiement trouvé.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} />
      )}
    </div>
    </Card>
  );
}
