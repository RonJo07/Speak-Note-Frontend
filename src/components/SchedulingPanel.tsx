import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckIcon, 
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import { useReminders } from '../contexts/ReminderContext';
import toast from 'react-hot-toast';

interface SchedulingPanelProps {
  schedulingInfo: any;
  onClose: () => void;
  editOnly?: boolean;
}

const SchedulingPanel: React.FC<SchedulingPanelProps> = ({ schedulingInfo, onClose, editOnly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(schedulingInfo.suggested_title || '');
  const [description, setDescription] = useState(schedulingInfo.originalText || '');
  const [scheduledDate, setScheduledDate] = useState(
    schedulingInfo.detected_date ? new Date(schedulingInfo.detected_date) : new Date()
  );
  const [scheduledTime, setScheduledTime] = useState(
    schedulingInfo.detected_time || '12:00'
  );
  const [isImportant, setIsImportant] = useState(false);
  
  const { createReminder } = useReminders();

  const handleConfirm = async () => {
    try {
      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':');
      const finalDate = new Date(scheduledDate);
      finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const reminderData = {
        title: title || 'Untitled Reminder',
        description: description,
        scheduled_for: finalDate.toISOString(),
        is_important: isImportant,
        original_text: schedulingInfo.originalText,
        confidence_score: schedulingInfo.confidence,
        source_type: schedulingInfo.source,
        image_url: schedulingInfo.imageUrl
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    setTitle(schedulingInfo.suggested_title || '');
    setDescription(schedulingInfo.originalText || '');
    setScheduledDate(
      schedulingInfo.detected_date ? new Date(schedulingInfo.detected_date) : new Date()
    );
    setScheduledTime(schedulingInfo.detected_time || '12:00');
    setIsImportant(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card border-purple-500 bg-purple-900/20 p-4 sm:p-6 max-w-full overflow-y-auto"
      style={{ maxHeight: '90vh' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gradient">Scheduling Detected!</h3>
        <button
          onClick={onClose}
          className="text-dark-300 hover:text-white transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Confidence Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-dark-300">AI Confidence:</span>
          <div className="flex-1 bg-dark-700 rounded-full h-2">
            <motion.div
              className="bg-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${schedulingInfo.confidence * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm text-purple-400 font-medium">
            {Math.round(schedulingInfo.confidence * 100)}%
          </span>
        </div>

        {/* Detected Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedulingInfo.detected_date && (
            <div className="flex items-center space-x-2 p-3 bg-dark-700 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-sm text-dark-300">Detected Date:</span>
                <p className="text-white font-medium">
                  {new Date(schedulingInfo.detected_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {schedulingInfo.detected_time && (
            <div className="flex items-center space-x-2 p-3 bg-dark-700 rounded-lg">
              <ClockIcon className="w-5 h-5 text-lavender-400" />
              <div>
                <span className="text-sm text-dark-300">Detected Time:</span>
                <p className="text-white font-medium">{schedulingInfo.detected_time}</p>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter reminder title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full h-20 resize-none"
                placeholder="Enter reminder description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Date
                </label>
                <DatePicker
                  selected={scheduledDate}
                  onChange={(date: Date) => setScheduledDate(date)}
                  className="input-field w-full"
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
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

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={handleConfirm}
                className="btn-primary flex-1 py-3 text-lg"
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                Create Reminder
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1 py-3 text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Read-only View */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Suggested Title
              </label>
              <p className="text-white font-medium">
                {schedulingInfo.suggested_title || 'Untitled Reminder'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Original Text
              </label>
              <p className="text-white bg-dark-700 p-3 rounded-lg">
                {schedulingInfo.originalText}
              </p>
            </div>

            <div className="flex space-x-3">
              {editOnly ? (
                <button
                  onClick={handleEdit}
                  className="btn-primary flex items-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleEdit}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit & Create</span>
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="btn-accent"
                  >
                    Create as Detected
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SchedulingPanel; 