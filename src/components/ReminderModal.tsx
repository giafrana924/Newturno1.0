import React, { useState } from 'react';
import { X, Bell, Calendar, Clock as ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timestamp: number | null) => void;
  initialTime?: number;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTime
}) => {
  const [date, setDate] = useState(initialTime ? new Date(initialTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialTime ? new Date(initialTime).toTimeString().slice(0, 5) : new Date(Date.now() + 3600000).toTimeString().slice(0, 5));

  if (!isOpen) return null;

  const handleSave = () => {
    const combined = new Date(`${date}T${time}`);
    onSave(combined.getTime());
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Bell size={20} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Set Alarm</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} />
                  Date
                </label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ClockIcon size={12} />
                  Time
                </label>
                <input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Save Alarm
                </button>
              </div>
              {initialTime && (
                <button
                  onClick={handleClear}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors"
                >
                  Clear Alarm
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
