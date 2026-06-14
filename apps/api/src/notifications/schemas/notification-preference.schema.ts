import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationPreferenceDocument = NotificationPreference & Document;

@Schema({ _id: false })
class ChannelPreferences {
  @Prop({ default: true })
  inApp: boolean;

  @Prop({ default: true })
  whatsapp: boolean;

  @Prop({ default: false })
  email: boolean;
}

@Schema({ _id: false })
class QuietHours {
  @Prop({ default: false })
  enabled: boolean;

  @Prop({ default: '22:00' })
  start: string;

  @Prop({ default: '08:00' })
  end: string;
}

@Schema({ _id: false })
class TypePreferences {
  @Prop({ default: true })
  designation: boolean;

  @Prop({ default: true })
  convocation: boolean;

  @Prop({ default: true })
  reminder: boolean;

  @Prop({ default: true })
  payment: boolean;

  @Prop({ default: true })
  announcement: boolean;

  @Prop({ default: true })
  availability: boolean;
}

@Schema({ _id: false })
class ReminderTiming {
  @Prop({ default: 24 })
  matchHoursBefore: number;

  @Prop({ default: 48 })
  seminarHoursBefore: number;
}

@Schema({ timestamps: true })
export class NotificationPreference {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: ChannelPreferences, default: () => ({}) })
  channels: ChannelPreferences;

  @Prop({ type: QuietHours, default: () => ({}) })
  quietHours: QuietHours;

  @Prop({ type: TypePreferences, default: () => ({}) })
  types: TypePreferences;

  @Prop({ type: ReminderTiming, default: () => ({}) })
  reminderTiming: ReminderTiming;

  @Prop()
  whatsappNumber?: string; // Override from user profile

  @Prop()
  emailAddress?: string; // Override from user profile

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationPreferenceSchema = SchemaFactory.createForClass(
  NotificationPreference,
);
