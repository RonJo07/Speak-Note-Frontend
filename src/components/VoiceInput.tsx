import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon, StopIcon, PlayIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useReminders } from '../contexts/ReminderContext';

interface VoiceInputProps {
  onSchedulingDetected: (info: any) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onSchedulingDetected }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { createReminder } = useReminders();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      toast.success('Recording stopped!');
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.wav');
      
      const response = await axios.post(`${API_BASE_URL}/analyze/voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { text, confidence: conf, scheduling_info } = response.data;
      
      setTranscribedText(text);
      setConfidence(conf);
      
      if (scheduling_info && scheduling_info.confidence > 0.3) {
        const reminderData = {
          title: scheduling_info.suggested_title || 'Voice Reminder',
          description: text,
          scheduled_for: scheduling_info.detected_date ? new Date(scheduling_info.detected_date).toISOString() : new Date().toISOString(),
          source_type: 'voice',
          original_text: text,
          confidence_score: scheduling_info.confidence,
        };
        await createReminder(reminderData);
      } else {
        toast.error('Could not detect a clear schedule in your voice. Please try again.');
      }
      
      toast.success('Voice analysis completed!');
    } catch (error: any) {
      console.error('Error processing audio:', error);
      const message = error.response?.data?.detail || 'Failed to process audio';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscribedText('');
    setConfidence(0);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Recording Interface */}
      <div className="text-center">
        <motion.div
          className="relative inline-block"
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
        >
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-accent-error hover:bg-accent-error/90 shadow-lg shadow-accent-error/30'
                : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/30'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="stop"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <StopIcon className="w-8 h-8 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MicrophoneIcon className="w-8 h-8 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          {/* Recording indicator */}
          {isRecording && (
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-accent-error rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
        
        {/* Recording time */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-2xl font-mono text-purple-400"
          >
            {formatTime(recordingTime)}
          </motion.div>
        )}
        
        {/* Wave animation during recording */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex justify-center"
          >
            <div className="voice-wave">
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  animate={{ height: [20, 40, 20] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Status and Actions */}
      <div className="text-center space-y-4">
        <div className="text-sm text-dark-300">
          {isRecording && 'Recording... Speak clearly into your microphone'}
          {!isRecording && !audioBlob && 'Click the microphone to start recording'}
          {audioBlob && !isProcessing && 'Recording complete! Process to analyze'}
          {isProcessing && 'Processing your voice...'}
        </div>
        
        {audioBlob && !isProcessing && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={processAudio}
              className="btn-primary flex items-center space-x-2"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Process Audio</span>
            </button>
            <button
              onClick={resetRecording}
              className="btn-secondary"
            >
              Record Again
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {transcribedText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-gradient">Transcribed Text</h3>
              <div className="bg-dark-700 p-4 rounded-lg border border-dark-600">
                <p className="text-white leading-relaxed">{transcribedText}</p>
              </div>
              
              {confidence > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-sm text-dark-300">Confidence:</span>
                  <div className="flex-1 bg-dark-700 rounded-full h-2">
                    <motion.div
                      className="bg-purple-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-sm text-purple-400">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
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
          <p className="text-dark-300">Analyzing your voice...</p>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceInput; 