import { Role } from '../../types/user';

/**
 * Frontend capability flags that mirror the backend controller `@Roles(...)`
 * declarations exactly. Keep these in sync with the API so the UI only ever
 * offers actions the server will actually authorize (avoids 403s).
 *
 * Scope (league/competition) is enforced server-side per role via the category
 * mechanism; these flags only gate *whether* the action button is shown.
 */
const ROLE_CAPABILITIES = {
  // MatchesController
  createMatch: [Role.ADMIN_DNA, Role.DESIGNATION_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
  editMatch:   [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
  deleteMatch: [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
  importMatch: [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],

  // RefereesController
  createReferee: [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
  editReferee:   [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
  deleteReferee: [Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],

  // PaymentsController
  generatePayment: [Role.FINANCE_DNA, Role.ADMIN_DNA, Role.CAA, Role.CAJ, Role.CAF, Role.CRA],
} as const;

export type Capability = keyof typeof ROLE_CAPABILITIES;

export const can = (role: Role | string | undefined, capability: Capability): boolean =>
  !!role && (ROLE_CAPABILITIES[capability] as readonly string[]).includes(role);

/**
 * Categories a commission role is allowed to manage — mirrors the backend
 * `getAllowedCategoriesForRole`. Returns null for unrestricted roles.
 * Used to constrain category selectors so writes stay in scope.
 */
export const allowedCategoriesForRole = (role: Role | string | undefined): string[] | null => {
  switch (role) {
    case Role.CAA: return ['C1', 'C2'];
    case Role.CAJ: return ['JEUNE'];
    case Role.CAF: return ['FEMININE'];
    case Role.CRA: return ['REGIONAL'];
    case Role.ADMIN_DNA:
    case Role.DESIGNATION_DNA:
    case Role.FINANCE_DNA:
      return null;
    default:
      return [];
  }
};
export const allowedLeaguesForRole = (role: Role | string | undefined): string[] | null => {
  switch (role) {
    case Role.CAA: return ['AMATEUR_C1', 'AMATEUR_C2'];
    case Role.CAJ: return ['JEUNES'];
    case Role.CAF: return ['FEMININE'];
    case Role.CRA: return ['REGIONAL'];
    case Role.ADMIN_DNA:
    case Role.DESIGNATION_DNA:
    case Role.FINANCE_DNA:
      return null;
    default:
      return [];
  }
};
