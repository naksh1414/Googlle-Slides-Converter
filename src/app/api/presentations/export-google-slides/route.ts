/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { GoogleSlidesClient } from '@/lib/google-slides-client';
import { PresentationConverter } from '@/lib/presentation-converter';
import { z } from 'zod';
import type { IPresentation } from '@/types/Presentation';
import type { ISlide } from '@/types/slide';
import  connectDB  from "@/lib/db"; // Adjust path as needed
import PresentationModel from '@/models/Presentation'; // Adjust path as needed
import SlideModel from '@/models/Slide'; // Adjust path as needed

const exportSchema = z.object({
  presentationId: z.string(),
  accessToken: z.string(),
  exportOptions: z.object({
    exportFormat: z.enum(['pptx', 'pdf', 'jpeg', 'png', 'svg', 'txt']).default('pptx'),
    includeNotes: z.boolean().default(true),
    quality: z.enum(['high', 'medium', 'low']).optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { presentationId, accessToken, exportOptions } = exportSchema.parse(body);

    // Connect to database
    await connectDB();

    // Fetch actual presentation from database
    const presentation = await PresentationModel.findById(presentationId).lean() as IPresentation | null;
    if (!presentation) {
      return NextResponse.json({
        success: false,
        error: 'Presentation not found',
        details: `No presentation found with ID: ${presentationId}`
      }, { status: 404 });
    }

    // Fetch actual slides from database
    const slides = await SlideModel.find({ 
      presentationId: presentationId 
    }).sort({ slideNumber: 1 }).lean();

    if (!slides || slides.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No slides found',
        details: `No slides found for presentation ID: ${presentationId}`
      }, { status: 404 });
    }

    console.log(`Found presentation: ${presentation.title} with ${slides.length} slides`);

    // Convert to Google Slides format
    const slidesTyped: ISlide[] = slides.map((slide: any) => ({
      _id: slide._id?.toString?.() ?? '',
      presentationId: slide.presentationId,
      slideNumber: slide.slideNumber,
      elements: slide.elements,
      background: slide.background,
      notes: slide.notes,
      createdAt: slide.createdAt,
      updatedAt: slide.updatedAt,
      transition: slide.transition ?? null,
      layout: slide.layout ?? null
    }));
    const googleSlidesData = PresentationConverter.convertToGoogleSlides(
      presentation as IPresentation,
      slidesTyped
    );

    console.log('Converted to Google Slides format:', {
      title: googleSlidesData.title,
      slidesCount: googleSlidesData.slides?.length || 0
    });

    // Create Google Slides presentation
    const googleSlidesClient = new GoogleSlidesClient(accessToken);
    const googlePresentationId = await googleSlidesClient.createPresentation(googleSlidesData);

    console.log(`Created Google Slides presentation: ${googlePresentationId}`);

    // Export if format is specified
    let exportBuffer: Buffer | null = null;
    let downloadUrl: string | null = null;
    
    if (exportOptions && exportOptions.exportFormat !== 'pptx') {
      try {
        exportBuffer = await googleSlidesClient.exportPresentation(
          googlePresentationId,
          exportOptions
        );
        console.log(`Exported presentation as ${exportOptions.exportFormat}`);
      } catch (exportError) {
        console.warn('Export failed, but presentation was created:', exportError);
        // Continue without failing the entire request
      }
    }

    // Generate different URLs based on format
    const baseUrl = `https://docs.google.com/presentation/d/${googlePresentationId}`;
    if (exportOptions?.exportFormat === 'pdf') {
      downloadUrl = `${baseUrl}/export/pdf`;
    } else if (exportOptions?.exportFormat === 'pptx') {
      downloadUrl = `${baseUrl}/export/pptx`;
    }

    return NextResponse.json({
      success: true,
      googlePresentationId,
      editUrl: `${baseUrl}/edit`,
      downloadUrl,
      exportBuffer: exportBuffer ? exportBuffer.toString('base64') : null,
      presentationData: {
        title: presentation.title,
        slideCount: slides.length,
        description: presentation.description
      },
      message: 'Successfully exported to Google Slides'
    });

  } catch (error) {
    console.error('Export error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Cast to ObjectId failed')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid presentation ID format',
          details: 'The provided presentation ID is not valid'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to export to Google Slides',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}