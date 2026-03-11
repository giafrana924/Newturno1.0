import { Note } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a new node at the same level immediately after the active node.
 */
export const handleEnter = (notes: Note[], activeNoteId: string): Note[] => {
  const activeNote = notes.find(n => n.id === activeNoteId);
  if (!activeNote) return notes;

  const newNoteId = uuidv4();
  const newNote: Note = {
    id: newNoteId,
    title: "",
    content: "",
    parentId: activeNote.parentId,
    order: activeNote.order + 1,
    updatedAt: Date.now(),
    tags: []
  };

  return notes.map(n => {
    if (n.parentId === activeNote.parentId && n.order > activeNote.order) {
      return { ...n, order: n.order + 1 };
    }
    return n;
  }).concat(newNote);
};

/**
 * Finds the preceding sibling and makes it the new parent.
 */
export const handleIndent = (notes: Note[], activeNoteId: string): Note[] => {
  const activeNote = notes.find(n => n.id === activeNoteId);
  if (!activeNote) return notes;

  const siblings = notes
    .filter(n => n.parentId === activeNote.parentId)
    .sort((a, b) => a.order - b.order);
  
  const currentIndex = siblings.findIndex(n => n.id === activeNoteId);
  if (currentIndex === 0) return notes;

  const precedingSibling = siblings[currentIndex - 1];
  
  // Get max order of new siblings
  const newSiblings = notes.filter(n => n.parentId === precedingSibling.id);
  const newOrder = newSiblings.length > 0 
    ? Math.max(...newSiblings.map(s => s.order)) + 1 
    : 0;

  return notes.map(n => {
    if (n.id === activeNoteId) {
      return { ...n, parentId: precedingSibling.id, order: newOrder };
    }
    // Shift remaining siblings of the old parent to fill the gap
    if (n.parentId === activeNote.parentId && n.order > activeNote.order) {
      return { ...n, order: n.order - 1 };
    }
    return n;
  });
};

/**
 * Moves the node up one level to become a sibling of its current parent.
 */
export const handleOutdent = (notes: Note[], activeNoteId: string): Note[] => {
  const activeNote = notes.find(n => n.id === activeNoteId);
  if (!activeNote || !activeNote.parentId) return notes;

  const parentNote = notes.find(n => n.id === activeNote.parentId);
  if (!parentNote) return notes;

  const newParentId = parentNote.parentId;
  const newOrder = parentNote.order + 1;

  return notes.map(n => {
    if (n.id === activeNoteId) {
      return { ...n, parentId: newParentId, order: newOrder };
    }
    // Shift siblings of the new parent (who are after the old parent)
    if (n.parentId === newParentId && n.order > parentNote.order) {
      return { ...n, order: n.order + 1 };
    }
    // Shift siblings of the old parent (who were after the active node)
    if (n.parentId === activeNote.parentId && n.order > activeNote.order) {
      return { ...n, order: n.order - 1 };
    }
    return n;
  });
};
