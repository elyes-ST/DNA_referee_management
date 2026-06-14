export const EVENT_TYPE_OPTIONS = [
  { value: 'SEMINAR', label: 'Séminaire' },
  { value: 'TRAINING', label: 'Formation' },
  { value: 'MEETING', label: 'Réunion' }
];

export const getTypeLabel = (type: string) => {
  const option = EVENT_TYPE_OPTIONS.find(o => o.value === type);
  return option?.label || type;
};
