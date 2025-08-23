import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { HiCamera, HiXMark, HiQrCode } from 'react-icons/hi2';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [cameras, setCameras] = useState([]);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    // Check camera permission and get camera list on mount
    initializeCamera();
    
    return () => {
      // Cleanup scanner on unmount
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(console.error);
      }
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      console.log('Initializing camera...');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission('not-supported');
        setError('Camera not supported on this browser');
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera permission granted');
      setCameraPermission('granted');
      
      // Stop the stream since we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
      
      // Get available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices);
        setCameras(devices);
      } catch (cameraError) {
        console.log('Could not get camera list, using fallback:', cameraError);
        setCameras([{ id: 'default', label: 'Default Camera' }]);
      }
      
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraPermission('denied');
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const startScanning = async () => {
    console.log('Starting QR scanner...');
    setIsInitializing(true);
    setError(null);

    try {
      if (cameras.length === 0) {
        throw new Error('No cameras available');
      }

      // Clean up any existing scanners first
      await cleanupScanners();

      // Set scanning state first to render the qr-reader element
      setIsScanning(true);
      
      // Wait a moment for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if element exists now
      const container = document.getElementById('qr-reader');
      if (!container) {
        throw new Error('QR reader container not found in DOM');
      }

      // Try method 1: Html5Qrcode with camera ID
      await tryHtml5QrcodeMethod();
      
    } catch (err) {
      console.error('Html5Qrcode method failed, trying Html5QrcodeScanner:', err);
      
      // Fallback method 2: Html5QrcodeScanner
      try {
        await tryHtml5QrcodeScannerMethod();
      } catch (scannerErr) {
        console.error('All scanner methods failed:', scannerErr);
        
        let errorMsg = 'Failed to start camera';
        if (err.message && err.message !== 'undefined') {
          errorMsg = `Camera error: ${err.message}`;
        } else {
          errorMsg = 'Camera initialization failed. Please try again or use simulation.';
        }
        
        setError(errorMsg);
        setIsScanning(false);
        setIsInitializing(false);
      }
    }
  };

  const cleanupScanners = async () => {
    // Clean up any existing scanners
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (error) {
        console.log('Previous Html5Qrcode scanner already stopped:', error.message);
      }
      html5QrcodeRef.current = null;
    }

    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.clear();
      } catch (error) {
        console.log('Previous Html5QrcodeScanner already cleared:', error.message);
      }
      html5QrcodeScannerRef.current = null;
    }

    // Clear the container if it exists
    const container = document.getElementById('qr-reader');
    if (container) {
      container.innerHTML = '';
    }
  };

  const tryHtml5QrcodeMethod = async () => {
    console.log('Trying Html5Qrcode method...');
    
    // Try back camera first, then front camera
    let cameraId = cameras.find(camera => 
      camera.label.toLowerCase().includes('back') || 
      camera.label.toLowerCase().includes('rear') ||
      camera.label.toLowerCase().includes('environment')
    )?.id || cameras[0].id;

    console.log('Using camera:', cameraId, 'from available cameras:', cameras);

    html5QrcodeRef.current = new Html5Qrcode("qr-reader");
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    console.log('Starting camera with Html5Qrcode and config:', config);
    
    try {
      // First try with specific camera ID
      await html5QrcodeRef.current.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          setScanResult(decodedText);
          stopScanning();
          onScanSuccess?.(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Ignore frequent scanning errors
          console.log('Scan error:', errorMessage);
          onScanError?.(errorMessage);
        }
      );
    } catch (cameraError) {
      console.log('Failed with camera ID, trying with constraints:', cameraError);
      
      // Fallback: try with video constraints instead of camera ID
      await html5QrcodeRef.current.start(
        { facingMode: "environment" }, // Try back camera
        config,
        (decodedText, decodedResult) => {
          console.log('QR Code scanned:', decodedText);
          setScanResult(decodedText);
          stopScanning();
          onScanSuccess?.(decodedText, decodedResult);
        },
        (errorMessage) => {
          console.log('Scan error:', errorMessage);
          onScanError?.(errorMessage);
        }
      );
    }
    
    console.log('Html5Qrcode started successfully');
    setIsInitializing(false);
  };

  const tryHtml5QrcodeScannerMethod = async () => {
    console.log('Trying Html5QrcodeScanner method...');
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: false,
      showZoomSliderIfSupported: false,
      showHideCameraButton: false,
      videoConstraints: {
        facingMode: "environment"
      }
    };

    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    html5QrcodeScannerRef.current.render(
      (decodedText, decodedResult) => {
        console.log('QR Code scanned with scanner:', decodedText);
        setScanResult(decodedText);
        stopScanning();
        onScanSuccess?.(decodedText, decodedResult);
      },
      (errorMessage) => {
        console.log('Scanner scan error:', errorMessage);
        onScanError?.(errorMessage);
      }
    );
    
    console.log('Html5QrcodeScanner started successfully');
    setIsInitializing(false);
  };

  const stopScanning = async () => {
    console.log('Stopping scanner...');
    await cleanupScanners();
    setIsScanning(false);
    setIsInitializing(false);
    setError(null);
  };

  const simulateQRScan = () => {
    const mockQRData = 'location://conference-room-a-floor-2';
    setScanResult(mockQRData);
    onScanSuccess?.(mockQRData, { text: mockQRData });
  };

  const retryPermissions = async () => {
    setError(null);
    setCameraPermission('pending');
    await initializeCamera();
  };

  return (
    <div className="qr-scanner-container">
      {!isScanning && !scanResult && (
        <div className="text-center space-y-6">
          <div className="w-64 h-64 mx-auto bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
            <div className="text-center space-y-4">
              <HiCamera className="w-16 h-16 mx-auto text-blue-400" />
              <p className="text-gray-300">Ready to scan QR code</p>
              {cameras.length > 0 && (
                <p className="text-xs text-gray-400">
                  {cameras.length} camera(s) detected
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {cameraPermission === 'pending' && (
              <div className="card bg-yellow-500/10 border-yellow-500/20">
                <p className="text-yellow-400 text-sm">Checking camera permissions...</p>
              </div>
            )}
            
            {cameraPermission === 'granted' && cameras.length > 0 && !isInitializing && (
              <button
                onClick={startScanning}
                className="btn btn-primary w-full max-w-xs mx-auto block"
              >
                <HiCamera className="w-5 h-5 mr-2 inline" />
                Start Camera Scan
              </button>
            )}
            
            {isInitializing && (
              <div className="card bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-blue-400 text-sm">Starting camera...</p>
                </div>
              </div>
            )}
            
            {(cameraPermission === 'denied' || cameraPermission === 'not-supported' || cameras.length === 0) && !isInitializing && (
              <button
                onClick={retryPermissions}
                className="btn btn-secondary w-full max-w-xs mx-auto block"
              >
                <HiCamera className="w-5 h-5 mr-2 inline" />
                Retry Camera Access
              </button>
            )}
            
            {/* Simulation button for testing */}
            <button
              onClick={simulateQRScan}
              className="btn btn-secondary w-full max-w-xs mx-auto block"
            >
              <HiQrCode className="w-5 h-5 mr-2 inline" />
              Simulate QR Scan
            </button>
          </div>

          {error && (
            <div className="card bg-red-500/10 border-red-500/20 space-y-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              {cameraPermission === 'denied' && (
                <div className="text-xs text-gray-300 space-y-2">
                  <p className="font-medium">Troubleshooting steps:</p>
                  <div className="space-y-1">
                    <p><strong>Chrome/Edge:</strong></p>
                    <p>• Click the camera icon in address bar</p>
                    <p>• Select "Always allow" for camera</p>
                    <p>• Refresh the page</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Firefox:</strong></p>
                    <p>• Click the shield icon in address bar</p>
                    <p>• Enable camera permissions</p>
                    <p>• Refresh the page</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Safari:</strong></p>
                    <p>• Go to Settings → Privacy &amp; Security</p>
                    <p>• Enable camera for this website</p>
                    <p>• Refresh the page</p>
                  </div>
                  <p className="text-yellow-400 mt-2">
                    <strong>Alternative:</strong> Use the "Simulate QR Scan" button below to test the app functionality.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div className="relative">
            <div id="qr-reader" ref={scannerRef} className="w-full"></div>
            
            {/* Custom overlay for better UI */}
            <div className="qr-scanner-overlay">
              <div className="qr-scanner-corners top-left"></div>
              <div className="qr-scanner-corners top-right"></div>
              <div className="qr-scanner-corners bottom-left"></div>
              <div className="qr-scanner-corners bottom-right"></div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-300">Position QR code within the frame</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={stopScanning}
                className="btn btn-ghost"
              >
                <HiXMark className="w-5 h-5 mr-2 inline" />
                Cancel
              </button>
              
              <button
                onClick={simulateQRScan}
                className="btn btn-secondary"
              >
                <HiQrCode className="w-5 h-5 mr-2 inline" />
                Use Demo QR
              </button>
            </div>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="text-center space-y-4">
          <div className="card-glass">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Scan Successful!
            </h3>
            <p className="text-gray-300 break-all">{scanResult}</p>
          </div>
          
          <button
            onClick={() => {
              setScanResult(null);
              setError(null);
            }}
            className="btn btn-secondary"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
