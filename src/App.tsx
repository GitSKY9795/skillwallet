import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ElectricityData } from './types';
import { Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [data, setData] = useState<ElectricityData[] | null>(null);

  const handleDataLoaded = (parsedData: ElectricityData[]) => {
    setData(parsedData);
  };

  const handleReset = () => {
    setData(null);
  };

  if (data) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Dashboard data={data} onReset={handleReset} />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full space-y-8 text-center"
      >
        <div className="flex justify-center">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Zap className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            India Electricity Dashboard
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Upload your electricity consumption CSV data to instantly generate interactive visualizations, regional insights, and consumption trends.
          </p>
        </div>

        <FileUpload onDataLoaded={handleDataLoaded} />
        
        <div className="pt-8 text-sm text-slate-500">
          <p>Expected CSV format: States, Regions, latitude, longitude, Dates, Usage</p>
        </div>
      </motion.div>
    </div>
  );
}

