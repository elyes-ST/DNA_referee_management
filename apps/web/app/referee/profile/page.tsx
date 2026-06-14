'use client';
import React, { useState, useEffect } from 'react';
import {
  Mail, Phone, MapPin, Save, User,
  Shield, AlertTriangle, ChevronRight, CheckCircle2, Loader2
} from 'lucide-react';
import { useUser } from '../../../hooks/useUser';
import { api } from '../../../services/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArbitreProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field = ({
  id, label, type = 'text', placeholder, icon, value, onChange, disabled = false, required = false, colSpan = false,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  icon: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; required?: boolean; colSpan?: boolean;
}) => (
  <div className={`flex flex-col gap-1.5 ${colSpan ? 'md:col-span-2' : ''}`}>
    <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-flashscore-muted">
      {label}{required && <span className="text-[#ce1126] ml-1">*</span>}
    </label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-flashscore-muted">{icon}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none
          ${disabled
            ? 'bg-gray-50 dark:bg-flashscore-hover border-gray-100 dark:border-flashscore-border text-gray-400 dark:text-flashscore-muted cursor-not-allowed'
            : 'bg-white dark:bg-flashscore-card border-gray-200 dark:border-flashscore-border text-gray-900 dark:text-flashscore-text focus:border-[#ce1126] focus:ring-2 focus:ring-[#ce1126]/10 hover:border-gray-300 dark:border-flashscore-border'
          }`}
      />
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, icon, children }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-flashscore-card rounded-2xl border border-gray-100 dark:border-flashscore-border shadow-sm overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#ce1126]/8 flex items-center justify-center text-[#ce1126]">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-flashscore-text">{title}</h3>
        <p className="text-xs text-gray-400 dark:text-flashscore-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ArbitreProfilePage = () => {
  const { user, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profileData, setProfileData] = useState<ArbitreProfileData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // Fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const profileResponse = await api.referees.getMyProfile();
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
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      // Update referee-specific fields
      await api.referees.updateMyProfile({
        address: profileData.address,
        emergencyContact: {
          name: profileData.emergencyContactName,
          phone: profileData.emergencyContactPhone,
        },
      });

      // Update base user fields
      await api.users.updateMyProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phoneNumber,
      });

      await refreshUser();
      setSaved(true);
      toast.success('Profil mis à jour avec succès');
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#ce1126]/8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#ce1126] animate-spin" />
        </div>
        <p className="text-sm text-gray-400 dark:text-flashscore-muted font-medium">Chargement du profil…</p>
      </div>
    );
  }

  // ── Page ─────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 py-2 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-flashscore-text tracking-tight">Mon Profil</h1>
          <p className="text-sm text-gray-400 dark:text-flashscore-muted mt-1">Gérez vos informations personnelles et contacts</p>
        </div>
        {/* Avatar badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ce1126] to-[#8b0016] flex items-center justify-center shadow-lg shadow-[#ce1126]/20">
          <span className="text-white font-bold text-lg">
            {profileData.firstName?.[0]?.toUpperCase()}{profileData.lastName?.[0]?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Section 1 — Informations personnelles */}
      <SectionCard
        title="Informations personnelles"
        subtitle="Nom, téléphone et coordonnées de base"
        icon={<User size={16} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field id="firstName" label="Prénom" placeholder="Prénom" icon={<User size={15} />}
            value={profileData.firstName} onChange={handleChange} required />
          <Field id="lastName" label="Nom" placeholder="Nom" icon={<User size={15} />}
            value={profileData.lastName} onChange={handleChange} required />
          <Field id="email" label="Email" type="email" placeholder="Email" icon={<Mail size={15} />}
            value={profileData.email} onChange={handleChange} disabled />
          <Field id="phoneNumber" label="Téléphone" type="tel" placeholder="+216 12 345 678"
            icon={<Phone size={15} />} value={profileData.phoneNumber} onChange={handleChange} />
        </div>
      </SectionCard>

      {/* Section 2 — Adresse */}
      <SectionCard
        title="Adresse"
        subtitle="Votre adresse de résidence"
        icon={<MapPin size={16} />}
      >
        <div className="grid grid-cols-1 gap-5">
          <Field id="address" label="Adresse complète" placeholder="Rue, ville, code postal"
            icon={<MapPin size={15} />} value={profileData.address} onChange={handleChange} colSpan />
        </div>
      </SectionCard>

      {/* Section 3 — Contact d'urgence */}
      <SectionCard
        title="Contact d'urgence"
        subtitle="Personne à contacter en cas d'urgence"
        icon={<AlertTriangle size={16} />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field id="emergencyContactName" label="Nom du contact" placeholder="Nom complet"
            icon={<User size={15} />} value={profileData.emergencyContactName} onChange={handleChange} />
          <Field id="emergencyContactPhone" label="Téléphone du contact" type="tel"
            placeholder="+216 12 345 678" icon={<Phone size={15} />}
            value={profileData.emergencyContactPhone} onChange={handleChange} />
        </div>
      </SectionCard>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm
            ${saved
              ? 'bg-green-500 text-white shadow-green-200'
              : 'bg-[#ce1126] hover:bg-[#a30d1e] text-white shadow-[#ce1126]/20 hover:shadow-[#ce1126]/30 active:scale-95'
            }
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`}
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
          ) : saved ? (
            <><CheckCircle2 size={16} /> Enregistré</>
          ) : (
            <><Save size={16} /> Enregistrer le profil</>
          )}
        </button>
      </div>
    </div>
  );
};

export default ArbitreProfilePage;