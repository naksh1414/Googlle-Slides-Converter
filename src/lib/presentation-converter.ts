/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/presentation-converter.ts
import type { IPresentation } from '@/types/Presentation';
import type { ISlide } from '@/types/slide';
import type { GoogleSlidesCreateRequest, GoogleSlideData } from '@/types/Google-slides';

export class PresentationConverter {
  static convertToGoogleSlides(
    presentation: IPresentation, 
    slides: ISlide[]
  ): GoogleSlidesCreateRequest {
    console.log('Converting presentation:', presentation.title);
    console.log('Number of slides to convert:', slides.length);

    // Sort slides by slide number to ensure correct order
    const sortedSlides = slides.sort((a, b) => a.slideNumber - b.slideNumber);

    const googleSlidesRequest: GoogleSlidesCreateRequest = {
      title: presentation.title || 'Untitled Presentation',
      slides: sortedSlides.map(slide => this.convertSlideToGoogleSlide(slide)),
      theme: this.convertThemeToGoogleTheme(presentation.settings?.theme)
    };

    console.log('Converted slides:', googleSlidesRequest.slides.length);
    console.log('Slide details:', googleSlidesRequest.slides.map(s => ({
      slideNumber: s.slideNumber,
      title: s.title,
      contentCount: s.content.length
    })));
    
    return googleSlidesRequest;
  }

  private static convertSlideToGoogleSlide(slide: ISlide): GoogleSlideData {
    console.log(`Converting slide ${slide.slideNumber}: "${slide.title}"`);
    console.log(`Slide elements count: ${slide.elements?.length || 0}`);
    
    const googleSlide: GoogleSlideData = {
      title: slide.title || `Slide ${slide.slideNumber}`,
      slideNumber: slide.slideNumber,
      content: (slide.elements || []).map(element => this.convertElementToGoogleContent(element)),
      background: this.convertBackgroundToGoogleBackground(slide.background)
    };

    console.log(`Converted slide ${slide.slideNumber} with ${googleSlide.content.length} content elements`);
    
    // Log each content element for debugging
    googleSlide.content.forEach((element, index) => {
      console.log(`  Element ${index + 1}: ${element.type} at (${element.position.x}, ${element.position.y})`);
    });
    
    return googleSlide;
  }

  private static convertElementToGoogleContent(element: any): any {
    console.log(`Converting element: ${element.type} with ID: ${element.id}`);
    
    const baseElement = {
      id: element.id,
      type: element.type,
      position: {
        x: element.position?.x || 0,
        y: element.position?.y || 0
      },
      size: {
        width: element.dimensions?.width || 100,
        height: element.dimensions?.height || 50
      },
      rotation: element.rotation || 0,
      opacity: element.opacity || 1,
      zIndex: element.zIndex || 1
    };

    switch (element.type) {
      case 'text':
        const textElement = {
          ...baseElement,
          content: {
            text: element.data?.content || '',
            font: {
              family: element.data?.font?.family || 'Arial',
              size: element.data?.font?.size || 14,
              weight: element.data?.font?.weight || 400,
              style: element.data?.font?.style || 'normal'
            },
            color: {
              hex: element.data?.color?.hex || '#000000'
            },
            alignment: element.data?.alignment || 'left',
            lineHeight: element.data?.lineHeight || 1.2,
            letterSpacing: element.data?.letterSpacing || 0,
            textDecoration: element.data?.textDecoration || 'none',
            textTransform: element.data?.textTransform || 'none'
          }
        };
        console.log(`  Text: "${textElement.content.text.substring(0, 50)}..."`);
        return textElement;

      case 'image':
        const imageElement = {
          ...baseElement,
          content: {
            src: element.data?.src || '',
            alt: element.data?.alt || '',
            fit: element.data?.fit || 'cover'
          }
        };
        console.log(`  Image: ${imageElement.content.src}`);
        return imageElement;

      case 'shape':
        const shapeElement = {
          ...baseElement,
          content: {
            shapeType: element.data?.shapeType || 'rectangle',
            fill: {
              hex: element.data?.fill?.hex || '#cccccc'
            },
            stroke: {
              color: { hex: element.data?.stroke?.color?.hex || '#000000' },
              width: element.data?.stroke?.width || 1
            },
            cornerRadius: element.data?.cornerRadius || 0
          }
        };
        console.log(`  Shape: ${shapeElement.content.shapeType}`);
        return shapeElement;

      case 'video':
        const videoElement = {
          ...baseElement,
          content: {
            src: element.data?.src || '',
            poster: element.data?.poster || '',
            autoplay: element.data?.autoplay || false,
            controls: element.data?.controls !== false
          }
        };
        console.log(`  Video: ${videoElement.content.src}`);
        return videoElement;

      case 'audio':
        const audioElement = {
          ...baseElement,
          content: {
            src: element.data?.src || '',
            autoplay: element.data?.autoplay || false,
            controls: element.data?.controls !== false,
            loop: element.data?.loop || false
          }
        };
        console.log(`  Audio: ${audioElement.content.src}`);
        return audioElement;

      default:
        console.log(`  Unknown element type: ${element.type}`);
        return {
          ...baseElement,
          content: element.data || {}
        };
    }
  }

  private static convertBackgroundToGoogleBackground(background: any): any {
    if (!background) {
      return {
        type: 'color',
        data: { color: { hex: '#ffffff' } }
      };
    }

    console.log(`Converting background: ${background.type}`);

    switch (background.type) {
      case 'color':
        return {
          type: 'color',
          data: {
            color: {
              hex: background.data?.color?.hex || '#ffffff'
            }
          }
        };

      case 'image':
        return {
          type: 'image',
          data: {
            src: background.data?.src || '',
            fit: background.data?.fit || 'cover',
            opacity: background.data?.opacity || 1
          }
        };

      case 'gradient':
        return {
          type: 'gradient',
          data: {
            colors: background.data?.colors || [
              { hex: '#ffffff' },
              { hex: '#f0f0f0' }
            ],
            direction: background.data?.direction || 'horizontal',
            angle: background.data?.angle || 0
          }
        };

      default:
        return {
          type: 'color',
          data: { color: { hex: '#ffffff' } }
        };
    }
  }

  private static convertThemeToGoogleTheme(theme: any): any {
    if (!theme) {
      return {
        primaryColor: { hex: '#007bff' },
        backgroundColor: { hex: '#ffffff' },
        textColor: { hex: '#333333' }
      };
    }

    return {
      primaryColor: { hex: theme.primaryColor?.hex || '#007bff' },
      secondaryColor: { hex: theme.secondaryColor?.hex || '#6c757d' },
      backgroundColor: { hex: theme.backgroundColor?.hex || '#ffffff' },
      textColor: { hex: theme.textColor?.hex || '#333333' },
      accentColor: { hex: theme.accentColor?.hex || '#28a745' }
    };
  }

  // Helper method to validate converted data
  static validateGoogleSlidesData(data: GoogleSlidesCreateRequest): boolean {
    if (!data.title || typeof data.title !== 'string') {
      console.error('Invalid title in Google Slides data');
      return false;
    }

    if (!Array.isArray(data.slides)) {
      console.error('Slides must be an array');
      return false;
    }

    if (data.slides.length === 0) {
      console.error('No slides to convert');
      return false;
    }

    for (let i = 0; i < data.slides.length; i++) {
      const slide = data.slides[i];
      if (!this.validateGoogleSlideData(slide, i)) {
        return false;
      }
    }

    console.log(`Validation passed: ${data.slides.length} slides ready for export`);
    return true;
  }

  private static validateGoogleSlideData(slide: GoogleSlideData, index: number): boolean {
    if (typeof slide.slideNumber !== 'number') {
      console.error(`Invalid slide number for slide ${index}`);
      return false;
    }

    if (!Array.isArray(slide.content)) {
      console.error(`Slide content must be an array for slide ${index}`);
      return false;
    }

    console.log(`Slide ${slide.slideNumber} validation passed: ${slide.content.length} elements`);
    return true;
  }

  // Debug method to inspect data structure
  static debugPresentationData(presentation: IPresentation, slides: ISlide[]): void {
    console.log('=== PRESENTATION DEBUG ===');
    console.log('Presentation:', {
      title: presentation.title,
      description: presentation.description,
      slideCount: slides.length,
      settings: presentation.settings
    });

    console.log('=== SLIDES DEBUG ===');
    slides.forEach((slide, index) => {
      console.log(`Slide ${index + 1}:`, {
        slideNumber: slide.slideNumber,
        title: slide.title,
        elementCount: slide.elements?.length || 0,
        background: slide.background?.type || 'none',
        elements: slide.elements?.map(el => ({
          type: el.type,
          id: el.id,
          position: el.position,
          dimensions: el.dimensions
        })) || []
      });
    });
    console.log('=== END DEBUG ===');
  }
}