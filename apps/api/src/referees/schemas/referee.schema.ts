import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RefereeCategory, RefereeRole } from '../../common/enums';

export type RefereeDocument = Referee & Document;

@Schema({ _id: false })
class EmergencyContact {
  @Prop({ required: false })
  name: string;

  @Prop({ required: false })
  phone: string;
}

@Schema({ _id: false })
class Statistics {
  @Prop({ default: 0 })
  matchesCount: number;

  @Prop({ default: 0 })
  averageNote: number;
}

@Schema({ _id: false })
class SeminarNote {
  @Prop({ type: Types.ObjectId, required: true })
  seminarId: Types.ObjectId;

  @Prop({ required: true })
  note: number;

  @Prop({ required: true })
  date: Date;
}

@Schema({ timestamps: true })
export class Referee {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  matricule: string;

  @Prop({ required: true, type: String, enum: Object.values(RefereeCategory) })
  category: RefereeCategory;

  // Rôles que l'arbitre peut occuper (ex: peut être Central et Assistant)
  @Prop({
    type: [String],
    enum: Object.values(RefereeRole),
    default: [
      RefereeRole.ARBITRE_CENTRAL,
      RefereeRole.ASSISTANT_1,
      RefereeRole.ASSISTANT_2,
      RefereeRole.QUATRIEME_ARBITRE,
    ],
  })
  allowedRoles: RefereeRole[];

  // Certification VAR
  @Prop({ default: false })
  isVARCertified: boolean;

  @Prop()
  league: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true })
  cin: string;

  @Prop()
  address: string;

  @Prop({ type: EmergencyContact })
  emergencyContact: EmergencyContact;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop()
  notes: string;

  @Prop({ type: Statistics, default: () => ({}) })
  statistics: Statistics;

  @Prop({ type: [SeminarNote], default: [] })
  seminarNotes: SeminarNote[];
}

export const RefereeSchema = SchemaFactory.createForClass(Referee);

// Create indexes (matricule already has unique: true)
RefereeSchema.index({ userId: 1 });
RefereeSchema.index({ category: 1 });
RefereeSchema.index({ isAvailable: 1 });
RefereeSchema.index({ category: 1, region: 1 });
