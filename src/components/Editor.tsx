import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Note } from '../types';
import { 
  Maximize2, 
  Minimize2, 
  Eye, 
  Edit3, 
  Hash, 
  Clock, 
  Tag, 
  Image as ImageIcon, 
  Copy, 
  Trash2, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Calendar,
  SortAsc,
  Filter,
  MoreVertical,
  Plus,
  Bell,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ImageEditor } from './ImageEditor';
import { RecursiveNoteTree } from './RecursiveNoteTree';
import { MobileOutlinerToolbar } from './MobileOutlinerToolbar';
import { ReminderModal } from './ReminderModal';
import { MentionListOverlay } from './MentionListOverlay';
import { useRichText } from '../contexts/RichTextContext';

interface EditorProps {
  note: Note;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  allNotes: Note[];
  onNavigate: (id: string) => void;
  onDelete?: (id: string) => Promise<string | null>;
  onDuplicate?: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onEnter?: (id: string) => Promise<string | null>;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onAddNote?: (parentId: string | null) => void;
}

const BulletBlock: React.FC<{
  note: Note;
  allNotes: Note[];
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onNavigate: (id: string) => void;
  onEnter: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  depth: number;
  focusedBulletId: string | null;
  setFocusedBulletId: (id: string | null) => void;
  setIsFocused: (focused: boolean) => void;
}> = ({
  note,
  allNotes,
  onUpdate,
  onNavigate,
  onEnter,
  onDelete,
  onIndent,
  onOutdent,
  onMoveUp,
  onMoveDown,
  isFocused,
  onFocus,
  depth,
  focusedBulletId,
  setFocusedBulletId,
  setIsFocused
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { registerInput } = useRichText();
  const children = allNotes
    .filter(n => n.parentId === note.id)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused]);

  // Sync content from props if not focused or if content changed externally
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== note.title) {
      // Only update if not focused (external change)
      if (document.activeElement !== contentRef.current) {
        contentRef.current.innerHTML = note.title;
      }
    }
  }, [note.title]);

  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(note.id, { isCollapsed: !note.isCollapsed });
  };

  return (
    <div className="relative">
      {/* Indentation Line */}
      {depth > 0 && (
        <div 
          className="absolute left-[-17px] top-0 bottom-0 w-px bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors"
          style={{ left: '-13px' }}
        />
      )}
      
      <div className="flex items-start gap-1 group py-0.5">
        {/* Collapse/Expand Toggle */}
        <div className="w-5 h-8 flex items-center justify-center shrink-0">
          {children.length > 0 && (
            <button 
              onClick={toggleCollapse}
              className="p-0.5 hover:bg-slate-800 rounded transition-colors text-slate-600 hover:text-emerald-500"
            >
              {note.isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div 
          className="mt-3 text-slate-600 group-hover:text-emerald-500 transition-colors cursor-pointer flex-shrink-0" 
          onClick={() => onNavigate(note.id)}
        >
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-all",
            depth === 0 ? "bg-orange-500 scale-125 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : 
            depth === 1 ? "bg-blue-400 scale-110 shadow-[0_0_8px_rgba(96,165,250,0.3)]" :
            children.length > 0 ? "bg-emerald-500 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-current"
          )} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          <div
            ref={contentRef}
            contentEditable
            onInput={(e) => onUpdate(note.id, { title: e.currentTarget.innerHTML })}
            onFocus={onFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEnter(note.id);
              } else if (e.key === 'Backspace' && (contentRef.current?.innerText === '' || contentRef.current?.innerHTML === '<br>')) {
                e.preventDefault();
                onDelete(note.id);
              } else if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                  onOutdent(note.id);
                } else {
                  onIndent(note.id);
                }
              } else if (e.key === 'ArrowUp' && e.altKey) {
                e.preventDefault();
                onMoveUp(note.id);
              } else if (e.key === 'ArrowDown' && e.altKey) {
                e.preventDefault();
                onMoveDown(note.id);
              }
            }}
            className={cn(
              "w-full bg-transparent border-none outline-none py-1 text-base placeholder:empty:before:content-[attr(data-placeholder)] placeholder:empty:before:text-slate-700 font-sans min-h-[1.5em]",
              depth === 0 ? "text-orange-400 font-bold text-lg" : 
              depth === 1 ? "text-blue-300 font-medium" : 
              "text-slate-300"
            )}
            data-placeholder="Bullet point..."
          />
          
          {/* Metadata Badges */}
          {(note.startDate || note.endDate || note.tags.length > 0 || note.reminderAt) && (
            <div className="flex flex-wrap gap-2 pb-1">
              {note.reminderAt && (
                <div className={cn(
                  "flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors",
                  note.reminderDismissed 
                    ? "text-slate-500 bg-slate-800/30 border-slate-800/50" 
                    : "text-orange-400 bg-orange-500/5 border-orange-500/10 animate-pulse"
                )}>
                  <Bell size={10} />
                  {new Date(note.reminderAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {(note.startDate || note.endDate) && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/30 px-1.5 py-0.5 rounded border border-slate-800/50">
                  <Calendar size={10} />
                  {note.startDate && new Date(note.startDate).toLocaleDateString()}
                  {note.endDate && ` - ${new Date(note.endDate).toLocaleDateString()}`}
                </div>
              )}
              {note.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70 bg-emerald-500/5 px-1 rounded border border-emerald-500/10">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recursive Children */}
      {children.length > 0 && !note.isCollapsed && (
        <div className="ml-8 border-l border-transparent">
          {children.map(child => (
            <BulletBlock
              key={child.id}
              note={child}
              allNotes={allNotes}
              onUpdate={onUpdate}
              onNavigate={onNavigate}
              onEnter={onEnter}
              onDelete={onDelete}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              isFocused={focusedBulletId === child.id}
              onFocus={() => {
                setFocusedBulletId(child.id);
                setIsFocused(true);
              }}
              depth={depth + 1}
              focusedBulletId={focusedBulletId}
              setFocusedBulletId={setFocusedBulletId}
              setIsFocused={setIsFocused}
            />
          ))}
        </div>
      )}
    </div>
  );
};
  
  export const Editor: React.FC<EditorProps> = ({ 
    note, 
    onUpdate, 
    allNotes, 
    onNavigate, 
    onDelete, 
    onDuplicate,
    onIndent,
    onOutdent,
    onEnter,
    onMoveUp,
    onMoveDown,
    onAddNote
  }) => {
    const [isEditing, setIsEditing] = useState(true);
    const [title, setTitle] = useState(note.title);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [focusedBulletId, setFocusedBulletId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'order' | 'updatedAt' | 'title' | 'size'>('order');
    const [showMeta, setShowMeta] = useState(false);
    const { setActiveNoteId, applyFormat, insertText } = useRichText();
  
    const children = allNotes
      .filter(n => n.parentId === note.id)
      .sort((a, b) => {
        if (sortBy === 'order') return a.order - b.order;
        if (sortBy === 'updatedAt') return b.updatedAt - a.updatedAt;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'size') {
          const aSize = allNotes.filter(n => n.parentId === a.id).length;
          const bSize = allNotes.filter(n => n.parentId === b.id).length;
          return bSize - aSize;
        }
        return 0;
      });
  
    useEffect(() => {
      setActiveNoteId(note.id);
      return () => setActiveNoteId(null);
    }, [note.id, setActiveNoteId]);
  
    useEffect(() => {
      setTitle(note.title);
    }, [note.id]);
  
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      onUpdate(note.id, { title: newTitle, updatedAt: Date.now() });
    };
  
    const targetId = focusedBulletId || note.id;
    const targetNote = allNotes.find(n => n.id === targetId) || note;
    const canOutdent = targetNote.parentId !== null;
    const canIndent = allNotes.some(n => n.parentId === targetNote.parentId && n.order < targetNote.order);
  
    const insertImage = (base64: string) => {
      console.log("Image inserted:", base64);
      setShowImageEditor(false);
    };
  
    const getBreadcrumbs = (noteId: string): Note[] => {
      const path: Note[] = [];
      let current = allNotes.find(n => n.id === noteId);
      while (current) {
        path.unshift(current);
        current = allNotes.find(n => n.id === current?.parentId);
      }
      return path;
    };
  
    const breadcrumbs = getBreadcrumbs(note.id);
  
    const handleBulletEnter = async (id: string) => {
      if (onEnter) {
        const nextId = await onEnter(id);
        if (nextId) setFocusedBulletId(nextId);
      }
    };

    const handleBulletDelete = async (id: string) => {
      if (onDelete) {
        const prevId = await onDelete(id);
        if (prevId) setFocusedBulletId(prevId);
      }
    };

    const toggleAllCollapse = (collapsed: boolean) => {
      children.forEach(child => {
        onUpdate(child.id, { isCollapsed: collapsed });
      });
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-brand-bg">
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 lg:p-16">
            <div className="max-w-3xl mx-auto">
              {note.parentId && (
                <button 
                  onClick={() => onNavigate(note.parentId!)}
                  className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors mb-4 group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
                </button>
              )}
              
              <div className="flex items-center justify-between mb-8">
                <input
                  value={title}
                  onChange={handleTitleChange}
                  className="flex-1 bg-transparent border-none outline-none text-4xl font-bold text-white placeholder:text-slate-800"
                  placeholder="Untitled Note"
                />
                {note.reminderAt && (
                  <button 
                    onClick={() => setShowReminderModal(true)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                      note.reminderDismissed 
                        ? "text-slate-500 bg-slate-900/50 border-slate-800" 
                        : "text-orange-400 bg-orange-500/10 border-orange-500/20 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                    )}
                  >
                    <Bell size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {new Date(note.reminderAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                )}
              </div>

              <div className="space-y-0">
                {children.map(child => (
                  <BulletBlock
                    key={child.id}
                    note={child}
                    allNotes={allNotes}
                    onUpdate={onUpdate}
                    onNavigate={onNavigate}
                    onEnter={handleBulletEnter}
                    onDelete={handleBulletDelete}
                    onIndent={onIndent}
                    onOutdent={onOutdent}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    isFocused={focusedBulletId === child.id}
                    onFocus={() => {
                      setFocusedBulletId(child.id);
                      setIsFocused(true);
                    }}
                    depth={0}
                    focusedBulletId={focusedBulletId}
                    setFocusedBulletId={setFocusedBulletId}
                    setIsFocused={setIsFocused}
                  />
                ))}
                {children.length === 0 && (
                  <button 
                    onClick={() => onAddNote?.(note.id)}
                    className="text-slate-600 hover:text-emerald-500 text-sm italic transition-colors py-4 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add your first bullet point...
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      <AnimatePresence>
        {showImageEditor && (
          <ImageEditor 
            onComplete={insertImage}
            onCancel={() => setShowImageEditor(false)}
          />
        )}
      </AnimatePresence>

      <ReminderModal 
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        onSave={(timestamp) => {
          const targetId = focusedBulletId || note.id;
          if (timestamp === null) {
            onUpdate(targetId, { reminderAt: undefined, reminderDismissed: undefined });
          } else {
            onUpdate(targetId, { reminderAt: timestamp, reminderDismissed: false });
          }
        }}
        initialTime={focusedBulletId ? allNotes.find(n => n.id === focusedBulletId)?.reminderAt : note.reminderAt}
      />

      <MobileOutlinerToolbar 
        isVisible={isEditing}
        onIndent={() => {
          if (focusedBulletId) onIndent?.(focusedBulletId);
          else onIndent?.(note.id);
        }}
        onOutdent={() => {
          if (focusedBulletId) onOutdent?.(focusedBulletId);
          else onOutdent?.(note.id);
        }}
        canIndent={canIndent}
        canOutdent={canOutdent}
        onHideKeyboard={() => setIsFocused(false)}
        onFormat={(type, value) => {
          if (type === 'bold') document.execCommand('bold');
          else if (type === 'italic') document.execCommand('italic');
          else if (type === 'underline') document.execCommand('underline');
          else if (type === 'color') document.execCommand('foreColor', false, value);
          else if (type === 'highlight') document.execCommand('backColor', false, value);
        }}
        onInsertTimestamp={() => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          document.execCommand('insertText', false, ` ${timeStr} `);
        }}
        onInsertDate={() => {
          const now = new Date();
          const dateStr = now.toLocaleDateString();
          document.execCommand('insertText', false, ` ${dateStr} `);
        }}
        onInsertMedia={() => setShowImageEditor(true)}
        onSetReminder={() => setShowReminderModal(true)}
        onToggleTask={() => {
          if (!focusedBulletId) return;
          const targetNote = allNotes.find(n => n.id === focusedBulletId);
          if (!targetNote) return;
          
          let newTitle = targetNote.title;
          if (newTitle.startsWith('[ ] ')) {
            newTitle = newTitle.replace('[ ] ', '[x] ');
          } else if (newTitle.startsWith('[x] ')) {
            newTitle = newTitle.replace('[x] ', '');
          } else {
            newTitle = '[ ] ' + newTitle;
          }
          onUpdate(focusedBulletId, { title: newTitle });
        }}
        onMention={() => {
          if (!focusedBulletId) return;
          const targetNote = allNotes.find(n => n.id === focusedBulletId);
          if (!targetNote) return;
          onUpdate(focusedBulletId, { title: targetNote.title + '@' });
        }}
        onTag={() => {
          if (!focusedBulletId) return;
          const targetNote = allNotes.find(n => n.id === focusedBulletId);
          if (!targetNote) return;
          onUpdate(focusedBulletId, { title: targetNote.title + '#' });
        }}
        onUndo={() => document.execCommand('undo')}
        onRedo={() => document.execCommand('redo')}
      />

      {/* MentionListOverlay removed during refactor to outliner mode */}
    </div>
  );
};
