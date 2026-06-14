import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  AvailabilityType,
  AvailabilityStatus,
  AvailabilityUrgency,
} from '../../common/enums';

class AvailabilityDocument {
  @Prop()
  filename: string;

  @Prop()
  url: string;
}

export type AvailabilityDocumentType = Availability & Document;

@Schema({ timestamps: true })
export class Availability {
  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true, index: true })
  refereeId: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  dateFrom: Date;

  @Prop({ type: Date, required: true, index: true })
  dateTo: Date;

  @Prop({ type: String, enum: AvailabilityType, required: true })
  type: AvailabilityType;

  @Prop()
  reason: string;

  @Prop({
    type: String,
    enum: AvailabilityUrgency,
    default: AvailabilityUrgency.NORMAL,
  })
  urgency: AvailabilityUrgency;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: AvailabilityStatus,
    default: AvailabilityStatus.PENDING,
  })
  status: AvailabilityStatus;

  @Prop({ type: [AvailabilityDocument], default: [] })
  documents: AvailabilityDocument[];

  // CRA notification fields
  @Prop({ default: false })
  notifyCRA: boolean;

  @Prop()
  craRegion: string;

  @Prop({ default: false })
  craNotified: boolean;

  @Prop({ type: Date })
  craNotifiedAt: Date;

  @Prop()
  craResponse: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  craRespondedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// Compound index for date range queries
AvailabilitySchema.index({ refereeId: 1, dateFrom: 1, dateTo: 1 });
AvailabilitySchema.index({ dateFrom: 1, dateTo: 1, status: 1 });
AvailabilitySchema.index({ craRegion: 1, status: 1 });
AvailabilitySchema.index({ notifyCRA: 1, craNotified: 1 });
