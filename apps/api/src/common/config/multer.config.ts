import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

// Configuration pour l'upload des logos d'équipes
export const teamLogoStorage = diskStorage({
  destination: './uploads/team-logos',
  filename: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `team-logo-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

// Filtre pour valider les types de fichiers d'images
export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    return callback(
      new BadRequestException(
        'Seuls les fichiers image sont autorisés (jpg, jpeg, png, gif, svg, webp)',
      ),
      false,
    );
  }
  callback(null, true);
};

// Limites de taille de fichier (2MB)
export const maxFileSize = 2 * 1024 * 1024; // 2MB
