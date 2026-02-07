import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface UploadAreaProps {
  onFileLoaded: (content: string) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileLoaded }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onFileLoaded(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    },
    [onFileLoaded]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onFileLoaded(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={clsx(
        "border-2 border-dashed border-gray-300 rounded-lg p-12",
        "flex flex-col items-center justify-center text-center",
        "hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer bg-white"
      )}
    >
      <input
        type="file"
        accept=".html"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center w-full h-full">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          Drop your Reading List HTML here
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          or click to select a file
        </p>
      </label>
    </div>
  );
};
