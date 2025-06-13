import { useState } from "react";
import type { GoogleSlidesExportOptions } from "@/types/Google-slides";

interface ExportResult {
  success: boolean;
  googlePresentationId?: string;
  exportUrl?: string;
  exportBuffer?: string;
  error?: string;
}

export function useGoogleSlidesExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToGoogleSlides = async (
    presentationId: string,
    accessToken: string,
    options?: GoogleSlidesExportOptions
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch("/api/presentations/export-google-slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          presentationId,
          accessToken,
          exportOptions: options,
        }),
      });

      const result = await response.json();
      const exportUrl = result.editUrl;
      if (!response.ok) {
        throw new Error(result.error || "Export failed");
      }

      return {
        success: true,
        googlePresentationId: result.googlePresentationId,
        exportUrl,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Export failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToGoogleSlides,
    isExporting,
    error,
  };
}
