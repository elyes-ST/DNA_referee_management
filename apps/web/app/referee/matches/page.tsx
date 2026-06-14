'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Calendar, MapPin, Trophy, User } from 'lucide-react';
import useApi from '../../../services/useApi';
import { api } from '../../../services/api';

const ROLE_LABELS: Record<string, string> = {
  ARBITRE_CENTRAL:  'Arbitre Central',
  ASSISTANT_1:      'Assistant 1',
  ASSISTANT_2:      'Assistant 2',
  QUATRIEME_ARBITRE:'4ème Arbitre',
  ARBITRE_VAR:      'Arbitre VAR',
  ASSISTANT_VAR:    'Assistant VAR 1',
};

const COMPETITION_LABELS: Record<string, string> = {
  LIGUE1:    'Ligue 1',
  LIGUE2:    'Ligue 2',
  COUPE:     'Coupe de Tunisie',
  AMATEUR_C1:'Amateur C1',
  AMATEUR_C2:'Amateur C2',
  JEUNES:    'Jeunes',
  FEMENINE:  'Féminine',
  REGIONAL:  'Régional',
};

const DESIGNATION_STATUS_MAP: Record<string, { label: string; status: 'success' | 'warning' | 'error' | 'default' }> = {
  CONFIRMED: { label: 'Confirmé',  status: 'success' },
  PROPOSED:  { label: 'En attente', status: 'warning' },
  DECLINED:  { label: 'Refusé',    status: 'error'   },
  REPLACED:  { label: 'Remplacé',  status: 'error'   },
};

const OVERALL_STATUS_MAP: Record<string, { label: string; status: 'success' | 'warning' | 'error' | 'default' }> = {
  DRAFT:     { label: 'Brouillon', status: 'default' },
  SUBMITTED: { label: 'Soumis',   status: 'warning'  },
  VALIDATED: { label: 'Validé',   status: 'success'  },
  COMPLETED: { label: 'Terminé',  status: 'success'  },
  CANCELLED: { label: 'Annulé',   status: 'error'    },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MatchesPage() {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'upcoming' | 'past'>('all');
  const [selected, setSelected] = useState<any>(null);

  const { data: rawDesignations, loading, error } = useApi(() => api.designations.getMyDesignations());
  const { data: profileData }                     = useApi(() => api.referees.getMyProfile());

  const designations: any[] = Array.isArray(rawDesignations)
    ? rawDesignations
    : Array.isArray((rawDesignations as any)?.data)
    ? (rawDesignations as any).data
    : [];

  const myRefereeId = (profileData as any)?._id;
  const now = new Date();

  const getMyEntry = (designation: any) =>
    designation?.referees?.find(
      (r: any) => r.refereeId === myRefereeId || r.refereeId?._id === myRefereeId,
    ) ?? null;

  const filtered = designations
    .filter((d: any) => {
      const match = d.matchId || d.match;
      if (!match) return false;
      const home  = match.homeTeam?.name || match.homeTeam || '';
      const away  = match.awayTeam?.name || match.awayTeam || '';
      const comp  = match.competition || d.category || '';
      const venue = match.venue || match.stade || '';
      if (![home, away, comp, venue].join(' ').toLowerCase().includes(search.toLowerCase())) return false;
      const matchDate = match.date ? new Date(match.date) : null;
      if (filter === 'upcoming' && matchDate && matchDate < now)  return false;
      if (filter === 'past'     && matchDate && matchDate >= now) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      const da = new Date((a.matchId || a.match)?.date || 0).getTime();
      const db = new Date((b.matchId || b.match)?.date || 0).getTime();
      return db - da;
    });

  return (
    <Card>
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">Mes Matchs</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Consultez toutes vos désignations de matchs</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    count: designations.length,                                                                            color: 'bg-blue-50   text-blue-700'  },
          { label: 'Validés', count: designations.filter((d: any) => ['VALIDATED','COMPLETED'].includes(d.status)).length,            color: 'bg-green-50  text-green-700' },
          { label: 'En attente', count: designations.filter((d: any) => ['PROPOSED','SUBMITTED','DRAFT'].includes(getMyEntry(d)?.status ?? d.status)).length,
                                                                                                                                       color: 'bg-amber-50  text-amber-700' },
          { label: 'À venir', count: designations.filter((d: any) => { const dt = (d.matchId||d.match)?.date; return dt && new Date(dt) >= now; }).length,
                                                                                                                                       color: 'bg-purple-50 text-purple-700'},
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Rechercher un match..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 px-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          />
          <div className="flex gap-2">
            {(['all', 'upcoming', 'past'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? 'bg-[#ce1126] text-white' : 'bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-200 dark:bg-flashscore-border'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'upcoming' ? 'À venir' : 'Passés'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#ce1126] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-flashscore-muted">Chargement des désignations…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-flashscore-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Équipes</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Compétition</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Poste</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Lieu</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Désignation</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Mon statut</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d: any) => {
                  const match    = d.matchId || d.match || {};
                  const myEntry  = getMyEntry(d);
                  const home     = match.homeTeam?.name || match.homeTeam || '—';
                  const away     = match.awayTeam?.name || match.awayTeam || '—';
                  const dStatus  = OVERALL_STATUS_MAP[d.status]            || { label: d.status,        status: 'default' as const };
                  const myStatus = myEntry ? (DESIGNATION_STATUS_MAP[myEntry.status] || { label: myEntry.status, status: 'default' as const }) : null;

                  return (
                    <tr key={d._id} className="border-b border-gray-100 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-flashscore-text whitespace-nowrap">
                        <div>{formatDate(match.date)}</div>
                        <div className="text-xs text-gray-400 dark:text-flashscore-muted">{formatTime(match.date)}</div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-flashscore-text">
                        {home} <span className="text-gray-400 dark:text-flashscore-muted font-normal">vs</span> {away}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                        <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3" />{COMPETITION_LABELS[match.competition || d.category] || match.competition || d.category || '—'}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                        {myEntry ? (ROLE_LABELS[myEntry.role] || myEntry.role) : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{match.stadium || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={dStatus.status}>{dStatus.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        {myStatus
                          ? <Badge status={myStatus.status}>{myStatus.label}</Badge>
                          : <span className="text-gray-400 dark:text-flashscore-muted text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelected(d)}
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
                    <td colSpan={8} className="py-10 text-center text-sm text-gray-400 dark:text-flashscore-muted">Aucun match trouvé.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de la Désignation"
      >
        {selected && (() => {
          const m        = selected.matchId || selected.match || {};
          const myEntry  = getMyEntry(selected);
          const home     = m.homeTeam?.name || m.homeTeam || '—';
          const away     = m.awayTeam?.name || m.awayTeam || '—';
          const dStatus  = OVERALL_STATUS_MAP[selected.status] || { label: selected.status, status: 'default' as const };
          const myStatus = myEntry ? (DESIGNATION_STATUS_MAP[myEntry.status] || { label: myEntry.status, status: 'default' as const }) : null;
          return (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-flashscore-hover rounded-xl p-4">
                <p className="text-base font-semibold text-gray-900 dark:text-flashscore-text mb-2">{home} vs {away}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(m.date)} {formatTime(m.date)}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{m.stadium || '—'}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-4 h-4" />{COMPETITION_LABELS[m.competition || selected.category] || m.competition || selected.category || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Désignation', content: <Badge status={dStatus.status}>{dStatus.label}</Badge> },
                  { label: 'Mon Statut',  content: myStatus ? <Badge status={myStatus.status}>{myStatus.label}</Badge> : <span className="text-gray-400 dark:text-flashscore-muted text-xs">—</span> },
                  { label: 'Mon Poste',   content: <p className="text-sm font-medium">{myEntry ? (ROLE_LABELS[myEntry.role] || myEntry.role) : '—'}</p> },
                  { label: 'Catégorie',   content: <p className="text-sm font-medium">{COMPETITION_LABELS[selected.category] || selected.category || '—'}</p> },
                ].map((row) => (
                  <div key={row.label} className="bg-gray-50 dark:bg-flashscore-hover rounded-xl p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">{row.label}</p>
                    {row.content}
                  </div>
                ))}
              </div>

              {selected.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Notes</p>
                  <p className="text-sm text-amber-700">{selected.notes}</p>
                </div>
              )}

              {selected.referees?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Équipe Arbitrale</p>
                  <div className="space-y-2">
                    {selected.referees.map((r: any, i: number) => {
                      const refName = r.refereeId?.userId?.firstName
                        ? `${r.refereeId.userId.firstName} ${r.refereeId.userId.lastName}`
                        : '—';
                      const rStatus = DESIGNATION_STATUS_MAP[r.status] || { label: r.status, status: 'default' as const };
                      return (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-flashscore-hover rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 dark:text-flashscore-muted" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-flashscore-text">{refName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{ROLE_LABELS[r.role] || r.role}</p>
                            </div>
                          </div>
                          <Badge status={rStatus.status}>{rStatus.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
    </Card>
  );
}
