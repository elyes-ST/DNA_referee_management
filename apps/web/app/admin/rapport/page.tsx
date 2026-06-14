'use client';
import React, { useState, useEffect,useCallback } from 'react';
import { api } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Form, FormField } from '../../../components/ui/Form';
import { Plus, FileText, Eye, Filter, Calendar, TrendingUp, TrendingDown, Lock, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';
import { debounce } from '../../../utils/helpers/debounce';
// Enums matching backend
enum InspectionType {
    BEFORE_MATCH = 'BEFORE_MATCH',
    DURING_MATCH = 'DURING_MATCH',
    POST_MATCH = 'POST_MATCH',
    FULL_INSPECTION = 'FULL_INSPECTION',
}

enum InspectorVerdict {
    EXCELLENT = 'EXCELLENT',
    VERY_GOOD = 'VERY_GOOD',
    GOOD = 'GOOD',
    SATISFACTORY = 'SATISFACTORY',
    NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
    INSUFFICIENT = 'INSUFFICIENT',
}

enum PromotionRecommendation {
    STRONGLY_RECOMMENDED = 'STRONGLY_RECOMMENDED',
    RECOMMENDED = 'RECOMMENDED',
    NEUTRAL = 'NEUTRAL',
    NOT_READY = 'NOT_READY',
    DEMOTION_SUGGESTED = 'DEMOTION_SUGGESTED',
}

const Rapports = () => {
    const [rapports, setRapports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [filterType, setFilterType] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        inspectorId: '',
        refereeId: '',
        matchId: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        inspectionType: InspectionType.FULL_INSPECTION,
        scores: {
            technicalScore: 10,
            physicalScore: 10,
            psychologicalScore: 10,
            communicationScore: 10,
            decisionMakingScore: 10,
        },
        strengths: '',
        weaknesses: '',
        recommendations: '',
        trainingNeeds: [] as string[],
        verdict: InspectorVerdict.SATISFACTORY,
        promotionRecommendation: PromotionRecommendation.NEUTRAL,
        confidential: false,
    });

    useEffect(() => {
        fetchReports();
    }, [currentPage, filterType]);
    const fetchReports = async () => {
        try {
            setLoading(true);
            const params: any = {
                    page: currentPage,
                    limit: itemsPerPage,
            };
            if (filterType) params.inspectionType = filterType;
            
            const response = await api.inspectorReports.getAll(params);
            const reportsData = Array.isArray(response.data.data) ? response.data.data : [];
            setRapports(reportsData);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.total || 0);
        } catch (err) {
            toast.error("Erreur lors de la récupération des rapports");
            setRapports([]);
        } finally {
            setLoading(false);
        }
    };
    const debouncedLoadInspectorOptions = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
    try {
        const response = await api.inspectors.getAll({
        search: inputValue,
        page: 1,
        limit: 1000,
    });

        const data = response.data.data || [];

        callback(data.map((inspector: any) => ({
            value: inspector._id,
            label: `${inspector.userId?.firstName || ''} ${inspector.userId?.lastName || ''} (${inspector.matricule || 'N/A'})`
        })));
    } catch (err) {
        toast.error("Erreur lors de la récupération des inspecteurs");
        callback([]);
    }
}, 500), []);
const loadInspectorOptions = (inputValue: string) =>
    new Promise((resolve) => debouncedLoadInspectorOptions(inputValue, resolve));


    const debouncedLoadRefereeOptions = useCallback(debounce(async (inputValue: string, callback: Function)  => {
        try {
    const response = await api.referees.getAll({
        search: inputValue,
        page: 1,
        limit: 1000,
    });

    const data = response.data.data || [];

    callback(data.map((ref: any) => ({
        value: ref._id,
        label: `${ref.userId?.firstName || ''} ${ref.userId?.lastName || ''} (${ref.matricule || 'N/A'})`
    })));
} catch {
            toast.error("Erreur lors de la récupération des arbitres");
            callback([]);
        }
    }, 500), []
);
const loadRefereeOptions = (inputValue: string) =>
    new Promise((resolve) => debouncedLoadRefereeOptions(inputValue, resolve));


const debouncedLoadMatchOptions = useCallback(
    debounce(async (inputValue: string, callback: Function) => {
        try{
    const response = await api.matches.getAll({
        team: inputValue,
        page: 1,
        limit: 1000,
    });

    const data = response.data.data || [];

    callback(data.map((match: any) => ({
        value: match._id,
        label: `${match.homeTeam} vs ${match.awayTeam} - ${new Date(match.date).toLocaleDateString()}`
    })));
} catch (err) {
    toast.error("Erreur lors de la récupération des matches");
    callback([]);
}}, 500), []);

const loadMatchOptions = (inputValue: string) =>
    new Promise((resolve) => debouncedLoadMatchOptions(inputValue, resolve));

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        
        // Handle nested scores fields
        if (id.includes('Score')) {
            setFormData({
                ...formData,
                scores: {
                    ...formData.scores,
                    [id]: type === 'number' ? parseFloat(value) || 0 : value
                }
            });
        } else if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [id]: checked });
        } else {
            setFormData({ ...formData, [id]: value });
        }
    };

    const handleAddReport = async () => {
        try {
            if (!formData.refereeId || !formData.matchId || !formData.inspectorId) {
                toast.error("Veuillez remplir tous les champs obligatoires");
                return;
            }

            if (isEditMode && selectedReport) {
                // Exclude inspectorId, refereeId, matchId from update
                const { inspectorId, refereeId, matchId, ...updateData } = formData;
                await api.inspectorReports.update(selectedReport._id, updateData);
                toast.success('Rapport modifié avec succès');
            } else {
                await api.inspectorReports.create(formData);
                toast.success('Rapport créé avec succès');
            }
            
            await fetchReports();
            
            // Reset form
            setFormData({
                inspectorId: '',
                refereeId: '',
                matchId: '',
                inspectionDate: new Date().toISOString().split('T')[0],
                inspectionType: InspectionType.FULL_INSPECTION,
                scores: {
                    technicalScore: 10,
                    physicalScore: 10,
                    psychologicalScore: 10,
                    communicationScore: 10,
                    decisionMakingScore: 10,
                },
                strengths: '',
                weaknesses: '',
                recommendations: '',
                trainingNeeds: [],
                verdict: InspectorVerdict.SATISFACTORY,
                promotionRecommendation: PromotionRecommendation.NEUTRAL,
                confidential: false,
            });
            
            setIsModalOpen(false);
            setIsEditMode(false);
            setSelectedReport(null);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Erreur lors de ${isEditMode ? 'la modification' : 'la création'} du rapport`);
        }
    };

    const handleEditReport = (report: any) => {
        setIsEditMode(true);
        setSelectedReport(report);
        setFormData({
            inspectorId: typeof report.inspectorId === 'object' ? (report.inspectorId?._id || report.inspectorId?.id || '') : (report.inspectorId || ''),
            refereeId: typeof report.refereeId === 'object' ? (report.refereeId?._id || report.refereeId?.id || '') : (report.refereeId || ''),
            matchId: typeof report.matchId === 'object' ? (report.matchId?._id || report.matchId?.id || '') : (report.matchId || ''),
            inspectionDate: new Date(report.inspectionDate).toISOString().split('T')[0],
            inspectionType: report.inspectionType,
            scores: {
                technicalScore: report.scores?.technicalScore || 10,
                physicalScore: report.scores?.physicalScore || 10,
                psychologicalScore: report.scores?.psychologicalScore || 10,
                communicationScore: report.scores?.communicationScore || 10,
                decisionMakingScore: report.scores?.decisionMakingScore || 10,
            },
            strengths: report.strengths || '',
            weaknesses: report.weaknesses || '',
            recommendations: report.recommendations || '',
            trainingNeeds: report.trainingNeeds || [],
            verdict: report.verdict,
            promotionRecommendation: report.promotionRecommendation,
            confidential: report.confidential || false,
        });
        setIsModalOpen(true);
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
            return;
        }

        try {
            await api.inspectorReports.delete(reportId);
            toast.success('Rapport supprimé avec succès');
            await fetchReports();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Erreur lors de la suppression du rapport");
        }
    };

    const handleViewReport = (report: any) => {
        setSelectedReport(report);
        setIsViewModalOpen(true);
    };

    const getInspectionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            BEFORE_MATCH: 'Avant Match',
            DURING_MATCH: 'Pendant Match',
            POST_MATCH: 'Après Match',
            FULL_INSPECTION: 'Inspection Complète',
        };
        return labels[type] || type;
    };

    const getVerdictLabel = (verdict: string) => {
        const labels: Record<string, string> = {
            EXCELLENT: 'Excellent',
            VERY_GOOD: 'Très Bien',
            GOOD: 'Bien',
            SATISFACTORY: 'Satisfaisant',
            NEEDS_IMPROVEMENT: 'À Améliorer',
            INSUFFICIENT: 'Insuffisant',
        };
        return labels[verdict] || verdict;
    };

    const getVerdictColor = (verdict: string) => {
        const colors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
            EXCELLENT: 'success',
            VERY_GOOD: 'success',
            GOOD: 'success',
            SATISFACTORY: 'warning',
            NEEDS_IMPROVEMENT: 'warning',
            INSUFFICIENT: 'error',
        };
        return colors[verdict] || 'default';
    };

    const inspectionTypeOptions = [
        { value: '', label: 'Tous les types' },
        { value: InspectionType.BEFORE_MATCH, label: 'Avant Match' },
        { value: InspectionType.DURING_MATCH, label: 'Pendant Match' },
        { value: InspectionType.POST_MATCH, label: 'Après Match' },
        { value: InspectionType.FULL_INSPECTION, label: 'Inspection Complète' },
    ];

    const verdictOptions = [
        { value: InspectorVerdict.EXCELLENT, label: 'Excellent' },
        { value: InspectorVerdict.VERY_GOOD, label: 'Très Bien' },
        { value: InspectorVerdict.GOOD, label: 'Bien' },
        { value: InspectorVerdict.SATISFACTORY, label: 'Satisfaisant' },
        { value: InspectorVerdict.NEEDS_IMPROVEMENT, label: 'À Améliorer' },
        { value: InspectorVerdict.INSUFFICIENT, label: 'Insuffisant' },
    ];

    const promotionOptions = [
        { value: PromotionRecommendation.STRONGLY_RECOMMENDED, label: 'Fortement Recommandé' },
        { value: PromotionRecommendation.RECOMMENDED, label: 'Recommandé' },
        { value: PromotionRecommendation.NEUTRAL, label: 'Neutre' },
        { value: PromotionRecommendation.NOT_READY, label: 'Pas Prêt' },
        { value: PromotionRecommendation.DEMOTION_SUGGESTED, label: 'Rétrogradation Suggérée' },
    ];
    // Form fields configuration
    const basicInfoFields: FormField[] = [
        { 
            name: 'inspectorId', 
            label: 'Inspecteur ', 
            type: 'async-select', 
            loadOptions: loadInspectorOptions as any, 
            required: true, 
            placeholder: 'Rechercher un inspecteur...',
            defaultLabel: selectedReport?.inspectorId?.userId ? `${selectedReport.inspectorId.userId.firstName || ''} ${selectedReport.inspectorId.userId.lastName || ''}` : ''
        },
        { 
            name: 'refereeId', 
            label: 'Arbitre ', 
            type: 'async-select', 
            loadOptions: loadRefereeOptions as any, 
            required: true, 
            placeholder: 'Rechercher un arbitre...',
            defaultLabel: selectedReport?.refereeId?.userId ? `${selectedReport.refereeId.userId.firstName || ''} ${selectedReport.refereeId.userId.lastName || ''}` : ''
        },
        { 
            name: 'matchId', 
            label: 'Match ', 
            type: 'async-select', 
            loadOptions: loadMatchOptions as any, 
            required: true, 
            placeholder: 'Rechercher un match...',
            defaultLabel: selectedReport?.matchId ? `${selectedReport.matchId.homeTeam || ''} vs ${selectedReport.matchId.awayTeam || ''}` : ''
        },
        { name: 'inspectionDate', label: 'Date d\'inspection ', type: 'date', required: true },
        { name: 'inspectionType', label: 'Type d\'inspection ', type: 'select', options: inspectionTypeOptions.slice(1), required: true },
    ];

    const scoresFields: FormField[] = [
        { name: 'technicalScore', label: 'Score Technique', type: 'number', min: 0, max: 20, step: 0.5 },
        { name: 'physicalScore', label: 'Score Physique', type: 'number', min: 0, max: 20, step: 0.5 },
        { name: 'psychologicalScore', label: 'Score Psychologique', type: 'number', min: 0, max: 20, step: 0.5 },
        { name: 'communicationScore', label: 'Score Communication', type: 'number', min: 0, max: 20, step: 0.5 },
        { name: 'decisionMakingScore', label: 'Prise de Décision', type: 'number', min: 0, max: 20, step: 0.5 },
    ];

    const verdictFields: FormField[] = [
        { name: 'verdict', label: 'Verdict ', type: 'select', options: verdictOptions, required: true },
        { name: 'promotionRecommendation', label: 'Recommandation de Promotion ', type: 'select', options: promotionOptions, required: true },
    ];

    const commentsFields: FormField[] = [
        { name: 'strengths', label: 'Points Forts', type: 'textarea', placeholder: 'Décrivez les points forts observés...', className: 'col-span-1 md:col-span-2' },
        { name: 'weaknesses', label: 'Points Faibles', type: 'textarea', placeholder: 'Décrivez les points à améliorer...', className: 'col-span-1 md:col-span-2' },
        { name: 'recommendations', label: 'Recommandations', type: 'textarea', placeholder: 'Vos recommandations pour l\'arbitre...', className: 'col-span-1 md:col-span-2' },
    ];

    // Prepare form data with nested scores flattened for Form component
    const flatFormData = {
        ...formData,
        technicalScore: formData.scores.technicalScore,
        physicalScore: formData.scores.physicalScore,
        psychologicalScore: formData.scores.psychologicalScore,
        communicationScore: formData.scores.communicationScore,
        decisionMakingScore: formData.scores.decisionMakingScore,
    };

    return (
        <AuthGuard role={[Role.ADMIN_DNA, Role.CDC, Role.INSPECTEUR, Role.CDE]}>
        <div className="animate-fadeIn">
            <Card>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-flashscore-border">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#ce1126]" />
                        Rapports d'Inspection
                    </h3>
                    <Button 
                        variant="primary" 
                        onClick={() => {
                            setIsEditMode(false);
                            setSelectedReport(null);
                            setFormData({
                                inspectorId: '',
                                refereeId: '',
                                matchId: '',
                                inspectionDate: new Date().toISOString().split('T')[0],
                                inspectionType: InspectionType.FULL_INSPECTION,
                                scores: {
                                    technicalScore: 10,
                                    physicalScore: 10,
                                    psychologicalScore: 10,
                                    communicationScore: 10,
                                    decisionMakingScore: 10,
                                },
                                strengths: '',
                                weaknesses: '',
                                recommendations: '',
                                trainingNeeds: [],
                                verdict: InspectorVerdict.SATISFACTORY,
                                promotionRecommendation: PromotionRecommendation.NEUTRAL,
                                confidential: false,
                            });
                            setIsModalOpen(true);
                        }} 
                        className="flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau Rapport
                    </Button>
                </div>

                <div className="flex gap-4 mb-6 max-w-xs">
                    <Input
                        id="filter-type"
                        type="select"
                        icon={<Filter className="w-4 h-4" />}
                        value={filterType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                        options={inspectionTypeOptions}
                        placeholder="Filtrer par type"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
                    </div>
                ) : (
                    <>
                        <Table headers={["Arbitre", "Match", "Type", "Note Globale", "Verdict", "Actions"]}>
                            {rapports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 dark:text-gray-400 dark:text-flashscore-muted py-8">
                                        Aucun rapport disponible
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rapports.map((rapport) => (
                                    <TableRow key={rapport._id}>
                                        <TableCell>
                                            <div className="font-medium">
                                                {rapport.refereeId?.userId?.firstName || ''} {rapport.refereeId?.userId?.lastName || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
                                                {rapport.refereeId?.matricule || 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {rapport.matchId?.homeTeam || 'N/A'} vs {rapport.matchId?.awayTeam|| 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(rapport.inspectionDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge status="default">
                                                {getInspectionTypeLabel(rapport.inspectionType)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{rapport.overallScore?.toFixed(1) || 'N/A'}</span>
                                                <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">/20</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge status={getVerdictColor(rapport.verdict)}>
                                                {getVerdictLabel(rapport.verdict)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewReport(rapport)}
                                                    className="bg-transparent border-none p-0 cursor-pointer hover:text-blue-600 transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditReport(rapport)}
                                                    className="bg-transparent border-none p-0 cursor-pointer hover:text-[#ce1126] transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </Table>

                        {totalPages > 1 && (
                            <div className="mt-6">
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

            {/* Create Report Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                    setSelectedReport(null);
                }}
                title={isEditMode ? "Modifier le Rapport d'Inspection" : "Nouveau Rapport d'Inspection"}
            >
                <div className="space-y-6">
                    {/* Basic Information */}
                    {!isEditMode && (
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-900 dark:text-flashscore-text">Informations de Base</h4>
                            <Form
                                fields={basicInfoFields}
                                formData={flatFormData}
                                onChange={handleFormChange}
                            />
                        </div>
                    )}

                    {/* Technical Scores */}
                    <div>
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-flashscore-text">Scores Techniques (/20)</h4>
                        <Form
                            fields={scoresFields}
                            formData={flatFormData}
                            onChange={handleFormChange}
                        />
                    </div>

                    {/* Verdict & Recommendation */}
                    <div>
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-flashscore-text">Évaluation Globale</h4>
                        <Form
                            fields={verdictFields}
                            formData={flatFormData}
                            onChange={handleFormChange}
                        />
                    </div>

                    {/* Detailed Comments */}
                    <div>
                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-flashscore-text">Commentaires Détaillés</h4>
                        <Form
                            fields={commentsFields}
                            formData={flatFormData}
                            onChange={handleFormChange}
                        />
                    </div>

                    {/* Confidential Checkbox */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                        <input
                            type="checkbox"
                            id="confidential"
                            checked={formData.confidential}
                            onChange={handleFormChange}
                            className="w-4 h-4 text-[#ce1126] border-gray-300 dark:border-flashscore-border rounded focus:ring-[#ce1126]"
                        />
                        <label htmlFor="confidential" className="text-sm text-gray-700 dark:text-gray-300">
                            Rapport confidentiel
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-300 dark:border-flashscore-border">
                        <Button variant="secondary" onClick={() => {
                            setIsModalOpen(false);
                            setIsEditMode(false);
                            setSelectedReport(null);
                        }}>
                            Annuler
                        </Button>
                        <Button variant="primary" onClick={handleAddReport} className='flex !flex-row'>
                            <Plus className="w-4 h-4 mr-2" />
                            {isEditMode ? 'Modifier le Rapport' : 'Créer le Rapport'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Détails du Rapport"
            >
                {selectedReport && (
                    <div className="space-y-5">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-5 border-b border-gray-200 dark:border-flashscore-border">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Arbitre</p>
                                <p className="font-semibold text-gray-900 dark:text-flashscore-text">
                                    {selectedReport.refereeId?.userId?.firstName} {selectedReport.refereeId?.userId?.lastName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{selectedReport.refereeId?.matricule}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Inspecteur</p>
                                <p className="font-semibold text-gray-900 dark:text-flashscore-text">{selectedReport.inspectorId?.userId?.firstName} {selectedReport.inspectorId?.userId?.lastName || 'N/A'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{selectedReport.inspectorId?.matricule}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Match</p>
                                <p className="font-semibold text-gray-900 dark:text-flashscore-text">
                                    {selectedReport.matchId?.homeTeam} vs {selectedReport.matchId?.awayTeam}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Date d'Inspection</p>
                                <p className="font-semibold text-gray-900 dark:text-flashscore-text flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-800 dark:text-flashscore-text" />
                                    {new Date(selectedReport.inspectionDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* Scores */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-3 uppercase tracking-wide">Scores Techniques</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Technique</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
                                        {selectedReport.scores?.technicalScore || 'N/A'}<span className="text-base text-gray-400 dark:text-flashscore-muted ml-1">/20</span>
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Physique</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
                                        {selectedReport.scores?.physicalScore || 'N/A'}<span className="text-base text-gray-400 dark:text-flashscore-muted ml-1">/20</span>
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Psychologique</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
                                        {selectedReport.scores?.psychologicalScore || 'N/A'}<span className="text-base text-gray-400 dark:text-flashscore-muted ml-1">/20</span>
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Communication</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
                                        {selectedReport.scores?.communicationScore || 'N/A'}<span className="text-base text-gray-400 dark:text-flashscore-muted ml-1">/20</span>
                                    </p>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-1">Prise de Décision</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-flashscore-text">
                                        {selectedReport.scores?.decisionMakingScore || 'N/A'}<span className="text-base text-gray-400 dark:text-flashscore-muted ml-1">/20</span>
                                    </p>
                                </div>
                                <div className="bg-[#ce1126] p-4 rounded-lg">
                                    <p className="text-sm text-white/90 mb-1">Note Globale</p>
                                    <p className="text-2xl font-bold text-white">
                                        {selectedReport.overallScore?.toFixed(1) || 'N/A'}<span className="text-base text-white/80 ml-1">/20</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Verdict & Recommendation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 border-y border-gray-200 dark:border-flashscore-border">
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Verdict</p>
                                <Badge status={getVerdictColor(selectedReport.verdict)} className="text-sm">
                                    {getVerdictLabel(selectedReport.verdict)}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-flashscore-muted uppercase tracking-wide">Recommandation</p>
                                <Badge status="default" className="text-sm">
                                    {selectedReport.promotionRecommendation?.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                        </div>

                        {/* Detailed Comments */}
                        <div className="space-y-4">
                            {selectedReport.strengths && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text uppercase tracking-wide">Points Forts</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6">{selectedReport.strengths}</p>
                                </div>
                            )}

                            {selectedReport.weaknesses && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text uppercase tracking-wide">Points à Améliorer</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6">{selectedReport.weaknesses}</p>
                                </div>
                            )}

                            {selectedReport.recommendations && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text uppercase tracking-wide">Recommandations</h4>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-6">{selectedReport.recommendations}</p>
                                </div>
                            )}
                        </div>

                        {selectedReport.trainingNeeds && selectedReport.trainingNeeds.length > 0 && (
                            <div className="pt-4 border-t border-gray-200 dark:border-flashscore-border">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-3 uppercase tracking-wide">Besoins en Formation</h4>
                                <div className="flex flex-wrap gap-2 pl-6">
                                    {selectedReport.trainingNeeds.map((need: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 text-sm rounded-full">
                                            {need}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedReport.confidential && (
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-flashscore-border">
                                <Lock className="w-4 h-4 text-gray-600 dark:text-gray-400 dark:text-flashscore-muted" />
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Rapport Confidentiel</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
        </AuthGuard>
    );
};

export default Rapports;
