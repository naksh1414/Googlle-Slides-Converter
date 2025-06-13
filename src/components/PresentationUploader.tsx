/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  File,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Download,
  Eye,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleSlidesExport } from "@/hooks/useGoogleSlidesExport";
import { useGoogleOAuth } from "@/components/GoogleOAuthProvider";
import {
  validateFileType,
  validateFileSize,
  formatFileSize,
} from "@/utils/file-validation";
import type { GoogleSlidesExportOptions } from "@/types/Google-slides";
import Image from "next/image";
interface PresentationUploaderProps {
  onUploadSuccess?: (presentationId: string) => void;
  onExportSuccess?: (result: any) => void;
}

export function PresentationUploader({
  onUploadSuccess,
  onExportSuccess,
}: PresentationUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPresentationId, setUploadedPresentationId] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [exportOptions, setExportOptions] = useState<GoogleSlidesExportOptions>(
    {
      exportFormat: "pptx",
      includeNotes: true,
      quality: "high",
    }
  );

  const { exportToGoogleSlides, isExporting, error } = useGoogleSlidesExport();
  const {
    isAuthenticated,
    login,
    logout,
    accessToken,
    isLoading,
    userInfo,
    error: authError,
  } = useGoogleOAuth();

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!validateFileType(file)) {
        alert("Please select a valid presentation file (PPT, PPTX, or ODP)");
        return;
      }

      if (!validateFileSize(file)) {
        alert("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
      // Reset previous upload state
      setUploadedPresentationId(null);
      setExportResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.oasis.opendocument.presentation": [".odp"],
    },
    multiple: false,
  });

  // Handle file select (fallback for browsers without drag/drop)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!validateFileType(file)) {
        alert("Please select a valid presentation file (PPT, PPTX, or ODP)");
        return;
      }

      if (!validateFileSize(file)) {
        alert("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
      setUploadedPresentationId(null);
      setExportResult(null);
    }
  };

  // Simulate upload progress
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const progressInterval = simulateUploadProgress();

    try {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const mockPresentationData = {
        presentation: {
          title: selectedFile.name.replace(/\.[^/.]+$/, ""),
          description: `Uploaded presentation from ${selectedFile.name}`,
          slides: ["slide-1", "slide-2"],
          settings: {
            dimensions: { width: 1920, height: 1080, aspectRatio: "16:9" },
            theme: {
              primaryColor: { hex: "#007bff" },
              secondaryColor: { hex: "#6c757d" },
              backgroundColor: { hex: "#ffffff" },
              textColor: { hex: "#333333" },
              accentColor: { hex: "#28a745" },
            },
            defaultFont: {
              family: "Arial",
              size: 14,
              weight: 400,
              style: "normal" as const,
            },
          },
        },
        slides: [
          {
            slideNumber: 1,
            title: "Uploaded Content",
            elements: [
              {
                id: "title-text",
                type: "text",
                position: { x: 100, y: 200 },
                dimensions: { width: 800, height: 100 },
                rotation: 0,
                opacity: 1,
                zIndex: 1,
                locked: false,
                visible: true,
                data: {
                  content: selectedFile.name.replace(/\.[^/.]+$/, ""),
                  font: {
                    family: "Arial",
                    size: 32,
                    weight: 700,
                    style: "normal",
                  },
                  color: { hex: "#333333" },
                  alignment: "center",
                },
              },
            ],
            background: { type: "color", data: { color: { hex: "#ffffff" } } },
          },
        ],
      };

      const response = await fetch("/api/presentations/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockPresentationData),
      });

      const result = await response.json();
      console.log("Upload result:", result);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadedPresentationId(result.presentationId);
        onUploadSuccess?.(result.presentationId);

        // Reset progress after animation
        setTimeout(() => {
          setUploadProgress(0);
        }, 1000);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoogleSlidesExport = async () => {
    if (!uploadedPresentationId || !accessToken) return;

    const result = await exportToGoogleSlides(
      uploadedPresentationId,
      accessToken,
      exportOptions
    );



    console.log("Export result:", result);

    if (result.success) {
      setExportResult(result);
      onExportSuccess?.(result);

      // Auto-open Google Slides
      if (result.exportUrl) {
        setTimeout(() => {
          window.open(result.exportUrl, "_blank");
        }, 1000);
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedPresentationId(null);
    setExportResult(null);
    setUploadProgress(0);
    setShowExportOptions(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Upload & Export Presentation
              </h2>
              <p className="text-blue-100">
                Transform your presentations into Google Slides format
              </p>
            </div>
            {(uploadedPresentationId || selectedFile) && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm"
              >
                Start Over
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between text-sm">
            <div
              className={`flex items-center gap-2 ${
                selectedFile
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedFile
                    ? "bg-green-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {selectedFile ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              <span className="font-medium">Select File</span>
            </div>

            <div
              className={`flex items-center gap-2 ${
                uploadedPresentationId
                  ? "text-green-600 dark:text-green-400"
                  : selectedFile
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  uploadedPresentationId
                    ? "bg-green-600 text-white"
                    : selectedFile
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {uploadedPresentationId ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  "2"
                )}
              </div>
              <span className="font-medium">Upload</span>
            </div>

            <div
              className={`flex items-center gap-2 ${
                exportResult
                  ? "text-green-600 dark:text-green-400"
                  : uploadedPresentationId
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  exportResult
                    ? "bg-green-600 text-white"
                    : uploadedPresentationId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {exportResult ? <CheckCircle className="w-4 h-4" /> : "3"}
              </div>
              <span className="font-medium">Export</span>
            </div>
          </div>

          {/* Step 1: File Upload */}
          {!uploadedPresentationId && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Presentation File
              </h3>

              {/* Drag & Drop Area */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                  ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105"
                      : selectedFile
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                `}
              >
                <input {...getInputProps()} />

                <div className="space-y-3">
                  <div
                    className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedFile
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-blue-100 dark:bg-blue-900"
                    }`}
                  >
                    {selectedFile ? (
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                        <File className="h-4 w-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)} • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isDragActive
                          ? "Drop your file here"
                          : "Drag & drop your presentation"}
                      </p>
                      <p className="text-gray-500 text-sm">
                        or{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          browse files
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        Supports PPT, PPTX, ODP files up to 50MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fallback File Input */}
              <div className="text-center">
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".pptx,.ppt,.odp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer underline">
                    Or click here to select a file
                  </span>
                </label>
              </div>

              {/* Upload Progress */}
              <AnimatePresence>
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        Processing presentation...
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={`
                  w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    !selectedFile || isUploading
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  }
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Presentation
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Upload Success & Google Auth */}
          <AnimatePresence>
            {uploadedPresentationId && !exportResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Success Message */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Upload Successful!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your presentation is ready for export to Google Slides.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Authentication */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Connect Google Account
                    </h3>
                    {isAuthenticated && (
                      <button
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                      >
                        <Settings className="h-4 w-4" />
                        Export Options
                      </button>
                    )}
                  </div>

                  {!isAuthenticated ? (
                    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-red-600 dark:text-red-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Google Account Required
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Connect your Google account to export presentations
                            to Google Slides
                          </p>
                        </div>
                        <button
                          onClick={login}
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-gray-700"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              />
                            </svg>
                          )}
                          {isLoading ? "Connecting..." : "Sign in with Google"}
                        </button>

                        {authError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{authError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {userInfo?.picture ? (
                            <Image
                              src={userInfo.picture}
                              alt={userInfo.name}
                              className="w-8 h-8 rounded-full"
                              width={32}
                              height={32}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              {userInfo?.name ||
                                userInfo?.email ||
                                "Google Account Connected"}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Ready to export
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={logout}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <LogOut className="w-3 h-3" />
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Export Options */}
                  <AnimatePresence>
                    {showExportOptions && isAuthenticated && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Export Settings
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Format
                            </label>
                            <select
                              value={exportOptions.exportFormat}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  exportFormat: e.target.value as any,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="pptx">PowerPoint (.pptx)</option>
                              <option value="pdf">PDF (.pdf)</option>
                              <option value="jpeg">JPEG (.jpg)</option>
                              <option value="png">PNG (.png)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quality
                            </label>
                            <select
                              value={exportOptions.quality || "high"}
                              onChange={(e) =>
                                setExportOptions((prev) => ({
                                  ...prev,
                                  quality: e.target.value as any,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="include-notes"
                            checked={exportOptions.includeNotes}
                            onChange={(e) =>
                              setExportOptions((prev) => ({
                                ...prev,
                                includeNotes: e.target.checked,
                              }))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor="include-notes"
                            className="text-sm text-gray-700 dark:text-gray-300"
                          >
                            Include speaker notes
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Export Button */}
                  {isAuthenticated && (
                    <button
                      onClick={handleGoogleSlidesExport}
                      disabled={isExporting}
                      className={`
                        w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2
                        ${
                          isExporting
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                        } text-white
                      `}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Exporting to Google Slides...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-5 h-5" />
                          Export to Google Slides
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Export Success */}
          <AnimatePresence>
            {exportResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Success Message */}
                <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-full">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        🎉 Export Successful!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Your presentation has been successfully converted and
                        exported to Google Slides.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {exportResult.exportUrl && (
                          <a
                            href={exportResult.exportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Open in Google Slides
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {exportResult.exportBuffer && (
                          <button
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = `data:application/octet-stream;base64,${exportResult.exportBuffer}`;
                              link.download = `${
                                selectedFile?.name.replace(/\.[^/.]+$/, "") ||
                                "presentation"
                              }.${exportOptions.exportFormat}`;
                              link.click();
                            }}
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download {exportOptions.exportFormat.toUpperCase()}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Export Info
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <p>Format: {exportOptions.exportFormat.toUpperCase()}</p>
                      <p>Quality: {exportOptions.quality}</p>
                      <p>
                        Notes:{" "}
                        {exportOptions.includeNotes ? "Included" : "Excluded"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Status
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        ✓ Successfully exported
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Available in Google Drive
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">
                      Export Error
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
