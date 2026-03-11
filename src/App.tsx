import React, { useState, useEffect } from 'react';
import { Editor } from './components/Editor';
import { GraphView } from './components/GraphView';
import { MindMap } from './components/MindMap';
import { ReminderSystem } from './components/ReminderSystem';
import { Note, ViewMode } from './types';
import { INITIAL_NOTES } from './constants';
import { LogIn, LogOut, LayoutGrid, Network, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { handleEnter as outlinerEnter, handleIndent as outlinerIndent, handleOutdent as outlinerOutdent } from './lib/outliner';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  writeBatch,
  User
} from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('root');
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync & Migration
  useEffect(() => {
    if (!isAuthReady) return;

    if (user) {
      // Sync with Firestore
      const q = query(collection(db, 'notes'), where('uid', '==', user.uid));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const firestoreNotes = snapshot.docs.map(doc => doc.data() as Note);
        
        if (firestoreNotes.length === 0) {
          // Migration from localStorage or Initial Notes
          const saved = localStorage.getItem('lumina-notes');
          const localNotes = saved ? JSON.parse(saved) : INITIAL_NOTES;
          
          const batch = writeBatch(db);
          localNotes.forEach((n: Note) => {
            const noteRef = doc(db, 'notes', n.id);
            batch.set(noteRef, { ...n, uid: user.uid });
          });
          await batch.commit();
        } else {
          setNotes(firestoreNotes);
        }
      });
      return () => unsubscribe();
    } else {
      // Use Local Storage
      const saved = localStorage.getItem('lumina-notes');
      const parsed = saved ? JSON.parse(saved) : INITIAL_NOTES;
      const unique = Array.from(new Map(parsed.map((n: Note) => [n.id, n])).values()) as Note[];
      setNotes(unique);
    }
  }, [user, isAuthReady]);

  // Save to local storage when logged out
  useEffect(() => {
    if (!user && notes.length > 0) {
      localStorage.setItem('lumina-notes', JSON.stringify(notes));
    }
  }, [notes, user]);

  useEffect(() => {
    if (notes.length > 0 && !notes.find(n => n.id === activeNoteId)) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'notes', id), { ...updates, updatedAt: Date.now() });
      } catch (error) {
        console.error("Update failed:", error);
      }
    } else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    }
  };

  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return null;

    const siblings = notes
      .filter(n => n.parentId === noteToDelete.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblings.findIndex(n => n.id === id);
    let focusId: string | null = null;
    if (currentIndex > 0) {
      focusId = siblings[currentIndex - 1].id;
    }

    if (user) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    } else {
      const newNotes = notes.filter(n => n.id !== id);
      setNotes(newNotes);
    }

    if (id === activeNoteId && focusId) {
      setActiveNoteId(focusId);
    } else if (id === activeNoteId && notes.length > 1) {
      const other = notes.find(n => n.id !== id);
      if (other) setActiveNoteId(other.id);
    }

    return focusId;
  };

  const handleDuplicateNote = async (id: string) => {
    const noteToDup = notes.find(n => n.id === id);
    if (!noteToDup) return;
    const newNote: Note = {
      ...noteToDup,
      id: uuidv4(),
      title: `${noteToDup.title} (Copy)`,
      updatedAt: Date.now(),
      uid: user?.uid
    };

    if (user) {
      try {
        await setDoc(doc(db, 'notes', newNote.id), newNote);
      } catch (error) {
        console.error("Duplicate failed:", error);
      }
    } else {
      setNotes(prev => [...prev, newNote]);
      setActiveNoteId(newNote.id);
    }
  };

  const handleBulkGenerate = async () => {
    const bulkNotes: Note[] = [];
    const batchId = uuidv4();
    for (let i = 0; i < 100; i++) {
      bulkNotes.push({
        id: `bulk-${batchId}-${i}-${uuidv4().split('-')[0]}`,
        title: `Automated Note ${i + 1}`,
        content: `# Note ${i + 1}\nThis is an automatically generated note to test performance and "unlimited" node features.\n\nPart of a large knowledge base.`,
        parentId: activeNoteId,
        order: i,
        updatedAt: Date.now(),
        tags: ["bulk", "test"],
        uid: user?.uid
      });
    }

    if (user) {
      const batch = writeBatch(db);
      bulkNotes.forEach(n => {
        batch.set(doc(db, 'notes', n.id), n);
      });
      await batch.commit();
    } else {
      setNotes(prev => [...prev, ...bulkNotes]);
    }
  };

  const handleAddNote = async (parentId: string | null = null) => {
    const siblings = notes.filter(n => n.parentId === parentId);
    const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) : -1;

    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled Note",
      content: "",
      parentId,
      order: maxOrder + 1,
      updatedAt: Date.now(),
      tags: [],
      uid: user?.uid
    };

    if (user) {
      try {
        await setDoc(doc(db, 'notes', newNote.id), newNote);
        setActiveNoteId(newNote.id);
      } catch (error) {
        console.error("Add failed:", error);
      }
    } else {
      setNotes(prev => [...prev, newNote]);
      setActiveNoteId(newNote.id);
    }
  };

  const handleIndent = async (id: string) => {
    const activeNote = notes.find(n => n.id === id);
    if (!activeNote) return;

    // 1. Identify the sibling node immediately above the focusedNodeId
    const siblings = notes
      .filter(n => n.parentId === activeNote.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblings.findIndex(n => n.id === id);
    
    // 3. If no sibling exists, do nothing
    if (currentIndex <= 0) return;

    const precedingSibling = siblings[currentIndex - 1];
    
    // Calculate new order (append to the end of the new parent's children)
    const newSiblings = notes.filter(n => n.parentId === precedingSibling.id);
    const newOrder = newSiblings.length > 0 
      ? Math.max(...newSiblings.map(s => s.order)) + 1 
      : 0;

    if (user) {
      try {
        // 2. Update the focusedNode's parentId in Firestore to match that sibling's ID
        // 4. UI re-renders immediately (via onSnapshot listener in App.tsx)
        await updateDoc(doc(db, 'notes', id), { 
          parentId: precedingSibling.id, 
          order: newOrder,
          updatedAt: Date.now()
        });
      } catch (error) {
        console.error("Firestore Indent failed:", error);
      }
    } else {
      // Fallback for local-only mode
      const newNotes = outlinerIndent(notes, id);
      setNotes(newNotes);
    }
  };

  const handleOutdent = async (id: string) => {
    const newNotes = outlinerOutdent(notes, id);
    if (user) {
      const updated = newNotes.find(n => n.id === id);
      if (updated) {
        await updateDoc(doc(db, 'notes', id), { parentId: updated.parentId, order: updated.order });
      }
    } else {
      setNotes(newNotes);
    }
  };

  const handleEnter = async (id: string) => {
    const newNotes = outlinerEnter(notes, id);
    const newNote = newNotes.find(n => !notes.some(pn => pn.id === n.id));
    
    if (user && newNote) {
      try {
        await setDoc(doc(db, 'notes', newNote.id), { ...newNote, uid: user.uid });
        return newNote.id;
      } catch (error) {
        console.error("Enter failed:", error);
        return null;
      }
    } else if (newNote) {
      setNotes(newNotes);
      return newNote.id;
    }
    return null;
  };

  const handleMoveUp = (id: string) => {
    const currentNote = notes.find(n => n.id === id);
    if (!currentNote) return;

    const siblings = notes
      .filter(n => n.parentId === currentNote.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblings.findIndex(n => n.id === id);
    if (currentIndex > 0) {
      const siblingAbove = siblings[currentIndex - 1];
      const currentOrder = currentNote.order;
      const aboveOrder = siblingAbove.order;

      setNotes(prev => prev.map(n => {
        if (n.id === id) return { ...n, order: aboveOrder };
        if (n.id === siblingAbove.id) return { ...n, order: currentOrder };
        return n;
      }));
    }
  };

  const handleMoveDown = (id: string) => {
    const currentNote = notes.find(n => n.id === id);
    if (!currentNote) return;

    const siblings = notes
      .filter(n => n.parentId === currentNote.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblings.findIndex(n => n.id === id);
    if (currentIndex < siblings.length - 1) {
      const siblingBelow = siblings[currentIndex + 1];
      const currentOrder = currentNote.order;
      const belowOrder = siblingBelow.order;

      setNotes(prev => prev.map(n => {
        if (n.id === id) return { ...n, order: belowOrder };
        if (n.id === siblingBelow.id) return { ...n, order: currentOrder };
        return n;
      }));
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-bg text-slate-200 overflow-hidden font-sans">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* View Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'editor' && activeNote && (
              <motion.div
                key="editor-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Editor 
                  note={activeNote} 
                  onUpdate={handleUpdateNote} 
                  allNotes={notes}
                  onNavigate={(id) => setActiveNoteId(id)}
                  onDelete={handleDeleteNote}
                  onDuplicate={handleDuplicateNote}
                  onIndent={handleIndent}
                  onOutdent={handleOutdent}
                  onEnter={handleEnter}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onAddNote={handleAddNote}
                />
              </motion.div>
            )}
            {viewMode === 'graph' && (
              <motion.div
                key="graph-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <GraphView 
                  notes={notes} 
                  onNoteClick={(id) => {
                    setActiveNoteId(id);
                    setViewMode('editor');
                  }}
                  activeNoteId={activeNoteId}
                />
              </motion.div>
            )}
            {viewMode === 'mindmap' && (
              <motion.div
                key="mindmap-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <MindMap 
                  notes={notes} 
                  rootNoteId={activeNoteId}
                  onNoteClick={(id) => {
                    setActiveNoteId(id);
                  }}
                  onAddChild={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                  onEditNote={(id) => {
                    setActiveNoteId(id);
                    setViewMode('editor');
                  }}
                  onIndent={handleIndent}
                  onOutdent={handleOutdent}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating View Switcher */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1 rounded-full shadow-2xl">
          <button
            onClick={() => setViewMode('editor')}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-2 px-4",
              viewMode === 'editor' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <FileText size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Outline</span>
          </button>
          <button
            onClick={() => setViewMode('mindmap')}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-2 px-4",
              viewMode === 'mindmap' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <LayoutGrid size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mind Map</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-2 px-4",
              viewMode === 'graph' ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Network size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Graph</span>
          </button>
        </div>

        {/* Floating Action Button for Auth/Settings */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={user ? handleLogout : handleLogin}
            className="p-3 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-400 hover:text-emerald-400 transition-all backdrop-blur-sm shadow-xl group"
            title={user ? "Logout" : "Login"}
          >
            {user ? <LogOut size={20} /> : <LogIn size={20} />}
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900 text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-800 pointer-events-none">
              {user ? user.email : "Login with Google"}
            </span>
          </button>
        </div>

        {/* Reminder System */}
        <ReminderSystem 
          notes={notes}
          onDismiss={(id) => handleUpdateNote(id, { reminderDismissed: true })}
          onNavigate={(id) => {
            setActiveNoteId(id);
            setViewMode('editor');
          }}
        />
      </main>
    </div>
  );
}
