import axios  from 'axios';
import { BASE_URL, API_ROUTES, buildApiUrl } from './apiRoutes';


const base = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

base.interceptors.request.use(config => {
   if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  
  }
  return config;
},
  (error) => Promise.reject(error)
);
base.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('access_token')  &&
      typeof window !== 'undefined'&&
      !originalRequest.url?.includes(API_ROUTES.AUTH.REFRESH)
    ) {
      originalRequest._retry = true;
        try {
          const { data } = await axios.post(
            BASE_URL + API_ROUTES.AUTH.REFRESH,
            {},
            { withCredentials: true }
          );
          localStorage.setItem('access_token', data.access_token);
          base.defaults.headers.common['Authorization'] ='Bearer ' + data.access_token;
          return base(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed', refreshError);
          localStorage.removeItem('access_token');
          window.location.href = '/auth/signin';
        }
      
    }
 return Promise.reject(error);
  },

);



export const api = {
  auth: {
    login: (data) => base.post(API_ROUTES.AUTH.LOGIN, data),
    refresh: (data) => base.post(API_ROUTES.AUTH.REFRESH, data),
    logout: (data) => base.post(API_ROUTES.AUTH.LOGOUT, data),
    logoutAll: () => base.post(API_ROUTES.AUTH.LOGOUT_ALL),
    forgotPassword: (data) => base.post(API_ROUTES.AUTH.FORGOT_PASSWORD, data),
    resetPassword: (data) => base.post(API_ROUTES.AUTH.RESET_PASSWORD, data),
  },

  teams: {
    create: (data) => base.post(API_ROUTES.TEAMS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.TEAMS.GET_ALL, { params }),
    getRegions: () => base.get(API_ROUTES.TEAMS.GET_REGIONS),
    getByRegion: (region) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_BY_REGION, { region })),
    getByLeague: (league) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_BY_LEAGUE, { league })),
    seed: () => base.post(API_ROUTES.TEAMS.SEED),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_ONE, { id })),
    update: (id, data) => base.put(buildApiUrl(API_ROUTES.TEAMS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.TEAMS.DELETE, { id })),
    uploadLogo: (id, data) => base.post(buildApiUrl(API_ROUTES.TEAMS.UPLOAD_LOGO, { id }), data),
  },

  dashboard: {
    getStats: (params) => base.get(API_ROUTES.DASHBOARD.GET_STATS, { params }),
    getMatchesChart: (params) => base.get(API_ROUTES.DASHBOARD.GET_MATCHES_CHART, { params }),
    getRefereePerformanceChart: (params) => base.get(API_ROUTES.DASHBOARD.GET_REFEREE_PERFORMANCE_CHART, { params }),
  },

  notifications: {
    getMy: (params) => base.get(API_ROUTES.NOTIFICATIONS.GET_MY, { params }),
    getUnreadCount: () => base.get(API_ROUTES.NOTIFICATIONS.GET_UNREAD_COUNT),
    markAsRead: (id) => base.patch(buildApiUrl(API_ROUTES.NOTIFICATIONS.MARK_READ, { id })),
    markAllAsRead: () => base.patch(API_ROUTES.NOTIFICATIONS.MARK_ALL_READ),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.NOTIFICATIONS.DELETE, { id })),
    getPreferences: () => base.get(API_ROUTES.NOTIFICATIONS.GET_PREFERENCES),
    updatePreferences: (data) => base.patch(API_ROUTES.NOTIFICATIONS.UPDATE_PREFERENCES, data),
    sendGroup: (data) => base.post(API_ROUTES.NOTIFICATIONS.SEND_GROUP, data),
  },

  inspectorAssignments: {
    create: (data) => base.post(API_ROUTES.INSPECTOR_ASSIGNMENTS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_ALL, { params }),
    getDashboard: () => base.get(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_DASHBOARD),
    getAwaitingReport: (params) => base.get(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_AWAITING_REPORT, { params }),
    getByMatch: (matchId) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_BY_MATCH, { matchId })),
    getByInspector: (inspectorId) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_BY_INSPECTOR, { inspectorId })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_ASSIGNMENTS.GET_ONE, { id })),
    cancel: (id, data) => base.post(buildApiUrl(API_ROUTES.INSPECTOR_ASSIGNMENTS.CANCEL, { id }), data),
    linkReport: (id, data) => base.post(buildApiUrl(API_ROUTES.INSPECTOR_ASSIGNMENTS.LINK_REPORT, { id }), data),
  },

  users: {
    create: (data) => base.post(API_ROUTES.USERS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.USERS.GET_ALL, { params }),
    getByRole: (role) => base.get(buildApiUrl(API_ROUTES.USERS.GET_BY_ROLE, { role })),
    getMyProfile: () => base.get(API_ROUTES.USERS.MY_PROFILE),
    updateMyProfile: (data) => base.patch(API_ROUTES.USERS.UPDATE_MY_PROFILE, data),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.USERS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.USERS.UPDATE, { id }), data),
    toggleStatus: (id) => base.patch(buildApiUrl(API_ROUTES.USERS.TOGGLE_STATUS, { id })),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.USERS.DELETE, { id })),
  },

  referees: {
    create: (data) => base.post(API_ROUTES.REFEREES.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.REFEREES.GET_ALL, { params }),
    getStatistics: () => base.get(API_ROUTES.REFEREES.GET_STATISTICS),
    getByCategory: (category) => base.get(buildApiUrl(API_ROUTES.REFEREES.GET_BY_CATEGORY, { category })),
    getMyProfile: () => base.get(API_ROUTES.REFEREES.MY_PROFILE),
    updateMyProfile: (data) => base.patch(API_ROUTES.REFEREES.UPDATE_MY_PROFILE, data),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.REFEREES.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.REFEREES.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.REFEREES.DELETE, { id })),
    import: (data) => base.post(API_ROUTES.REFEREES.IMPORT, data),
  },

  inspectors: {
    create: (data) => base.post(API_ROUTES.INSPECTORS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.INSPECTORS.GET_ALL, { params }),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.INSPECTORS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.INSPECTORS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.INSPECTORS.DELETE, { id })),
  },

  craPresidents: {
    create: (data) => base.post(API_ROUTES.CRA_PRESIDENTS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.CRA_PRESIDENTS.GET_ALL, { params }),
    getByRegion: (region) => base.get(buildApiUrl(API_ROUTES.CRA_PRESIDENTS.GET_BY_REGION, { region })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.CRA_PRESIDENTS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.CRA_PRESIDENTS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.CRA_PRESIDENTS.DELETE, { id })),
  },

  matches: {
    create: (data) => base.post(API_ROUTES.MATCHES.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.MATCHES.GET_ALL, { params }),
    getCalendar: (params) => base.get(API_ROUTES.MATCHES.GET_CALENDAR, { params }),
    import: (data) => base.post(API_ROUTES.MATCHES.IMPORT, data),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.MATCHES.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.MATCHES.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.MATCHES.DELETE, { id })),
    updateDate: (id, data) => base.patch(buildApiUrl(API_ROUTES.MATCHES.UPDATE_DATE, { id }), data),
    submitSheet: (id, data) => base.post(buildApiUrl(API_ROUTES.MATCHES.SUBMIT_SHEET, { id }), data),
  },

  convocations: {
    getMy: () => base.get(API_ROUTES.CONVOCATIONS.MY),
    getMyUpcoming: () => base.get(API_ROUTES.CONVOCATIONS.MY_UPCOMING),
    create: (data) => base.post(API_ROUTES.CONVOCATIONS.CREATE, data),
    getAll: (params) => base.get(buildApiUrl(API_ROUTES.CONVOCATIONS.GET_ALL), { params }),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.CONVOCATIONS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.CONVOCATIONS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.CONVOCATIONS.DELETE, { id })),
    addNote: (id, data) => base.post(buildApiUrl(API_ROUTES.CONVOCATIONS.ADD_NOTE, { id }), data),
    sendNotifications: (id) => base.post(buildApiUrl(API_ROUTES.CONVOCATIONS.SEND_NOTIFICATIONS, { id })),
  },

  designations: {
    create: (data) => base.post(API_ROUTES.DESIGNATIONS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.DESIGNATIONS.GET_ALL, { params }),
    getCalendar: (params) => base.get(API_ROUTES.DESIGNATIONS.GET_CALENDAR, { params }),
    getByMatch: (matchId) => base.get(buildApiUrl(API_ROUTES.DESIGNATIONS.GET_BY_MATCH, { matchId })),
    getSuggestions: (matchId, params) => base.get(buildApiUrl(API_ROUTES.DESIGNATIONS.GET_SUGGESTIONS, { matchId }), { params }),
    getMyDesignations: () => base.get(API_ROUTES.DESIGNATIONS.MY_DESIGNATIONS),
    getAllOverrides: (params) => base.get(API_ROUTES.DESIGNATIONS.ALL_OVERRIDES, { params }),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.DESIGNATIONS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.DESIGNATIONS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.DESIGNATIONS.DELETE, { id })),
    submit: (id, data) => base.patch(buildApiUrl(API_ROUTES.DESIGNATIONS.SUBMIT, { id }), data),
    sendNotifications: (id) => base.post(buildApiUrl(API_ROUTES.DESIGNATIONS.SEND_NOTIFICATIONS, { id })),
    validate: (id, data) => base.patch(buildApiUrl(API_ROUTES.DESIGNATIONS.VALIDATE, { id }), data),
    bulkAssign: (data) => base.post(API_ROUTES.DESIGNATIONS.BULK_ASSIGN, data),
    override: (id, data) => base.post(buildApiUrl(API_ROUTES.DESIGNATIONS.OVERRIDE, { id }), data),
    takeControl: (id, data) => base.post(buildApiUrl(API_ROUTES.DESIGNATIONS.TAKE_CONTROL, { id }), data),
    getOverrideHistory: (id) => base.get(buildApiUrl(API_ROUTES.DESIGNATIONS.OVERRIDE_HISTORY, { id })),
    revertOverride: (id, data) => base.post(buildApiUrl(API_ROUTES.DESIGNATIONS.REVERT_OVERRIDE, { id }), data),
    getEligibleReferees: (matchId, params) => base.get(buildApiUrl(API_ROUTES.DESIGNATIONS.GET_ELIGIBLE_REFEREES, { matchId }), { params }),
  },

  availability: {
    report: (data) => {
      if (data instanceof FormData) {
        // For FormData, let axios auto-detect the boundary
        return base.post(API_ROUTES.AVAILABILITY.REPORT, data, {
          headers: {
            'Content-Type': undefined,
          },
        });
      }
      return base.post(API_ROUTES.AVAILABILITY.REPORT, data);
    },
    getMy: () => base.get(API_ROUTES.AVAILABILITY.GET_MY),
    getCraPending: (params) => base.get(API_ROUTES.AVAILABILITY.GET_CRA_PENDING, { params }),
    create: (data) => base.post(API_ROUTES.AVAILABILITY.CREATE, data),
    getAll: () => base.get(API_ROUTES.AVAILABILITY.GET_ALL),
    getByDate: (date) => base.get(buildApiUrl(API_ROUTES.AVAILABILITY.GET_BY_DATE, { date })),
    getByReferee: (refereeId) => base.get(buildApiUrl(API_ROUTES.AVAILABILITY.GET_BY_REFEREE, { refereeId })),
    getByMonth: (month) => base.get(buildApiUrl(API_ROUTES.AVAILABILITY.GET_BY_MONTH, { month })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.AVAILABILITY.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.AVAILABILITY.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.AVAILABILITY.DELETE, { id })),
    approve: (id, data) => base.patch(buildApiUrl(API_ROUTES.AVAILABILITY.APPROVE, { id }), data),
    reject: (id, data) => base.patch(buildApiUrl(API_ROUTES.AVAILABILITY.REJECT, { id }), data),
  },

  commissionerReports: {
    create: (data) => base.post(API_ROUTES.COMMISSIONER_REPORTS.CREATE, data),
    getAll: () => base.get(API_ROUTES.COMMISSIONER_REPORTS.GET_ALL),
    getByReferee: (refereeId) => base.get(buildApiUrl(API_ROUTES.COMMISSIONER_REPORTS.GET_BY_REFEREE, { refereeId })),
    getByMatch: (matchId) => base.get(buildApiUrl(API_ROUTES.COMMISSIONER_REPORTS.GET_BY_MATCH, { matchId })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.COMMISSIONER_REPORTS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.COMMISSIONER_REPORTS.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.COMMISSIONER_REPORTS.DELETE, { id })),
  },

  payments: {
    generate: (data) => base.post(API_ROUTES.PAYMENTS.GENERATE, data),
    previewMatches: (params) => base.get(API_ROUTES.PAYMENTS.PREVIEW_MATCHES, { params }),
    getAll: (params) => base.get(API_ROUTES.PAYMENTS.GET_ALL, { params }),
    getPending: () => base.get(API_ROUTES.PAYMENTS.GET_PENDING),
    getStatistics: (params) => base.get(API_ROUTES.PAYMENTS.GET_STATISTICS, { params }),
    getByReferee: (refereeId) => base.get(buildApiUrl(API_ROUTES.PAYMENTS.GET_BY_REFEREE, { refereeId })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.PAYMENTS.GET_ONE, { id })),
    validate: (id, data) => base.patch(buildApiUrl(API_ROUTES.PAYMENTS.VALIDATE, { id }), data),
    reject: (id, data) => base.patch(buildApiUrl(API_ROUTES.PAYMENTS.REJECT, { id }), data),
    markPaid: (id, data) => base.patch(buildApiUrl(API_ROUTES.PAYMENTS.MARK_PAID, { id }), data),
    bulkValidate: (data) => base.patch(API_ROUTES.PAYMENTS.BULK_VALIDATE, data),
    exportRegionalPdf: (params) => base.get(API_ROUTES.PAYMENTS.EXPORT_REGIONAL_PDF, { params }),
    getFinancialVisibility: (params) => base.get(API_ROUTES.PAYMENTS.GET_FINANCIAL_VISIBILITY, { params }),
  },

  paymentRates: {
    create: (data) => base.post(API_ROUTES.PAYMENT_RATES.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.PAYMENT_RATES.GET_ALL, { params }),
    getActive: () => base.get(API_ROUTES.PAYMENT_RATES.GET_ACTIVE),
    calculate: (params) => base.get(API_ROUTES.PAYMENT_RATES.CALCULATE, { params }),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.PAYMENT_RATES.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.PAYMENT_RATES.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.PAYMENT_RATES.DELETE, { id })),
  },

  matchPayments: {
    create: (data) => base.post(API_ROUTES.MATCH_PAYMENTS.CREATE, data),
    getAll: () => base.get(API_ROUTES.MATCH_PAYMENTS.GET_ALL),
    getUnpaid: () => base.get(API_ROUTES.MATCH_PAYMENTS.GET_UNPAID),
    getByMatch: (matchId) => base.get(buildApiUrl(API_ROUTES.MATCH_PAYMENTS.GET_BY_MATCH, { matchId })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.MATCH_PAYMENTS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.MATCH_PAYMENTS.UPDATE, { id }), data),
    calculate: (data) => base.post(API_ROUTES.MATCH_PAYMENTS.CALCULATE, data),
  },

  inspectorReports: {
    create: (data) => base.post(API_ROUTES.INSPECTOR_REPORTS.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.INSPECTOR_REPORTS.GET_ALL, { params }),
    getByReferee: (refereeId) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.GET_BY_REFEREE, { refereeId })),
    getLatestByReferee: (refereeId) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.GET_LATEST_BY_REFEREE, { refereeId })),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.UPDATE, { id }), data),
    submit: (id, data) => base.patch(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.SUBMIT, { id }), data),
    review: (id, data) => base.patch(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.REVIEW, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.INSPECTOR_REPORTS.DELETE, { id })),
  },

  statistics: {
    getMy: () => base.get('/statistics/my'),
    getMySpeedChart: () => base.get('/statistics/my/speed-chart'),
    getMyProgression: () => base.get('/statistics/my/progression'),
    getMyRanking: () => base.get('/statistics/my/ranking'),

    getRankings: (params) => base.get(API_ROUTES.STATISTICS.GET_RANKINGS, { params }),
    getSpeedChart: (id) => base.get(buildApiUrl(API_ROUTES.STATISTICS.GET_SPEED_CHART, { id })),
    getComparativeAnalysis: (id) => base.get(buildApiUrl(API_ROUTES.STATISTICS.GET_COMPARATIVE_ANALYSIS, { id })),
    getProgression: (id) => base.get(buildApiUrl(API_ROUTES.STATISTICS.GET_PROGRESSION, { id })),
    getSeminarNotes: (id) => base.get(buildApiUrl(API_ROUTES.STATISTICS.GET_SEMINAR_NOTES, { id })),
  },

  trainingResources: {
    getMy: () => base.get(API_ROUTES.TRAINING_RESOURCES.MY),
    getMyRecommended: () => base.get(API_ROUTES.TRAINING_RESOURCES.MY_RECOMMENDED),
    getMyPersonal: () => base.get(API_ROUTES.TRAINING_RESOURCES.MY_PERSONAL),
    create: (data) => base.post(API_ROUTES.TRAINING_RESOURCES.CREATE, data),
    getAll: (params) => base.get(API_ROUTES.TRAINING_RESOURCES.GET_ALL, { params }),
    getStatistics: () => base.get(API_ROUTES.TRAINING_RESOURCES.GET_STATISTICS),
    getOne: (id) => base.get(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.GET_ONE, { id })),
    update: (id, data) => base.patch(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.UPDATE, { id }), data),
    delete: (id) => base.delete(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.DELETE, { id })),
    incrementView: (id) => base.post(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.INCREMENT_VIEW, { id })),
    rate: (id, data) => base.post(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.RATE, { id }), data),
    notifyReferees: (id, data) => base.post(buildApiUrl(API_ROUTES.TRAINING_RESOURCES.NOTIFY_REFEREES, { id }), data),
  },

teams: {
  create: (data) => base.post(API_ROUTES.TEAMS.CREATE, data),
  getAll: (params) => base.get(API_ROUTES.TEAMS.GET_ALL, { params }),
  getRegions: () => base.get(API_ROUTES.TEAMS.GET_REGIONS),
  getOne: (id) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_ONE, { id })),
  getByRegion: (region) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_BY_REGION, { region })),
  getByLeague: (league) => base.get(buildApiUrl(API_ROUTES.TEAMS.GET_BY_LEAGUE, { league })),
  update: (id, data) => base.put(buildApiUrl(API_ROUTES.TEAMS.UPDATE, { id }), data),
  delete: (id) => base.delete(buildApiUrl(API_ROUTES.TEAMS.DELETE, { id })),
  seed: () => base.post(API_ROUTES.TEAMS.SEED),
  uploadLogo: (id, formData) => base.post(buildApiUrl(API_ROUTES.TEAMS.UPLOAD_LOGO, { id }), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteLogo: (id) => base.delete(buildApiUrl(API_ROUTES.TEAMS.DELETE_LOGO, { id })),
},
};

export default base;
