import { Note } from "./types";

export const INITIAL_NOTES: Note[] = [
  {
    id: "root",
    title: "Welcome to Newturno1.0",
    content: "# Welcome to Newturno1.0\n\nThis is your professional knowledge management system. \n\n## Key Features\n- **Hierarchical Outlining**: Organize notes in a tree structure.\n- **Bi-directional Linking**: Use `[[Note Title]]` to link notes.\n- **Graph View**: See how your ideas connect.\n- **Mind Map**: Visualize your hierarchy.\n\nTry clicking on [[Project Ideas]] or [[Personal Goals]] to see how linking works.",
    parentId: null,
    order: 0,
    updatedAt: Date.now(),
    tags: ["welcome", "guide"]
  },
  {
    id: "project-ideas",
    title: "Project Ideas",
    content: "# Project Ideas\n\nHere are some things I want to build:\n- A decentralized social network\n- An AI-powered gardening assistant\n- [[Newturno1.0 Notes]] (This app!)\n\nCheck out my [[Personal Goals]] for more inspiration.",
    parentId: "root",
    order: 1,
    updatedAt: Date.now(),
    tags: ["projects"]
  },
  {
    id: "personal-goals",
    title: "Personal Goals",
    content: "# Personal Goals\n\n- Learn D3.js for data visualization\n- Master React 19 features\n- Build a second brain in [[Newturno1.0 Notes]]",
    parentId: "root",
    order: 2,
    updatedAt: Date.now(),
    tags: ["goals"]
  }
];
