// models/Slide.ts
import mongoose, { Schema, Document } from 'mongoose';
import type { ISlide } from '@/types/slide';

export interface ISlideDocument extends Omit<ISlide, '_id'>, Document {}

const PositionSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

const DimensionsSchema = new Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true }
}, { _id: false });

const ColorSchema = new Schema({
  hex: { type: String, required: true }
}, { _id: false });

const FontSchema = new Schema({
  family: { type: String, required: true },
  size: { type: Number, required: true },
  weight: { type: Number, required: true },
  style: { type: String, required: true }
}, { _id: false });

const TextDataSchema = new Schema({
  content: { type: String, required: true },
  font: FontSchema,
  color: ColorSchema,
  alignment: { type: String, enum: ['left', 'center', 'right', 'justify'], default: 'left' },
  lineHeight: { type: Number, default: 1.2 },
  letterSpacing: { type: Number, default: 0 },
  textDecoration: { type: String, default: 'none' },
  textTransform: { type: String, default: 'none' },
  wordWrap: { type: Boolean, default: true }
}, { _id: false });

const ImageDataSchema = new Schema({
  src: { type: String, required: true },
  alt: { type: String, default: '' },
  fit: { type: String, enum: ['cover', 'contain', 'fill', 'none'], default: 'cover' }
}, { _id: false });

const ShapeDataSchema = new Schema({
  shapeType: { type: String, required: true },
  fill: ColorSchema,
  stroke: {
    color: ColorSchema,
    width: { type: Number, default: 0 }
  },
  cornerRadius: { type: Number, default: 0 }
}, { _id: false });

const ElementSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'image', 'shape', 'video', 'audio'], 
    required: true 
  },
  position: PositionSchema,
  dimensions: DimensionsSchema,
  rotation: { type: Number, default: 0 },
  opacity: { type: Number, default: 1, min: 0, max: 1 },
  zIndex: { type: Number, default: 1 },
  locked: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  data: { type: Schema.Types.Mixed, required: true } // Can be TextData, ImageData, ShapeData, etc.
}, { _id: false });

const BackgroundSchema = new Schema({
  type: { type: String, enum: ['color', 'gradient', 'image'], required: true },
  data: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

const LayoutSchema = new Schema({
  type: { type: String, required: true },
  placeholders: [{ type: Schema.Types.Mixed }]
}, { _id: false });

const SlideSchema = new Schema<ISlideDocument>({
  presentationId: { type: Schema.Types.ObjectId, ref: 'Presentation', required: true },
  slideNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  elements: [ElementSchema],
  background: BackgroundSchema,

  layout: LayoutSchema
}, {
  timestamps: true
});

// Indexes for better performance
SlideSchema.index({ presentationId: 1, slideNumber: 1 });
SlideSchema.index({ presentationId: 1 });

const SlideModel = mongoose.models.Slide || 
  mongoose.model<ISlideDocument>('Slide', SlideSchema);

export default SlideModel;