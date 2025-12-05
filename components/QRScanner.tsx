import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion } from 'framer-motion';

interface QRScannerProps {
  onScan: (visitorId: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScanRef = useRef<{ id: string; timestamp: number } | null>(null);
  const SCAN_COOLDOWN = 3000; // 3 seconds cooldown between same QR codes

  // Vibration feedback function
  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      // Pattern: vibrate for 200ms, pause 100ms, vibrate for 200ms
      navigator.vibrate([200, 100, 200]);
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Check if running on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
      if (!isSecureContext) {
        alert('⚠️ Camera requires HTTPS! Please use the deployed Vercel URL or localhost.');
        setCameraPermission('denied');
        return;
      }

      // Check if mediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('❌ Camera API not available in this browser. Please use Chrome, Firefox, or Safari.');
        setCameraPermission('denied');
        return;
      }

      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      
      console.log('✅ Camera access granted!');
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      setScannerActive(true); // Set this BEFORE initializing scanner
      initializeScanner();
    } catch (error: any) {
      console.error('❌ Camera error:', error);
      setCameraPermission('denied');
      
      let errorMessage = '';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '🚫 Camera access denied!\n\nPlease click the camera icon in your browser address bar and allow camera access.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = '📷 No camera found on this device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = '⚠️ Camera is being used by another application.\n\nPlease close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '⚙️ Camera constraints not supported. Trying again...';
        // Retry without constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setCameraPermission('granted');
          setScannerActive(true); // Set this BEFORE initializing scanner
          initializeScanner();
          return;
        } catch (retryError) {
          errorMessage = '❌ Camera initialization failed.';
        }
      } else if (error.name === 'SecurityError') {
        errorMessage = '🔒 Security error: Camera requires HTTPS!\n\nPlease deploy to Vercel or use localhost.';
      } else {
        errorMessage = `❌ Camera error: ${error.message || 'Unknown error'}\n\nPlease check browser settings.`;
      }
      
      alert(errorMessage);
    }
  };

  const initializeScanner = () => {
    if (scannerInitialized) return;

    // Wait for DOM element to be available
    setTimeout(() => {
      const element = document.getElementById('qr-reader');
      if (!element) {
        console.error('QR reader element not found, retrying...');
        setScannerActive(false);
        return;
      }

      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 30, // Increased FPS for faster scanning
            qrbox: { width: 280, height: 280 }, // Larger scan box
            aspectRatio: 1.0,
            disableFlip: false, // Allow flipped QR codes
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true // Use native browser barcode detector if available (much faster!)
            },
            rememberLastUsedCamera: true, // Remember camera preference
            showTorchButtonIfSupported: true // Show flashlight button if available
          },
          false
        );

        scanner.render(
          (decodedText) => {
            // Extract visitor ID from URL or use raw text
            const match = decodedText.match(/id=([a-f0-9-]+)/i);
            const visitorId = match ? match[1] : decodedText;
            
            // Check if this is a duplicate scan within cooldown period
            const now = Date.now();
            if (lastScanRef.current && 
                lastScanRef.current.id === visitorId && 
                now - lastScanRef.current.timestamp < SCAN_COOLDOWN) {
              console.log('⏱️ Duplicate scan ignored (cooldown active)');
              return; // Ignore duplicate scan
            }
            
            // Update last scan
            lastScanRef.current = { id: visitorId, timestamp: now };
            
            // Trigger vibration feedback
            triggerVibration();
            
            console.log('✅ QR code scanned:', visitorId);
            onScan(visitorId);
            // Don't clear scanner - keep it running for continuous scanning!
            // scanner.clear();
            // setScannerActive(false);
            // setScannerInitialized(false);
          },
          (error) => {
            // Ignore scanning errors - they're thrown constantly during scanning
          }
        );

        scannerRef.current = scanner;
        setScannerInitialized(true);
      } catch (error) {
        console.error('Error initializing scanner:', error);
        setScannerActive(false);
        alert('Failed to initialize camera scanner. Please try again.');
      }
    }, 100); // Small delay to ensure DOM is ready
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setScannerInitialized(false);
    setScannerActive(false);
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center space-x-3 mb-4">
          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg md:text-xl font-semibold text-gray-800">
            Scan QR Code
          </h3>
        </div>

        {!scannerActive && cameraPermission === 'prompt' && (
          <div className="text-center py-8">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-gray-600 mb-6 px-4">
              Camera access is required to scan visitor QR codes
            </p>
            <button
              onClick={requestCameraPermission}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg active:scale-95"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span className="text-lg">Enable Camera</span>
            </button>
          </div>
        )}

        {cameraPermission === 'denied' && (
          <div className="text-center py-8 bg-red-50 rounded-lg">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 font-medium mb-2">Camera Access Denied</p>
            <p className="text-sm text-gray-600 px-4">
              Please enable camera permissions in your browser settings to scan QR codes.
            </p>
          </div>
        )}

        {scannerActive && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Camera Active - Ready to Scan</span>
              </div>
              <button
                onClick={stopScanner}
                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded transition"
              >
                Stop Camera
              </button>
            </div>
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
          </>
        )}
      </motion.div>
  );
}
