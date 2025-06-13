'use client';

import React from 'react';
import { Upload, Settings, Download, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Upload,
    title: 'Upload Your File',
    description: 'Select and upload your presentation file (PPT, PPTX, ODP supported)',
    color: 'blue',
  },
  {
    icon: Settings,
    title: 'Configure Options',
    description: 'Choose export format, quality settings, and Google account authorization',
    color: 'purple',
  },
  {
    icon: Download,
    title: 'Convert & Export',
    description: 'Our system processes your file and creates a Google Slides presentation',
    color: 'green',
  },
  {
    icon: CheckCircle,
    title: 'Access & Share',
    description: 'Open your converted presentation in Google Slides and start collaborating',
    color: 'orange',
  },
];

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    icon: 'text-blue-600 dark:text-blue-400',
    connector: 'bg-blue-300',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    icon: 'text-purple-600 dark:text-purple-400',
    connector: 'bg-purple-300',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900',
    icon: 'text-green-600 dark:text-green-400',
    connector: 'bg-green-300',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900',
    icon: 'text-orange-600 dark:text-orange-400',
    connector: 'bg-orange-300',
  },
};

export function HowItWorks() {
  return (
    <section className="py-16">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
        >
          Convert your presentations to Google Slides in just four simple steps
        </motion.p>
      </div>
      
      <div className="relative">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="flex justify-between items-start relative">
            {steps.map((step, index) => {
              const colorClass = colorClasses[step.color as keyof typeof colorClasses];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="flex-1 relative"
                >
                  <div className="text-center max-w-xs mx-auto">
                    <div className={`w-16 h-16 ${colorClass.bg} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <step.icon className={`h-8 w-8 ${colorClass.icon}`} />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1, delay: index * 0.2 + 0.5 }}
                        viewport={{ once: true }}
                        className={`h-full ${colorClass.connector} rounded-full`}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-12">
          {steps.map((step, index) => {
            const colorClass = colorClasses[step.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-6"
              >
                <div className={`w-12 h-12 ${colorClass.bg} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <step.icon className={`h-6 w-6 ${colorClass.icon}`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}