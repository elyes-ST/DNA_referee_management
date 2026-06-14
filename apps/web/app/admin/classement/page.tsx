'use client';
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { Trophy, Medal, Star, Activity, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '../../../types/user';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { useUser } from '../../../hooks/useUser';

/** Map each commission role to its default category tab */
const ROLE_DEFAULT_CATEGORY: Partial<Record<Role, string>> = {
  [Role.CAA]: 'C1',
  [Role.CAJ]: 'Jeune',
  [Role.CAF]: 'Féminine',
  [Role.CRA]: 'Regional',
};

const Classement = () => {
    const { user } = useUser();
    // Pre-select category based on commission role; default to 'A' for admin
    const defaultCategory = (user?.role && ROLE_DEFAULT_CATEGORY[user.role]) ?? 'A';
    const [gradeFilter, setGradeFilter] = useState(defaultCategory);
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 8;

    // Update default when user loads asynchronously
    useEffect(() => {
        if (user?.role && ROLE_DEFAULT_CATEGORY[user.role]) {
            setGradeFilter(ROLE_DEFAULT_CATEGORY[user.role]!);
        }
    }, [user?.role]);

    useEffect(() => {
        fetchRankings();
    }, [gradeFilter, currentPage]);

    const fetchRankings = async () => {
        try {
            setLoading(true);
            const response = await api.statistics.getRankings({ 
                category: gradeFilter,
                page: currentPage,
                limit: limit
            });
            const rankingsData = Array.isArray(response.data) 
                ? response.data 
                : (response.data?.data || response.data?.rankings || []);
            setRankings(rankingsData);
            
            // Handle pagination metadata
            if (response.data && !Array.isArray(response.data)) {
                setTotal(response.data.total || 0);
                setTotalPages(response.data.totalPages || 1);
            } else {
                setTotal(rankingsData.length);
                setTotalPages(1);
            }
        } catch (err) {
            let errorMessage = "Une erreur est survenue lors de la récupération du classement.";
            if (err && typeof err === "object" && "response" in err) {
                const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
                if (maybeResponse?.data?.message) {
                    errorMessage = maybeResponse.data.message;
                }
            }
            toast.error(errorMessage);
            setRankings([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="font-bold text-gray-400 dark:text-flashscore-muted text-sm">#{rank}</span>;
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryChange = (category: string) => {
        setGradeFilter(category);
        setCurrentPage(1);
    };

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            'A': 'Catégorie A ',
            'B': 'Catégorie B ',
            'C': 'Catégorie C ',
            'C1': 'Catégorie Amateur C1 ',
            'C2': 'Catégorie Amateur C2 ',
            'Jeune': 'Catégorie Jeunes ',
            'Féminine': 'Catégorie Féminine ',
            'Regional': 'Catégorie Régionale ',
        };
        return labels[category] || category;
    };

    return (
        <AuthGuard role={[Role.ADMIN_DNA, Role.FINANCE_DNA, Role.DESIGNATION_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA, Role.CDC, Role.CDE]}>
        <div className="animate-fadeIn">
            <Card className="mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-6 h-6 text-[#ce1126]" />
                    <h3 className="text-lg font-bold">Classement des Arbitres</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-100 dark:border-flashscore-border overflow-x-auto">
                    {['A', 'B', 'C', 'C1', 'C2', 'Jeune', 'Féminine', 'Regional'].map(g => (
                        <button
                            key={g}
                            onClick={() => handleCategoryChange(g)}
                            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                                gradeFilter === g 
                                ? 'border-[#ce1126] text-[#ce1126]' 
                                : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {getCategoryLabel(g)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                        <Table headers={["Rang", "Arbitre", "Note Moyenne", "Matchs", "Performance"]}>
                        {rankings.length > 0 ? (
                            rankings.map((ranking: any, idx: number) => (
                                <TableRow key={ranking.refereeId || idx}>
                                    <TableCell>
                                        <div className="pl-2 flex items-center gap-2">
                                            {getRankIcon(ranking.rank || ((currentPage - 1) * limit + idx + 1))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 dark:text-flashscore-text">
                                                {ranking.firstName || ''} {ranking.lastName || ''}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                                                {ranking.matricule || 'N/A'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-bold text-gray-900 dark:text-flashscore-text">
                                                {ranking.averageNote ? ranking.averageNote.toFixed(2) : '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                                            <Activity className="w-4 h-4 text-gray-400 dark:text-flashscore-muted" />
                                            <span>{ranking.matchesCount || 0}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-[#ce1126]" />
                                            <span className="font-semibold text-gray-900 dark:text-flashscore-text">
                                                {ranking.performanceScore ? ranking.performanceScore.toFixed(1) : '-'}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400 dark:text-flashscore-muted italic">
                                    Aucun arbitre trouvé pour cette catégorie.
                                </TableCell>
                            </TableRow>
                        )}
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                totalItems={total}
                            />
                        )}
                    </div>
                )}
            </Card>
        </div>
        </AuthGuard>
    );
};

export default Classement;
