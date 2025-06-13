/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/presentations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import PresentationModel from '@/models/Presentation';
import { FileManager } from '@/lib/file-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // 'mongodb' | 'local' | 'all'
    const presentationId = searchParams.get('id');

    // If requesting specific presentation
    if (presentationId) {
      return await getSinglePresentation(presentationId, source);
    }

    // Get all presentations
    return await getAllPresentations(source);

  } catch (error) {
    console.error('Error fetching presentations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch presentations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function getSinglePresentation(presentationId: string, source: string | null) {
  if (source === 'local') {
    // Try to find in local files
    const files = await FileManager.listPresentations();
    
    for (const filename of files) {
      try {
        const data = await FileManager.readFromLocal(filename);
        if (data.presentation._id === presentationId) {
          return NextResponse.json({
            success: true,
            source: 'local',
            presentation: data,
            filename
          });
        }
      } catch (error) {
        console.warn(`Failed to read ${filename}:`, error);
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Presentation not found in local files'
    }, { status: 404 });
  }

  // Default to MongoDB
  await connectDB();
  
  const presentation = await PresentationModel.findById(presentationId)
    .populate('slides')
    .lean();

  if (!presentation) {
    return NextResponse.json({
      success: false,
      error: 'Presentation not found in database'
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    source: 'mongodb',
    presentation
  });
}

async function getAllPresentations(source: string | null) {
  const results: any = {
    success: true,
    presentations: [],
    sources: []
  };

  // Get from MongoDB
  if (!source || source === 'mongodb' || source === 'all') {
    try {
      await connectDB();
      const mongodbPresentations = await PresentationModel.find()
        .select('title description createdAt updatedAt metadata.totalSlides status')
        .sort({ updatedAt: -1 })
        .lean();

      results.presentations.push(...mongodbPresentations.map((p: any) => ({
        ...p,
        source: 'mongodb'
      })));
      results.sources.push('mongodb');
    } catch (error) {
      console.error('Failed to fetch from MongoDB:', error);
    }
  }

  // Get from local files
  if (!source || source === 'local' || source === 'all') {
    try {
      const files = await FileManager.listPresentations();
      
      for (const filename of files) {
        try {
          const data = await FileManager.readFromLocal(filename);
          const stats = await FileManager.getFileStats(filename);
          
          results.presentations.push({
            _id: data.presentation._id,
            title: data.presentation.title,
            description: data.presentation.description,
            createdAt: data.presentation.createdAt,
            updatedAt: data.presentation.updatedAt,
            totalSlides: data.slides?.length || 0,
            source: 'local',
            filename,
            fileSize: stats.size
          });
        } catch (error) {
          console.warn(`Failed to process ${filename}:`, error);
        }
      }
      
      results.sources.push('local');
    } catch (error) {
      console.error('Failed to fetch from local files:', error);
    }
  }

  // Sort by creation date (newest first)
  results.presentations.sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(results);
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const presentationId = searchParams.get('id');
    const source = searchParams.get('source') || 'all';

    if (!presentationId) {
      return NextResponse.json({
        success: false,
        error: 'Presentation ID is required'
      }, { status: 400 });
    }

    const deletedFrom: string[] = [];

    // Delete from MongoDB
    if (source === 'mongodb' || source === 'all') {
      try {
        await connectDB();
        const deleted = await PresentationModel.findByIdAndDelete(presentationId);
        if (deleted) {
          deletedFrom.push('mongodb');
        }
      } catch (error) {
        console.error('Failed to delete from MongoDB:', error);
      }
    }

    // Delete from local files
    if (source === 'local' || source === 'all') {
      try {
        const files = await FileManager.listPresentations();
        
        for (const filename of files) {
          try {
            const data = await FileManager.readFromLocal(filename);
            if (data.presentation._id === presentationId) {
              await FileManager.deletePresentationFiles(filename);
              deletedFrom.push('local');
              break;
            }
          } catch (error) {
            console.warn(`Failed to check ${filename}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to delete from local files:', error);
      }
    }

    if (deletedFrom.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Presentation not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Presentation deleted from: ${deletedFrom.join(', ')}`,
      deletedFrom
    });

  } catch (error) {
    console.error('Error deleting presentation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete presentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}