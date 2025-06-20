import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface Reminder {
  id: number;
  title: string;
  description?: string;
  scheduled_for: string;
  created_at: string;
  updated_at?: string;
  is_completed: boolean;
  is_important: boolean;
  original_text?: string;
  confidence_score?: number;
  source_type?: string;
  image_url?: string;
  user_id: number;
}

interface ReminderContextType {
  reminders: Reminder[];
  loading: boolean;
  createReminder: (reminderData: Partial<Reminder>) => Promise<boolean>;
  updateReminder: (id: number, reminderData: Partial<Reminder>) => Promise<boolean>;
  deleteReminder: (id: number) => Promise<boolean>;
  markCompleted: (id: number) => Promise<boolean>;
  fetchReminders: () => Promise<void>;
  fetchUpcomingReminders: () => Promise<Reminder[]>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};

interface ReminderProviderProps {
  children: ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchReminders = async () => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/reminders`);
      setReminders(response.data);
    } catch (error: any) {
      console.error('Failed to fetch reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (reminderData: Partial<Reminder>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/reminders`, reminderData);
      const newReminder = response.data;
      setReminders(prev => [...prev, newReminder]);
      toast.success('Reminder created successfully!');
      return true;
    } catch (error: any) {
      console.error('Failed to create reminder:', error);
      const message = error.response?.data?.detail || 'Failed to create reminder';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateReminder = async (id: number, reminderData: Partial<Reminder>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE_URL}/reminders/${id}`, reminderData);
      const updatedReminder = response.data;
      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? updatedReminder : reminder
      ));
      toast.success('Reminder updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Failed to update reminder:', error);
      const message = error.response?.data?.detail || 'Failed to update reminder';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE_URL}/reminders/${id}`);
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
      toast.success('Reminder deleted successfully!', { id: 'reminder-delete-toast' });
      return true;
    } catch (error: any) {
      console.error('Failed to delete reminder:', error);
      const message = error.response?.data?.detail || 'Failed to delete reminder';
      toast.error(message, { id: 'reminder-delete-toast' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return false;
      let response;
      if (reminder.is_completed) {
        // Uncomplete: send to /reminders/{id}/uncomplete (you need to implement this endpoint in backend)
        response = await axios.post(`${API_BASE_URL}/reminders/${id}/uncomplete`);
      } else {
        // Complete
        response = await axios.post(`${API_BASE_URL}/reminders/${id}/complete`);
      }
      const updatedReminder = response.data;
      setReminders(prev => prev.map(reminder => 
        reminder.id === id ? updatedReminder : reminder
      ));
      toast.success(`Reminder marked as ${updatedReminder.is_completed ? 'completed' : 'uncompleted'}!`);
      return true;
    } catch (error: any) {
      console.error('Failed to toggle reminder completion:', error);
      toast.error('Failed to update reminder status');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingReminders = async (): Promise<Reminder[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders/upcoming`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch upcoming reminders:', error);
      return [];
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchReminders();
    }
  }, [isAuthenticated]);

  const value: ReminderContextType = {
    reminders,
    loading,
    createReminder,
    updateReminder,
    deleteReminder,
    markCompleted,
    fetchReminders,
    fetchUpcomingReminders
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
}; 