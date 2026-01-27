
import React, { useState } from 'react';
import { Upload, FileJson, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (data: any) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Please upload a valid JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onUpload(json);
        setError(null);
      } catch (err) {
        setError('Invalid JSON format. Please check the file content.');
      }
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Upload className="text-blue-600 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Conversation Report</h2>
        <p className="text-gray-500 mb-8">Drag and drop your JSON report file here or click to browse</p>
        
        <label className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 inline-flex items-center gap-2">
          <FileJson className="w-5 h-5" />
          Choose JSON File
          <input
            type="file"
            className="hidden"
            accept=".json"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-bounce">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
