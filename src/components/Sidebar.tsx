import React from 'react';
import { Note } from '../types';
import { ChevronRight, ChevronDown, FileText, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  notes: Note[];
  filteredNotes: Note[];
  isSearching: boolean;
  activeNoteId: string;
  onNoteSelect: (id: string) => void;
  onAddNote: (parentId: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ notes, filteredNotes, isSearching, activeNoteId, onNoteSelect, onAddNote }) => {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(['root']));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderFlatList = () => {
    return filteredNotes.map(note => {
      const isActive = activeNoteId === note.id;
      return (
        <div 
          key={note.id}
          className={cn(
            "group flex items-center py-2 px-3 cursor-pointer transition-colors rounded-md mx-2 my-0.5",
            isActive ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
          onClick={() => onNoteSelect(note.id)}
        >
          <FileText size={14} className="opacity-40 mr-2" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{note.title || "Untitled"}</p>
            <div className="flex gap-1 mt-1 overflow-x-hidden">
              {note.tags.map(t => (
                <span key={t} className="text-[8px] px-1 bg-slate-700 rounded text-slate-400">#{t}</span>
              ))}
            </div>
          </div>
        </div>
      );
    });
  };

  const renderTree = (parentId: string | null, depth = 0) => {
    const children = notes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
    
    return children.map(note => {
      const hasChildren = notes.some(n => n.parentId === note.id);
      const isExpanded = expandedIds.has(note.id);
      const isActive = activeNoteId === note.id;

      return (
        <div key={note.id} className="select-none">
          <div 
            className={cn(
              "group flex items-center py-1.5 px-3 cursor-pointer transition-colors rounded-md mx-2 my-0.5",
              isActive ? "bg-emerald-500/10 text-emerald-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
            onClick={() => onNoteSelect(note.id)}
          >
            <div 
              className="p-1 hover:bg-slate-700 rounded transition-colors"
              style={{ marginLeft: `${depth * 12}px` }}
              onClick={(e) => hasChildren && toggleExpand(note.id, e)}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : (
                <FileText size={14} className="opacity-40" />
              )}
            </div>
            <span className="ml-1 text-sm font-medium truncate flex-1">{note.title || "Untitled"}</span>
            <button 
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-emerald-400 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onAddNote(note.id);
                if (!expandedIds.has(note.id)) {
                  const newExpanded = new Set(expandedIds);
                  newExpanded.add(note.id);
                  setExpandedIds(newExpanded);
                }
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          {isExpanded && renderTree(note.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="w-64 h-full bg-brand-surface border-r border-slate-800 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
          <h1 className="font-bold text-white tracking-tight">Newturno1.0</h1>
        </div>
        <button 
          onClick={() => onAddNote(null)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <div className="px-4 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {isSearching ? `Search Results (${filteredNotes.length})` : 'Knowledge Base'}
          </span>
          {!isSearching && (
            <button 
              onClick={() => setExpandedIds(new Set())}
              className="text-[10px] font-bold text-slate-600 hover:text-emerald-500 uppercase tracking-widest transition-colors"
            >
              Collapse All
            </button>
          )}
        </div>
        {isSearching ? renderFlatList() : renderTree(null)}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Abulfajal Rana</p>
            <p className="text-[10px] text-slate-500 truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};
