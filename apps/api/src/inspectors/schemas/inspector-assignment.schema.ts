import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InspectorAssignmentDocument = InspectorAssignment & Document;

export enum AssignmentStatus {
  PENDING = 'PENDING', // En attente
  CONFIRMED = 'CONFIRMED', // Confirmé par CDC
  COMPLETED = 'COMPLETED', // Match terminé, rapport soumis
  CANCELLED = 'CANCELLED', // Annulé
}

@Schema({ timestamps: true })
export class InspectorAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Match', required: true, index: true })
  matchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Inspector', required: true, index: true })
  inspectorId: Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(AssignmentStatus),
    default: AssignmentStatus.PENDING,
  })
  status: AssignmentStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId; // CDC qui a fait l'affectation

  @Prop({ type: Date, required: true })
  assignedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'InspectorReport' })
  reportId: Types.ObjectId; // Lien vers le rapport soumis

  @Prop()
  notes: string;

  @Prop()
  cancellationReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy: Types.ObjectId;
}

export const InspectorAssignmentSchema =
  SchemaFactory.createForClass(InspectorAssignment);

// Indexes
InspectorAssignmentSchema.index(
  { matchId: 1, inspectorId: 1 },
  { unique: true },
);
InspectorAssignmentSchema.index({ inspectorId: 1, status: 1 });
InspectorAssignmentSchema.index({ status: 1 });
