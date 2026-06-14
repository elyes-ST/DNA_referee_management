import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Competition } from '../../common/enums';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  shortName: string; // Ex: ESS, CSS, EST, CA

  @Prop({ required: true })
  city: string; // Ex: Sousse, Sfax, Tunis

  @Prop({ required: true })
  region: string; // Ex: Sousse, Sfax, Tunis, Nabeul

  @Prop({ required: true, type: String, enum: Object.values(Competition) })
  league: Competition; // Ligue dans laquelle l'équipe joue

  @Prop()
  stadium: string; // Stade principal

  @Prop({ type: String, default: null })
  logo: string | null; // URL du logo

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// Index pour recherche rapide
TeamSchema.index({ name: 'text', shortName: 'text' });
TeamSchema.index({ region: 1 });
TeamSchema.index({ league: 1 });
TeamSchema.index({ city: 1 });
