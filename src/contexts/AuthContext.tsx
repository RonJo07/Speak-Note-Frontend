import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  full_name?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  requestLoginOTP: (email: string) => Promise<boolean>;
  loginWithOTP: (email: string, otp: string) => Promise<boolean>;
  register: (email: string, password: string, fullName?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      // You could add a /me endpoint to verify token and get user info
      // For now, we'll just check if token exists
      const token = localStorage.getItem('token');
      if (token) {
        // Set user from localStorage or make API call
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/login`, formData);
      
      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user info (you might want to add a /me endpoint)
      const userResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/me`);
      const userData = userResponse.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Successfully logged in!');
      return true;
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestLoginOTP = async (email: string): Promise<boolean> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('email', email);
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/request-login-otp`, formData);
      return true;
    } catch (error: any) {
      console.error('Request OTP failed:', error);
      const message = error.response?.data?.detail || 'Failed to send login code.';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/login-with-otp`, formData);
      const { access_token } = response.data;

      // Store token and user info
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      const userResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/me`);
      const userData = userResponse.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success('Successfully logged in!');
      return true;
    } catch (error: any) {
      console.error('Login with OTP failed:', error);
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName?: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/auth/register`, {
        email,
        password,
        full_name: fullName
      });
      
      const userData = response.data;
      
      // Auto-login after registration
      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        toast.success('Account created successfully!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration failed:', error);
      const message = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    requestLoginOTP,
    loginWithOTP,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 