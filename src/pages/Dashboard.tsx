import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MicrophoneIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import VoiceInput from '../components/VoiceInput';
import TextInput from '../components/TextInput';
import ImageInput from '../components/ImageInput';
import ReminderList from '../components/ReminderList';
import SchedulingPanel from '../components/SchedulingPanel';
import { useReminders } from '../contexts/ReminderContext';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'image'>('voice');
  const [schedulingInfo, setSchedulingInfo] = useState<any>(null);
  const { reminders, loading } = useReminders();

  const upcomingReminders = reminders.filter(reminder => 
    !reminder.is_completed && new Date(reminder.scheduled_for) > new Date()
  ).slice(0, 5);

  const tabs = [
    { id: 'voice', name: 'Voice', icon: MicrophoneIcon, color: 'text-purple-400' },
    { id: 'text', name: 'Text', icon: DocumentTextIcon, color: 'text-lavender-400' },
    { id: 'image', name: 'Image', icon: PhotoIcon, color: 'text-accent-primary' }
  ];

  const handleSchedulingDetected = (info: any) => {
    setSchedulingInfo(info);
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-2">
            SpeakNote Remind
          </h1>
          <p className="text-dark-300 text-lg">
            AI-powered reminders with voice, text, and image analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              {/* Input Tabs */}
              <div className="flex space-x-1 mb-6 bg-dark-700 p-1 rounded-lg">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'text-dark-300 hover:text-white hover:bg-dark-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Input Components */}
              <div className="min-h-[400px]">
                {activeTab === 'voice' && (
                  <VoiceInput onSchedulingDetected={handleSchedulingDetected} />
                )}
                {activeTab === 'text' && (
                  <TextInput onSchedulingDetected={handleSchedulingDetected} />
                )}
                {activeTab === 'image' && (
                  <ImageInput onSchedulingDetected={handleSchedulingDetected} />
                )}
              </div>
            </motion.div>

            {/* Scheduling Panel */}
            {schedulingInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <SchedulingPanel 
                  schedulingInfo={schedulingInfo}
                  onClose={() => setSchedulingInfo(null)}
                />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <h3 className="text-xl font-semibold mb-4 text-gradient">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">Total Reminders</span>
                  <span className="text-2xl font-bold text-purple-400">
                    {reminders.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">Upcoming</span>
                  <span className="text-2xl font-bold text-lavender-400">
                    {upcomingReminders.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">Completed</span>
                  <span className="text-2xl font-bold text-accent-success">
                    {reminders.filter(r => r.is_completed).length}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Upcoming Reminders */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h3 className="text-xl font-semibold mb-4 text-gradient">Upcoming</h3>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : upcomingReminders.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-3 bg-dark-700 rounded-lg border border-dark-600 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">
                            {reminder.title}
                          </h4>
                          {reminder.description && (
                            <p className="text-sm text-dark-300 mb-2">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-dark-400">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(reminder.scheduled_for).toLocaleDateString()}
                            </span>
                            <ClockIcon className="w-4 h-4 ml-2" />
                            <span>
                              {new Date(reminder.scheduled_for).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        {reminder.is_important && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-accent-warning flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-dark-400">
                  <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-accent-success" />
                  <p>No upcoming reminders</p>
                  <p className="text-sm">Create your first reminder above!</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Full Reminder List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <ReminderList />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 