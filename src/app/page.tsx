import React from "react";
import { PresentationUploader } from "@/components/PresentationUploader";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { HowItWorks } from "@/components/HowItWorks";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <Hero />

      <section id="uploader" className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Upload Your Presentation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get started by uploading your presentation file and exporting it to
            Google Slides
          </p>
        </div>

        <PresentationUploader />
      </section>

      <HowItWorks />
      <Features />
    </div>
  );
}
