import React, { useEffect, useState } from 'react';
import { Note } from '../types';
import { Bell, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderSystemProps {
  notes: Note[];
  onDismiss: (id: string) => void;
  onNavigate: (id: string) => void;
}

export const ReminderSystem: React.FC<ReminderSystemProps> = ({
  notes,
  onDismiss,
  onNavigate
}) => {
  const [activeReminder, setActiveReminder] = useState<Note | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      const triggered = notes.find(n => 
        n.reminderAt && 
        n.reminderAt <= now && 
        !n.reminderDismissed
      );

      if (triggered && !activeReminder) {
        setActiveReminder(triggered);
        // Play a subtle sound if possible
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play();
        } catch (e) {
          console.log('Audio play failed', e);
        }
      }
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [notes, activeReminder]);

  const handleDismiss = () => {
    if (activeReminder) {
      onDismiss(activeReminder.id);
      setActiveReminder(null);
    }
  };

  const handleGoTo = () => {
    if (activeReminder) {
      onNavigate(activeReminder.id);
      setActiveReminder(null);
    }
  };

  return (
    <AnimatePresence>
      {activeReminder && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto ring-4 ring-emerald-500/10"
          >
            <div className="p-5 flex items-start gap-4">
              <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 animate-pulse">
                <Bell size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Alarm Triggered</h4>
                <p className="text-white font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: activeReminder.title }} />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleGoTo}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors"
                  >
                    View Note
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={12} /> Dismiss
                  </button>
                </div>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
