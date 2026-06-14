'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Pagination } from '../../../components/ui/Pagination';
import {
  BookOpen, Video, FileText, Search, ExternalLink,
  Play, Star, Clock, BookMarked,
} from 'lucide-react';
import { api } from '../../../services/api';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  VIDEO:       { label: 'Vidéo',      icon: <Video className="w-4 h-4" />,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
  DOCUMENT:    { label: 'Document',   icon: <FileText className="w-4 h-4" />,   color: 'text-orange-600', bg: 'bg-orange-50' },
  INTERACTIVE: { label: 'Interactif', icon: <BookOpen className="w-4 h-4" />,   color: 'text-purple-600', bg: 'bg-purple-50' },
  QUIZ:        { label: 'Quiz',       icon: <BookMarked className="w-4 h-4" />, color: 'text-green-600',  bg: 'bg-green-50'  },
  WEBINAR:     { label: 'Webinaire',  icon: <Video className="w-4 h-4" />,      color: 'text-pink-600',   bg: 'bg-pink-50'   },
};

const CATEGORY_LABELS: Record<string, string> = {
  RULES:                'Règles',
  POSITIONING:          'Positionnement',
  SIGNALS:              'Signaux',
  PHYSICAL_PREPARATION: 'Prép. Physique',
  PSYCHOLOGY:           'Psychologie',
  VAR:                  'VAR',
  GENERAL:              'Général',
};

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{value.toFixed(1)}</span>
    </div>
  );
}

const ITEMS_PER_PAGE = 6;

export default function RessourcesPage() {
  const [resources, setResources]           = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [search, setSearch]                 = useState('');
  const [typeFilter, setTypeFilter]         = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage]       = useState(1);
  const [ratingTarget, setRatingTarget]     = useState<any>(null);
  const [pendingRating, setPendingRating]   = useState(0);
  const [hoverRating, setHoverRating]       = useState(0);
  const [successMsg, setSuccessMsg]         = useState('');

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.trainingResources.getMy();
      const raw = res.data;
      const items: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setResources(items);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement des ressources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const filtered = resources.filter((r: any) => {
    const matchSearch =
      !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchCat  = categoryFilter === 'all' || r.categories?.includes(categoryFilter);
    return matchSearch && matchType && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleOpen = async (resource: any) => {
    try { await api.trainingResources.incrementView(resource._id); } catch {}
    if (resource.url) window.open(resource.url, '_blank');
  };

  const handleSubmitRating = async () => {
    if (!ratingTarget || pendingRating === 0) return;
    try {
      await api.trainingResources.rate(ratingTarget._id, { rating: pendingRating });
      setSuccessMsg('Évaluation envoyée !');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchResources();
    } catch {}
    setRatingTarget(null);
    setPendingRating(0);
    setHoverRating(0);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  const hasFilters = search || typeFilter !== 'all' || categoryFilter !== 'all';

  return (
    <Card>
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-1">Ressources Pédagogiques</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-sm">Bibliothèque de ressources disponibles pour votre formation</p>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',      count: resources.length,                                         color: 'bg-gray-50 dark:bg-flashscore-hover   text-gray-700 dark:text-gray-300'   },
          { label: 'Vidéos',    count: resources.filter((r: any) => r.type === 'VIDEO').length,   color: 'bg-blue-50   text-blue-700'   },
          { label: 'Documents', count: resources.filter((r: any) => r.type === 'DOCUMENT').length, color: 'bg-orange-50 text-orange-700' },
          { label: 'Quiz',      count: resources.filter((r: any) => r.type === 'QUIZ').length,    color: 'bg-green-50  text-green-700'  },
          { label: 'Webinaires',count: resources.filter((r: any) => r.type === 'WEBINAR').length,  color: 'bg-pink-50   text-pink-700'   },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
            <div className="text-xl font-bold">{s.count}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-flashscore-muted" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm bg-white dark:bg-flashscore-card focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          >
            <option value="all">Tous types</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-200 dark:border-flashscore-border rounded-lg text-sm bg-white dark:bg-flashscore-card focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted border border-gray-200 dark:border-flashscore-border rounded-lg hover:bg-gray-50 dark:bg-flashscore-hover transition-colors"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#ce1126] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 dark:text-flashscore-muted">Chargement des ressources…</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : paginated.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400 dark:text-flashscore-muted">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p className="text-sm">Aucune ressource trouvée.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {paginated.map((resource: any) => {
                const cfg = TYPE_CONFIG[resource.type] ?? {
                  label: resource.type,
                  icon: <BookOpen className="w-4 h-4" />,
                  color: 'text-gray-600 dark:text-gray-400 dark:text-flashscore-muted',
                  bg: 'bg-gray-50 dark:bg-flashscore-hover',
                };
                return (
                  <div
                    key={resource._id}
                    className="border-2 border-gray-100 dark:border-flashscore-border rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-[#ce1126] transition-all duration-300 group flex flex-col"
                  >
                    {/* Thumbnail / icon area */}
                    <div className="relative h-40 bg-gradient-to-br from-[#ce1126]/5 to-[#ce1126]/10 flex items-center justify-center overflow-hidden">
                      {resource.thumbnailUrl ? (
                        <img
                          src={resource.thumbnailUrl}
                          alt={resource.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : resource.type === 'VIDEO' ? (
                        <Video className="w-14 h-14 text-[#ce1126]/30" />
                      ) : (
                        <FileText className="w-14 h-14 text-[#ce1126]/30" />
                      )}

                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className="text-xs px-2.5 py-1 bg-white dark:bg-flashscore-card/90 backdrop-blur-sm text-[#ce1126] rounded-full font-semibold shadow-sm">
                          {cfg.label}
                        </span>
                      </div>

                      {/* Personal badge */}
                      {resource.isPersonal && (
                        <div className="absolute top-2 right-2">
                          <span className="text-xs px-2 py-1 bg-purple-500/90 text-white rounded-full font-medium">
                            Personnel
                          </span>
                        </div>
                      )}

                      {/* Duration */}
                      {resource.duration > 0 && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs px-2.5 py-1 bg-black/70 text-white rounded-full font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {resource.duration} min
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-flashscore-text mb-1.5 line-clamp-2 group-hover:text-[#ce1126] transition-colors">
                        {resource.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-3 line-clamp-2 flex-1">{resource.description}</p>

                      {resource.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.categories.slice(0, 3).map((cat: string) => (
                            <span key={cat} className="text-xs bg-gray-100 dark:bg-flashscore-border text-gray-600 dark:text-gray-400 dark:text-flashscore-muted px-2 py-0.5 rounded-full">
                              {CATEGORY_LABELS[cat] || cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {resource.averageRating > 0 && (
                        <div className="mb-3">
                          <StarRow value={resource.averageRating} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-flashscore-border mt-auto">
                        <span className="text-xs text-gray-400 dark:text-flashscore-muted flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {resource.viewsCount ?? 0} vue{(resource.viewsCount ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setRatingTarget(resource); setPendingRating(0); setHoverRating(0); }}
                            className="p-1.5 text-gray-300 hover:text-amber-400 transition-colors"
                            title="Évaluer"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpen(resource)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#ce1126] rounded-lg hover:bg-[#a50e1f] transition-colors"
                          >
                            {resource.type === 'VIDEO' ? <Play className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                            {resource.type === 'VIDEO' ? 'Voir' : 'Ouvrir'}
                          </button>
                        </div>
                      </div>
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

      {/* Rating modal */}
      <Modal
        isOpen={!!ratingTarget}
        onClose={() => { setRatingTarget(null); setPendingRating(0); setHoverRating(0); }}
        title="Évaluer la Ressource"
      >
        {ratingTarget && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted line-clamp-2">{ratingTarget.title}</p>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setPendingRating(s)}
                  className="transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-9 h-9 ${
                      s <= (hoverRating || pendingRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-flashscore-muted">
              {pendingRating === 0 ? 'Sélectionnez une note' : `Votre note : ${pendingRating}/5`}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setRatingTarget(null); setPendingRating(0); setHoverRating(0); }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-flashscore-border rounded-lg hover:bg-gray-50 dark:bg-flashscore-hover transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={pendingRating === 0}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-[#ce1126] rounded-lg hover:bg-[#a50e1f] disabled:opacity-50 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
    </Card>
  );
}
