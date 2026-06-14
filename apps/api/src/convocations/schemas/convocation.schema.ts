import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConvocationType } from '../../common/enums';

export type ConvocationDocument = Convocation & Document;

@Schema({ _id: false })
class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'Referee', required: true })
  refereeId: Types.ObjectId;

  @Prop({ default: false })
  attended: boolean;

  @Prop()
  note: number;
}

@Schema({ timestamps: true })
export class Convocation {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: String, enum: Object.values(ConvocationType) })
  type: ConvocationType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Referee' }], default: [] })
  referees: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: false })
  notificationSent: boolean;

  @Prop({ type: [Attendance], default: [] })
  attendanceList: Attendance[];
}

export const ConvocationSchema = SchemaFactory.createForClass(Convocation);

// Create indexes
ConvocationSchema.index({ date: 1 });
ConvocationSchema.index({ type: 1 });
ConvocationSchema.index({ createdBy: 1 });
