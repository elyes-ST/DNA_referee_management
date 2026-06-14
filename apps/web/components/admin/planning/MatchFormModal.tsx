import { Plus, Save, Shield } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Form, FormField } from '../../ui/Form';
import { Button } from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';

interface MatchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  formData: any;
  onChange: (e: any) => void;
  onSubmit: () => void;
  fields: FormField[];
  teams: any[];
}

const TeamPreviewBadge = ({ name }: { name?: string }) => {
  if (!name) {
    return (
      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
        <Shield className="w-6 h-6 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
      <span className="text-sm font-bold text-white uppercase">
        {name.slice(0, 2)}
      </span>
    </div>
  );
};

export const MatchFormModal = ({
  isOpen,
  onClose,
  title,
  formData,
  onChange,
  onSubmit,
  fields,
  teams
}: MatchFormModalProps) => {
  const handleTeamChange = (e: any) => {
    if (e.target.id === 'homeTeamId' || e.target.id === 'awayTeamId') {
      const teamNameField = e.target.id === 'homeTeamId' ? 'homeTeam' : 'awayTeam';
      // Support both async-select (label in event) and legacy select (lookup from teams array)
      const teamName = e.target.label
        || teams.find((team: any) => team._id === e.target.value)?.name
        || '';
      if (teamName) {
        onChange({
          target: {
            id: e.target.id,
            value: e.target.value,
            extraData: { [teamNameField]: teamName }
          }
        });
        return;
      }
    }
    onChange(e);
  };

  const isEdit = title.includes('Modifier');
  const homeName = formData.homeTeam;
  const awayName = formData.awayTeam;
  const hasTeams = !!(homeName || awayName);

  const hasScoreInputs = fields.some((f) => f.name === 'homeScore' || f.name === 'awayScore');
  const scoreFields = fields.filter((f) => f.name === 'homeScore' || f.name === 'awayScore');
  const otherFields = fields.filter((f) => f.name !== 'homeScore' && f.name !== 'awayScore');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 -m-px">
        {/* Live preview header, mirrors the match details scoreboard */}
        {hasTeams && (
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl px-4 py-4 -mx-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <TeamPreviewBadge name={homeName} />
                <span className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">
                  {homeName || 'Équipe domicile'}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-3 min-w-[80px]">
                {formData.date && (
                  <span className="text-[11px] text-gray-400 dark:text-flashscore-muted font-medium mb-1">
                    {new Date(formData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                )}
                <span className="text-xl font-bold text-white tabular-nums">
                  {formData.time || '--:--'}
                </span>
                {formData.stadium && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-1 truncate max-w-[100px]">
                    {formData.stadium}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center text-center gap-2">
                <TeamPreviewBadge name={awayName} />
                <span className="text-xs font-semibold text-white leading-tight truncate max-w-[100px]">
                  {awayName || 'Équipe extérieure'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main fields */}
        <div>
          <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-xs uppercase tracking-wide font-medium block mb-2 px-1">
            Informations du match
          </span>
          <Form
            fields={otherFields}
            formData={formData}
            onChange={handleTeamChange}
          />
        </div>

        {/* Score section, only on edit forms */}
        {hasScoreInputs && (
          <div className="pt-2 border-t border-gray-100 dark:border-flashscore-border">
            <span className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted text-xs uppercase tracking-wide font-medium block mb-2 px-1 mt-2">
              Résultat
            </span>
            <Form
              fields={scoreFields}
              formData={formData}
              onChange={handleTeamChange}
            />
          </div>
        )}

        {/* VAR toggle */}
        <div className="pt-2 border-t border-gray-100 dark:border-flashscore-border">
          <Checkbox
            id="hasVAR"
            label="Match avec VAR"
            value={String(formData.hasVAR)}
            checked={formData.hasVAR}
            onChange={(e) => onChange({ target: { id: 'hasVAR', value: e.target.checked } })}
            className="mt-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex items-center">
            Annuler
          </Button>
          <Button variant="primary" onClick={onSubmit} className="flex items-center bg-[#ce1126] hover:bg-[#a90e1f] border-[#ce1126]">
            {isEdit ? (
              <Save className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};