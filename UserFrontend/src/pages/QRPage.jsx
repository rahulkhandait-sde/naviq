import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import { HiArrowLeft, HiCheckCircle } from 'react-icons/hi2';

const QRPage = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScanSuccess = (decodedText) => {
    console.log('QR scan successful:', decodedText);
    setScanResult(decodedText);
    setIsProcessing(true);

    // Simulate processing the QR code
    setTimeout(() => {
      setIsProcessing(false);
      console.log('Navigating to home with data:', {
        scannedLocation: decodedText,
        showNavigation: true 
      });
      // Navigate to home with the scanned location data
      navigate('/home', { 
        state: { 
          scannedLocation: decodedText,
          showNavigation: true 
        } 
      });
    }, 2000);
  };

  const handleScanError = (error) => {
    console.log('QR Scan Error:', error);
  };

  return (
    <div className="container-app p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Scan QR Code</h1>
        <div className="w-10 h-10"></div> {/* Spacer */}
      </div>

      {!scanResult && !isProcessing && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Find Your Location</h2>
            <p className="text-gray-400">
              Scan the QR code on the wall to get instant navigation directions
            </p>
          </div>

          <QRScanner 
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />

          <div className="card bg-white/5">
            <h3 className="font-semibold text-white mb-3">How to scan:</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                Look for QR codes on walls, doors, or information boards
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                Tap "Start Scanning" and point your camera at the QR code
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                Wait for the scan to complete and get instant directions
              </li>
            </ul>
          </div>
        </div>
      )}

      {scanResult && isProcessing && (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <HiCheckCircle className="w-12 h-12 text-green-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Scan Successful!</h2>
            <p className="text-gray-400">Processing your location...</p>
          </div>

          <div className="card-glass">
            <h3 className="font-semibold text-white mb-2">Location Found:</h3>
            <p className="text-gray-300 break-all">{scanResult}</p>
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div className="loading-spinner"></div>
            <p className="text-blue-400">Loading navigation...</p>
          </div>
        </div>
      )}

      {/* Alternative options */}
      {!scanResult && !isProcessing && (
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">Or</p>
          </div>

          <button
            onClick={() => {
              console.log('Skipping to home with navigation');
              navigate('/home', { 
                state: { 
                  scannedLocation: 'manual-location',
                  showNavigation: true 
                } 
              });
            }}
            className="btn btn-secondary w-full"
          >
            Skip to Map View
          </button>

          <button
            onClick={() => {
              // Simulate manual location selection
              setScanResult('Manual Location: Main Entrance');
              handleScanSuccess('location://main-entrance');
            }}
            className="btn btn-ghost w-full"
          >
            Use Current Location
          </button>
        </div>
      )}
    </div>
  );
};

export default QRPage;
