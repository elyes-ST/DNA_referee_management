import { ResourceCard } from './ResourceCard';

interface ResourceGridProps {
  resources: any[];
  loading: boolean;
  categoryOptions: Array<{ value: string; label: string }>;
  onEdit: (resource: any) => void;
  onDelete: (id: string) => void;
  onSendNotification: (id: string) => void;
  sendingNotificationId?: string | null;
  onIncrementView: (id: string) => void;
}

export const ResourceGrid = ({ 
  resources, 
  loading, 
  categoryOptions, 
  onEdit, 
  onDelete,
  onSendNotification,
  sendingNotificationId,
  onIncrementView 
}: ResourceGridProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ce1126]"></div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">
        Aucune ressource disponible
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource: any) => (
        <ResourceCard
          key={resource._id}
          resource={resource}
          categoryOptions={categoryOptions}
          onEdit={onEdit}
          onDelete={onDelete}
          onSendNotification={onSendNotification}
          sendingNotificationId={sendingNotificationId}
          onIncrementView={onIncrementView}
        />
      ))}
    </div>
  );
};
