import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RefereeCategory, Competition, RefereeRole } from '../../common/enums';

export type PaymentRateDocument = PaymentRate & Document;

@Schema({ timestamps: true })
export class PaymentRate {
  @Prop({ type: String, enum: RefereeCategory, required: true, index: true })
  category: RefereeCategory;

  @Prop({ type: String, enum: Competition, required: true, index: true })
  competition: Competition;

  @Prop({ type: String, enum: RefereeRole, required: true })
  role: RefereeRole;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const PaymentRateSchema = SchemaFactory.createForClass(PaymentRate);

// Compound indexes for rate lookup
PaymentRateSchema.index({
  category: 1,
  competition: 1,
  role: 1,
});
