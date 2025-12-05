import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PWAInstallPrompt({ onInstall, onDismiss }: PWAInstallPromptProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg">
                <Image
                  src="/christunifavcion.png"
                  alt="Christ University"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Install App</h3>
                <p className="text-sm text-white/90">Quick access to campus entry</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Install Christ University Access
            </h4>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              Add this app to your home screen for quick and easy access to campus entry management. 
              Works offline and provides instant access to your QR codes.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Instant Access</p>
                  <p className="text-xs text-gray-600">Launch directly from home screen</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Offline Support</p>
                  <p className="text-xs text-gray-600">Access your QR codes without internet</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Fast & Lightweight</p>
                  <p className="text-xs text-gray-600">Optimized for mobile devices</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onInstall}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Install Now</span>
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors active:scale-95"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
