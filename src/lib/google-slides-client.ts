/* eslint-disable @typescript-eslint/no-explicit-any */
import { google, slides_v1, drive_v3 } from 'googleapis';
import type { GoogleSlidesCreateRequest, GoogleSlidesExportOptions } from '@/types/Google-slides';

export class GoogleSlidesClient {
  private slides: slides_v1.Slides;
  private drive: drive_v3.Drive;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.slides = google.slides({ version: 'v1', auth });
    this.drive = google.drive({ version: 'v3', auth });
  }

  async createPresentation(request: GoogleSlidesCreateRequest): Promise<string> {
    try {
      console.log(`\n🚀 STARTING PRESENTATION CREATION`);
      console.log(`Title: "${request.title}"`);
      console.log(`Slides to create: ${request.slides.length}`);
      
      // Debug: Log the incoming request structure
      console.log(`\n📊 INCOMING REQUEST DATA:`);
      request.slides.forEach((slide, index) => {
        console.log(`  Slide ${index + 1}:`);
        console.log(`    - Title: ${slide.title}`);
        console.log(`    - Slide Number: ${slide.slideNumber}`);
        console.log(`    - Content Elements: ${slide.content?.length || 0}`);
        console.log(`    - Has Background: ${!!slide.background}`);
        
        if (slide.content && slide.content.length > 0) {
          slide.content.forEach((element, elemIndex) => {
            console.log(`      Element ${elemIndex + 1}: ${element.type} (ID: ${element.id})`);
          });
        }
      });

      // Step 1: Create empty presentation
      console.log(`\n📝 Creating empty presentation...`);
      const presentation = await this.slides.presentations.create({
        requestBody: {
          title: request.title,
        },
      });

      const presentationId = presentation.data.presentationId;
      
      if (!presentationId) {
        throw new Error('Failed to get presentation ID');
      }

      console.log(`✅ Created presentation with ID: ${presentationId}`);

      // Step 2: Get the current presentation structure
      console.log(`\n🔍 Getting current presentation structure...`);
      const currentPresentation = await this.slides.presentations.get({
        presentationId: presentationId
      });

      const currentSlides = currentPresentation.data.slides || [];
      console.log(`Current slides in presentation: ${currentSlides.length}`);
      
      const defaultSlideId = currentSlides[0]?.objectId;
      console.log(`Default slide ID: ${defaultSlideId}`);

      // Step 3: Process all slides with detailed logging
      if (request.slides && request.slides.length > 0) {
        await this.processAllSlidesWithDebug(presentationId, request.slides, defaultSlideId ?? undefined);
      } else {
        console.log(`⚠️ No slides to process!`);
      }

      // Step 4: Verify final presentation structure
      console.log(`\n🔍 Verifying final presentation...`);
      const finalPresentation = await this.slides.presentations.get({
        presentationId: presentationId
      });
      
      const finalSlides = finalPresentation.data.slides || [];
      console.log(`Final presentation has ${finalSlides.length} slides`);
      
      finalSlides.forEach((slide, index) => {
        console.log(`  Final Slide ${index + 1}: ID = ${slide.objectId}`);
      });

      console.log(`\n🎉 Presentation creation completed successfully`);
      return presentationId;

    } catch (error) {
      console.error(`\n❌ Error creating Google Slides presentation:`, error);
      throw new Error(`Failed to create presentation: ${error}`);
    }
  }

  private async processAllSlidesWithDebug(
    presentationId: string, 
    slidesData: any[], 
    defaultSlideId?: string
  ): Promise<void> {
    
    console.log(`\n🔧 PROCESSING ${slidesData.length} SLIDES`);
    
    // Step 1: Create additional slides if needed
    if (slidesData.length > 1) {
      console.log(`\n➕ Creating ${slidesData.length - 1} additional slides...`);
      await this.createNewSlidesWithDebug(presentationId, slidesData);
    } else {
      console.log(`\n📄 Only 1 slide, using default slide`);
    }
    
    // Step 2: Add content to all slides
    console.log(`\n📝 Adding content to all slides...`);
    await this.addContentToAllSlidesWithDebug(presentationId, slidesData, defaultSlideId);
    
    console.log(`\n✅ Processed all ${slidesData.length} slides successfully`);
  }

  private async createNewSlidesWithDebug(presentationId: string, slidesData: any[]): Promise<void> {
    const slideCreationRequests = [];
    
    console.log(`\n🏗️ BUILDING SLIDE CREATION REQUESTS:`);
    
    // Create slides starting from index 1 (index 0 uses the default slide)
    for (let i = 1; i < slidesData.length; i++) {
      const slideId = `slide_${i + 1}`;
      const slideData = slidesData[i];
      
      console.log(`  Request ${i}: Creating slide "${slideId}" for slide number ${slideData.slideNumber}`);
      
      slideCreationRequests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: i + 1,
          slideLayoutReference: {
            predefinedLayout: 'BLANK'
          }
        }
      });
    }

    if (slideCreationRequests.length > 0) {
      console.log(`\n🚀 Executing ${slideCreationRequests.length} slide creation requests...`);
      
      try {
        const response = await this.slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: slideCreationRequests
          }
        });
        
        console.log(`✅ Slide creation response:`, response.data);
        console.log(`✅ Successfully created ${slideCreationRequests.length} slides`);
        
        // Verify slides were created
        const updatedPresentation = await this.slides.presentations.get({
          presentationId: presentationId
        });
        
        const updatedSlides = updatedPresentation.data.slides || [];
        console.log(`📊 After creation, presentation has ${updatedSlides.length} slides:`);
        updatedSlides.forEach((slide, index) => {
          console.log(`    Slide ${index + 1}: ${slide.objectId}`);
        });
        
      } catch (error) {
        console.error(`❌ Failed to create slides:`, error);
        throw error;
      }
    } else {
      console.log(`⚠️ No slide creation requests generated`);
    }
  }

  private async addContentToAllSlidesWithDebug(
    presentationId: string, 
    slidesData: any[], 
    defaultSlideId?: string
  ): Promise<void> {
    
    console.log(`\n📝 ADDING CONTENT TO ALL SLIDES:`);
    
    for (let slideIndex = 0; slideIndex < slidesData.length; slideIndex++) {
      const slide = slidesData[slideIndex];
      const slideId = slideIndex === 0 ? defaultSlideId : `slide_${slideIndex + 1}`;
      
      console.log(`\n--- SLIDE ${slideIndex + 1} ---`);
      console.log(`Slide ID: ${slideId}`);
      console.log(`Slide Title: ${slide.title || 'Untitled'}`);
      console.log(`Slide Number: ${slide.slideNumber}`);
      console.log(`Content Elements: ${slide.content?.length || 0}`);
      
      if (!slideId) {
        console.error(`❌ No slide ID available for slide ${slideIndex + 1}`);
        continue;
      }
      
      if (slide.content && Array.isArray(slide.content) && slide.content.length > 0) {
        console.log(`Processing ${slide.content.length} content elements...`);
        await this.addContentToSlideWithDebug(presentationId, slideId, slide.content, slideIndex);
      } else {
        console.log(`⚠️ Slide ${slideIndex + 1} has no content to add`);
      }
    }
  }

  private async addContentToSlideWithDebug(
    presentationId: string, 
    slideId: string, 
    elements: any[], 
    slideIndex: number
  ): Promise<void> {
    
    const contentRequests: any[] = [];

    console.log(`\n  🔧 Building content requests for slide ${slideIndex + 1}:`);
    
    elements.forEach((element: any, elementIndex: number) => {
      const elementId = `slide_${slideIndex + 1}_element_${elementIndex + 1}`;
      
      console.log(`\n    Element ${elementIndex + 1}:`);
      console.log(`      Type: ${element.type}`);
      console.log(`      Original ID: ${element.id}`);
      console.log(`      Generated ID: ${elementId}`);
      console.log(`      Position: (${element.position?.x || 0}, ${element.position?.y || 0})`);
      console.log(`      Size: ${element.size?.width || 100} x ${element.size?.height || 50}`);

      switch (element.type) {
        case 'text':
          console.log(`      Text Content: "${(element.content?.text || '').substring(0, 50)}..."`);
          this.addTextElementWithDebug(contentRequests, slideId, elementId, element);
          break;
        case 'image':
          console.log(`      Image URL: ${element.content?.src || 'No URL'}`);
          this.addImageElementWithDebug(contentRequests, slideId, elementId, element);
          break;
        case 'shape':
          console.log(`      Shape Type: ${element.content?.shapeType || 'rectangle'}`);
          this.addShapeElementWithDebug(contentRequests, slideId, elementId, element);
          break;
        default:
          console.warn(`      ⚠️ Unknown element type: ${element.type}`);
      }
    });

    console.log(`\n  📤 Generated ${contentRequests.length} content requests for slide ${slideIndex + 1}`);

    if (contentRequests.length > 0) {
      try {
        console.log(`  🚀 Executing content requests...`);
        
        const response = await this.slides.presentations.batchUpdate({
          presentationId,
          requestBody: {
            requests: contentRequests
          }
        });
        
        console.log(`  ✅ Content added successfully to slide ${slideIndex + 1}`);
        console.log(`  📊 Response:`, response.data);
        
      } catch (error) {
        console.error(`  ❌ Failed to add content to slide ${slideIndex + 1}:`, error);
        console.error(`  📋 Failed requests:`, JSON.stringify(contentRequests, null, 2));
        throw error;
      }
    } else {
      console.log(`  ⚠️ No content requests generated for slide ${slideIndex + 1}`);
    }
  }

  private addTextElementWithDebug(requests: any[], slideId: string, elementId: string, element: any): void {
    const content = element.content || {};
    const position = element.position || { x: 100, y: 100 };
    const size = element.size || { width: 400, height: 100 };

    console.log(`        Creating text box with content: "${content.text || 'NO TEXT'}"`);

    // Create text box
    requests.push({
      createShape: {
        objectId: elementId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: Math.max(size.width, 10), unit: 'PT' },
            height: { magnitude: Math.max(size.height, 10), unit: 'PT' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: Math.max(position.x, 0),
            translateY: Math.max(position.y, 0),
            unit: 'PT'
          }
        }
      }
    });

    // Add text content
    if (content.text) {
      requests.push({
        insertText: {
          objectId: elementId,
          text: content.text,
          insertionIndex: 0
        }
      });
    }
  }

  private addImageElementWithDebug(requests: any[], slideId: string, elementId: string, element: any): void {
    const content = element.content || {};
    const position = element.position || { x: 100, y: 100 };
    const size = element.size || { width: 300, height: 200 };

    console.log(`        Creating image with URL: ${content.src || 'NO URL'}`);

    if (content.src) {
      requests.push({
        createImage: {
          objectId: elementId,
          url: content.src,
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: Math.max(size.width, 10), unit: 'PT' },
              height: { magnitude: Math.max(size.height, 10), unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: Math.max(position.x, 0),
              translateY: Math.max(position.y, 0),
              unit: 'PT'
            }
          }
        }
      });
    } else {
      console.warn('        ⚠️ Image element missing src URL');
    }
  }

  private addShapeElementWithDebug(requests: any[], slideId: string, elementId: string, element: any): void {
    const content = element.content || {};
    const position = element.position || { x: 100, y: 100 };
    const size = element.size || { width: 100, height: 100 };

    console.log(`        Creating shape: ${content.shapeType || 'rectangle'}`);

    requests.push({
      createShape: {
        objectId: elementId,
        shapeType: this.mapShapeType(content.shapeType || 'rectangle'),
        elementProperties: {
          pageObjectId: slideId,
          size: {
            width: { magnitude: Math.max(size.width, 10), unit: 'PT' },
            height: { magnitude: Math.max(size.height, 10), unit: 'PT' }
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: Math.max(position.x, 0),
            translateY: Math.max(position.y, 0),
            unit: 'PT'
          }
        }
      }
    });
  }

  private mapShapeType(shapeType: string): string {
    const shapeMap: Record<string, string> = {
      rectangle: 'RECTANGLE',
      circle: 'ELLIPSE',
      ellipse: 'ELLIPSE',
      triangle: 'TRIANGLE',
      arrow: 'RIGHT_ARROW',
      star: 'STAR_5',
      polygon: 'HEXAGON'
    };
    return shapeMap[shapeType.toLowerCase()] || 'RECTANGLE';
  }

  async exportPresentation(
    presentationId: string, 
    options: GoogleSlidesExportOptions
  ): Promise<Buffer> {
    try {
      console.log(`Exporting presentation ${presentationId} as ${options.exportFormat}`);
      
      const response = await this.drive.files.export({
        fileId: presentationId,
        mimeType: this.getMimeType(options.exportFormat),
      }, { responseType: 'arraybuffer' });

      const arrayBuffer = response.data as ArrayBuffer;
      console.log(`Export completed, size: ${arrayBuffer.byteLength} bytes`);
      return Buffer.from(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error('Error exporting presentation:', error);
      throw new Error(`Failed to export presentation: ${error}`);
    }
  }

  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf: 'application/pdf',
      jpeg: 'image/jpeg',
      png: 'image/png',
      svg: 'image/svg+xml',
      txt: 'text/plain'
    };
    return mimeTypes[format] || mimeTypes.pptx;
  }
}