export const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const API_ROUTES = {
      AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  TEAMS: {
    CREATE: '/teams',
    GET_ALL: '/teams',
    GET_REGIONS: '/teams/regions',
    GET_BY_REGION: '/teams/region/:region',
    GET_BY_LEAGUE: '/teams/league/:league',
    SEED: '/teams/seed',
    GET_ONE: '/teams/:id',
    UPDATE: '/teams/:id',
    DELETE: '/teams/:id',
    UPLOAD_LOGO: '/teams/:id/logo',
  },

  DASHBOARD: {
    GET_STATS: '/dashboard',
    GET_MATCHES_CHART: '/dashboard/charts/matches',
    GET_REFEREE_PERFORMANCE_CHART: '/dashboard/charts/referee-performance',
  },

  NOTIFICATIONS: {
    GET_MY: '/notifications/my',
    GET_UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: '/notifications/:id',
    GET_PREFERENCES: '/notifications/preferences',
    UPDATE_PREFERENCES: '/notifications/preferences',
    SEND_GROUP: '/notifications/send-group',
  },

  INSPECTOR_ASSIGNMENTS: {
    CREATE: '/inspector-assignments',
    GET_ALL: '/inspector-assignments',
    GET_DASHBOARD: '/inspector-assignments/dashboard',
    GET_AWAITING_REPORT: '/inspector-assignments/awaiting-report',
    GET_BY_MATCH: '/inspector-assignments/match/:matchId',
    GET_BY_INSPECTOR: '/inspector-assignments/inspector/:inspectorId',
    GET_ONE: '/inspector-assignments/:id',
    CANCEL: '/inspector-assignments/:id/cancel',
    LINK_REPORT: '/inspector-assignments/:id/link-report',
  },


  USERS: {
    CREATE: '/users',
    GET_ALL: '/users',
    GET_BY_ROLE: '/users/role/:role',
    MY_PROFILE: '/users/me',
    UPDATE_MY_PROFILE: '/users/me',
    GET_ONE: '/users/:id',
    UPDATE: '/users/:id',
    TOGGLE_STATUS: '/users/:id/toggle-status',
    DELETE: '/users/:id',
  },


  REFEREES: {
    CREATE: '/referees',
    GET_ALL: '/referees',
    GET_STATISTICS: '/referees/statistics',
    GET_BY_CATEGORY: '/referees/category/:category',
    MY_PROFILE: '/referees/me',
    UPDATE_MY_PROFILE: '/referees/me',
    GET_ONE: '/referees/:id',
    UPDATE: '/referees/:id',
    DELETE: '/referees/:id',
    IMPORT: '/referees/import',
  },


  INSPECTORS: {
    CREATE: '/inspectors',
    GET_ALL: '/inspectors',
    GET_ONE: '/inspectors/:id',
    UPDATE: '/inspectors/:id',
    DELETE: '/inspectors/:id',
  },


  CRA_PRESIDENTS: {
    CREATE: '/cra-presidents',
    GET_ALL: '/cra-presidents',
    GET_BY_REGION: '/cra-presidents/region/:region',
    GET_ONE: '/cra-presidents/:id',
    UPDATE: '/cra-presidents/:id',
    DELETE: '/cra-presidents/:id',
  },


  MATCHES: {
    CREATE: '/matches',
    IMPORT: '/matches/import',
    GET_ALL: '/matches',
    GET_CALENDAR: '/matches/calendar',
    GET_ONE: '/matches/:id',
    UPDATE: '/matches/:id',
    DELETE: '/matches/:id',
    UPDATE_DATE: '/matches/:id/date',
    SUBMIT_SHEET: '/matches/:id/submit-sheet',
  },

 
  CONVOCATIONS: {
    MY: '/convocations/my',
    MY_UPCOMING: '/convocations/my/upcoming',
    CREATE: '/convocations',
    GET_ALL: '/convocations',
    GET_ONE: '/convocations/:id',
    UPDATE: '/convocations/:id',
    DELETE: '/convocations/:id',
    ADD_NOTE: '/convocations/:id/add-note',
    SEND_NOTIFICATIONS: '/convocations/:id/send-notifications',
  },


  DESIGNATIONS: {
    CREATE: '/designations',
    GET_ALL: '/designations',
    GET_CALENDAR: '/designations/calendar',
    GET_BY_MATCH: '/designations/match/:matchId',
    GET_SUGGESTIONS: '/designations/suggestions/:matchId',
    MY_DESIGNATIONS: '/designations/my',
    ALL_OVERRIDES: '/designations/overrides/all',
    GET_ONE: '/designations/:id',
    UPDATE: '/designations/:id',
    DELETE: '/designations/:id',
    VALIDATE: '/designations/:id/validate',
    SUBMIT: '/designations/:id/submit',
    SEND_NOTIFICATIONS: '/designations/:id/send-notifications',
    BULK_ASSIGN: '/designations/bulk-assign',
    OVERRIDE: '/designations/:id/override',
    TAKE_CONTROL: '/designations/:id/take-control',
    OVERRIDE_HISTORY: '/designations/:id/override-history',
    REVERT_OVERRIDE: '/designations/:id/revert-override',
    GET_ELIGIBLE_REFEREES: '/designations/eligible/:matchId',
  },


  AVAILABILITY: {
    REPORT: '/availability/report',
    GET_MY: '/availability/my',
    GET_CRA_PENDING: '/availability/cra/pending',
    CREATE: '/availability',
    GET_ALL: '/availability',
    GET_ACTIVE: '/availability/active',
    GET_BY_REFEREE: '/availability/referee/:refereeId',
    GET_BY_DATE: '/availability/date/:date',
    GET_ONE: '/availability/:id',
    UPDATE: '/availability/:id',
    DELETE: '/availability/:id',
    APPROVE: '/availability/:id/approve',
    REJECT: '/availability/:id/reject',
  },


  COMMISSIONER_REPORTS: {
    CREATE: '/commissioner-reports',
    GET_ALL: '/commissioner-reports',
    GET_BY_REFEREE: '/commissioner-reports/referee/:refereeId',
    GET_BY_MATCH: '/commissioner-reports/match/:matchId',
    GET_ONE: '/commissioner-reports/:id',
    UPDATE: '/commissioner-reports/:id',
    DELETE: '/commissioner-reports/:id',
  },


  PAYMENTS: {
    GENERATE: '/payments/generate',
    PREVIEW_MATCHES: '/payments/preview-matches',
    GET_ALL: '/payments',
    GET_PENDING: '/payments/pending',
    GET_STATISTICS: '/payments/statistics',
    GET_BY_REFEREE: '/payments/referee/:refereeId',
    GET_ONE: '/payments/:id',
    VALIDATE: '/payments/:id/validate',
    REJECT: '/payments/:id/reject',
    MARK_PAID: '/payments/:id/mark-paid',
    BULK_VALIDATE: '/payments/bulk-validate',
    EXPORT_REGIONAL_PDF: '/payments/export-regional-pdf',
    GET_FINANCIAL_VISIBILITY: '/payments/financial-visibility',
  },


  PAYMENT_RATES: {
    BASE: '/payment-rates',
    CREATE: '/payment-rates',
    GET_ALL: '/payment-rates',
    GET_ACTIVE: '/payment-rates/active',
    CALCULATE: '/payment-rates/calculate',
    GET_ONE: '/payment-rates/:id',
    UPDATE: '/payment-rates/:id',
  },

  
  MATCH_PAYMENTS: {
    BASE: '/match-payments',
    CREATE: '/match-payments',
    GET_ALL: '/match-payments',
    GET_UNPAID: '/match-payments/unpaid',
    GET_BY_MATCH: '/match-payments/match/:matchId',
    GET_ONE: '/match-payments/:id',
    UPDATE: '/match-payments/:id',
    CALCULATE: '/match-payments/calculate',
  },


  INSPECTOR_REPORTS: {
    BASE: '/inspector-reports',
    CREATE: '/inspector-reports',
    GET_ALL: '/inspector-reports',
    GET_BY_REFEREE: '/inspector-reports/referee/:refereeId',
    GET_LATEST_BY_REFEREE: '/inspector-reports/referee/:refereeId/latest',
    GET_ONE: '/inspector-reports/:id',
    UPDATE: '/inspector-reports/:id',
    SUBMIT: '/inspector-reports/:id/submit',
    REVIEW: '/inspector-reports/:id/review',
    DELETE: '/inspector-reports/:id',
  },


  STATISTICS: {
    BASE: '/statistics',
    GET_RANKINGS: '/statistics/rankings',
    GET_SPEED_CHART: '/statistics/referee/:id/speed-chart',
    GET_COMPARATIVE_ANALYSIS: '/statistics/referee/:id/comparative-analysis',
    GET_PROGRESSION: '/statistics/referee/:id/progression',
    GET_SEMINAR_NOTES: '/statistics/referee/:id/seminar-notes',
  },

 
  TRAINING_RESOURCES: {
    MY: '/training-resources/my',
    MY_RECOMMENDED: '/training-resources/my/recommended',
    MY_PERSONAL: '/training-resources/my/personal',
    CREATE: '/training-resources',
    GET_ALL: '/training-resources',
    GET_STATISTICS: '/training-resources/statistics',
    GET_ONE: '/training-resources/:id',
    UPDATE: '/training-resources/:id',
    DELETE: '/training-resources/:id',
    INCREMENT_VIEW: '/training-resources/:id/view',
    RATE: '/training-resources/:id/rate',
    NOTIFY_REFEREES: '/training-resources/:id/notify-arbitres',
  },

  TEAMS: {
    CREATE: '/teams',
    GET_ALL: '/teams',
    GET_REGIONS: '/teams/regions',
    GET_ONE: '/teams/:id',
    GET_BY_REGION: '/teams/region/:region',
    GET_BY_LEAGUE: '/teams/league/:league',
    UPDATE: '/teams/:id',
    DELETE: '/teams/:id',
    SEED: '/teams/seed',
    UPLOAD_LOGO: '/teams/:id/logo',
    DELETE_LOGO: '/teams/:id/logo',
  },
}


export const buildApiUrl = (route, params = {}) => {
  let url = `${BASE_URL}${route}`
  

  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key])
  })
  
  return url
}

export default API_ROUTES