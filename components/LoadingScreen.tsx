import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-tertiary-50">
      <div className="text-center flex-1 flex flex-col items-center justify-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
          className="mb-8"
        >
          <div className="relative w-32 h-32 mx-auto">
            <Image
              src="/christunilogo.png"
              alt="Christ University Logo"
              width={128}
              height={128}
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2,
            ease: "easeOut"
          }}
        >
          <h1 className="text-4xl font-bold text-primary-600 mb-2 tracking-tight">
            AUTH
          </h1>
          <p className="text-sm text-gray-600 font-medium">
            University Access Management
          </p>
        </motion.div>

        {/* Animated Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.4
          }}
          className="mt-8"
        >
          {/* Pulse Animation */}
          <div className="flex justify-center space-x-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-3 h-3 bg-primary-600 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
              className="w-3 h-3 bg-primary-600 rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
              className="w-3 h-3 bg-primary-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6
          }}
          className="mt-4 text-xs text-gray-500"
        >
          Loading...
        </motion.p>
      </div>

      {/* Powered by Socio - Fixed at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: 0.1,
          ease: "easeOut"
        }}
        className="pb-8"
      >
        <p className="text-xs text-gray-400 mb-2 text-center">Powered by</p>
        <Image
          src="/socio.png"
          alt="Socio"
          width={100}
          height={38}
          className="object-contain opacity-80 hover:opacity-100 transition-opacity"
          priority
          unoptimized
        />
      </motion.div>
    </div>
  );
}
