import { useState, useEffect, useMemo } from 'react';
import { Note } from '../types';

/**
 * Custom hook to search and filter nodes with debouncing.
 * 
 * @param query - The search string
 * @param allNodes - Array of all available nodes
 * @returns An array of filtered suggestions (max 10)
 */
export function useNodeSearch(query: string, allNodes: Note[]) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Filter and limit results
  const suggestions = useMemo(() => {
    const lowerQuery = debouncedQuery.toLowerCase().trim();
    
    if (!lowerQuery) {
      // Return top 10 most recently updated nodes if no query
      return [...allNodes]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10);
    }

    return allNodes
      .filter(node => 
        node.title.toLowerCase().includes(lowerQuery) || 
        node.content.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [debouncedQuery, allNodes]);

  return suggestions;
}
