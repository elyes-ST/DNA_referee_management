import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RefereeRole, PaymentStatus } from '../../common/enums';

export type MatchPaymentDocument = MatchPayment & Document;

@Schema({ timestamps: true })
export class MatchPayment {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true, index: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true, index: true })
  refereeId: Types.ObjectId;

  @Prop({ type: String, enum: RefereeRole, required: true })
  role: RefereeRole;

  @Prop({ required: true, default: 0 })
  baseAmount: number;

  @Prop({ default: 0 })
  bonus: number;

  @Prop({ default: 0 })
  deduction: number;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop()
  notes: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MatchPaymentSchema = SchemaFactory.createForClass(MatchPayment);

// Unique compound index: a referee can only have ONE payment record per match
// This is the definitive guard against double-counting the same match
MatchPaymentSchema.index({ matchId: 1, refereeId: 1 }, { unique: true });
MatchPaymentSchema.index({ status: 1, createdAt: -1 });
