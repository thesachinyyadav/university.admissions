import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface Panel {
  panel_login: string;
  is_active: boolean;
  floors?: { floor_name: string };
}

export default function Home() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [showPanelSelector, setShowPanelSelector] = useState(false);
  const [stats, setStats] = useState({ candidates: 0, campuses: 0, panels: 0 });

  const roles = [
    {
      title: 'Master Admin',
      description: 'Configure panels & monitor systems',
      href: '/login?role=master_admin',
      accent: 'from-primary-500 to-primary-600',
    },
    {
      title: 'Volunteer',
      description: 'Scan QR and manage arrivals',
      href: '/login?role=volunteer',
      accent: 'from-tertiary-500 to-tertiary-600',
    },
    {
      title: 'Verification Staff',
      description: 'Validate documents and profiles',
      href: '/login?role=verification_staff',
      accent: 'from-emerald-500 to-emerald-600',
    },
  ];

  useEffect(() => {
    fetchActivePanels();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/public-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats', e);
    }
  };

  const fetchActivePanels = async () => {
    try {
      const response = await fetch('/api/panels/active-list');
      if (response.ok) {
        const data = await response.json();
        setPanels(data.panels || []);
      } else {
        console.log('Failed to fetch panels:', response.status);
        setPanels([]);
      }
    } catch (error) {
      console.log('Error fetching panels, setting empty array');
      setPanels([]);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-gray-900 text-white">
      <div className="container mx-auto px-3 py-4 sm:py-8 lg:py-10">
        {/* Compact hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-3 sm:gap-6 lg:grid-cols-[2fr,1fr] mb-6 sm:mb-10"
        >
          <div className="bg-white/10 border border-white/15 rounded-3xl p-4 sm:p-6 backdrop-blur-lg shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white rounded-lg p-2 sm:p-3 shadow-xl">
                  <Image src="/christunilogo.png" alt="Christ University" width={100} height={60} className="object-contain h-12 w-auto sm:h-[72px]" unoptimized />
                </div>
                <div>
                  <p className="uppercase text-[10px] sm:text-xs tracking-[0.35em] text-white/70">Office of Admissions</p>
                  <h1 className="text-2xl sm:text-3xl sm:text-4xl font-semibold">AUTH</h1>
                  <p className="text-xs sm:text-sm text-white/80">Interview and visitor orchestration platform</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-start sm:justify-end">
                <span className="text-[10px] sm:text-xs text-white/60">powered by</span>
                <Image src="/socio.png" alt="Socio" width={70} height={24} className="opacity-80 invert w-16 sm:w-20" unoptimized />
              </div>
            </div>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-white/90 leading-relaxed line-clamp-3 sm:line-clamp-none">
              A beautifully unified workspace that streamlines check-ins, document verification, and panel interviews so every candidate visits a calm, organized campus environment.
            </p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/visitor-register"
                className="inline-flex items-center justify-center rounded-xl sm:rounded-2xl bg-white text-primary-700 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold shadow-lg hover:shadow-primary-500/30 transition"
              >
                Visitor Self Registration
              </Link>
              <button
                onClick={() => setShowPanelSelector(true)}
                className="inline-flex items-center justify-center rounded-xl sm:rounded-2xl border border-white/40 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Interview Panel Access
              </button>
            </div>
                        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              {[
                { label: 'Campuses', value: stats.campuses.toString().padStart(2, '0'), accent: 'bg-white/10' },
                { label: 'Candidates', value: stats.candidates.toLocaleString(), accent: 'bg-white/5' },
                { label: 'Panels', value: stats.panels.toString().padStart(2, '0'), accent: 'bg-white/5' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl sm:rounded-2xl ${stat.accent} border border-white/10 py-2 sm:py-4`}> 
                  <p className="text-lg sm:text-2xl font-semibold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex bg-gradient-to-br from-tertiary-500/90 to-primary-500/80 rounded-3xl p-6 shadow-xl flex-col gap-6">
            <div>
              <p className="uppercase text-xs tracking-[0.35em] text-white/70">Today&apos;s focus</p>
              <h2 className="text-2xl font-semibold mt-2">Seamless lobby to panel handoff</h2>
              <p className="text-sm text-white/85 mt-3">
                Keep volunteers, verification teams, and interview panels aligned with live queues and instant updates.
              </p>
            </div>
            <div className="space-y-3">
              {['Smart lobby batching', 'Realtime verification insights', 'Panel-ready dossiers'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-semibold">{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Role grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-10"
        >
          {roles.map((role, index) => (
            <motion.div key={role.title} transition={{ delay: 0.15 * index }}>
              <Link href={role.href}>
                <div className="group h-full bg-white text-gray-900 rounded-2xl p-3 sm:p-5 shadow-xl hover:-translate-y-1 transition flex flex-col justify-between">
                  <div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${role.accent} text-white flex items-center justify-center mb-3 sm:mb-4`}> 
                      <span className="font-semibold text-base sm:text-lg">{role.title.charAt(0)}</span>
                    </div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-1 leading-tight">{role.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed hidden sm:block">{role.description}</p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-primary-600 flex items-center gap-1 mt-2 sm:mt-4">
                    Login
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                      <path d="M4 2l4 4-4 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
          <button
            onClick={() => setShowPanelSelector(true)}
            className="text-left bg-white/5 border border-white/15 rounded-2xl p-3 sm:p-5 hover:bg-white/10 transition flex flex-col justify-between"
          >
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/70 mb-1">Teams</p>
              <h3 className="text-sm sm:text-2xl font-semibold mt-0 sm:mt-2">Panel Login</h3>
              <p className="text-sm text-white/80 mt-2 hidden sm:block">
                Choose your assigned panel and start conducting interviews instantly.
              </p>
            </div>
            <span className="mt-2 sm:mt-4 inline-flex items-center text-[10px] sm:text-sm font-semibold">Select →</span>
          </button>
        </motion.section>

        {/* Process timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-4 sm:p-6 sm:p-8 text-gray-900 shadow-[0_20px_60px_rgba(15,23,42,0.35)] mb-6 sm:mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-500">Process Guide</p>
              <h3 className="text-lg sm:text-2xl font-semibold">Candidate journey</h3>
            </div>
            <Link href="/visitor-register" className="text-xs sm:text-sm font-semibold text-primary-600">
              View flow →
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 sm:grid sm:gap-4 sm:grid-cols-3 sm:pb-0 snap-x scrollbar-hide">
            {[
              {
                title: 'Arrival',
                description: 'Volunteers scan QR codes, tag walk-ins, and sync lobby batches.',
              },
              {
                title: 'Verification',
                description: 'Documents, portfolio, and assessments are validated instantly.',
              },
              {
                title: 'Interview',
                description: 'Panels receive curated dossiers and record decisions.',
              },
            ].map((step, idx) => (
              <div key={step.title} className="min-w-[200px] sm:min-w-0 snap-center rounded-2xl border border-gray-200 p-4 sm:p-5 flex-shrink-0">
                <span className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  {idx + 1}
                </span>
                <h4 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{step.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Single banner */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
        >
          <div className="relative h-40 sm:h-56 sm:h-72">
            <Image src="/banner3.jpg" alt="Admissions day" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-full sm:w-1/2 px-4 sm:px-6 sm:px-10 py-4 sm:py-6 flex flex-col justify-center">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/70">Campus spotlight</p>
              <h4 className="text-lg sm:text-2xl sm:text-3xl font-semibold mt-1 sm:mt-2">Interviews, orchestrated</h4>
              <p className="text-xs sm:text-sm text-white/85 mt-2 hidden sm:block">
                Real-time dashboards keep arrivals, verification, and panels in sync so candidates feel cared for from the first hello.
              </p>
            </div>
          </div>
        </motion.section>

        <div className="mt-6 sm:mt-10 text-center text-white/70 text-[10px] sm:text-xs">
          <p>© 2025 Christ University • Office of Admissions</p>
          <p className="mt-1 text-white/50">AUTH – Admissions Management Platform</p>
        </div>
      </div>

      {/* Panel Selector Modal */}
      <AnimatePresence>
        {showPanelSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPanelSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-tertiary-600 to-tertiary-700 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Select Interview Panel</h2>
                <p className="text-tertiary-100">Choose your panel to login</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {panels.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 text-lg mb-2">No active panels available</p>
                    <p className="text-gray-500 text-sm">Please contact the master admin to create interview panels</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {panels.map((panel) => (
                      <Link key={panel.panel_login} href={`/login?role=panel&panel=${panel.panel_login}`}>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200 hover:border-tertiary-500 hover:shadow-lg transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-tertiary-600 to-tertiary-700 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">{panel.panel_login}</h3>
                              {panel.floors && (
                                <p className="text-xs text-gray-600">{panel.floors.floor_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-xs text-green-600 font-medium">● Active</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <button
                  onClick={() => setShowPanelSelector(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
