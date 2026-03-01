import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { ElectricityData } from '../types';
import { cn } from '../lib/utils';

interface FileUploadProps {
  onDataLoaded: (data: ElectricityData[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.error('CSV Parsing errors:', results.errors);
        }
        
        // Filter out invalid rows and map to our type
        const parsedData = results.data
          .filter((row: any) => row.States && row.Dates && row.Usage !== undefined)
          .map((row: any) => ({
            States: row.States,
            Regions: row.Regions,
            latitude: row.latitude,
            longitude: row.longitude,
            Dates: row.Dates,
            Usage: row.Usage,
          }));

        if (parsedData.length === 0) {
          setError('No valid data found in the CSV. Please ensure it has States, Regions, Dates, and Usage columns.');
        } else {
          onDataLoaded(parsedData);
        }
      },
      error: (error) => {
        setError(`Error parsing file: ${error.message}`);
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-16 p-6">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out cursor-pointer",
          isDragging 
            ? "border-blue-500 bg-blue-50/50" 
            : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upload Electricity Data</h3>
            <p className="text-sm text-slate-500 mt-1">Drag and drop your CSV file here, or click to browse</p>
          </div>
          <div className="flex items-center text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200">
            <FileText className="w-3 h-3 mr-1.5" />
            CSV format required
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-600">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
