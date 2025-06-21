import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  BellIcon, 
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true
  });
  const [fullName, setFullName] = useState(user?.full_name || '');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success('Notification settings updated!');
  };

  const handleThemeToggle = () => setIsDarkMode((prev) => !prev);

  const handleProfileUpdate = async () => {
    try {
      // Call backend to update user profile
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/me`,
        { full_name: fullName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser({ full_name: fullName });
      toast.success('Profile updated!');
    } catch (error: any) {
      toast.error('Failed to update profile');
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
      setNotifications(prev => ({ ...prev, push: true }));
    } else {
      toast.error('Notification permission denied.');
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Settings</h1>
          <p className="text-dark-300">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <UserIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-gradient">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input-field w-full bg-dark-700 cursor-not-allowed"
                />
                <p className="text-xs text-dark-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <button className="btn-primary" onClick={handleProfileUpdate}>
                Update Profile
              </button>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <BellIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-gradient">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-sm text-dark-300">Receive reminders via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Push Notifications</h3>
                  <p className="text-sm text-dark-300">Receive alerts in your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) => handleNotificationChange('push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Reminder Alerts</h3>
                  <p className="text-sm text-dark-300">Get notified before reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.reminders}
                    onChange={(e) => handleNotificationChange('reminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Manual Permission Button */}
              {Notification && Notification.permission !== 'granted' && (
                <div className="pt-2">
                  <p className="text-sm text-dark-300 mb-2">
                    Browser notifications are currently {Notification.permission}.
                  </p>
                  <button onClick={requestNotificationPermission} className="btn-secondary w-full">
                    Enable Notifications
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Cog6ToothIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-gradient">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Dark Mode</h3>
                  <p className="text-sm text-dark-300">Use dark theme</p>
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  {isDarkMode ? (
                    <MoonIcon className="w-5 h-5 text-purple-400" />
                  ) : (
                    <SunIcon className="w-5 h-5 text-yellow-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Auto-detect Theme</h3>
                  <p className="text-sm text-dark-300">Follow system preference</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-gradient">Privacy & Security</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">Data Usage</h3>
                <p className="text-sm text-dark-300 mb-3">
                  Your voice recordings and images are processed locally and securely. 
                  No data is stored permanently without your consent.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                    <span className="text-sm text-dark-300">Voice data processed locally</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                    <span className="text-sm text-dark-300">Images analyzed securely</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-accent-success rounded-full"></div>
                    <span className="text-sm text-dark-300">Open source AI models</span>
                  </div>
                </div>
              </div>

              <button className="btn-secondary w-full">
                Export My Data
              </button>
            </div>
          </motion.div>
        </div>

        {/* About Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 card"
        >
          <h2 className="text-xl font-semibold text-gradient mb-4">About SpeakNote Remind</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-dark-300">
            <div>
              <h3 className="text-white font-medium mb-2">Version</h3>
              <p>Beta 1.0.0</p>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Powered by</h3>
              <a href="https://techwithron.co.in" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">techwithron</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings; 