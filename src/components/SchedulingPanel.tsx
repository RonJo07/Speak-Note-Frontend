import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useReminders } from '../contexts/ReminderContext';
import toast from 'react-hot-toast';

interface SchedulingPanelProps {
  schedulingInfo: {
    detected_date?: string;
    detected_time?: string;
    suggested_title?: string;
    confidence?: number;
  };
  onClose: () => void;
}

const SchedulingPanel: React.FC<SchedulingPanelProps> = ({ schedulingInfo, onClose }) => {
  const [title, setTitle] = useState(schedulingInfo.suggested_title || 'Untitled Reminder');
  const [isImportant, setIsImportant] = useState(false);
  const { createReminder } = useReminders();

  const handleConfirm = async () => {
    try {
      let date = schedulingInfo.detected_date ? new Date(schedulingInfo.detected_date) : new Date();
      
      if (schedulingInfo.detected_time) {
        const timeStr = schedulingInfo.detected_time;
        const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
        if (match) {
          let hours = Number(match[1]);
          let minutes = Number(match[2] || '0');
          const modifier = match[3];
          if (modifier) {
            if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
            if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
          }
          date.setHours(hours, minutes, 0, 0);
        }
      }

      const reminderData = {
        title,
        description: '',
        scheduled_for: date.toISOString(),
        is_important: isImportant,
        original_text: '',
        confidence_score: schedulingInfo.confidence || 0,
        source_type: 'manual',
        priority_level: isImportant ? 'High' : 'Medium',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const success = await createReminder(reminderData);
      if (success) {
        toast.success('Reminder created successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
    }
  };

  const confidenceColor = schedulingInfo.confidence && schedulingInfo.confidence > 0.7 
    ? 'text-green-400' 
    : schedulingInfo.confidence && schedulingInfo.confidence > 0.4 
    ? 'text-yellow-400' 
    : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card border-2 border-purple-500/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gradient">Schedule Reminder</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-dark-600 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-dark-300" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Confidence Indicator */}
        {schedulingInfo.confidence !== undefined && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-dark-300">Confidence:</span>
            <span className={`text-sm font-medium ${confidenceColor}`}>
              {Math.round(schedulingInfo.confidence * 100)}%
            </span>
            {schedulingInfo.confidence < 0.5 && (
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
            )}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Reminder Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field w-full"
            placeholder="Enter reminder title"
          />
        </div>

        {/* Date and Time Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedulingInfo.detected_date && (
            <div className="flex items-center space-x-2 p-3 bg-dark-700 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-dark-300">Date</p>
                <p className="font-medium text-white">
                  {new Date(schedulingInfo.detected_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {schedulingInfo.detected_time && (
            <div className="flex items-center space-x-2 p-3 bg-dark-700 rounded-lg">
              <ClockIcon className="w-5 h-5 text-lavender-400" />
              <div>
                <p className="text-sm text-dark-300">Time</p>
                <p className="font-medium text-white">
                  {schedulingInfo.detected_time}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Important Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="important"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-dark-700 border-dark-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="important" className="text-sm text-dark-300">
            Mark as important
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            <CheckIcon className="w-5 h-5" />
            <span>Create Reminder</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SchedulingPanel; 