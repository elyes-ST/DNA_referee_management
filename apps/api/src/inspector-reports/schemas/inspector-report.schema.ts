import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  InspectionType,
  InspectorVerdict,
  PromotionRecommendation,
  InspectorReportStatus,
} from '../../common/enums';

@Schema({ _id: false })
class TechnicalScores {
  @Prop({ required: true, min: 0, max: 20 })
  technicalScore: number;

  @Prop({ required: true, min: 0, max: 20 })
  physicalScore: number;

  @Prop({ required: true, min: 0, max: 20 })
  psychologicalScore: number;

  @Prop({ required: true, min: 0, max: 20 })
  communicationScore: number;

  @Prop({ required: true, min: 0, max: 20 })
  decisionMakingScore: number;
}

export type InspectorReportDocument = InspectorReport & Document;

@Schema({ timestamps: true })
export class InspectorReport {
  @Prop({ type: Types.ObjectId, ref: 'Inspector', required: true, index: true })
  inspectorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true, index: true })
  refereeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Match', required: true })
  matchId: Types.ObjectId;

  @Prop({ required: true })
  inspectionDate: Date;

  @Prop({ type: String, enum: InspectionType, required: true })
  inspectionType: InspectionType;

  @Prop({ type: TechnicalScores, required: true })
  scores: TechnicalScores;

  @Prop({ required: true, min: 0, max: 20 })
  overallScore: number;

  @Prop()
  strengths: string;

  @Prop()
  weaknesses: string;

  @Prop()
  recommendations: string;

  @Prop({ type: [String], default: [] })
  trainingNeeds: string[];

  @Prop({ type: String, enum: InspectorVerdict, required: true })
  verdict: InspectorVerdict;

  @Prop({ type: String, enum: PromotionRecommendation, required: true })
  promotionRecommendation: PromotionRecommendation;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop({
    type: String,
    enum: InspectorReportStatus,
    default: InspectorReportStatus.DRAFT,
  })
  status: InspectorReportStatus;

  @Prop({ default: false })
  confidential: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const InspectorReportSchema =
  SchemaFactory.createForClass(InspectorReport);

// Indexes
InspectorReportSchema.index({ refereeId: 1, inspectionDate: -1 });
InspectorReportSchema.index({ inspectorId: 1, inspectionDate: -1 });
InspectorReportSchema.index({ status: 1 });
