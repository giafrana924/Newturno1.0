import React, { useState } from 'react';
import { 
  ChevronDown, 
  Type, 
  CheckSquare, 
  Image as ImageIcon, 
  AtSign, 
  Hash, 
  Undo, 
  Redo, 
  ArrowLeftToLine, 
  ArrowRightFromLine,
  Bold,
  Italic,
  Underline,
  Palette,
  CalendarDays,
  Clock,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useRichText } from '../contexts/RichTextContext';

interface MobileOutlinerToolbarProps {
  isVisible: boolean;
  onHideKeyboard?: () => void;
  onToggleTask?: () => void;
  onInsertMedia?: () => void;
  onMention?: () => void;
  onTag?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onFormat?: (type: 'bold' | 'italic' | 'underline' | 'color' | 'highlight' | 'timestamp' | 'date', value?: string) => void;
  onInsertTimestamp?: () => void;
  onInsertDate?: () => void;
  onSetReminder?: () => void;
  canIndent?: boolean;
  canOutdent?: boolean;
}

/**
 * MobileOutlinerToolbar component.
 * Styled for a dark mode interface, acting as an InputAccessoryView.
 * Uses Lucide icons matching the user's description exactly.
 */
export const MobileOutlinerToolbar: React.FC<MobileOutlinerToolbarProps> = ({
  isVisible,
  onHideKeyboard,
  onToggleTask,
  onInsertMedia,
  onMention,
  onTag,
  onUndo,
  onRedo,
  onIndent,
  onOutdent,
  onFormat,
  onInsertTimestamp,
  onInsertDate,
  onSetReminder,
  canIndent = true,
  canOutdent = true
}) => {
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'text' | 'highlight'>('text');

  if (!isVisible) return null;

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleAction = (e: React.MouseEvent, action?: () => void, disabled?: boolean) => {
    e.preventDefault(); // Prevent focus loss
    if (disabled) return;
    triggerHaptic();
    action?.();
  };

  const colors = [
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Yellow', value: '#eab308' },
  ];

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col transition-all duration-300",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
    )}>
      {/* Style Menu Overlay */}
      {isStyleMenuOpen && (
        <div 
          onMouseDown={(e) => e.preventDefault()}
          className="mb-2 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center px-4 py-2 gap-4 overflow-x-auto no-scrollbar max-w-[90vw]"
        >
          <button
            onMouseDown={(e) => handleAction(e, () => onFormat?.('bold'))}
            className="p-2 text-slate-300 hover:text-emerald-400 transition-colors shrink-0"
          >
            <Bold size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, () => onFormat?.('italic'))}
            className="p-2 text-slate-300 hover:text-emerald-400 transition-colors shrink-0"
          >
            <Italic size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, () => onFormat?.('underline'))}
            className="p-2 text-slate-300 hover:text-emerald-400 transition-colors shrink-0"
          >
            <Underline size={18} />
          </button>
          
          <div className="w-px h-6 bg-slate-800 mx-1 shrink-0" />
          
          <button
            onMouseDown={(e) => handleAction(e, () => setColorMode(colorMode === 'text' ? 'highlight' : 'text'))}
            className={cn(
              "p-2 rounded-lg flex items-center gap-2 shrink-0 transition-colors",
              colorMode === 'highlight' ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:bg-slate-800"
            )}
          >
            <Palette size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {colorMode === 'text' ? 'Text' : 'High'}
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {colors.map((color) => (
              <button
                key={color.value}
                onMouseDown={(e) => handleAction(e, () => onFormat?.(colorMode === 'text' ? 'color' : 'highlight', color.value))}
                className="w-4 h-4 rounded-full border border-white/10 shrink-0 hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div 
        onMouseDown={(e) => e.preventDefault()}
        className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex items-center h-12 px-3 gap-1"
      >
        <button
          onMouseDown={(e) => handleAction(e, onHideKeyboard)}
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
        >
          <ChevronDown size={18} />
        </button>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => handleAction(e, () => setIsStyleMenuOpen(!isStyleMenuOpen))}
            className={cn(
              "p-2 rounded-xl transition-all",
              isStyleMenuOpen ? "text-emerald-400 bg-emerald-500/10" : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
            )}
          >
            <Type size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onToggleTask)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <CheckSquare size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onInsertMedia)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onMention)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <AtSign size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onTag)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <Hash size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onInsertTimestamp)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
            title="Insert Timestamp"
          >
            <Clock size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onInsertDate)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
            title="Insert Date"
          >
            <CalendarDays size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onSetReminder)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
            title="Set Alarm"
          >
            <Bell size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => handleAction(e, onUndo)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <Undo size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onRedo)}
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
          >
            <Redo size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onMouseDown={(e) => handleAction(e, onOutdent, !canOutdent)}
            className={cn(
              "p-2 rounded-xl transition-all",
              canOutdent 
                ? "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10" 
                : "text-slate-600 cursor-not-allowed opacity-50"
            )}
            disabled={!canOutdent}
          >
            <ArrowLeftToLine size={18} />
          </button>
          <button
            onMouseDown={(e) => handleAction(e, onIndent, !canIndent)}
            className={cn(
              "p-2 rounded-xl transition-all",
              canIndent 
                ? "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10" 
                : "text-slate-600 cursor-not-allowed opacity-50"
            )}
            disabled={!canIndent}
          >
            <ArrowRightFromLine size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
