import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useReminders } from '../contexts/ReminderContext';
import toast from 'react-hot-toast';

const alertAudio = new Audio('/alert.mp3'); // Place alert.mp3 in your public folder

// Helper to format countdown
function getCountdown(scheduledFor: string) {
  const now = new Date();
  const target = new Date(scheduledFor);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'Due!';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} left`;
}

function CountdownTimer({ scheduledFor, title }: { scheduledFor: string, title?: string }) {
  const [countdown, setCountdown] = useState(getCountdown(scheduledFor));
  const [alerted, setAlerted] = useState(false);

  useEffect(() => {
    // Request notification permission on mount
    if (Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdown = getCountdown(scheduledFor);
      setCountdown(newCountdown);
      if (newCountdown === 'Due!' && !alerted) {
        // Show browser notification
        if (Notification && Notification.permission === 'granted') {
          new Notification('Reminder Due!', {
            body: title ? `It's time for: ${title}` : 'A reminder is due!',
            icon: '/favicon.ico',
          });
        }
        // Play sound
        alertAudio.play();
        setAlerted(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledFor, alerted, title]);

  return <span style={{ marginLeft: 8, color: '#aaa', fontSize: '0.9em' }}>{countdown}</span>;
}

const ReminderList: React.FC = () => {
  const { reminders, loading, deleteReminder, markCompleted } = useReminders();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'important'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'title'>('date');

  const filteredReminders = reminders
    .filter(reminder => {
      switch (filter) {
        case 'upcoming':
          return !reminder.is_completed && new Date(reminder.scheduled_for) > new Date();
        case 'completed':
          return reminder.is_completed;
        case 'important':
          return reminder.is_important;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime();
        case 'created':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      await deleteReminder(id);
    }
  };

  const handleToggleComplete = async (id: number) => {
    const success = await markCompleted(id);
    if (success) {
      toast.success('Reminder status updated!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    // Compare only the date part (year, month, day)
    const dateYMD = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowYMD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = dateYMD.getTime() - nowYMD.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString();
  };

  const getStatusColor = (reminder: any) => {
    if (reminder.is_completed) return 'text-accent-success';
    if (new Date(reminder.scheduled_for) < new Date()) return 'text-accent-error';
    if (reminder.is_important) return 'text-accent-warning';
    return 'text-purple-400';
  };

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gradient mb-4 sm:mb-0">
          All Reminders
        </h2>
        
        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-dark-300" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input-field text-sm"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="important">Important</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="created">Sort by Created</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : filteredReminders.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${
                  reminder.is_completed
                    ? 'bg-dark-700 border-dark-600 opacity-75'
                    : 'bg-dark-800 border-dark-600 hover:border-purple-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className={`font-semibold ${
                        reminder.is_completed ? 'line-through text-dark-400' : 'text-white'
                      }`}>
                        {reminder.title}
                      </h3>
                      {reminder.is_important && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-accent-warning" />
                      )}
                      {reminder.is_completed && (
                        <CheckCircleIcon className="w-5 h-5 text-accent-success" />
                      )}
                    </div>

                    {reminder.description && (
                      <p className={`text-sm mb-3 ${
                        reminder.is_completed ? 'text-dark-400' : 'text-dark-300'
                      }`}>
                        {reminder.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4 text-dark-400" />
                        <span className={getStatusColor(reminder)}>
                          {formatDate(reminder.scheduled_for)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4 text-dark-400" />
                        <span className="text-dark-300">
                          {new Date(reminder.scheduled_for).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* AI Analysis Info */}
                    {reminder.source_type && (
                      <div className="mt-2 flex items-center space-x-2 text-xs text-dark-400">
                        <span>Source: {reminder.source_type}</span>
                        {reminder.confidence_score && (
                          <>
                            <span>Confidence: {Math.round(reminder.confidence_score * 100)}%</span>
                            <CountdownTimer scheduledFor={reminder.scheduled_for} title={reminder.title} />
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleComplete(reminder.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        reminder.is_completed
                          ? 'text-accent-success hover:bg-accent-success/20'
                          : 'text-dark-300 hover:text-white hover:bg-dark-700'
                      }`}
                      title={reminder.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2 rounded-lg text-dark-300 hover:text-accent-error hover:bg-accent-error/20 transition-colors"
                      title="Delete reminder"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-dark-400" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">
            No reminders found
          </h3>
          <p className="text-dark-400">
            {filter === 'all' 
              ? 'Create your first reminder using voice, text, or image input above!'
              : `No ${filter} reminders found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ReminderList; 