'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import {
  Target, Clock, Star, CheckCircle, Bell, Calendar,
  ChevronRight, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { StatCard } from '../../../components/admin/StatCard';
import useApi from '../../../services/useApi';
import { api } from '../../../services/api';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; badge: 'success' | 'warning' | 'error' | 'default' }> = {
  CONFIRMED: { label: 'Confirmé',   badge: 'success' },
  VALIDATED: { label: 'Validé',     badge: 'success' },
  PROPOSED:  { label: 'En attente', badge: 'warning' },
  SUBMITTED: { label: 'En attente', badge: 'warning' },
  DECLINED:  { label: 'Refusé',     badge: 'error'   },
};

const NOTIF_TYPE_COLORS: Record<string, string> = {
  DESIGNATION:  'bg-blue-50  text-blue-700',
  PAYMENT:      'bg-green-50 text-green-700',
  TRAINING:     'bg-purple-50 text-purple-700',
  AVAILABILITY: 'bg-amber-50 text-amber-700',
  SYSTEM:       'bg-gray-50 dark:bg-flashscore-hover   text-gray-700 dark:text-gray-300',
};

export default function RefereeDashboard() {
  const router = useRouter();

  const { data: profileData }  = useApi(() => api.referees.getMyProfile());
  const { data: myStats }      = useApi(() => api.statistics.getMy());
  const { data: convocations } = useApi(() => api.convocations.getMyUpcoming());
  const { data: rawDesig }     = useApi(() => api.designations.getMyDesignations());
  const { data: rawNotifs, refetch: refetchNotifs } = useApi(() => api.notifications.getMy());

  const profile     = profileData as any;
  const user        = profile?.userId;
  const myRefereeId = profile?._id;

  // Designations: pick PROPOSED ones (awaiting referee action)
  const designations: any[] = Array.isArray(rawDesig)
    ? rawDesig
    : Array.isArray((rawDesig as any)?.data) ? (rawDesig as any).data : [];
  const pendingDesig = designations.filter((d: any) => {
    const entry = d.referees?.find(
      (r: any) => r.refereeId === myRefereeId || r.refereeId?._id === myRefereeId,
    );
    return entry?.status === 'PROPOSED';
  });

  // Notifications
  const notifications: any[] = Array.isArray(rawNotifs)
    ? rawNotifs
    : Array.isArray((rawNotifs as any)?.data) ? (rawNotifs as any).data : [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Local state
  const [selectedDesig, setSelectedDesig] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getNoteTrend = (note: number) => {
    if (note >= 4)   return { trend: '↑ Excellente',  trendType: 'positive' as const };
    if (note >= 2.5) return { trend: '→ Moyenne',      trendType: 'neutral'  as const };
    return              { trend: '↓ Faible',         trendType: 'negative' as const };
  };

  // ── Accept / Decline designation ─────────────────────────────────────────
  const handleValidate = async (designationId: string, status: 'CONFIRMED' | 'DECLINED') => {
    setActionLoading(true);
    try {
      await api.designations.validate(designationId, { status });
      toast.success(status === 'CONFIRMED' ? 'Désignation acceptée !' : 'Désignation refusée.');
      setSelectedDesig(null);
      // Reload page to refresh data (simple approach compatible with useApi)
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la mise à jour de la désignation');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Mark notification as read ────────────────────────────────────────────
  const handleMarkRead = async (notifId: string) => {
    try {
      await api.notifications.markAsRead(notifId);
      refetchNotifs();
    } catch {
      // silent
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">
            Bienvenue, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Voici un aperçu de vos statistiques et prochains matchs</p>
        </div>

        {/* Pending-designation alert banner */}
        {pendingDesig.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-700">
              {pendingDesig.length} désignation{pendingDesig.length > 1 ? 's' : ''} en attente de réponse
            </p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Matchs Arbitrés"
          value={(profile?.statistics?.matchesCount ?? 0).toString()}
          trend="Total cumulé"
          trendType="positive"
          icon={<Target className="w-8 h-8 text-blue-500" />}
        />
        <StatCard
          title="Convocations à Venir"
          value={(Array.isArray(convocations) ? (convocations as any[]).length : 0).toString()}
          trend="⏳ À venir"
          trendType="neutral"
          icon={<Clock className="w-8 h-8 text-amber-500" />}
        />
        <StatCard
          title="Note Moyenne"
          value={(profile?.statistics?.averageNote?.toFixed(2) ?? '0.00')}
          trend={getNoteTrend(profile?.statistics?.averageNote ?? 0).trend}
          trendType={getNoteTrend(profile?.statistics?.averageNote ?? 0).trendType}
          icon={<Star className="w-8 h-8 text-yellow-500" />}
        />
        <StatCard
          title="Disponibilité"
          value={profile?.isAvailable ? 'Disponible' : 'Indisponible'}
          trend={profile?.isAvailable ? '↑ Prêt pour matchs' : '✗ Non disponible'}
          trendType={profile?.isAvailable ? 'positive' : 'negative'}
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Upcoming matches ───────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Prochains Matchs</h3>
              <button
                onClick={() => router.push('/referee/matches')}
                className="text-sm text-[#ce1126] font-medium hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-flashscore-border">
                    {['Date', 'Équipes', 'Compétition', 'Statut', ''].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(convocations) && (convocations as any[]).length > 0 ? (
                    (convocations as any[]).slice(0, 5).map((conv: any) => {
                      const match = conv.matchId || conv.match || {};
                      const home  = match.homeTeam?.name || match.homeTeam || '—';
                      const away  = match.awayTeam?.name || match.awayTeam || '—';
                      const date  = match.date
                        ? new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                        : '—';
                      const myEntry = conv.referees?.find(
                        (r: any) => r.refereeId === myRefereeId || r.refereeId?._id === myRefereeId,
                      );
                      const rawStatus = myEntry?.status ?? conv.status ?? '';
                      const si = STATUS_MAP[rawStatus] ?? { label: rawStatus, badge: 'default' as const };
                      const isPending = rawStatus === 'PROPOSED';

                      return (
                        <tr key={conv._id} className="border-b border-gray-50 hover:bg-gray-50 dark:bg-flashscore-hover transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-700 dark:text-gray-300">{date}</td>
                          <td className="py-3 px-3 text-sm font-medium text-gray-900 dark:text-flashscore-text">{home} vs {away}</td>
                          <td className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{match.competition || '—'}</td>
                          <td className="py-3 px-3">
                            <Badge status={si.badge}>{si.label}</Badge>
                          </td>
                          <td className="py-3 px-3">
                            {isPending && (
                              <button
                                onClick={() => setSelectedDesig(conv)}
                                className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                              >
                                Répondre
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-400 dark:text-flashscore-muted">
                        Aucun match à venir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ── Notifications feed ─────────────────────────────────────────── */}
        <div>
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#ce1126]" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-[#ce1126] text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-flashscore-muted text-center py-8">Aucune notification</p>
              ) : (
                notifications.slice(0, 10).map((n: any) => {
                  const colorClass = NOTIF_TYPE_COLORS[n.type] || NOTIF_TYPE_COLORS.SYSTEM;
                  return (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        n.isRead
                          ? 'border-gray-100 dark:border-flashscore-border bg-white dark:bg-flashscore-card'
                          : 'border-amber-100 bg-amber-50 hover:bg-amber-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${colorClass}`}>
                            {n.type?.replace(/_/g, ' ') || 'SYSTÈME'}
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-flashscore-text truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#ce1126] mt-1.5" />
                        )}
                      </div>
                      {n.createdAt && (
                        <p className="text-xs text-gray-400 dark:text-flashscore-muted mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* ── Accept / Decline Designation Modal ─────────────────────────── */}
      <Modal
        isOpen={!!selectedDesig}
        onClose={() => setSelectedDesig(null)}
        title="Répondre à la Désignation"
      >
        {selectedDesig && (() => {
          const match = selectedDesig.matchId || selectedDesig.match || {};
          const home  = match.homeTeam?.name || match.homeTeam || '—';
          const away  = match.awayTeam?.name || match.awayTeam || '—';
          const date  = match.date
            ? new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
            : '—';
          const myEntry = selectedDesig.referees?.find(
            (r: any) => r.refereeId === myRefereeId || r.refereeId?._id === myRefereeId,
          );

          return (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-flashscore-hover rounded-xl p-4">
                <p className="text-base font-semibold text-gray-900 dark:text-flashscore-text mb-1">{home} vs {away}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> {date}
                </p>
                {match.stadium && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">📍 {match.stadium}</p>
                )}
                {match.competition && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-0.5">🏆 {match.competition}</p>
                )}
              </div>

              {myEntry && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                  <strong>Votre poste :</strong>{' '}
                  {{
                    ARBITRE_CENTRAL:   'Arbitre Central',
                    ASSISTANT_1:       'Assistant 1',
                    ASSISTANT_2:       'Assistant 2',
                    QUATRIEME_ARBITRE: '4ème Arbitre',
                    ARBITRE_VAR:       'Arbitre VAR',
                    ASSISTANT_VAR:     'Assistant VAR',
                  }[myEntry.role as string] || myEntry.role}
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                Voulez-vous accepter ou refuser cette désignation ?
              </p>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleValidate(selectedDesig._id, 'DECLINED')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <ThumbsDown className="w-4 h-4" /> Refuser
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleValidate(selectedDesig._id, 'CONFIRMED')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ThumbsUp className="w-4 h-4" /> Accepter
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}