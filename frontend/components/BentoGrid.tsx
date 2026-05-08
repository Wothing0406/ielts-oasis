"use client";

import React from 'react';
import { motion } from 'framer-motion';

export const BentoGrid = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${className}`}>
      {children}
    </div>
  );
};

export const BentoItem = ({ 
  children, 
  className = "", 
  span = "",
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string; 
  span?: string;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`matcha-card ${span} ${className} relative overflow-hidden group`}
    >
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
