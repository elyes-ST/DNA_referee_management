'use client';
import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Form, FormField } from '../../../components/ui/Form';
import { MessageCircle, Mail, Send } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';

const Communication = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        filterType: 'all', 
        regions: [] as string[],
        categories: [] as string[],
        priority: 'NORMAL',
        channels: ['IN_APP'] as string[],
    });
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!formData.title.trim()) {
            toast.error('Veuillez entrer un titre');
            return;
        }
        if (!formData.message.trim()) {
            toast.error('Veuillez écrire un message');
            return;
        }
        if (formData.channels.length === 0) {
            toast.error('Veuillez sélectionner au moins un canal');
            return;
        }

        try {
            setSending(true);
            
            const payload: any = {
                title: formData.title,
                message: formData.message,
                channels: formData.channels,
                priority: formData.priority,
            };
            if (formData.filterType === 'region' && formData.regions.length > 0) {
                payload.regions = formData.regions;
            } else if (formData.filterType === 'category' && formData.categories.length > 0) {
                payload.categories = formData.categories;
            }

            const response = await api.notifications.sendGroup(payload);
            
            toast.success(`Notification envoyée avec succès à ${response.data?.sent || 0} utilisateur(s)`);
            
            // Reset form
            setFormData({
                title: '',
                message: '',
                filterType: 'all',
                regions: [],
                categories: [],
                priority: 'NORMAL',
                channels: ['IN_APP'],
            });
        } catch (error: any) {
            console.error('Error sending notification:', error);
            toast.error(error?.response?.data?.message || 'Erreur lors de l\'envoi de la notification');
        } finally {
            setSending(false);
        }
    };

    const filterTypeOptions = [
        { value: 'all', label: 'Tous les utilisateurs' },
        { value: 'region', label: 'Par région' },
        { value: 'category', label: 'Par catégorie' },
    ];

    const regionOptions = [
        { value: 'Tunis', label: 'Tunis' },
        { value: 'Sfax', label: 'Sfax' },
        { value: 'Sousse', label: 'Sousse' },
        { value: 'Bizerte', label: 'Bizerte' },
        { value: 'Gabès', label: 'Gabès' },
        { value: 'Nabeul', label: 'Nabeul' },
        { value: 'Ariana', label: 'Ariana' },
        { value: 'Ben Arous', label: 'Ben Arous' },
    ];


    const categoryOptions = [
        { value:'A', label: 'Catégorie A' },
        { value:'B', label: 'Catégorie B' },
        { value:'AMATEUR_C1', label: 'Amateur C1' },
        { value:'AMATEUR_C2', label: 'Amateur C2' },
        { value:'JEUNE', label: 'Jeune' },
        { value:'FEMININE', label: 'Féminine' },
        { value: 'REGIONAL', label: 'Régional' },
    ];

    const priorityOptions = [
        { value: 'LOW', label: 'Basse' },
        { value: 'NORMAL', label: 'Normale' },
        { value: 'HIGH', label: 'Haute' },
        { value: 'URGENT', label: 'Urgente' },
    ];

    const channelOptions = [
        { value: 'IN_APP', label: 'Notification in-app' },
        { value: 'WHATSAPP', label: 'WhatsApp' },
        { value: 'EMAIL', label: 'Email' },
    ];

    return (
        <AuthGuard role={[Role.ADMIN_DNA]}>
        <div className="animate-fadeIn max-w-3xl">
            <Card>
                <h3 className="text-lg font-bold mb-6">Communication Groupée</h3>
                
                <div className="space-y-6">
                    {/* Title */}
                    <Input
                        id="title"
                        type="text"
                        label="Titre de la notification"
                        placeholder="Ex: Annonce importante"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    {/* Message */}
                    <Input
                        id="message"
                        type="textarea"
                        label="Message"
                        placeholder="Votre message ici..."
                        value={formData.message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                        required
                    />

                    {/* Priority */}
                    <Input
                        id="priority"
                        type="select"
                        label="Priorité"
                        value={formData.priority}
                        options={priorityOptions}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, priority: e.target.value })}
                    />

                    {/* Channels */}
                    <Input
                        id="channels"
                        type="checkbox"
                        label="Canaux de diffusion"
                        value={formData.channels}
                        options={channelOptions}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const { value, checked } = e.target;
                            setFormData(prev => ({
                                ...prev,
                                channels: checked 
                                    ? [...prev.channels, value]
                                    : prev.channels.filter(c => c !== value)
                            }));
                        }}
                    />

                    {/* Filter Type */}
                    <Input
                        id="filterType"
                        type="select"
                        label="Destinataires"
                        value={formData.filterType}
                        options={filterTypeOptions}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ 
                            ...formData, 
                            filterType: e.target.value,
                            regions: [],
                            categories: []
                        })}
                    />

                    {/* Conditional Filters */}
                    {formData.filterType === 'region' && (
                        <Input
                            id="regions"
                            type="checkbox"
                            label="Sélectionner les régions"
                            value={formData.regions}
                            options={regionOptions}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const { value, checked } = e.target;
                                setFormData(prev => ({
                                    ...prev,
                                    regions: checked 
                                        ? [...prev.regions, value]
                                        : prev.regions.filter(r => r !== value)
                                }));
                            }}
                        />
                    )}
                    {formData.filterType === 'category' && (
                        <Input
                            id="categories"
                            type="checkbox"
                            label="Sélectionner les catégories"
                            value={formData.categories}
                            options={categoryOptions}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const { value, checked } = e.target;
                                setFormData(prev => ({
                                    ...prev,
                                    categories: checked 
                                        ? [...prev.categories, value]
                                        : prev.categories.filter(c => c !== value)
                                }));
                            }}
                        />
                    )}
                </div>

                {/* Action Button */}
                <div className="flex pt-6 mt-6 border-t border-gray-100 dark:border-flashscore-border">
                    <Button 
                        variant="primary"
                        className="flex items-center justify-center w-full sm:w-auto"
                        onClick={handleSend}
                        disabled={sending}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {sending ? 'Envoi en cours...' : 'Envoyer la notification'}
                    </Button>
                </div>

                {/* Info message */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                        <strong>Note:</strong> Les notifications seront envoyées aux utilisateurs selon leurs préférences de notification configurées.
                        {formData.filterType !== 'all' && ' Les filtres sélectionnés seront appliqués aux arbitres uniquement.'}
                    </p>
                </div>
            </Card>
        </div>
        </AuthGuard>
    );
};

export default Communication;
