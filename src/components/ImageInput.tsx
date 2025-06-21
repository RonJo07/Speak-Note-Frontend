import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  PhotoIcon, 
  CameraIcon, 
  DocumentTextIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ImageInputProps {
  onSchedulingDetected: (info: any) => void;
}

const ImageInput: React.FC<ImageInputProps> = ({ onSchedulingDetected }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [schedulingInfo, setSchedulingInfo] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false
  });

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera not available or permission denied. Please check your browser settings.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image_file', selectedImage);
      
      const response = await axios.post(`${API_BASE_URL}/analyze/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { text, confidence, image_url, scheduling_info } = response.data;
      
      setOcrResult({ text, confidence, image_url });
      setSchedulingInfo(scheduling_info);
      
      if (scheduling_info && scheduling_info.confidence > 0.3) {
        onSchedulingDetected({
          ...scheduling_info,
          source: 'image',
          originalText: text,
          imageUrl: image_url
        });
      }
      
      toast.success('Image analysis completed!');
    } catch (error: any) {
      console.error('Error processing image:', error);
      const message = error.response?.data?.detail || 'Failed to process image';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrResult(null);
    setSchedulingInfo(null);
    stopCamera();
  };

  const highlightSchedulingText = (text: string, schedulingInfo: any) => {
    if (!schedulingInfo) return text;
    
    let highlightedText = text;
    
    // Highlight detected dates
    if (schedulingInfo.detected_date) {
      const dateStr = schedulingInfo.detected_date.toString();
      highlightedText = highlightedText.replace(
        new RegExp(dateStr, 'gi'),
        `<span class="bg-purple-600 text-white px-1 rounded">${dateStr}</span>`
      );
    }
    
    // Highlight detected times
    if (schedulingInfo.detected_time) {
      highlightedText = highlightedText.replace(
        new RegExp(schedulingInfo.detected_time, 'gi'),
        `<span class="bg-lavender-600 text-white px-1 rounded">${schedulingInfo.detected_time}</span>`
      );
    }
    
    return highlightedText;
  };

  return (
    <div className="space-y-6">
      {/* Image Input Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <PhotoIcon className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-gradient">Image Input</h3>
          {isProcessing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="w-5 h-5 text-purple-400" />
            </motion.div>
          )}
        </div>

        {/* Upload Area */}
        {!selectedImage && (
          <div className="space-y-4">
            {/* Drag & Drop */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragActive
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-dark-600 hover:border-purple-500 hover:bg-dark-700/50'
              }`}
            >
              <input {...getInputProps()} />
              <PhotoIcon className="w-12 h-12 mx-auto mb-4 text-dark-400" />
              <p className="text-lg text-white mb-2">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-dark-300">or click to select a file</p>
            </div>

            {/* Camera Capture */}
            <div className="text-center">
              <p className="text-dark-300 mb-4">or</p>
              <button
                onClick={startCamera}
                className="btn-accent flex items-center space-x-2 mx-auto"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Open Camera</span>
              </button>
            </div>
          </div>
        )}

        {/* Camera Interface */}
        <AnimatePresence>
          {streamRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border border-dark-600"
                />
                <button
                  onClick={stopCamera}
                  className="absolute top-2 right-2 bg-dark-800/80 hover:bg-dark-700 p-2 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={captureImage}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CameraIcon className="w-5 h-5" />
                  <span>Capture Image</span>
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full rounded-lg border border-dark-600"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 bg-dark-800/80 hover:bg-dark-700 p-2 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="btn-primary flex items-center space-x-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Extract Text</span>
                </button>
                <button
                  onClick={clearImage}
                  className="btn-secondary"
                >
                  Choose Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* OCR Results */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Extracted Text */}
            <div className="card">
              <h4 className="text-lg font-semibold mb-3 text-gradient">Extracted Text</h4>
              <div className="bg-dark-700 p-4 rounded-lg border border-dark-600">
                <p className="text-white leading-relaxed whitespace-pre-wrap">
                  {ocrResult.text || 'No text detected in the image'}
                </p>
              </div>
              
              {ocrResult.confidence > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-sm text-dark-300">OCR Confidence:</span>
                  <div className="flex-1 bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${ocrResult.confidence * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm text-purple-400">
                    {Math.round(ocrResult.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* Highlighted Text with Scheduling */}
            {schedulingInfo && schedulingInfo.confidence > 0.3 && (
              <div className="card">
                <h4 className="text-lg font-semibold mb-3 text-gradient">Scheduling Analysis</h4>
                <div 
                  className="bg-dark-700 p-4 rounded-lg border border-dark-600"
                  dangerouslySetInnerHTML={{
                    __html: highlightSchedulingText(ocrResult.text, schedulingInfo)
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-dark-300">Analyzing image with OCR...</p>
        </motion.div>
      )}
    </div>
  );
};

export default ImageInput; 