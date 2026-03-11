import React from 'react';
import { Note } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { AtSign, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNodeSearch } from '../hooks/useNodeSearch';

interface MentionListOverlayProps {
  isVisible: boolean;
  query: string;
  allNotes: Note[];
  onInsertMention: (nodeId: string, nodeTitle: string) => void;
  onClose: () => void;
}

/**
 * MentionListOverlay component.
 * Displays a floating list of notes to mention when the user types '@'.
 */
export const MentionListOverlay: React.FC<MentionListOverlayProps> = ({
  isVisible,
  query,
  allNotes,
  onInsertMention,
  onClose
}) => {
  // Use the custom hook for debounced searching
  const filteredNotes = useNodeSearch(query, allNotes);

  if (!isVisible || filteredNotes.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-14 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-64 flex flex-col md:hidden"
      >
        <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
          <AtSign size={14} className="text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mention Note
          </span>
        </div>
        
        <div className="overflow-y-auto no-scrollbar">
          {filteredNotes.map((note) => {
            const parentNote = allNotes.find(n => n.id === note.parentId);
            
            return (
              <button
                key={note.id}
                onClick={() => onInsertMention(note.id, note.title)}
                className="w-full px-4 py-3 flex flex-col items-start gap-0.5 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors border-b border-slate-800/50 last:border-0 text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm font-medium text-slate-200 truncate flex-1">
                    {note.title || 'Untitled Note'}
                  </span>
                  <ChevronRight size={14} className="text-slate-600" />
                </div>
                {parentNote && (
                  <span className="text-[10px] text-slate-500 truncate">
                    in {parentNote.title || 'Untitled'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
