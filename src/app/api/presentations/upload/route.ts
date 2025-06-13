/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import connectDB from '@/lib/db';
import PresentationModel from '@/models/Presentation';
import SlideModel from '@/models/Slide';
import type { IPresentation } from '@/types/Presentation';
import type { ISlide } from '@/types/slide';
import mongoose from 'mongoose';

const uploadSchema = z.object({
  presentation: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    slides: z.array(z.string()),
    settings: z.object({
      dimensions: z.object({
        width: z.number(),
        height: z.number(),
        aspectRatio: z.string()
      }),
      theme: z.object({
        primaryColor: z.object({ hex: z.string() }),
        secondaryColor: z.object({ hex: z.string() }),
        backgroundColor: z.object({ hex: z.string() }),
        textColor: z.object({ hex: z.string() }),
        accentColor: z.object({ hex: z.string() })
      }),
      defaultFont: z.object({
        family: z.string(),
        size: z.number(),
        weight: z.number(),
        style: z.enum(['normal', 'italic'])
      })
    })
  }),
  slides: z.array(z.object({
    slideNumber: z.number(),
    title: z.string().optional(),
    elements: z.array(z.any()),
    background: z.any()
  }))
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = uploadSchema.parse(body);

    if (!validatedData.presentation || !validatedData.slides) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data structure'
      }, { status: 400 });
    }

    console.log('Starting presentation upload:', validatedData.presentation.title);

    // 1. Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');
const tempOwnerId = new mongoose.Types.ObjectId(); // Replace with actual user ID from authentication
    // 2. Create presentation document for MongoDB
    const presentationData: Partial<IPresentation> = {
      title: validatedData.presentation.title,
      description: validatedData.presentation.description || '',
      ownerId: tempOwnerId as any, // You should get this from authentication
      isPublic: false,
      slides: [], // Will be populated after saving slides
      settings: {
        dimensions: validatedData.presentation.settings.dimensions,
        theme: validatedData.presentation.settings.theme,
        defaultFont: validatedData.presentation.settings.defaultFont,
        slideTransition: 'fade' as any,
        autoPlay: false,
        loopPresentation: false,
        showSlideNumbers: true,
        showProgressBar: true
      },
      metadata: {
        totalSlides: validatedData.slides.length,
        estimatedDuration: validatedData.slides.length * 30, // 30 seconds per slide
        lastModifiedBy: 'temp-user-id',
        fileSize: JSON.stringify(validatedData).length,
        exportFormats: ['pptx', 'pdf'],
        aiGenerated: false
      },
      collaborators: [],
      version: 1,
      tags: []
    };

    // 3. Save presentation to MongoDB
    const savedPresentation = await PresentationModel.create(presentationData);
    const presentationId = savedPresentation._id.toString();
    
    console.log(`Saved presentation to MongoDB with ID: ${presentationId}`);

    // 4. Save slides to MongoDB
    const slideDocuments: Partial<ISlide>[] = validatedData.slides.map(slide => ({
      presentationId: savedPresentation._id,
      slideNumber: slide.slideNumber,
      title: slide.title || `Slide ${slide.slideNumber}`,
      elements: slide.elements,
      background: slide.background,
      transition: 'fade' as any,
      layout: {
        type: 'custom',
        placeholders: []
      } as any
    }));

    const savedSlides = await SlideModel.insertMany(slideDocuments);
    
    // Update presentation with slide IDs
    const slideIds = savedSlides.map(slide => slide._id);
    await PresentationModel.findByIdAndUpdate(presentationId, {
      slides: slideIds
    });

    console.log(`Saved ${savedSlides.length} slides to MongoDB`);

    // 5. Save to local file system using FileManager
    const { FileManager } = await import('@/lib/file-manager');
    
    const localFileData = {
      presentation: {
        ...validatedData.presentation,
        _id: presentationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      slides: validatedData.slides.map((slide, index) => ({
        ...slide,
        _id: savedSlides[index]._id.toString(),
        presentationId: presentationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      metadata: {
        source: 'upload',
        uploadedAt: new Date().toISOString(),
        mongodbId: presentationId,
        totalSlides: validatedData.slides.length
      }
    };

    // Generate filename and save files
    const filename = FileManager.generateFilename(validatedData.presentation.title);
    const { filePath, backupPath } = await FileManager.saveToLocal(localFileData, filename);
    
    console.log(`Saved presentation to local file: ${filePath}`);
    console.log(`Created backup at: ${backupPath}`);

    // 6. Generate summary file
    const summaryData = {
      presentationId,
      title: validatedData.presentation.title,
      description: validatedData.presentation.description,
      slideCount: validatedData.slides.length,
      createdAt: new Date().toISOString(),
      files: {
        main: filePath,
        backup: backupPath
      },
      mongodb: {
        presentationId,
        slideIds: slideIds.map(id => id.toString())
      }
    };

    const summaryPath = path.join(path.dirname(filePath), `summary_${filename}`);
    await fs.writeFile(summaryPath, JSON.stringify(summaryData, null, 2), 'utf-8');

    // Return success response
    return NextResponse.json({
      success: true,
      presentationId,
      slideIds: slideIds.map(id => id.toString()),
      files: {
        main: filename,
        backup: `backup_${filename}`,
        summary: `summary_${filename}`,
        localPath: filePath
      },
      mongodb: {
        presentationId,
        slideCount: savedSlides.length
      },
      message: 'Presentation uploaded and saved successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    // Handle MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('E11000')) {
        return NextResponse.json({
          success: false,
          error: 'Duplicate entry',
          details: 'A presentation with this data already exists'
        }, { status: 409 });
      }

      if (error.message.includes('ENOENT') || error.message.includes('EACCES')) {
        return NextResponse.json({
          success: false,
          error: 'File system error',
          details: 'Could not write to local storage'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to upload presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}