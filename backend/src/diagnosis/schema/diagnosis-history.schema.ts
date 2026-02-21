// src/diagnosis/schema/diagnosis-history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiagnosisHistoryDocument = DiagnosisHistory & Document;

@Schema({ collection: 'diagnosis_history', timestamps: true })
export class DiagnosisHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ type: Object, required: true })
  prediction: {
    classification: string; // "Lumpy" or "Normal"
    confidence: number[]; // Full probability array
    confidence_score?: number; // Optional single value for frontend
  };

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: false })
  location?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const DiagnosisHistorySchema = SchemaFactory.createForClass(DiagnosisHistory);