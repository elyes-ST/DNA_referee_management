import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../enums';

export type NotificationTemplateDocument = NotificationTemplate & Document;

@Schema({ timestamps: true })
export class NotificationTemplate {
  @Prop({ required: true, unique: true })
  code: string; // Ex: 'DESIGNATION_MATCH', 'CONVOCATION_SEMINAR'

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  titleTemplate: string; // Ex: 'Nouvelle désignation - Match {{matchName}}'

  @Prop({ required: true })
  messageTemplate: string; // Ex: 'Vous êtes désigné pour le match {{team1}} vs {{team2}}'

  @Prop()
  whatsappTemplate?: string; // Version courte pour WhatsApp

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  variables: string[]; // ['matchName', 'team1', 'team2', 'date', 'venue']

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const NotificationTemplateSchema =
  SchemaFactory.createForClass(NotificationTemplate);
