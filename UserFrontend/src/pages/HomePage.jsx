import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import MapView from '../components/MapView';
import AIBot from '../components/AIBot';
import { useAuth } from '../contexts/AuthContext';
import {
  HiMapPin,
  HiQrCode,
  HiClock,
  HiArrowTopRightOnSquare,
  HiMagnifyingGlass
} from 'react-icons/hi2';

const HomePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentDestination, setCurrentDestination] = useState(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Utility function to get organization ID from localStorage
  const getStoredOrganizationId = async () => {
    const userId = 'user1234'; // Define the user ID
    const userQuery = 'I want to go to pukur'; // Define the query

    try {
      const orgId = localStorage.getItem('organizationId');
      const orgData = localStorage.getItem('organizationData');

      if (!orgId) {
        console.error('🚫 Organization ID not found in localStorage.');
        return null;
      }

      try {
        console.log('Sending API request...');
        const response = await fetch(
          `http://localhost:3000/api/bot/callbot/${orgId}/${userId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userquery: userQuery }),
          }
        );

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ API call successful. Received data:', data);

      } catch (apiError) {
        console.error('❌ Error calling the API:', apiError);
      }

      // Log the stored data after the API call, for verification
      console.log('📋 Retrieved organization ID from localStorage:', orgId);
      if (orgData) {
        const parsedData = JSON.parse(orgData);
        console.log('📋 Organization data from localStorage:', parsedData);
      }

      return orgId;

    } catch (error) {
      console.error('An unexpected error occurred:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check if we came from QR scan with location data
    console.log('HomePage location state:', location.state);

    // Always check for stored organization ID on page load
    const storedOrgId = getStoredOrganizationId();

    if (location.state?.scannedLocation) {
      console.log('QR scan data detected:', location.state.scannedLocation);

      // Log organization ID if present
      if (location.state?.organizationId) {
        console.log('🏢 Organization ID received on HomePage:', location.state.organizationId);
        console.log('🎯 ORGANIZATION ID:', location.state.organizationId);
      }

      setShowNavigation(location.state.showNavigation || false);
      // Simulate setting destination based on scanned QR
      setCurrentDestination([40.7130, -74.0058]);
    }

    // Log stored organization ID if available
    if (storedOrgId) {
      console.log('🎯 ORGANIZATION ID from localStorage:', storedOrgId);
    }
  }, [location.state]);

  const quickActions = [
    {
      icon: HiQrCode,
      label: 'Scan QR',
      description: 'Quick location scan',
      color: 'bg-blue-500',
      action: () => window.location.href = '/scan'
    },
    {
      icon: HiMapPin,
      label: 'Find Room',
      description: 'Search locations',
      color: 'bg-green-500',
      action: () => setSearchQuery('conference room')
    },
    {
      icon: HiArrowTopRightOnSquare,
      label: 'Navigate',
      description: 'Start navigation',
      color: 'bg-purple-500',
      action: () => setShowNavigation(true)
    },
  ];

  const recentDestinations = [
    { name: 'Conference Room A', time: '2 hours ago', floor: '2nd Floor' },
    { name: 'Cafeteria', time: 'Yesterday', floor: '1st Floor' },
    { name: 'Restroom', time: '3 hours ago', floor: '2nd Floor' },
  ];

  const handleSearch = (query) => {
    // Simulate search functionality
    console.log('Searching for:', query);
    // In a real app, this would search the building database
    setCurrentDestination([40.7132, -74.0056]);
    setShowNavigation(true);
  };

  return (
    <div className="container-app pb-6">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-400">Ready to navigate?</p>
          </div>
          <div className="w-12 h-12 bg-gradient-button rounded-full flex items-center justify-center">
            <span className="text-xl">👋</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <HiMagnifyingGlass
            className="h-5 w-5 text-gray-300 absolute left-3 top-1/2 transform -translate-y-1/2 z-10 pointer-events-none search-icon"
          />
          <input
            type="text"
            placeholder="Search for rooms, facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            className="input pl-12"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="card hover:bg-white/15 transition-all duration-200 text-center p-3"
            >
              <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-medium text-white text-sm">{action.label}</p>
              <p className="text-xs text-gray-400">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div className="px-6 mb-6" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Navigation</h2>
          {showNavigation && (
            <button
              onClick={() => setShowNavigation(false)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Clear Route
            </button>
          )}
        </div>

        <MapView
          destination={currentDestination}
          showNavigation={showNavigation}
        />
      </div>

      {/* Recent Destinations */}
      <div className="px-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Destinations</h2>
        <div className="space-y-3">
          {recentDestinations.map((dest, index) => (
            <div key={index} className="card hover:bg-white/15 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <HiMapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{dest.name}</p>
                    <p className="text-sm text-gray-400">{dest.floor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-xs text-gray-400 mb-1">
                    <HiClock className="w-3 h-3 mr-1" />
                    {dest.time}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentDestination([40.7130 + index * 0.0001, -74.0058]);
                      setShowNavigation(true);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Navigate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      {showNavigation && (
        <div className="fixed top-4 left-4 right-4 z-30">
          <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-lg border border-green-400/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-4 h-4 bg-green-400/50 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Navigation Active</p>
                <p className="text-xs text-green-100/90">Follow the blue path on the map</p>
              </div>
              <button
                onClick={() => setShowNavigation(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <span className="text-white text-sm font-medium">×</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bot */}
      <AIBot />
    </div>
  );
};

export default HomePage;
