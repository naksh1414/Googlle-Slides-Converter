// models/Presentation.ts
import mongoose, { Schema, Document } from 'mongoose';
import type { IPresentation } from '@/types/Presentation';

export interface IPresentationDocument extends Omit<IPresentation, '_id'>, Document {}

const ColorSchema = new Schema({
  hex: { type: String, required: true }
}, { _id: false });

const FontSchema = new Schema({
  family: { type: String, required: true },
  size: { type: Number, required: true },
  weight: { type: Number, required: true },
  style: { type: String, required: true }
}, { _id: false });

const ThemeSchema = new Schema({
  primaryColor: ColorSchema,
  secondaryColor: ColorSchema,
  backgroundColor: ColorSchema,
  textColor: ColorSchema,
  accentColor: ColorSchema
}, { _id: false });

const DimensionsSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  aspectRatio: { type: String, required: true }
}, { _id: false });

const SettingsSchema = new Schema({
  dimensions: DimensionsSchema,
  theme: ThemeSchema,
  defaultFont: FontSchema,
  slideTransition: { type: String, required: true },
  autoPlay: { type: Boolean, default: false },
  loopPresentation: { type: Boolean, default: false },
  showSlideNumbers: { type: Boolean, default: true },
  showProgressBar: { type: Boolean, default: true }
}, { _id: false });

const MetadataSchema = new Schema({
  totalSlides: { type: Number, required: true },
  estimatedDuration: { type: Number, required: true },
  lastModifiedBy: { type: String, required: true },
  fileSize: { type: Number, required: true },
  exportFormats: [{ type: String }],
  aiGenerated: { type: Boolean, default: false }
}, { _id: false });

const CollaboratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true },
  role: { type: String, enum: ['viewer', 'editor', 'admin'], required: true },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'share', 'export']
  }],
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const PresentationSchema = new Schema<IPresentationDocument>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, required: true },
  isPublic: { type: Boolean, default: false },
  slides: [{ type: Schema.Types.ObjectId, ref: 'Slide' }],
  settings: SettingsSchema,
  metadata: MetadataSchema,
  collaborators: [CollaboratorSchema],
  version: { type: Number, default: 1 },
  tags: [{ type: String }]
}, {
  timestamps: true
});

// Indexes for better performance
PresentationSchema.index({ ownerId: 1 });
PresentationSchema.index({ status: 1 });
PresentationSchema.index({ isPublic: 1 });
PresentationSchema.index({ tags: 1 });

const PresentationModel = mongoose.models.Presentation || 
  mongoose.model<IPresentationDocument>('Presentation', PresentationSchema);

export default PresentationModel;