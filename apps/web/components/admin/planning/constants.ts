// Status mapper: French labels to backend enum values
export const STATUS_MAPPER: Record<string, string> = {
  'Terminés': 'COMPLETED',
  'Suspendus': 'POSTPONED',
  'Annulés': 'CANCELLED',
  'À venir': 'SCHEDULED',
};

export const COMPETITION_LABELS: Record<string, string> = {
  'LIGUE1': 'Ligue 1',
  'LIGUE2': 'Ligue 2',
  'COUPE': 'Coupe de Tunisie',
  'AMATEUR_C1': 'Amateur C1',
  'AMATEUR_C2': 'Amateur C2',
  'JEUNES': 'Jeunes',
  'FEMININE': 'Féminine',
  'REGIONAL': 'Régional'
};

export const COMPETITION_OPTIONS = [
  { value: 'LIGUE1', label: 'Ligue 1' },
  { value: 'LIGUE2', label: 'Ligue 2' },
  { value: 'COUPE', label: 'Coupe' },
  { value: 'AMATEUR_C1', label: 'Amateur C1' },
  { value: 'AMATEUR_C2', label: 'Amateur C2' },
  { value: 'JEUNES', label: 'Jeunes' },
  { value: 'FEMININE', label: 'Féminine' },
  { value: 'REGIONAL', label: 'Régional' }
];

export const CATEGORY_OPTIONS = [
  { value: 'A', label: 'Catégorie A' },
  { value: 'B', label: 'Catégorie B' },
  { value: 'C1', label: 'Catégorie C1' },
  { value: 'C2', label: 'Catégorie C2' },
  { value: 'JEUNE', label: 'Catégorie Jeune' },
  { value: 'FEMININE', label: 'Catégorie Féminine' },
  { value: 'REGIONAL', label: 'Catégorie Régional' }
];

export const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'À venir' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'POSTPONED', label: 'Suspendu' },
  { value: 'CANCELLED', label: 'Annulé' }
];
