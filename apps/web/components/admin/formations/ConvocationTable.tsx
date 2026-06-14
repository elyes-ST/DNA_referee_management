import { Calendar, MapPin, Users, ClipboardList, Edit, Trash2, Bell } from 'lucide-react';
import { Table, TableRow, TableCell } from '../../ui/Table';

interface ConvocationTableProps {
  convocations: any[];
  onGrade: (convocation: any) => void;
  onEdit: (convocation: any) => void;
  onDelete: (id: string) => void;
  onSendNotification: (id: string) => void;
  sendingNotificationId?: string | null;
  getTypeLabel: (type: string) => string;
}

export const ConvocationTable = ({ 
  convocations, 
  onGrade, 
  onEdit, 
  onDelete,
  onSendNotification,
  sendingNotificationId,
  getTypeLabel 
}: ConvocationTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table headers={["Événement", "Date", "Lieu", "Parts.", "Actions"]}>
        {convocations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 dark:text-flashscore-muted py-8">
              Aucune convocation disponible
            </TableCell>
          </TableRow>
        ) : (
          convocations.map((e: any) => (
            <TableRow key={e._id}>
              <TableCell>
                <div className="font-semibold">{e.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{getTypeLabel(e.type)}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 min-w-[100px]">
                  <Calendar className="w-3 h-3 text-gray-400 dark:text-flashscore-muted" />
                  <span>{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 min-w-[120px]">
                  <MapPin className="w-3 h-3 text-gray-400 dark:text-flashscore-muted" />
                  <span>{e.location}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-gray-400 dark:text-flashscore-muted" />
                  <span>{e.referees?.length || 0}</span>
                </div>
              </TableCell>
              <TableCell className="flex gap-2 mt-2.5 items-center">
                <button 
                  className="p-0 border-none bg-transparent cursor-pointer hover:text-green-600 transition-colors" 
                  onClick={() => onGrade(e)}
                  title="Noter"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>
                <button 
                  className="p-0 border-none bg-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:text-purple-600" 
                  onClick={() => onSendNotification(e._id)}
                  disabled={sendingNotificationId === e._id}
                  title="Envoyer notifications"
                >
                  {sendingNotificationId === e._id
                    ? <span className="inline-block w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    : <Bell className="w-4 h-4" />}
                </button>
                <button 
                  className="p-0 border-none bg-transparent cursor-pointer hover:text-blue-600 transition-colors" 
                  onClick={() => onEdit(e)}
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  className="text-red-500 bg-transparent border-none p-0 cursor-pointer hover:text-red-700 transition-colors" 
                  onClick={() => onDelete(e._id)}
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))
        )}
      </Table>
    </div>
  );
};
