import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ReportDetailsProps {
    report: any;
    onClose: () => void;
}

export const ReportDetails: React.FC<ReportDetailsProps> = ({ report, onClose }) => {
    if (!report) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Titre</label>
                    <p className="text-gray-900 dark:text-flashscore-text font-medium">{report.titre}</p>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Date</label>
                    <p className="text-gray-900 dark:text-flashscore-text">{report.date}</p>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Source</label>
                    <div>
                        <Badge status="default">{report.source || 'Autre'}</Badge>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Type</label>
                    <p className="text-gray-900 dark:text-flashscore-text">{report.type || 'Non spécifié'}</p>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Arbitre ID</label>
                    <p className="text-gray-900 dark:text-flashscore-text">{report.arbitreId}</p>
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Note</label>
                    <p className="text-gray-900 dark:text-flashscore-text font-bold text-lg">{report.note ? `${report.note}/20` : 'Non noté'}</p>
                </div>
            </div>
            
            <div>
                <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted block mb-1">Description / Commentaires</label>
                <div className="p-3 bg-gray-50 dark:bg-flashscore-hover rounded-md border border-gray-100 dark:border-flashscore-border text-sm text-gray-700 dark:text-gray-300 min-h-[100px] whitespace-pre-wrap">
                    {report.description || "Aucune description disponible."}
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-flashscore-border mt-2">
                <Button variant="secondary" onClick={onClose}>Fermer</Button>
            </div>
        </div>
    );
};
