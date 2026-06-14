import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InspectorDocument = Inspector & Document;

@Schema({ timestamps: true })
export class Inspector {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  matricule: string;

  @Prop({ required: true })
  region: string;

  @Prop()
  specialization: string;
}

export const InspectorSchema = SchemaFactory.createForClass(Inspector);

// Create indexes (matricule already has unique: true)
InspectorSchema.index({ userId: 1 });
