import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CRAPresidentDocument = CRAPresident & Document;

@Schema({ timestamps: true })
export class CRAPresident {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  region: string;

  @Prop({ required: true })
  startDate: Date;
}

export const CRAPresidentSchema = SchemaFactory.createForClass(CRAPresident);

// Create indexes (region already has unique: true)
CRAPresidentSchema.index({ userId: 1 });
