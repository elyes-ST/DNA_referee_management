import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '../enums';

export type NotificationDocument = Notification & Document;

@Schema({ _id: false })
class NotificationData {
  @Prop({ type: Types.ObjectId, ref: 'Match' })
  matchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Convocation' })
  convocationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Referee' })
  refereeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CommissionerReport' })
  reportId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  paymentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Designation' })
  designationId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Availability' })
  availabilityId?: Types.ObjectId;

  @Prop()
  actionUrl?: string; // URL for action button in emails

  @Prop()
  actionLabel?: string; // Label for action button

  @Prop()
  customData?: string; // JSON stringified additional data
}

@Schema({ _id: false })
class ChannelStatus {
  @Prop({ default: false })
  sent: boolean;

  @Prop()
  sentAt?: Date;

  @Prop()
  error?: string;

  @Prop()
  externalId?: string; // ID from WhatsApp/Email provider
}

@Schema({ _id: false })
class DeliveryStatus {
  @Prop({ type: ChannelStatus, default: {} })
  inApp: ChannelStatus;

  @Prop({ type: ChannelStatus, default: {} })
  whatsapp: ChannelStatus;

  @Prop({ type: ChannelStatus, default: {} })
  email: ChannelStatus;
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true, index: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: NotificationData, default: {} })
  data: NotificationData;

  @Prop({
    type: [String],
    enum: NotificationChannel,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Prop({ type: DeliveryStatus, default: {} })
  deliveryStatus: DeliveryStatus;

  @Prop({ default: false, index: true })
  read: boolean;

  @Prop()
  readAt?: Date;

  @Prop({
    type: String,
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  expiresAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Indexes for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
