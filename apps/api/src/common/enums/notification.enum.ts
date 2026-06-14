/**
 * Notification-related enumerations
 */

export enum NotificationType {
  DESIGNATION = 'DESIGNATION',
  PAYMENT = 'PAYMENT',
  TRAINING = 'TRAINING',
  REPORT = 'REPORT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}
