'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../../components/admin/StatCard';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
  FileText, Users, Target, Clock,
  AlertCircle, DollarSign, FileCheck,
  TrendingUp, Calendar, CheckCircle2,
} from 'lucide-react';
import { useDashboardData, useMatchesChart, useRefereePerformanceChart } from '../../../hooks/useDashboardData';
import { MatchesChart } from '../../../components/admin/MatchesChart';
import { RefereePerformanceChart } from '../../../components/admin/RefereePerformanceChart';
import { RefereeCategoryChart } from '../../../components/admin/RefereeCategoryChart';
import { Role } from '../../../types/user';
import { useUser } from '../../../hooks/useUser';
import useApi from '../../../services/useApi';
import { api } from '../../../services/api';

/** Maps commission role → its primary referee category filter */
const ROLE_CATEGORY: Partial<Record<Role, string>> = {
  [Role.CAA]:  'C1,C2',
  [Role.CAJ]:  'JEUNE',
  [Role.CAF]:  'FEMININE',
  [Role.CRA]:  'REGIONAL',
};

const ROLE_LABELS: Partial<Record<Role, string>> = {
  [Role.CAA]:  'Amateur (C1 & C2)',
  [Role.CAJ]:  'Jeunes',
  [Role.CAF]:  'Féminines',
  [Role.CRA]:  'Régional',
  [Role.CDC]:  'Commissaires',
  [Role.CDE]:  'Examens',
  [Role.INSPECTEUR]: 'Inspection',
};

// ─────────────────────────────────────────────────────────────────────────────
// Commission dashboard — fully data-driven, no quick-links
// ─────────────────────────────────────────────────────────────────────────────

// Map role → backend competition values (matches API uses competition, not category)
const ROLE_COMPETITIONS: Partial<Record<Role, string[]>> = {
  [Role.CAA]: ['AMATEUR_C1', 'AMATEUR_C2'],
  [Role.CAJ]: ['JEUNES'],
  [Role.CAF]: ['FEMININE'],
  [Role.CRA]: ['REGIONAL'],
};

function Kpi({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-2">{label}</p>
      <p className="text-4xl font-black mb-1">{value ?? '—'}</p>
      <p className="text-xs opacity-60">{sub}</p>
    </div>
  );
}

const CommissionDashboard = ({ role }: { role: Role }) => {
  const label     = ROLE_LABELS[role]     || '';
  const category  = ROLE_CATEGORY[role]  || '';
  const comps     = ROLE_COMPETITIONS[role] || [];
  const comp1     = comps[0];
  const comp2     = comps[1] ?? null;

  // ── Permitted API calls only ────────────────────────────────────────────────
  const { data: profile }     = useApi(() => api.users.getMyProfile());
  // Upcoming matches — split for CAA (C1 + C2), single for others
  const { data: sched1 }      = useApi(() => comp1 ? api.matches.getAll({ competition: comp1, status: 'SCHEDULED', limit: 5, page: 1 }) : Promise.resolve({ data: { total: 0, data: [] } }), [comp1]);
  const { data: sched2 }      = useApi(() => comp2 ? api.matches.getAll({ competition: comp2, status: 'SCHEDULED', limit: 5, page: 1 }) : Promise.resolve({ data: { total: 0, data: [] } }), [comp2]);
  // Completed matches this season
  const { data: done1 }       = useApi(() => comp1 ? api.matches.getAll({ competition: comp1, status: 'COMPLETED', limit: 1, page: 1 }) : Promise.resolve({ data: { total: 0 } }), [comp1]);
  const { data: done2 }       = useApi(() => comp2 ? api.matches.getAll({ competition: comp2, status: 'COMPLETED', limit: 1, page: 1 }) : Promise.resolve({ data: { total: 0 } }), [comp2]);
  // Designations — category-scoped
  const { data: desigPending }    = useApi(() => category ? api.designations.getAll({ category, status: 'SUBMITTED' })   : Promise.resolve({ data: [] }), [category]);
  const { data: desigValidated }  = useApi(() => category ? api.designations.getAll({ category, status: 'VALIDATED' })   : Promise.resolve({ data: [] }), [category]);
  const { data: desigRecent }     = useApi(() => category ? api.designations.getAll({ category, limit: 6, page: 1 })    : Promise.resolve({ data: [] }), [category]);
  // Referees in this category
  const { data: refData }     = useApi(() => category ? api.referees.getAll({ category, limit: 1, page: 1 }) : Promise.resolve({ data: { total: 0 } }), [category]);
  // Payments (getAll is permitted; getStatistics is NOT)
  const { data: payPending }  = useApi(() => category ? api.payments.getAll({ category, status: 'PENDING',   limit: 1 }) : Promise.resolve({ data: { total: 0 } }), [category]);
  const { data: payPaid }     = useApi(() => category ? api.payments.getAll({ category, status: 'PAID',      limit: 1 }) : Promise.resolve({ data: { total: 0 } }), [category]);
  // CRA: availability reports pending
  const { data: availData }   = useApi(() => role === Role.CRA ? api.availability.getCraPending({ status: 'PENDING' }) : Promise.resolve({ data: [] }), [role]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const p        = profile as any;
  const tot = (d: any) => (d as any)?.data?.total ?? (d as any)?.total ?? (Array.isArray((d as any)?.data) ? (d as any).data.length : 0);
  const arr = (d: any): any[] => Array.isArray((d as any)?.data) ? (d as any).data : Array.isArray(d) ? d as any[] : [];

  const upcomingTotal   = tot(sched1) + tot(sched2);
  const completedTotal  = tot(done1)  + tot(done2);
  const pendingDesig    = tot(desigPending);
  const validatedDesig  = tot(desigValidated);
  const totalDesig      = pendingDesig + validatedDesig;
  const completionRate  = totalDesig > 0 ? Math.round((validatedDesig / totalDesig) * 100) : 0;
  const activeReferees  = tot(refData);
  const pendingPay      = tot(payPending);
  const paidCount       = tot(payPaid);
  const recentDesig     = arr(desigRecent).slice(0, 5);
  const upcomingMatches = arr(sched1).concat(arr(sched2)).slice(0, 5);
  const pendingAvail    = tot(availData);

  const DESIG_STATUS: Record<string, { label: string; badge: 'success'|'warning'|'default' }> = {
    VALIDATED: { label: 'Validée',    badge: 'success' },
    SUBMITTED: { label: 'Soumise',    badge: 'warning' },
    DRAFT:     { label: 'Brouillon',  badge: 'default' },
  };

  return (
    <div className="animate-fadeIn space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
            Bienvenue, {p?.firstName} {p?.lastName}
          </h1>
          <p className="text-gray-400 dark:text-flashscore-muted text-sm mt-0.5">Tableau de bord — Commission {label}</p>
        </div>
        <span className="self-start sm:self-auto px-4 py-1.5 rounded-full bg-[#ce1126]/10 text-[#ce1126] text-sm font-semibold border border-[#ce1126]/20">
          {label}
        </span>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Matchs à Venir"         value={upcomingTotal}  sub={`${completedTotal} terminés cette saison`} color="border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-400"   />
        <Kpi label="Désignations En Attente" value={pendingDesig}   sub={`${completionRate}% validées`}             color="border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400"  />
        <Kpi label="Arbitres Actifs"         value={activeReferees} sub="dans votre catégorie"                      color="border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-950/20 text-purple-800 dark:text-purple-400" />
        <Kpi label="Paiements En Attente"    value={pendingPay}     sub={`${paidCount} payés au total`}             color="border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400"  />
      </div>

      {/* ── Activity panels ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming matches */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-flashscore-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ce1126]" /> Prochains Matchs
            </h3>
            <span className="text-xs text-gray-400 dark:text-flashscore-muted">{upcomingTotal} programmés</span>
          </div>
          {upcomingMatches.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-flashscore-muted py-8 text-center">Aucun match programmé</p>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.map((m: any) => (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-flashscore-hover hover:bg-gray-100 dark:bg-flashscore-border transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-flashscore-text">{m.homeTeam || m.homeTeamId?.name || '—'} vs {m.awayTeam || m.awayTeamId?.name || '—'}</p>
                    <p className="text-xs text-gray-400 dark:text-flashscore-muted mt-0.5">
                      {m.date ? new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'}
                      {m.stadium ? ` · ${m.stadium}` : ''}
                    </p>
                  </div>
                  <Badge status="warning">J{m.journee ?? '—'}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent designations */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-flashscore-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ce1126]" /> Désignations Récentes
            </h3>
            <span className="text-xs text-gray-400 dark:text-flashscore-muted">{pendingDesig} en attente</span>
          </div>
          {recentDesig.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-flashscore-muted py-8 text-center">Aucune désignation</p>
          ) : (
            <div className="space-y-2">
              {recentDesig.map((d: any) => {
                const m = d.matchId || {};
                const si = DESIG_STATUS[d.status] ?? { label: d.status, badge: 'default' as const };
                return (
                  <div key={d._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-flashscore-hover hover:bg-gray-100 dark:bg-flashscore-border transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-flashscore-text">
                        {m.homeTeam || '—'} vs {m.awayTeam || '—'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-flashscore-muted mt-0.5">
                        {d.category || ''}{m.date ? ` · ${new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
                      </p>
                    </div>
                    <Badge status={si.badge}>{si.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Role-specific insight panel ──────────────────────────────────── */}
      <Card>
        <h3 className="font-bold text-gray-900 dark:text-flashscore-text mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ce1126]" /> Indicateurs {label}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Designation completion rate */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-flashscore-hover">
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Taux de validation</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">{completionRate}%</span>
              <span className="text-xs text-gray-400 dark:text-flashscore-muted mb-0.5">{validatedDesig}/{totalDesig} désignations</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-flashscore-border overflow-hidden">
              <div className="h-full rounded-full bg-[#ce1126] transition-all" style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          {/* Matches coverage */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-flashscore-hover">
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Couverture matchs</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">{completedTotal}</span>
              <span className="text-xs text-gray-400 dark:text-flashscore-muted mb-0.5">terminés / {upcomingTotal + completedTotal} total</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-flashscore-border overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: upcomingTotal + completedTotal > 0 ? `${Math.round((completedTotal / (upcomingTotal + completedTotal)) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* CRA: pending availability reports | others: payment status */}
          {role === Role.CRA ? (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-xs text-orange-500 mb-1">Excuses & Blessures</p>
              <span className="text-2xl font-bold text-orange-700">{pendingAvail}</span>
              <p className="text-xs text-orange-400 mt-0.5">déclarations en attente</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50">
              <p className="text-xs text-green-600 dark:text-green-500 mb-1">Paiements traités</p>
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">{paidCount}</span>
              <p className="text-xs text-green-500 dark:text-green-600 mt-0.5">{pendingPay} encore en attente</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin DNA full dashboard (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const router = useRouter();
  const [filters, setFilters] = useState({
    saison: '2025-2026',
    groupBy: 'journee' as 'journee' | 'month',
  });

  const { stats, loading: statsLoading, error: statsError } = useDashboardData({ saison: filters.saison });
  const { data: matchesData, loading: matchesLoading } = useMatchesChart(filters.groupBy, { saison: filters.saison });
  const { data: performanceData, loading: performanceLoading } = useRefereePerformanceChart({ saison: filters.saison });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">Erreur: {statsError}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const overviewStats = [
    {
      title: "Total Arbitres",
      value: stats.referees.totalActive.toString(),
      trend: "Arbitres actifs",
      trendType: "positive" as const,
      icon: <Users className="w-8 h-8 text-blue-500" />,
    },
    {
      title: "Matchs cette Saison",
      value: stats.overview.matchesThisSeason.toString(),
      trend: `${stats.overview.matchesToday} aujourd'hui`,
      trendType: "positive" as const,
      icon: <Target className="w-8 h-8 text-emerald-500" />,
    },
    {
      title: "Désignations en Attente",
      value: stats.designations.pending.toString(),
      trend: `${stats.designations.completionRate}% complétées`,
      trendType: stats.designations.pending > 10 ? "negative" : "neutral",
      icon: <Clock className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "Rapports en Attente",
      value: stats.inspectorReports.pending.toString(),
      trend: `${stats.inspectorReports.reviewed} validés`,
      trendType: stats.inspectorReports.pending > 5 ? "negative" : "positive",
      icon: <FileCheck className="w-8 h-8 text-purple-500" />,
    },
  ];

  const additionalStats = [
    { title: "Matchs à Venir",       value: stats.overview.upcomingMatches,              icon: <Target className="w-6 h-6 text-blue-500" /> },
    { title: "Convocations ce Mois", value: stats.convocations.thisMonth,                icon: <FileText className="w-6 h-6 text-green-500" /> },
    { title: "Paiements en Attente", value: stats.payments.pendingValidation,            icon: <DollarSign className="w-6 h-6 text-yellow-500" /> },
    { title: "Montant ce Mois",      value: `${(stats.payments.totalAmountThisMonth / 1000).toFixed(1)}k TND`, icon: <DollarSign className="w-6 h-6 text-green-600" /> },
  ];

  return (
    <Card className="animate-fadeIn">
      {/* Header + Filters */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text mb-4">Tableau de Bord</h1>
        <div className="flex gap-4 flex-wrap">
          <select
            value={filters.saison}
            onChange={(e) => setFilters({ ...filters, saison: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-flashscore-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          >
            <option value="2025-2026">Saison 2025-2026</option>
            <option value="2024-2025">Saison 2024-2025</option>
            <option value="2023-2024">Saison 2023-2024</option>
          </select>

          <select
            value={filters.groupBy}
            onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as 'journee' | 'month' })}
            className="px-4 py-2 border border-gray-300 dark:border-flashscore-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ce1126]"
          >
            <option value="journee">Par Journée</option>
            <option value="month">Par Mois</option>
          </select>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overviewStats.map((stat, i) => <StatCard key={i} {...stat} />)}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {additionalStats.map((stat, i) => <StatCard key={i} {...stat as any} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MatchesChart data={matchesData} groupBy={filters.groupBy} loading={matchesLoading} />
        <RefereeCategoryChart byCategory={stats.referees.byCategory} loading={statsLoading} />
      </div>
      <div className="mb-8">
        <RefereePerformanceChart data={performanceData} loading={performanceLoading} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Matches */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Matchs Récents</h3>
            <button onClick={() => router.push('/admin/planning')} className="text-sm text-[#ce1126] font-medium hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.latestMatches.slice(0, 5).map((match: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-flashscore-border hover:border-gray-200 dark:border-flashscore-border transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#ce1126]">J{match.journee}</span>
                  <Badge status={match.status === 'COMPLETED' ? 'success' : match.status === 'SCHEDULED' ? 'warning' : 'error'}>
                    {match.status === 'COMPLETED' ? 'Terminé' : match.status === 'SCHEDULED' ? 'À venir' : match.status === 'CANCELLED' ? 'Annulé' : 'Suspendu'}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-1">{match.homeTeam} vs {match.awayTeam}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                  {new Date(match.date.split('T')[0]).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Latest Designations */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Désignations Récentes</h3>
            <button onClick={() => router.push('/admin/designations')} className="text-sm text-[#ce1126] font-medium hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.latestDesignations.slice(0, 5).map((designation: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-flashscore-border hover:border-gray-200 dark:border-flashscore-border transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Badge status={designation.status === 'SUBMITTED' ? 'warning' : designation.status === 'VALIDATED' ? 'success' : 'default'}>
                    {designation.status === 'VALIDATED' ? 'Validée' : designation.status === 'SUBMITTED' ? 'Soumis' : 'En attente'}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                    {new Date(designation.createdAt.split('T')[0]).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {designation.matchId && (
                  <p className="text-sm text-gray-900 dark:text-flashscore-text">{designation.matchId.homeTeam} vs {designation.matchId.awayTeam}</p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Latest Reports */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Rapports Récents</h3>
            <button onClick={() => router.push('/admin/rapport')} className="text-sm text-[#ce1126] font-medium hover:underline">Voir tout</button>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.latestReports.slice(0, 5).map((report: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 dark:border-flashscore-border hover:border-gray-200 dark:border-flashscore-border transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#ce1126]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge status={report.status}>
                        {report.status === 'REVIEWED' ? 'Validé' : report.status === 'SUBMITTED' ? 'Soumis' : 'Brouillon'}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{report.overallScore ? `${report.overallScore}/20` : '-'}</span>
                    </div>
                    {report.matchId && (
                      <p className="text-sm text-gray-900 dark:text-flashscore-text truncate">{report.matchId.homeTeam} vs {report.matchId.awayTeam}</p>
                    )}
                    {report.refereeId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">Arbitre: {report.refereeId.matricule}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page — role-aware routing
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useUser();

  if (!user) return null;

  if (user.role === Role.ADMIN_DNA) {
    return <AdminDashboard />;
  }

  return <CommissionDashboard role={user.role} />;
};

export default Dashboard;
