'use client';

import React from 'react';
import { Shield, Zap, Palette, Users, Download, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your presentations are processed securely with end-to-end encryption. Files are automatically deleted after conversion.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Convert presentations in seconds, not minutes. Our optimized engine handles large files efficiently.',
  },
  {
    icon: Palette,
    title: 'Format Preservation',
    description: 'Maintain your original formatting, fonts, colors, and layouts. Animations and transitions are preserved.',
  },
  {
    icon: Users,
    title: 'Collaboration Ready',
    description: 'Export directly to Google Slides for seamless team collaboration and real-time editing.',
  },
  {
    icon: Download,
    title: 'Multiple Formats',
    description: 'Export to various formats including PPTX, PDF, and image formats for maximum compatibility.',
  },
  {
    icon: Cloud,
    title: 'Cloud Integration',
    description: 'Direct integration with Google Drive and Google Slides. Access your converted presentations anywhere.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-16">
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          Powerful Features for Professional Results
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
        >
          Everything you need to convert and manage your presentations with confidence
        </motion.p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="group relative p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800"
          >
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {feature.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {feature.description}
            </p>
            
            {/* Subtle hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
