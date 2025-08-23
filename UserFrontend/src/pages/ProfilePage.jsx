import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HiUser, 
  HiEnvelope, 
  HiCog6Tooth, 
  HiMoon,
  HiBell,
  HiLanguage,
  HiQuestionMarkCircle,
  HiArrowRightOnRectangle,
  HiChevronRight 
} from 'react-icons/hi2';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await logout();
    if (result.success) {
      navigate('/login');
    }
    setIsLoggingOut(false);
  };

  const settingsItems = [
    {
      icon: HiBell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      action: () => console.log('Notifications settings'),
    },
    {
      icon: HiMoon,
      label: 'Dark Mode',
      description: 'Always enabled for better navigation',
      action: () => console.log('Dark mode toggle'),
      disabled: true,
    },
    {
      icon: HiLanguage,
      label: 'Language',
      description: 'English (US)',
      action: () => console.log('Language settings'),
    },
    {
      icon: HiCog6Tooth,
      label: 'Preferences',
      description: 'Navigation and voice settings',
      action: () => console.log('Preferences'),
    },
    {
      icon: HiQuestionMarkCircle,
      label: 'Help & Support',
      description: 'FAQs and contact support',
      action: () => console.log('Help & Support'),
    },
  ];

  const navigationStats = [
    { label: 'Destinations Visited', value: '24', period: 'This month' },
    { label: 'QR Codes Scanned', value: '18', period: 'This week' },
    { label: 'Distance Navigated', value: '2.3km', period: 'Total' },
  ];

  return (
    <div className="container-app p-6 space-y-6">
      {/* Profile Header */}
      <div className="card-glass text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-button rounded-full flex items-center justify-center mx-auto">
          <HiUser className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-white">{user?.name || 'User'}</h2>
          <p className="text-gray-400 flex items-center justify-center mt-1">
            <HiEnvelope className="w-4 h-4 mr-2" />
            {user?.email}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {navigationStats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className="text-xs text-gray-500">{stat.period}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Settings</h3>
        
        <div className="space-y-2">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              disabled={item.disabled}
              className={`card w-full text-left hover:bg-white/15 transition-all duration-200 ${
                item.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </div>
                {!item.disabled && (
                  <HiChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="card bg-white/5">
        <h4 className="font-semibold text-white mb-3">App Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Version</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Build</span>
            <span className="text-white">2024.01.001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Updated</span>
            <span className="text-white">Jan 2024</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="btn btn-ghost w-full flex items-center justify-center space-x-2 text-red-400 border-red-400/30 hover:bg-red-500/10"
      >
        {isLoggingOut ? (
          <>
            <div className="loading-spinner"></div>
            <span>Signing Out...</span>
          </>
        ) : (
          <>
            <HiArrowRightOnRectangle className="w-5 h-5" />
            <span>Sign Out</span>
          </>
        )}
      </button>

      {/* Bottom Spacing for Navigation */}
      <div className="h-4"></div>
    </div>
  );
};

export default ProfilePage;
