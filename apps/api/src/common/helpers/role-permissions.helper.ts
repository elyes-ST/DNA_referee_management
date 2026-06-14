import { Role, RefereeCategory } from '../enums';

/**
 * Returns the array of allowed categories for a given role.
 * If the role has unrestricted access to all categories, returns null.
 * If the role has no access, returns an empty array.
 */
export function getAllowedCategoriesForRole(role: string): string[] | null {
  switch (role) {
    case Role.CAA:
      return [RefereeCategory.C, RefereeCategory.C1, RefereeCategory.C2];
    case Role.CAJ:
      return [RefereeCategory.JEUNE];
    case Role.CAF:
      return [RefereeCategory.FEMININE];
    case Role.CRA:
      return [RefereeCategory.REGIONAL];
    case Role.ADMIN_DNA:
    case Role.DESIGNATION_DNA:
    case Role.FINANCE_DNA:
    case Role.CDC:
      return null; // Unrestricted access
    default:
      return []; // No access by default for category-restricted operations
  }
}
