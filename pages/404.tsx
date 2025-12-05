import { motion } from 'framer-motion';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Custom404() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const messages = [
    "This page doesn't exist. Maybe it never registered for entry?",
    "404: This URL isn't on our guest list.",
    "Lost? Even our QR scanner couldn't find this page.",
    "Wrong turn. This page took an unauthorized exit.",
    "Page not found. Did you scan the right QR code?",
  ];

  const [message] = useState(messages[Math.floor(Math.random() * messages.length)]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Alert Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </motion.div>

          {/* 404 Text */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-8xl sm:text-9xl font-bold text-white mb-4"
          >
            404
          </motion.h1>

          {/* Error message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-white">
              Page Not Found
            </h2>
            <p className="text-lg text-slate-400 max-w-md mx-auto">
              {message}
            </p>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <p className="text-slate-500 text-sm">
              Redirecting to home in <span className="text-indigo-400 font-semibold">{countdown}</span> seconds
            </p>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </button>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          </motion.div>

          {/* Powered by Socio */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-16 flex items-center justify-center space-x-2"
          >
            <span className="text-slate-400 text-sm">Powered by</span>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <Image 
                src="/socio.png" 
                alt="Socio" 
                width={80}
                height={24}
                className="h-6 object-contain"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
