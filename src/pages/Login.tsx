import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type LoginMode = 'password' | 'otp';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<LoginMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { login, requestLoginOTP, loginWithOTP } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleRequestOTP = async () => {
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    const success = await requestLoginOTP(email);
    if (success) {
      setOtpSent(true);
      toast.success('A login code has been sent to your email.');
    }
    setIsLoading(false);
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Please enter the code from your email.');
      return;
    }
    setIsLoading(true);
    const success = await loginWithOTP(email, otp);
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-2xl font-bold text-white">SN</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {mode === 'password' ? 'Welcome Back' : 'Email Sign-In'}
          </h1>
          <p className="text-dark-300">
            {mode === 'password' 
              ? 'Sign in to your SpeakNote Remind account'
              : 'Enter your email to receive a login code'
            }
          </p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          {mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field w-full pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email-otp" className="block text-sm font-medium text-dark-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email-otp"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your email"
                  required
                  disabled={otpSent}
                />
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-dark-300 mb-2">
                    Login Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-field w-full text-center tracking-[0.5em]"
                    placeholder="_ _ _ _ _ _"
                    required
                  />
                </div>
              )}

              {otpSent ? (
                <button type="submit" disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Verifying...' : 'Sign In with Code'}
                </button>
              ) : (
                <button type="button" onClick={handleRequestOTP} disabled={isLoading} className="btn-primary w-full">
                  {isLoading ? 'Sending...' : 'Send Login Code'}
                </button>
              )}
            </form>
          )}

          {/* Divider and mode toggle */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-dark-600"></div>
            <span className="px-4 text-sm text-dark-400">or</span>
            <div className="flex-1 border-t border-dark-600"></div>
          </div>
          <div className="text-center">
            <button 
              onClick={() => setMode(mode === 'password' ? 'otp' : 'password')}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {mode === 'password' ? 'Sign in with a code instead' : 'Sign in with password instead'}
            </button>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-dark-400 mb-4">
            Experience AI-powered reminders with voice, text, and image analysis
          </p>
          <div className="flex justify-center space-x-6 text-xs text-dark-400">
            <span>🎤 Voice Input</span>
            <span>📝 Text Analysis</span>
            <span>📷 AI Extraction</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login; 