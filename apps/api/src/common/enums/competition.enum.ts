export enum Competition {
  LIGUE1 = 'LIGUE1',
  LIGUE2 = 'LIGUE2',
  COUPE = 'COUPE',
  AMATEUR_C1 = 'AMATEUR_C1',
  AMATEUR_C2 = 'AMATEUR_C2',
  JEUNES = 'JEUNES',
  FEMININE = 'FEMININE',
  REGIONAL = 'REGIONAL',
}

export enum MatchCategory {
  A = 'A',
  B = 'B',
  C1 = 'C1',
  C2 = 'C2',
  JEUNE = 'JEUNE',
  FEMININE = 'FEMININE',
  REGIONAL = 'REGIONAL',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
}

export enum RefereeRole {
  // Obligatoires
  ARBITRE_CENTRAL = 'ARBITRE_CENTRAL', // Arbitre principal
  ASSISTANT_1 = 'ASSISTANT_1', // 1er Assistant
  ASSISTANT_2 = 'ASSISTANT_2', // 2ème Assistant
  QUATRIEME_ARBITRE = 'QUATRIEME_ARBITRE', // 4ème Arbitre

  // Optionnels (VAR)
  ARBITRE_VAR = 'ARBITRE_VAR', // Arbitre VAR
  ASSISTANT_VAR = 'ASSISTANT_VAR', // Assistant VAR
}

// Rôles obligatoires pour une désignation complète
export const REQUIRED_REFEREE_ROLES = [
  RefereeRole.ARBITRE_CENTRAL,
  RefereeRole.ASSISTANT_1,
  RefereeRole.ASSISTANT_2,
  RefereeRole.QUATRIEME_ARBITRE,
];

// Rôles optionnels
export const OPTIONAL_REFEREE_ROLES = [
  RefereeRole.ARBITRE_VAR,
  RefereeRole.ASSISTANT_VAR,
];
