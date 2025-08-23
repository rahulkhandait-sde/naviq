import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { HiMapPin, HiArrowTopRightOnSquare } from 'react-icons/hi2';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView = ({ destination, currentLocation, showNavigation = false }) => {
  const [userLocation, setUserLocation] = useState(currentLocation || [40.7128, -74.0060]); // Default to NYC
  const [isLoading, setIsLoading] = useState(false);

  // Dummy indoor navigation data
  const dummyDestination = destination || [40.7130, -74.0058];
  const dummyPath = [
    [40.7128, -74.0060],
    [40.7129, -74.0059],
    [40.7130, -74.0058],
  ];

  useEffect(() => {
    // Simulate getting user location
    if (!currentLocation) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setUserLocation([40.7128, -74.0060]);
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLocation]);

  const customIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5QzkuNSA3LjYyIDEwLjYyIDYuNSAxMiA2LjVDMTMuMzggNi41IDE0LjUgNy42MiAxNC41IDlDMTQuNSAxMC4zOCAxMy4zOCAxMS41IDEyIDExLjVaIiBmaWxsPSIjM0I4MkY2Ii8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  if (isLoading) {
    return (
      <div className="map-container flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-gray-300">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showNavigation && (
        <div className="card flex items-center space-x-3">
          <HiArrowTopRightOnSquare className="w-6 h-6 text-blue-400" />
          <div>
            <p className="font-medium text-white">Navigate to Destination</p>
            <p className="text-sm text-gray-400">Estimated time: 3 minutes</p>
          </div>
        </div>
      )}

      <div className="map-container h-96" style={{ position: 'relative', zIndex: 1 }}>
        <MapContainer
          center={userLocation}
          zoom={18}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="rounded-xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          <Marker position={userLocation} icon={customIcon}>
            <Popup>
              <div className="text-center">
                <HiMapPin className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>

          {/* Destination marker */}
          {destination && (
            <Marker position={dummyDestination}>
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Destination</p>
                  <p className="text-sm text-gray-600">Conference Room A</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Navigation path */}
          {showNavigation && (
            <Polyline
              positions={dummyPath}
              color="#3B82F6"
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          )}
        </MapContainer>
      </div>

      {showNavigation && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">150m</p>
            <p className="text-xs text-gray-400">Distance</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-400">3min</p>
            <p className="text-xs text-gray-400">Time</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">2</p>
            <p className="text-xs text-gray-400">Turns</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
