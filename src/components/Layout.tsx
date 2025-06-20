import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="glass-effect border-b border-dark-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">SpeakNote</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-purple-400 bg-purple-900/20'
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-white font-medium">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-dark-300">
                  {user?.email}
                </p>
              </div>
              
              <button
                onClick={logout}
                className="text-dark-300 hover:text-white transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-2 sm:px-4 py-4 w-full max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 z-50">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center p-2 rounded-md transition-colors ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-dark-300 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout; 