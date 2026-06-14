import { Edit2, Trash2} from "lucide-react"

export const TableActions = ({onEdit, onDelete}: {onEdit: () => void, onDelete: () => void}) => {
    return (
        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
            <button 
                onClick={() => onEdit()}
                className="p-1.5 hover:bg-blue-50 text-gray-400 dark:text-flashscore-muted hover:text-blue-600 rounded-lg transition-colors"
                title="Modifier"
            >
            <Edit2 className="w-4 h-4" />
            </button>
            <button 
                onClick={() => onDelete()}
                className="p-1.5 hover:bg-red-50 text-gray-400 dark:text-flashscore-muted hover:text-red-600 rounded-lg transition-colors"
                title="Supprimer">
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )};