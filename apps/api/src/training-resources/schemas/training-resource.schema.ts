import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TrainingResourceType, TrainingCategory } from '../../common/enums';

export type TrainingResourceDocument = TrainingResource & Document;

@Schema({ timestamps: true })
export class TrainingResource {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: String, enum: TrainingResourceType })
  type: TrainingResourceType;

  @Prop({ required: true, type: [String], enum: TrainingCategory })
  categories: TrainingCategory[];

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ default: 0 })
  duration: number; // in minutes for videos

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({
    type: [{ refereeId: String, rating: Number, date: Date }],
    default: [],
  })
  ratings: Array<{ refereeId: string; rating: number; date: Date }>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  targetCategories: string[]; // Referee categories this is for

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Referee' }], default: [] })
  targetRefereeIds: Types.ObjectId[]; // Specific referees for personal videos

  @Prop({ default: false })
  isPersonal: boolean; // True if this is a personal video for specific referees

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy?: Types.ObjectId;
}

export const TrainingResourceSchema =
  SchemaFactory.createForClass(TrainingResource);

// Create indexes
TrainingResourceSchema.index({ type: 1 });
TrainingResourceSchema.index({ isActive: 1 });
