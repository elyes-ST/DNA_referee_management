import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  Competition,
  MatchCategory,
  MatchStatus,
  RefereeRole,
  DesignationStatus,
} from '../../common/enums';

export type MatchDocument = Match & Document;

@Schema({ _id: false })
class Designation {
  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true })
  refereeId: Types.ObjectId;

  @Prop({ required: true, type: String, enum: Object.values(RefereeRole) })
  role: RefereeRole;

  @Prop({ default: false })
  confirmed: boolean;
}

@Schema({ timestamps: true })
export class Match {
  @Prop({ required: true })
  matchNumber: string;

  @Prop({ required: true })
  journee: number;

  @Prop({ required: true })
  saison: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  // Références aux équipes (ObjectId)
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  homeTeamId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  awayTeamId: Types.ObjectId;

  // Noms des équipes (dénormalisés pour faciliter l'affichage)
  @Prop({ required: true })
  homeTeam: string;

  @Prop({ required: true })
  awayTeam: string;

  @Prop({ required: true })
  stadium: string;

  @Prop({ required: true, type: String, enum: Object.values(Competition) })
  competition: Competition;

  @Prop({ required: true, type: String, enum: Object.values(MatchCategory) })
  category: MatchCategory;

  @Prop({
    default: MatchStatus.SCHEDULED,
    type: String,
    enum: Object.values(MatchStatus),
  })
  status: MatchStatus;

  @Prop({ default: false })
  hasVAR: boolean;

  // Designation metadata (one per match — stored flat to avoid duplication)
  @Prop({ type: Types.ObjectId, ref: 'Designation' })
  designationId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(DesignationStatus) })
  designationStatus?: DesignationStatus;

  @Prop({ type: [Designation], default: [] })
  designations: Designation[];

  @Prop({
    type: {
      homeScore: { type: Number, required: false },
      awayScore: { type: Number, required: false },
    },
    required: false,
  })
  score?: {
    homeScore?: number;
    awayScore?: number;
  };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const MatchSchema = SchemaFactory.createForClass(Match);

// Create indexes
MatchSchema.index({ journee: 1 });
MatchSchema.index({ saison: 1 });
MatchSchema.index({ date: 1 });
MatchSchema.index({ competition: 1 });
MatchSchema.index({ status: 1 });
MatchSchema.index({ journee: 1, saison: 1 });
MatchSchema.index({ date: 1, competition: 1 });
