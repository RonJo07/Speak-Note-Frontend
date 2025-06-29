import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  KeyIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

type AuthMode = 'login' | 'register';
type RegisterMethod = 'password' | 'otp';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [registrationOtpSent, setRegistrationOtpSent] = useState(false);
  
  const { login, requestLoginOTP, loginWithOTP, register, requestRegistrationOTP, registerWithOTP, loading } = useAuth();
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
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

  const handleRequestLoginOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setIsLoading(true);
    const success = await requestLoginOTP(email);
    if (success) {
      setOtpSent(true);
    }
    setIsLoading(false);
  };

  const handleLoginWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    const success = await loginWithOTP(email, otp);
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    const success = await register(email, password, fullName);
    if (success) {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  const handleRequestRegistrationOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Requesting registration OTP for:', email);
      const success = await requestRegistrationOTP(email);
      console.log('Registration OTP request result:', success);
      
      // Force the state to true regardless of the response
      console.log('Setting registrationOtpSent to true');
      setRegistrationOtpSent(true);
      
      // Add alert for debugging
      alert('OTP field should now be visible! Check if the input field appears below.');
      
      if (success) {
        toast.success('Verification code sent to your email!');
      } else {
        toast.error('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error requesting registration OTP:', error);
      toast.error('Failed to send verification code. Please try again.');
      // Still show the OTP field even if there's an error
      setRegistrationOtpSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWithOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp || !fullName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Validate OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await registerWithOTP(email, otp, fullName);
      if (success) {
        toast.success('Account created successfully! Welcome to SpeakNote Remind!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error registering with OTP:', error);
      // Error message is already handled by the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setFullName('');
    setOtpSent(false);
    setRegistrationOtpSent(false);
    setLoginMethod('password');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const switchRegisterMethod = (method: RegisterMethod) => {
    setRegisterMethod(method);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setFullName('');
    setOtpSent(false);
    setRegistrationOtpSent(false);
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
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-dark-300">
            {mode === 'login' 
              ? 'Sign in to your SpeakNote Remind account'
              : 'Create your account with email verification'
            }
          </p>
        </div>

        {/* Mode Selection */}
        <div className="card mb-6">
          <div className="flex space-x-1 bg-dark-700 p-1 rounded-lg">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-purple-600 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-purple-600 text-white'
                  : 'text-dark-300 hover:text-white hover:bg-dark-600'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            {/* Login Method Toggle */}
            <div className="flex space-x-1 bg-dark-700 p-1 rounded-lg mb-6">
              <button
                onClick={() => { setLoginMethod('password'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-purple-600 text-white'
                    : 'text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { setLoginMethod('otp'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'otp'
                    ? 'bg-purple-600 text-white'
                    : 'text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                Email Code
              </button>
            </div>

            {/* Password Login */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-6">
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
            )}

            {/* OTP Login */}
            {loginMethod === 'otp' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleRequestLoginOTP}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Send Login Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLoginWithOTP}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Enter 6-digit code
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="input-field pl-10"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                      </div>
                      <p className="text-sm text-dark-400 mt-2">
                        We sent a code to {email}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="flex-1 bg-dark-600 hover:bg-dark-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                      >
                        <ArrowLeftIcon className="w-5 h-5 inline mr-2" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Registration Form */}
        {mode === 'register' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            {/* Registration Method Toggle */}
            <div className="flex space-x-1 bg-dark-700 p-1 rounded-lg mb-6">
              <button
                onClick={() => { switchRegisterMethod('password'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  registerMethod === 'password'
                    ? 'bg-purple-600 text-white'
                    : 'text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => { switchRegisterMethod('otp'); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  registerMethod === 'otp'
                    ? 'bg-purple-600 text-white'
                    : 'text-dark-300 hover:text-white hover:bg-dark-600'
                }`}
              >
                Email Code
              </button>
            </div>

            {/* Password Registration */}
            {registerMethod === 'password' && (
              <form onSubmit={handlePasswordRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Create a password"
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
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* OTP Registration */}
            {registerMethod === 'otp' && (
              <div className="space-y-4">
                {/* Debug Info - Remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-xs">
                    <p>Debug: registrationOtpSent = {registrationOtpSent.toString()}</p>
                    <p>Debug: registerMethod = {registerMethod}</p>
                    <p>Debug: mode = {mode}</p>
                    <button 
                      onClick={() => setRegistrationOtpSent(true)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs mt-1 mr-1"
                    >
                      Test: Show OTP Field
                    </button>
                    <button 
                      onClick={() => setRegistrationOtpSent(false)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs mt-1"
                    >
                      Test: Hide OTP Field
                    </button>
                  </div>
                )}
                
                {registrationOtpSent === false ? (
                  <form onSubmit={handleRequestRegistrationOTP}>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-dark-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field pl-10"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 mt-4"
                    >
                      {isLoading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {/* Success Message */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-green-400 font-medium">Verification code sent!</p>
                          <p className="text-green-300 text-sm">Check your email for the 6-digit code</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleRegisterWithOTP}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Enter 6-digit verification code
                        </label>
                        <div className="relative">
                          <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => {
                              // Only allow numbers and limit to 6 digits
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setOtp(value);
                            }}
                            className="input-field pl-10 text-center text-lg font-mono tracking-widest"
                            placeholder="000000"
                            maxLength={6}
                            required
                            autoFocus
                          />
                        </div>
                        <p className="text-sm text-dark-400 mt-2">
                          We sent a verification code to <span className="text-purple-400 font-medium">{email}</span>
                        </p>
                      </div>

                      {/* Resend OTP Option */}
                      <div className="mb-4 text-center">
                        <button
                          type="button"
                          onClick={handleRequestRegistrationOTP}
                          disabled={isLoading}
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                        >
                          Didn't receive the code? Resend
                        </button>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => { 
                            setRegistrationOtpSent(false); 
                            setOtp(''); 
                          }}
                          className="flex-1 bg-dark-600 hover:bg-dark-500 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                        >
                          <ArrowLeftIcon className="w-5 h-5 inline mr-2" />
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || otp.length !== 6}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

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