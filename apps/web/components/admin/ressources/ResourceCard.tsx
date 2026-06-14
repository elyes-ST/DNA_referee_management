import Link from 'next/link';
import Image from 'next/image';
import { Bell, ExternalLink, Trash2, Video } from 'lucide-react';
import { Card } from '../../ui/Card';

interface ResourceCardProps {
  resource: any;
  categoryOptions: Array<{ value: string; label: string }>;
  onEdit: (resource: any) => void;
  onDelete: (id: string) => void;
  onSendNotification: (id: string) => void;
  sendingNotificationId?: string | null;
  onIncrementView: (id: string) => void;
}

const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const ResourceCard = ({ 
  resource, 
  categoryOptions, 
  onEdit, 
  onDelete,
  onSendNotification,
  sendingNotificationId,
  onIncrementView 
}: ResourceCardProps) => {
  return (
    <Card className="relative group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden border-2 border-gray-100 dark:border-flashscore-border hover:border-[#ce1126]">
      {/* Thumbnail or Icon Area */}
      <div className="relative h-40 bg-gradient-to-br from-[#ce1126]/5 to-[#ce1126]/10 flex items-center justify-center overflow-hidden">
        {resource.thumbnailUrl && isValidImageUrl(resource.thumbnailUrl) ? (
          <>
            <Image 
              src={resource.thumbnailUrl} 
              alt={resource.title} 
              width={400}
              height={160}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallbackIcon = parent.querySelector('.fallback-icon');
                  if (fallbackIcon) {
                    (fallbackIcon as HTMLElement).style.display = 'block';
                  }
                }
              }}
            />
            <Video className="fallback-icon w-16 h-16 text-[#ce1126]/30 hidden" />
          </>
        ) : (
          <Video className="w-16 h-16 text-[#ce1126]/30" />
        )}
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
                  className="text-white bg-purple-500 hover:bg-purple-600 p-1.5 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => onSendNotification(resource)}
                  disabled={sendingNotificationId === resource._id}
                  title="Envoyer notifications"
                >
                  {sendingNotificationId === resource._id
                    ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Bell className="w-4 h-4" />}
                </button>
          <button 
            onClick={() => onEdit(resource)}
            className="text-white bg-blue-500 hover:bg-blue-600 p-1.5 rounded-full shadow-lg"
            title="Modifier"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={() => onDelete(resource._id)}
            className="text-white bg-red-500 hover:bg-red-600 p-1.5 rounded-full shadow-lg"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

        </div>
        
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="text-xs px-2.5 py-1 bg-white dark:bg-flashscore-card/90 backdrop-blur-sm text-[#ce1126] rounded-full font-semibold shadow-sm">
            {resource.type}
          </span>
        </div>
        
        {/* Duration badge */}
        {resource.duration > 0 && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-2.5 py-1 bg-black/70 text-white rounded-full font-medium">
              {resource.duration} min
            </span>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-4 flex flex-col">
        <h4 className="text-lg font-bold text-gray-900 dark:text-flashscore-text mb-2 line-clamp-2 group-hover:text-[#ce1126] transition-colors">
          {resource.title}
        </h4>
        
        {/* Categories */}
        {resource.categories && resource.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {resource.categories.slice(0, 2).map((cat: string) => (
              <span key={cat} className="text-xs px-2 py-1 bg-gray-100 dark:bg-flashscore-border text-gray-700 dark:text-gray-300 rounded font-medium">
                {categoryOptions.find(c => c.value === cat)?.label || cat}
              </span>
            ))}
            {resource.categories.length > 2 && (
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-flashscore-border text-gray-500 dark:text-gray-400 dark:text-flashscore-muted rounded font-medium">
                +{resource.categories.length - 2}
              </span>
            )}
          </div>
        )}
        
        <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-flashscore-muted mb-4 line-clamp-2 flex-1">
          {resource.description}
        </p>
        
        {/* Action Button */}
        <Link
          href={resource.url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={() => onIncrementView(resource._id)}
          className="flex items-center justify-center w-full px-4 py-2.5 bg-[#ce1126] text-white rounded-lg text-sm font-semibold hover:bg-[#a00e1e] transition-colors shadow-sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Consulter
        </Link>
      </div>
    </Card>
  );
};
