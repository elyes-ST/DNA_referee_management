import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PaymentStatus,
  PaymentMethod,
  RefereeCategory,
} from '../../common/enums';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true, index: true })
  refereeId: Types.ObjectId;

  // --- Date range (replaces month + saison) ---
  @Prop({ type: Date, required: true, index: true })
  startDate: Date;

  @Prop({ type: Date, required: true, index: true })
  endDate: Date;

  /** Human-readable period label, e.g. "Janvier 2026". Optional but shown in PDFs/notifications. */
  @Prop({ type: String })
  label?: string;

  @Prop({ type: [Types.ObjectId], ref: 'Match', default: [] })
  matchIds: Types.ObjectId[];

  @Prop({ required: true, default: 0 })
  totalMatches: number;

  @Prop({ required: true, default: 0 })
  baseAmount: number;

  @Prop({ default: 0 })
  bonuses: number;

  @Prop({ default: 0 })
  deductions: number;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    index: true,
  })
  status: PaymentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  validatedBy: Types.ObjectId;

  @Prop({ type: Date })
  validatedAt: Date;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop()
  referenceNumber: string;

  @Prop()
  notes: string;

  /** Warnings produced during auto-calculation (e.g. missing rate for a match) */
  @Prop({ type: [String], default: [] })
  warnings: string[];

  @Prop({ required: true, index: true })
  region: string;

  @Prop({ type: String, enum: RefereeCategory, required: true, index: true })
  category: RefereeCategory;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Compound indexes
PaymentSchema.index({ status: 1, category: 1, startDate: 1 });
PaymentSchema.index({ refereeId: 1, startDate: 1, endDate: 1 }, { unique: true }); // Prevent duplicate bilans
PaymentSchema.index({ validatedBy: 1, validatedAt: -1 });
PaymentSchema.index({ region: 1, startDate: 1, endDate: 1, status: 1 }); // PDF queries
