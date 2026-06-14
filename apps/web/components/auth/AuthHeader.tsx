import Image from 'next/image';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <div className="flex flex-col space-y-2 mb-6  ">
      <div className="mb-4">
        <div className="relative w-20 h-20 flex items-center justify-center mx-auto">
          <Image 
            src="/logo.png" 
            alt="Logo FTF" 
            width={80} 
            height={80} 
            className="object-contain"
            priority
          /> 
        </div>
      </div>
      
      {title && <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-flashscore-text">{title}</h1>}
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-flashscore-muted">{subtitle}</p>}
    </div>
  );
}
