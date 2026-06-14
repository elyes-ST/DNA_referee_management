'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Form, FormField } from '../../../components/ui/Form';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { DeleteModal } from '../../../components/ui/DeleteModel';
import { Pagination } from '../../../components/ui/Pagination';
import { Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';
import { validateForm } from '../../../utils/helpers/form-validator';
import { AuthGuard } from '../../../components/ui/AuthGuard';
import { Role } from '../../../types/user';
import { useDebounce } from '../../../hooks/useDebounce';

const Inspecteurs = () => {
    const [search, setSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentData, setCurrentData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 8;

    const defaultNewUser = {
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        matricule: '',
        region: '',
        specialization: '',
    };

    const [newUser, setNewUser] = useState<any>(defaultNewUser);

    const fetchInspectors = async () => {
        setLoading(true);
        try {
            const response = await api.inspectors.getAll({ limit, page: currentPage, search: searchTerm });
            const data = response?.data?.data ?? [];
            setTotal(response?.data?.total ?? 0);
            setTotalPages(response?.data?.totalPages ?? 1);
            setCurrentData(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error('Fetch error:', err);
            setCurrentData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInspectors();
    }, [currentPage, searchTerm]);

    // Debounced search: applies the search term 500ms after the user stops
    // typing, resetting to the first page. No Enter / button submission needed.
    const debouncedSearch = useDebounce(search, 500);
    useEffect(() => {
        setSearchTerm(debouncedSearch);
        setCurrentPage(1);
    }, [debouncedSearch]);

    const getFields = (isEditMode: boolean = false): FormField[] => {
        // User-identity fields are owned by the User document. The Inspecteurs API
        // provisions them on create but cannot mutate them on update, so they are
        // shown read-only in edit mode.
        const baseFields: FormField[] = [
            { name: 'firstName', label: 'Prénom', placeholder: 'Prénom', required: true},
            { name: 'lastName', label: 'Nom', placeholder: 'Nom', required: true},
            { name: 'email', type: 'email', label: 'Email', placeholder: 'Email', required: true},
            { name: 'phoneNumber', type: 'tel', label: 'Téléphone', placeholder: 'Téléphone', required: false},
        ];

        if (!isEditMode) {
            baseFields.push(
                { name: 'password', type: 'password', label: 'Mot de passe', placeholder: 'Mot de passe', required: true },
                { name: 'confirmPassword', label: 'Confirmer mot de passe', placeholder: 'Confirmer', type: 'password', required: true }
            );
        }

        return [
            ...baseFields,
            { name: 'matricule', label: 'Matricule', placeholder: 'Matricule', required: true },
            { name: 'region', label: 'Région', placeholder: 'Région', required: true },
            { name: 'specialization', label: 'Spécialisation (optionnel)', placeholder: 'Spécialisation', required: false, className: 'col-span-1 md:col-span-2' }
        ];
    };

    const handleAddUser = async () => {
        if (!validateForm({ email: newUser.email, password: newUser.password, firstName: newUser.firstName, lastName: newUser.lastName, confirmPassword: newUser.confirmPassword }, ["email", "password", "firstName", "lastName", "confirmPassword"])) return;
        if (!validateForm({ matricule: newUser.matricule, region: newUser.region }, ["matricule", "region"])) return;
        try {
            await api.inspectors.create({
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                password: newUser.password,
                phoneNumber: newUser.phoneNumber || undefined,
                matricule: newUser.matricule,
                region: newUser.region,
                specialization: newUser.specialization || undefined
            });

            await fetchInspectors();
            setNewUser(defaultNewUser);
            setIsModalOpen(false);
            toast.success('Inspecteur ajouté avec succès');
        } catch (err: any) {
            toast.error("Erreur lors de l'ajout: " + (err.response?.data?.message || err.message));
        }
    };

    const confirmDelete = (id: string) => {
        setUserToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await api.inspectors.delete(userToDelete);
            await fetchInspectors();
            setUserToDelete(null);
            setShowDeleteModal(false);
            toast.success('Inspecteur supprimé avec succès');
        } catch (err: any) {
            toast.error('Erreur lors de la suppression: ' + (err.message || err));
        }
    };

    const handleEditUser = (record: any) => {
        const userId = record.userId?._id || record.userId?.id || record._id || record.id;
        const recordId = record._id || record.id;

        const firstName = record.userId?.firstName || record.firstName || '';
        const lastName = record.userId?.lastName || record.lastName || '';
        const email = record.userId?.email || record.email || '';
        const phoneNumber = record.userId?.phoneNumber || record.phoneNumber || '';

        const formattedUser = {
            id: userId,
            recordId: recordId,
            firstName: String(firstName),
            lastName: String(lastName),
            email: String(email),
            phoneNumber: String(phoneNumber),
            matricule: String(record.matricule || ''),
            originalMatricule: String(record.matricule || ''),
            region: String(record.region || ''),
            specialization: String(record.specialization || ''),
            password: '',
            confirmPassword: ''
        };
        setEditingUser(formattedUser);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        if (!validateForm({ email: editingUser.email, firstName: editingUser.firstName, lastName: editingUser.lastName ,matricule: editingUser.matricule, region: editingUser.region}, ["email", "firstName", "lastName","matricule", "region"])) return;
        try {
            const userId = editingUser.id;
            const recordId = editingUser.recordId;
            await api.users.update(userId, {
                            firstName: editingUser.firstName,
                            lastName: editingUser.lastName,
                            email: editingUser.email,
                            phoneNumber: editingUser.phoneNumber || undefined
                        });
            const inspectorData: any = {
                region: editingUser.region,
                specialization: editingUser.specialization || undefined
            };
            if (editingUser.matricule !== editingUser.originalMatricule) {
                inspectorData.matricule = editingUser.matricule;
            }
            await api.inspectors.update(recordId, inspectorData);

            await fetchInspectors();
            setIsEditModalOpen(false);
            setEditingUser(null);
            toast.success('Inspecteur modifié avec succès');
        } catch (err: any) {
            toast.error('Erreur lors de la modification: ' + (err.response?.data?.message || err.message));
        }
    };

    const MatriculeChip = ({ value }: { value: string }) => {
        if (!value) return <span className="text-gray-400 dark:text-flashscore-muted">-</span>;
        return (
            <span className="inline-flex items-center font-mono text-xs font-medium bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                {value}
            </span>
        );
    };

    const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
        <div className="flex gap-1.5 items-center">
            <button
                title="Modifier"
                className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={onEdit}
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                title="Supprimer"
                className="p-1.5 rounded-lg border-none bg-transparent cursor-pointer text-gray-400 dark:text-flashscore-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={onDelete}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );

    const handleOpenAddModal = () => {
        setNewUser({ ...defaultNewUser });
        setIsModalOpen(true);
    };

    const handleFormChange = (e: any, isEditMode: boolean = false) => {
        const { id, value } = e.target;
        if (isEditMode) {
            setEditingUser({ ...editingUser, [id]: value });
        } else {
            setNewUser({ ...newUser, [id]: value });
        }
    };

    const renderInspectorTable = () => (
        <Table headers={["Utilisateur", "Matricule", "Région", "Spécialisation", "Statut", "Actions"]}>
            {currentData.map((u: any, idx: number) => {
                const firstName = u.userId?.firstName || u.firstName || '';
                const lastName = u.userId?.lastName || u.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();

                return (
                    <TableRow key={`inspector-${u._id || u.id}-${idx}`}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar name={fullName} size="sm" />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-flashscore-text">{fullName || '-'}</div>
                                    {(u.userId?.email || u.email) && (
                                        <div className="text-xs text-gray-400 dark:text-flashscore-muted">{u.userId?.email || u.email}</div>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell><MatriculeChip value={u.matricule} /></TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{u.region || '-'}</TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">{u.specialization || '-'}</TableCell>
                        <TableCell>
                            <Badge status={u.userId?.isActive ? 'Actif' : 'Indisponible'}>
                                {u.userId?.isActive ? 'Actif' : 'Indisponible'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <ActionButtons onEdit={() => handleEditUser(u)} onDelete={() => confirmDelete(u._id || u.id)} />
                        </TableCell>
                    </TableRow>
                );
            })}
        </Table>
    );

    return (
        <AuthGuard role={[Role.ADMIN_DNA, Role.CDC]}>
            <div className="animate-fadeIn">
                <Card className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="text-lg font-bold">Gestion des Inspecteurs</h3>
                        <Button variant="primary" onClick={handleOpenAddModal} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                            + Ajouter Inspecteur
                        </Button>
                    </div>

                    {loading && <div className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-4">Chargement des inspecteurs...</div>}

                    {!loading && (
                        <>
                            <div className="flex gap-4 mb-6">
                                <div className="w-full max-w-md">
                                    <Input
                                        id="search-inspectors"
                                        placeholder="Rechercher un inspecteur..."
                                        value={search}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                        icon={<Search className="w-4 h-4" />}
                                    />
                                </div>
                            </div>

                            {renderInspectorTable()}

                            {currentData.length === 0 && (<div className="text-center p-8 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">Aucun inspecteur trouvé</div>)}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={total}
                                />
                            )}
                        </>
                    )}
                </Card>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter un Inspecteur">
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                        <Form fields={getFields(false)} formData={newUser} onChange={(e: any) => handleFormChange(e, false)} />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                        <Button variant="primary" onClick={handleAddUser}>Ajouter</Button>
                    </div>
                </Modal>

                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier l'Inspecteur">
                    {editingUser && (
                        <>
                            <div className="max-h-[60vh] overflow-y-auto pr-4">
                                <Form
                                    key={`edit-${editingUser.id}`}
                                    fields={getFields(true)}
                                    formData={editingUser}
                                    onChange={(e: any) => handleFormChange(e, true)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                                <Button variant="primary" onClick={handleSaveEdit}>Enregistrer</Button>
                            </div>
                        </>
                    )}
                </Modal>

                <DeleteModal
                    showDeleteModal={showDeleteModal}
                    setShowDeleteModal={setShowDeleteModal}
                    setEventToDelete={setUserToDelete}
                    handleDelete={handleDeleteUser}
                    message="Êtes-vous sûr de vouloir supprimer cet inspecteur ? Cette action est irréversible."
                />
            </div>
        </AuthGuard>
    );
};

export default Inspecteurs;
