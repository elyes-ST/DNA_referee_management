'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Form, FormField } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, Mail, Phone, MapPin, Save, User, Bell, Clock, Volume2, BellRing, MessageSquare } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { api } from '../../services/api';
import { toast } from 'sonner';

const Parametres = () => {
    const { user, refreshUser } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Profile form data
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',

        // Referee specific
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
    });

    // Notification preferences
    const [notificationPrefs, setNotificationPrefs] = useState({
        channels: ['inApp', 'whatsapp'],
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
        },
        types: ['designation', 'convocation', 'reminder', 'payment', 'announcement', 'availability'],
        reminderTiming: {
            matchHoursBefore: 24,
            seminarHoursBefore: 48,
        },
        whatsappNumber: '',
    });

    // Fetch user profile data
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            
            try {
                setLoading(true);
                
                // Fetch profile based on user role
                let profileResponse;
                if (user.role === 'ARBITRE') {
                    profileResponse = await api.referees.getMyProfile();
                    const referee = profileResponse.data;
                    setProfileData({
                        firstName: referee.userId.firstName || '',
                        lastName: referee.userId.lastName || '',
                        phoneNumber: referee.userId.phoneNumber || '',
                        email: referee.userId.email || '',
                        address: referee.address || '',
                        emergencyContactName: referee.emergencyContact?.name || '',
                        emergencyContactPhone: referee.emergencyContact?.phone || '',
                    });
                } else {
                    // For other roles (ADMIN_DNA, CRA_PRESIDENT, etc.)
                    setProfileData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        phoneNumber: user.phoneNumber || '',
                        email: user.email || '',
                        address: '',
                        emergencyContactName: '',
                        emergencyContactPhone: '',
                    });
                }

                // Fetch notification preferences
                const prefsResponse = await api.notifications.getPreferences();
                if (prefsResponse.data) {
                    const prefs = prefsResponse.data;
                    
                    // Convert channels object to array
                    const channelsArray = [];
                    if (prefs.channels?.inApp) channelsArray.push('inApp');
                    if (prefs.channels?.whatsapp) channelsArray.push('whatsapp');
                    if (prefs.channels?.email) channelsArray.push('email');
                    
                    // Convert types object to array
                    const typesArray = [];
                    if (prefs.types?.designation) typesArray.push('designation');
                    if (prefs.types?.convocation) typesArray.push('convocation');
                    if (prefs.types?.reminder) typesArray.push('reminder');
                    if (prefs.types?.payment) typesArray.push('payment');
                    if (prefs.types?.announcement) typesArray.push('announcement');
                    if (prefs.types?.availability) typesArray.push('availability');
                    
                    setNotificationPrefs({
                        channels: channelsArray,
                        quietHours: prefs.quietHours || notificationPrefs.quietHours,
                        types: typesArray,
                        reminderTiming: prefs.reminderTiming || notificationPrefs.reminderTiming,
                        whatsappNumber: prefs.whatsappNumber || '',
                    });
                }
            } catch (error: any) {
                console.error('Error fetching data:', error);
                toast.error(error?.response?.data?.message || 'Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setProfileData(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            
            if (user?.role === 'ARBITRE') {
                // Update referee profile
                await api.referees.updateMyProfile({
                    address: profileData.address,
                    emergencyContact: {
                        name: profileData.emergencyContactName,
                        phone: profileData.emergencyContactPhone,
                    },
                });
                
            } 
                // Update user profile for other roles
                await api.users.updateMyProfile({
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    phoneNumber: profileData.phoneNumber,
                });
            
            toast.success('Profil mis à jour avec succès');
            await refreshUser();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        try {
            setSaving(true);
            
            // Convert arrays back to object format for API
            const prefsToSave = {
                channels: {
                    inApp: notificationPrefs.channels.includes('inApp'),
                    whatsapp: notificationPrefs.channels.includes('whatsapp'),
                    email: notificationPrefs.channels.includes('email'),
                },
                quietHours: notificationPrefs.quietHours,
                types: {
                    designation: notificationPrefs.types.includes('designation'),
                    convocation: notificationPrefs.types.includes('convocation'),
                    reminder: notificationPrefs.types.includes('reminder'),
                    payment: notificationPrefs.types.includes('payment'),
                    announcement: notificationPrefs.types.includes('announcement'),
                    availability: notificationPrefs.types.includes('availability'),
                },
                reminderTiming: notificationPrefs.reminderTiming,
                whatsappNumber: notificationPrefs.whatsappNumber,
            };
            
            await api.notifications.updatePreferences(prefsToSave);
            toast.success('Préférences de notification mises à jour avec succès');
        } catch (error: any) {
            console.error('Error updating notifications:', error);
            toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour des préférences');
        } finally {
            setSaving(false);
        }
    };

    // Profile fields based on user role
    const getProfileFields = (): FormField[] => {
        const baseFields: FormField[] = [
            { name: 'firstName', label: 'Prénom', placeholder: 'Prénom', icon: <User size={18} />, required: true },
            { name: 'lastName', label: 'Nom', placeholder: 'Nom', icon: <User size={18} />, required: true },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'Email', icon: <Mail size={18} />, disabled: true },
            { name: 'phoneNumber', label: 'Téléphone', type: 'tel', placeholder: 'Téléphone', icon: <Phone size={18} /> },
        ];

        if (user?.role === 'ARBITRE') {
            return [
                ...baseFields,
                { name: 'address', label: 'Adresse', placeholder: 'Adresse complète', icon: <MapPin size={18} />, className: 'col-span-1 md:col-span-2' },
                { name: 'emergencyContactName', label: 'Contact d\'urgence (Nom)', placeholder: 'Nom du contact', icon: <User size={18} /> },
                { name: 'emergencyContactPhone', label: 'Contact d\'urgence (Téléphone)', type: 'tel', placeholder: 'Téléphone du contact', icon: <Phone size={18} /> },
            ];
        }

        return baseFields;
    };

    if (loading) {
        return (
            <div className="animate-fadeIn p-6 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Profile Section */}
            <Card>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-flashscore-border">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Informations du Profil</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">Mettez à jour vos informations personnelles</p>
                    </div>
                </div>

                <Form 
                    fields={getProfileFields()}
                    formData={profileData}
                    onChange={handleProfileChange}
                    className="gap-6"
                />

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-flashscore-border">
                    <Button 
                        variant="primary" 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#ce1126] hover:bg-[#a30d1e] text-white px-6"
                    >
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
                    </Button>
                </div>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-flashscore-border">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-flashscore-text">Préférences de Notification</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1">Gérez comment vous souhaitez recevoir les notifications</p>
                    </div>
                </div>

                {/* Channels */}
                <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-4 flex items-center gap-2">
                        <MessageSquare size={18} className="text-[#ce1126]" />
                        Canaux de notification
                    </h4>
                    <Input
                        id="channels"
                        type="checkbox"
                        value={notificationPrefs.channels}
                        options={[
                            { value: 'inApp', label: 'Notifications in-app' },
                            { value: 'whatsapp', label: 'WhatsApp' },
                            { value: 'email', label: 'Email' },
                        ]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const { value, checked } = e.target;
                            setNotificationPrefs(prev => ({
                                ...prev,
                                channels: checked 
                                    ? [...prev.channels, value]
                                    : prev.channels.filter(c => c !== value)
                            }));
                        }}
                    />
                </div>

                {/* Types */}
                <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-4 flex items-center gap-2">
                        <Bell size={18} className="text-[#ce1126]" />
                        Types de notifications
                    </h4>
                    <Input
                        id="types"
                        type="checkbox"
                        value={notificationPrefs.types}
                        options={[
                            { value: 'designation', label: 'Désignations' },
                            { value: 'convocation', label: 'Convocations' },
                            { value: 'reminder', label: 'Rappels' },
                            { value: 'payment', label: 'Paiements' },
                            { value: 'announcement', label: 'Annonces' },
                            { value: 'availability', label: 'Disponibilités' },
                        ]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const { value, checked } = e.target;
                            setNotificationPrefs(prev => ({
                                ...prev,
                                types: checked 
                                    ? [...prev.types, value]
                                    : prev.types.filter(t => t !== value)
                            }));
                        }}
                    />
                </div>

                {/* Quiet Hours */}
                <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-4 flex items-center gap-2">
                        <Volume2 size={18} className="text-[#ce1126]" />
                        Heures silencieuses
                    </h4>
                    <div className="space-y-4">
                       <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notificationPrefs.quietHours.enabled}
                                onChange={(e) => setNotificationPrefs(prev => ({
                                    ...prev,
                                    quietHours: { ...prev.quietHours, enabled: e.target.checked }
                                }))}
                                className="w-4 h-4 text-[#ce1126] border-gray-300 dark:border-flashscore-border rounded focus:ring-[#ce1126]"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Activer les heures silencieuses</span>
                        </label>
                        {notificationPrefs.quietHours.enabled && (
                            <div className="grid grid-cols-2 gap-4 pl-7">
                                <Input
                                    id="quietHoursStart"
                                    type="time"
                                    label="Début"
                                    value={notificationPrefs.quietHours.start}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationPrefs(prev => ({
                                        ...prev,
                                        quietHours: { ...prev.quietHours, start: e.target.value }
                                    }))}
                                />
                                <Input
                                    id="quietHoursEnd"
                                    type="time"
                                    label="Fin"
                                    value={notificationPrefs.quietHours.end}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationPrefs(prev => ({
                                        ...prev,
                                        quietHours: { ...prev.quietHours, end: e.target.value }
                                    }))}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Reminder Timing */}
                <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-flashscore-text mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-[#ce1126]" />
                        Délai des rappels
                    </h4>
                    <Form
                        fields={[
                            {
                                name: 'matchHoursBefore',
                                label: 'Rappel match (heures avant)',
                                type: 'number',
                                min: 1,
                                max: 168,
                                icon: <Clock size={18} />,
                            },
                            {
                                name: 'seminarHoursBefore',
                                label: 'Rappel séminaire (heures avant)',
                                type: 'number',
                                min: 1,
                                max: 168,
                                icon: <Clock size={18} />,
                            },
                        ]}
                        formData={{
                            matchHoursBefore: notificationPrefs.reminderTiming.matchHoursBefore.toString(),
                            seminarHoursBefore: notificationPrefs.reminderTiming.seminarHoursBefore.toString(),
                        }}
                        onChange={(e) => {
                            const { id, value } = e.target;
                            setNotificationPrefs(prev => ({
                                ...prev,
                                reminderTiming: {
                                    ...prev.reminderTiming,
                                    [id]: parseInt(value) || 1
                                }
                            }));
                        }}
                        className="gap-4"
                    />
                </div>

                {/* WhatsApp Number Override */}
                <div className="mb-8">
                    <Input
                        id="whatsappNumber"
                        type="tel"
                        label="Numéro WhatsApp alternatif"
                        placeholder="+216 12 345 678"
                        value={notificationPrefs.whatsappNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationPrefs(prev => ({
                            ...prev,
                            whatsappNumber: e.target.value
                        }))}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-2">Laissez vide pour utiliser le numéro de téléphone principal</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-flashscore-border">
                    <Button 
                        variant="primary" 
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        className="flex items-center gap-2 bg-[#ce1126] hover:bg-[#a30d1e] text-white px-6"
                    >
                        <Save size={18} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Parametres;