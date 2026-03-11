import React from 'react';
import { Note } from '../types';
import { ChevronRight, ChevronDown, FileText, CornerDownRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface RecursiveNoteTreeProps {
  notes: Note[];
  parentId: string;
  onNavigate: (id: string) => void;
  depth?: number;
}

export const RecursiveNoteTree: React.FC<RecursiveNoteTreeProps> = ({ 
  notes, 
  parentId, 
  onNavigate, 
  depth = 0 
}) => {
  const children = notes
    .filter(n => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);

  if (children.length === 0) return null;

  return (
    <div className={cn("flex flex-col", depth > 0 && "ml-4 border-l border-slate-800/50 pl-2")}>
      {children.map(note => (
        <div key={note.id} className="group">
          <div 
            onClick={() => onNavigate(note.id)}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-all group"
          >
            <div className="text-slate-600 group-hover:text-emerald-500 transition-colors">
              <CornerDownRight size={12} />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate">
              {note.title}
            </span>
          </div>
          <RecursiveNoteTree 
            notes={notes} 
            parentId={note.id} 
            onNavigate={onNavigate} 
            depth={depth + 1} 
          />
        </div>
      ))}
    </div>
  );
};
