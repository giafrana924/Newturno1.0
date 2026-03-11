export interface Note {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
  updatedAt: number;
  tags: string[];
  uid?: string;
  startDate?: number;
  endDate?: number;
  reminderAt?: number;
  reminderDismissed?: boolean;
  isCollapsed?: boolean;
}

export interface Link {
  source: string;
  target: string;
}

export type ViewMode = 'editor' | 'graph' | 'mindmap';
