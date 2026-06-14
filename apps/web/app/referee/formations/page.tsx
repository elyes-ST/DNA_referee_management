'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import {
  GraduationCap,
  Users,
  MessageSquare,
  Calendar,
  MapPin,
  Clock,
  BookOpen,
} from 'lucide-react';
import useApi from '../../../services/useApi';
import { api } from '../../../services/api';

const TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  badgeStatus: 'success' | 'warning' | 'info' | 'default';
  bg: string;
  iconColor: string;
}> = {
  TRAINING: {
    label: 'Formation',
    icon: <GraduationCap className="w-5 h-5" />,
    badgeStatus: 'success',
    bg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  SEMINAR: {
    label: 'Séminaire',
    icon: <BookOpen className="w-5 h-5" />,
    badgeStatus: 'info',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  MEETING: {
    label: 'Réunion',
    icon: <Users className="w-5 h-5" />,
    badgeStatus: 'warning',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date();
}

const ITEMS_PER_PAGE = 6;

export default function FormationsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: rawData, loading, error } = useApi(() => api.convocations.getMy());

  const convocations: any[] = React.useMemo(() => {
    const raw = (rawData as any);
    return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  }, [rawData]);

  const filtered = convocations.filter((c: any) => {
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    const matchTime =
      timeFilter === 'all' ||
      (timeFilter === 'upcoming' && isUpcoming(c.date)) ||
      (timeFilter === 'past' && !isUpcoming(c.date));
    return matchType && matchTime;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = {
    total: convocations.length,
    training: convocations.filter((c: any) => c.type === 'TRAINING').length,
    seminar: convocations.filter((c: any) => c.type === 'SEMINAR').length,
    meeting: convocations.filter((c: any) => c.type === 'MEETING').length,
    upcoming: convocations.filter((c: any) => isUpcoming(c.date)).length,
  };

  return (
    <Card>
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">Mes Formations & Convocations</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Retrouvez toutes vos formations, séminaires et réunions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',       count: stats.total,    color: 'bg-gray-50 dark:bg-flashscore-hover   text-gray-700 dark:text-gray-300'   },
          { label: 'Formations',  count: stats.training, color: 'bg-green-50  text-green-700'  },
          { label: 'Séminaires',  count: stats.seminar,  color: 'bg-blue-50   text-blue-700'   },
          { label: 'Réunions',    count: stats.meeting,  color: 'bg-amber-50  text-amber-700'  },
          { label: 'À venir',     count: stats.upcoming, color: 'bg-purple-50 text-purple-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <div className="text-xl font-bold">{s.count}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="flex flex-wrap gap-2">
            {(['all', 'TRAINING', 'SEMINAR', 'MEETING'] as const).map((f) => {
              const label = f === 'all' ? 'Tous types' : (TYPE_CONFIG[f]?.label || f);
              return (
                <button
                  key={f}
                  onClick={() => { setTypeFilter(f); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === f ? 'bg-[#ce1126] text-white' : 'bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-200 dark:bg-flashscore-border'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            {([
              { key: 'all',      label: 'Toutes dates' },
              { key: 'upcoming', label: 'À venir' },
              { key: 'past',     label: 'Passées' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => { setTimeFilter(f.key); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeFilter === f.key ? 'bg-gray-700 text-white' : 'bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-200 dark:bg-flashscore-border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#ce1126] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-flashscore-muted">Chargement des formations…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{typeof error === 'string' ? error : 'Erreur lors du chargement.'}</div>
        ) : paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400 dark:text-flashscore-muted">
            <GraduationCap className="w-12 h-12 opacity-30" />
            <p className="text-sm">Aucune convocation trouvée.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {paginated.map((conv: any) => {
                const cfg = TYPE_CONFIG[conv.type] ?? {
                  label: conv.type,
                  icon: <MessageSquare className="w-5 h-5" />,
                  badgeStatus: 'default' as const,
                  bg: 'bg-gray-50 dark:bg-flashscore-hover',
                  iconColor: 'text-gray-600 dark:text-gray-400 dark:text-flashscore-muted',
                };
                const upcoming = isUpcoming(conv.date);
                return (
                  <div
                    key={conv._id}
                    onClick={() => setSelected(conv)}
                    className="border-2 border-gray-100 dark:border-flashscore-border rounded-xl p-5 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-[#ce1126] transition-all duration-300 group flex flex-col gap-3"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className={`w-10 h-10 ${cfg.bg} ${cfg.iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge status={cfg.badgeStatus as any}>{cfg.label}</Badge>
                        {upcoming ? (
                          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">À venir</span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-flashscore-muted font-medium">Passée</span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-gray-900 dark:text-flashscore-text group-hover:text-[#ce1126] transition-colors line-clamp-2">
                      {conv.title}
                    </h4>

                    {/* Description */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted line-clamp-2">{conv.description}</p>

                    {/* Meta */}
                    <div className="space-y-1.5 mt-auto pt-3 border-t border-gray-100 dark:border-flashscore-border">
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                        <Calendar className="w-3.5 h-3.5 text-[#ce1126] flex-shrink-0" />
                        <span>{formatDateShort(conv.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                        <MapPin className="w-3.5 h-3.5 text-[#ce1126] flex-shrink-0" />
                        <span className="truncate">{conv.location}</span>
                      </div>
                      {conv.referees?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                          <Users className="w-3.5 h-3.5 text-[#ce1126] flex-shrink-0" />
                          <span>{conv.referees.length} arbitre(s) convoqué(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Détail'}
      >
        {selected && (() => {
          const cfg = TYPE_CONFIG[selected.type] ?? {
            label: selected.type,
            icon: <MessageSquare className="w-5 h-5" />,
            badgeStatus: 'default' as const,
            bg: 'bg-gray-50 dark:bg-flashscore-hover',
            iconColor: 'text-gray-600 dark:text-gray-400 dark:text-flashscore-muted',
          };
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${cfg.bg} ${cfg.iconColor} rounded-xl flex items-center justify-center`}>
                  {cfg.icon}
                </div>
                <Badge status={cfg.badgeStatus as any}>{cfg.label}</Badge>
                {isUpcoming(selected.date) ? (
                  <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">À venir</span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-flashscore-muted font-medium bg-gray-100 dark:bg-flashscore-border px-2 py-0.5 rounded-full">Passée</span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{selected.description}</p>

              <div className="bg-gray-50 dark:bg-flashscore-hover rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-[#ce1126]" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-flashscore-muted mb-0.5">Date</p>
                    <p className="font-medium text-gray-900 dark:text-flashscore-text">{formatDate(selected.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-[#ce1126]" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-flashscore-muted mb-0.5">Lieu</p>
                    <p className="font-medium text-gray-900 dark:text-flashscore-text">{selected.location}</p>
                  </div>
                </div>
                {selected.referees?.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-[#ce1126]" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-flashscore-muted mb-0.5">Arbitres convoqués</p>
                      <p className="font-medium text-gray-900 dark:text-flashscore-text">{selected.referees.length} arbitre(s)</p>
                    </div>
                  </div>
                )}
              </div>

              {selected.attendanceList?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Présence</p>
                  <div className="space-y-2">
                    {selected.attendanceList.map((att: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-flashscore-border last:border-0">
                        <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                          {typeof att.refereeId === 'object' ? (att.refereeId?.firstName + ' ' + att.refereeId?.lastName) : att.refereeId}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${att.attended ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {att.attended ? 'Présent' : 'Absent'}
                        </span>
                      </div>
                    ))}
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
