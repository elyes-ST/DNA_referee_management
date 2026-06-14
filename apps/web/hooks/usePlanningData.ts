import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { STATUS_MAPPER } from '../components/admin/planning/constants';
import { getSaisonFromDate } from '../utils/helpers/season-from-date';
export const usePlanningData = (
  selectedDate: Date | null,
  activeStatusFilter: string,
  activeCompetitionFilter: string,
  currentPage: number,
  itemsPerPage: number,
  category?: string
) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.teams.getAll({});
      const teamsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || response.data?.teams || []);
      setTeams(teamsData);
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors du chargement des équipes.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
      setTeams([]);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const mappedStatus = activeStatusFilter !== "Tous" 
        ? STATUS_MAPPER[activeStatusFilter] || activeStatusFilter 
        : undefined;
      
      const params: any = {
        competition: activeCompetitionFilter !== "Tous" ? activeCompetitionFilter : undefined,
        status: mappedStatus,
        saison: getSaisonFromDate(),
        page: currentPage,
        limit: itemsPerPage
      };

      // Category filter (single 'C1'/'C2' or comma-separated 'C1,C2')
      if (category) params.category = category;

      if (selectedDate) {
        const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        params.date = dateString;
      }

      const response = await api.matches.getAll(params);
      const matchesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data?.matches || []);
      
      setTotalItems(response.data?.total || 0);
      setTotalPages(response.data?.totalPages || 1);

      // Fetch teams by ID for logos
      const teamIds = new Set<string>();
      matchesData.forEach((m: any)=> {
        if (m.homeTeamId) teamIds.add(m.homeTeamId);
        if (m.awayTeamId) teamIds.add(m.awayTeamId);
      });

      const teamMap: Record<string, any> = { ...teamsMap }; 
      await Promise.all(
        Array.from(teamIds).map(async id => {
          if (!teamMap[id]) {
            try {
              const { data } = await api.teams.getOne(id);
              teamMap[id] = data;
            } catch {
              teamMap[id] = { name: "Unknown", logo: "/placeholder-team.png" };
            }
          }
        })
      );

      setTeamsMap(teamMap);

      // Enrich matches
      const enrichedMatches = matchesData.map((match: any) => ({
        ...match,
        homeTeam: teamMap[match.homeTeamId] || { name: match.homeTeam || "Unknown", logo: "/placeholder-team.png" },
        awayTeam: teamMap[match.awayTeamId] || { name: match.awayTeam || "Unknown", logo: "/placeholder-team.png" },
      }));

      setMatches(enrichedMatches);
    } catch (err) {
      let errorMessage = "Une erreur est survenue lors du chargement des matchs.";
      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }
      toast.error(errorMessage);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeStatusFilter, activeCompetitionFilter, currentPage, itemsPerPage, category]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return {
    matches,
    teams,
    loading,
    totalPages,
    totalItems,
    refetchMatches: fetchMatches
  };
};
