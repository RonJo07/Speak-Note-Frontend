import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentTextIcon, SparklesIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useReminders } from '../contexts/ReminderContext';
import SchedulingPanel from './SchedulingPanel';

interface TextInputProps {
  onSchedulingDetected: (info: any) => void;
}

// Helper to parse time string like '4 pm', '4:30 pm', '16:00', etc.
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 0, minutes: 0 };
  // Match formats like "12:58pm", "12:58 pm", "12 pm", "12pm"
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return { hours: 0, minutes: 0 };
  let hours = Number(match[1]);
  let minutes = Number(match[2] || '0');
  const modifier = match[3];
  if (modifier) {
    if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
  }
  return { hours, minutes };
}

const TextInput: React.FC<TextInputProps> = ({ onSchedulingDetected }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [schedulingInfo, setSchedulingInfo] = useState<any>(null);
  const { createReminder, updateReminder } = useReminders();
  const [createdReminder, setCreatedReminder] = useState<any>(null);
  const [createdReminderId, setCreatedReminderId] = useState<number | null>(null);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const analyzeTextAndHandleReminder = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    try {
      const formData = new FormData();
      formData.append('text', text);
      const response = await axios.post(`${API_BASE_URL}/analyze/text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { analysis: analysisResult, scheduling_info } = response.data;
      setAnalysis(analysisResult);
      setSchedulingInfo(scheduling_info);
      if (scheduling_info && scheduling_info.confidence >= 0.0) {
        let date = scheduling_info.detected_date ? new Date(scheduling_info.detected_date) : new Date();
        if (scheduling_info.detected_time) {
          const { hours, minutes } = parseTimeString(scheduling_info.detected_time);
          date.setHours(hours, minutes, 0, 0);
        }
        if (isNaN(date.getTime())) {
          date = new Date();
        }
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const reminderData = {
          title: scheduling_info.suggested_title || 'Untitled Reminder',
          description: text,
          scheduled_for: date.toISOString(),
          is_important: false,
          original_text: text,
          confidence_score: scheduling_info.confidence,
          source_type: 'text',
          priority_level: priority,
          timezone,
        };
        let success = false;
        let newReminderId = null;
        if (createdReminderId) {
          // Update existing reminder
          success = await updateReminder(createdReminderId, reminderData);
        } else {
          // Create new reminder
          success = await createReminder(reminderData);
        }
        // Use the real ID from the backend response if available
        if (success && response.data && response.data.id) {
          setCreatedReminder(response.data);
          setCreatedReminderId(response.data.id);
        } else if (success) {
          setCreatedReminder(reminderData);
        }
        if (success) {
          toast.success('Reminder created/updated successfully!', { id: 'reminder-toast' });
        }
      }
    } catch (error: any) {
      console.error('Error analyzing text:', error);
      const message = error.response?.data?.detail || 'Failed to analyze text';
      toast.error(message, { id: 'reminder-toast' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, priority, createdReminderId, createReminder, updateReminder, API_BASE_URL]);

  // Debounced analysis and reminder creation/update
  useEffect(() => {
    if (text.length > 10) {
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        analyzeTextAndHandleReminder();
        setDebounceTimer(null);
      }, 12000); // 12 seconds debounce
      setDebounceTimer(timer);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, priority, analyzeTextAndHandleReminder]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const clearText = () => {
    setText('');
    setAnalysis(null);
    setSchedulingInfo(null);
    setCreatedReminder(null);
    setCreatedReminderId(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  };

  const highlightSchedulingText = (text: string, schedulingInfo: any) => {
    if (!schedulingInfo) return text;
    let highlightedText = text;
    if (schedulingInfo.detected_date) {
      const dateStr = schedulingInfo.detected_date.toString();
      highlightedText = highlightedText.replace(
        new RegExp(dateStr, 'gi'),
        `<span class="bg-purple-600 text-white px-1 rounded">${dateStr}</span>`
      );
    }
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
      {/* Priority Selector */}
      <div className="flex items-center space-x-4 mb-2">
        <label className="text-sm font-medium text-dark-300">Priority:</label>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
          className="input-field w-32"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      {/* Text Input Area */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-gradient">Text Input</h3>
          {isAnalyzing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <SparklesIcon className="w-5 h-5 text-purple-400" />
            </motion.div>
          )}
        </div>
        <div className="relative">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Type your reminder here... For example: 'Meeting with John tomorrow at 3 PM' or 'Doctor appointment on Friday at 2:30 PM'"
            className="input-field w-full h-32 resize-none"
            disabled={isAnalyzing}
          />
          {isAnalyzing && (
            <div className="absolute top-2 right-2">
              <div className="loading-spinner w-6 h-6"></div>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-dark-400">
            {text.length} characters
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (debounceTimer) {
                  clearTimeout(debounceTimer);
                  setDebounceTimer(null);
                }
                analyzeTextAndHandleReminder();
              }}
              disabled={!text.trim() || isAnalyzing}
              className="btn-primary flex items-center space-x-2"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Analyze</span>
            </button>
            {text && (
              <button
                onClick={clearText}
                className="btn-secondary"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Text with Highlights */}
            <div className="card">
              <h4 className="text-lg font-semibold mb-3 text-gradient">Analyzed Text</h4>
              <div 
                className="bg-dark-700 p-4 rounded-lg border border-dark-600"
                dangerouslySetInnerHTML={{
                  __html: highlightSchedulingText(text, schedulingInfo)
                }}
              />
            </div>
            {/* Analysis Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entities */}
              {analysis.entities && analysis.entities.length > 0 && (
                <div className="card">
                  <h4 className="text-lg font-semibold mb-3 text-gradient">Detected Entities</h4>
                  <div className="space-y-2">
                    {analysis.entities.map((entity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-dark-700 rounded">
                        <span className="text-white">{entity.text}</span>
                        <span className="text-xs text-purple-400 bg-purple-900 px-2 py-1 rounded">
                          {entity.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Key Phrases */}
              {analysis.key_phrases && analysis.key_phrases.length > 0 && (
                <div className="card">
                  <h4 className="text-lg font-semibold mb-3 text-gradient">Key Phrases</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.key_phrases.map((phrase: string, index: number) => (
                      <span
                        key={index}
                        className="text-sm bg-lavender-900 text-lavender-300 px-3 py-1 rounded-full"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Scheduling Info */}
      <AnimatePresence>
        {schedulingInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`card ${schedulingInfo.confidence > 0.3 ? 'border-purple-500 bg-purple-900/20' : 'border-orange-500 bg-orange-900/20'}`}
          >
            <h4 className="text-lg font-semibold mb-3 text-gradient">
              {schedulingInfo.confidence > 0.3 ? 'Scheduling Detected!' : 'Scheduling Analysis'}
            </h4>
            <div className="space-y-2">
              {schedulingInfo.detected_date && (
                <div className="flex items-center space-x-2">
                  <span className="text-dark-300">Date:</span>
                  <span className="text-purple-400 font-medium">
                    {new Date(schedulingInfo.detected_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {schedulingInfo.detected_time && (
                <div className="flex items-center space-x-2">
                  <span className="text-dark-300">Time:</span>
                  <span className="text-lavender-400 font-medium">
                    {schedulingInfo.detected_time}
                  </span>
                </div>
              )}
              {schedulingInfo.suggested_title && (
                <div className="flex items-center space-x-2">
                  <span className="text-dark-300">Suggested Title:</span>
                  <span className="text-white font-medium">
                    {schedulingInfo.suggested_title}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-dark-300">Confidence:</span>
                <span className={`font-medium ${schedulingInfo.confidence > 0.3 ? 'text-accent-primary' : 'text-orange-400'}`}>
                  {Math.round(schedulingInfo.confidence * 100)}%
                </span>
              </div>
              {schedulingInfo.confidence <= 0.3 && (
                <div className="text-sm text-orange-400 mt-2">
                  Confidence too low to automatically create reminder. Try adding more specific date/time information.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Scheduling Panel */}
      {createdReminder && (
        <SchedulingPanel schedulingInfo={schedulingInfo} onClose={() => setCreatedReminder(null)} editOnly />
      )}
    </div>
  );
};

export default TextInput; 