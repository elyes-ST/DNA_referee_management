import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  DesignationStatus,
  RefereeDesignationStatus,
  DesignationCategory,
  RefereeRole,
} from '../../common/enums';

@Schema({ _id: false })
export class RefereeDesignation {
  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true })
  refereeId: Types.ObjectId;

  @Prop({ type: String, enum: RefereeRole, required: true })
  role: RefereeRole;

  @Prop({
    type: String,
    enum: RefereeDesignationStatus,
    default: RefereeDesignationStatus.PROPOSED,
  })
  status: RefereeDesignationStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  proposedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  proposedAt: Date;

  @Prop({ type: Date })
  responseDate: Date;

  @Prop()
  declineReason: string;
}
export const RefereeDesignationSchema = SchemaFactory.createForClass(RefereeDesignation);

@Schema({ _id: false })
export class DesignationOverride {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  overriddenBy: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  previousReferees: string; // JSON stringified array of previous referee assignments

  @Prop({ required: true })
  newReferees: string; // JSON stringified array of new referee assignments

  @Prop({ type: Date, default: Date.now })
  overriddenAt: Date;

  @Prop({ default: false })
  isSystemOverride: boolean; // true if system-generated, false if manual
}
export const DesignationOverrideSchema = SchemaFactory.createForClass(DesignationOverride);

export type DesignationDocument = Designation & Document;

@Schema({ timestamps: true })
export class Designation {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true, unique: true })
  matchId: Types.ObjectId;

  @Prop({ type: [RefereeDesignationSchema], default: [] })
  referees: RefereeDesignation[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  designatedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: DesignationStatus,
    default: DesignationStatus.DRAFT,
    index: true,
  })
  status: DesignationStatus;

  @Prop({ type: String, enum: DesignationCategory, required: true })
  category: DesignationCategory;

  @Prop()
  notes: string;

  @Prop({ default: false })
  notificationsSent: boolean;

  @Prop({ type: [DesignationOverrideSchema], default: [] })
  overrideHistory: DesignationOverride[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const DesignationSchema = SchemaFactory.createForClass(Designation);

// Indexes
DesignationSchema.index({ matchId: 1, status: 1 });
DesignationSchema.index({ 'referees.refereeId': 1 });
DesignationSchema.index({ designatedBy: 1, validatedBy: 1 });
