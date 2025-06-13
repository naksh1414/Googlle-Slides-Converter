/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { PresentationUploader } from '@/components/PresentationUploader';
import { useToast } from '@/components/ui/toaster';

export function PresentationUploaderWrapper() {
  const { addToast } = useToast();

  const handleUploadSuccess = (presentationId: string) => {
    console.log('Upload successful:', presentationId);
    addToast({
      type: 'success',
      title: 'Upload Successful!',
      description: `Presentation ${presentationId} has been uploaded successfully.`
    });
  };

  
  const handleExportSuccess = (result: any) => {
    console.log('Export successful:', result);
    addToast({
      type: 'success',
      title: 'Export Complete!',
      description: 'Your presentation has been exported to Google Slides.'
    });
    
    if (result.exportUrl) {
      window.open(result.exportUrl, '_blank');
    }
  };

  return (
    <PresentationUploader
      onUploadSuccess={handleUploadSuccess}
      onExportSuccess={handleExportSuccess}
    />
  );
}