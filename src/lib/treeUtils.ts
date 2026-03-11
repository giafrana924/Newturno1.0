/**
 * Interface for the flat input object
 */
export interface FlatNode {
  id: string;
  text: string;
  parentId: string | null;
  order: number;
  [key: string]: any; // To support additional properties like 'content', 'tags', etc.
}

/**
 * Interface for the nested tree structure
 */
export interface TreeNode extends FlatNode {
  children: TreeNode[];
}

/**
 * Transforms a flat list of objects into a nested JSON tree structure.
 * Maintains sibling order based on the 'order' property.
 * 
 * @param flatList - The array of flat objects to transform
 * @returns An array of root-level TreeNodes
 */
export function transformToTree(flatList: FlatNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: Create a map of all nodes with an empty children array
  flatList.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  // Second pass: Link children to their parents
  flatList.forEach(item => {
    const node = map.get(item.id)!;
    
    if (item.parentId === null || !map.has(item.parentId)) {
      // If no parent or parent doesn't exist in the list, it's a root node
      roots.push(node);
    } else {
      // Add to parent's children array
      const parent = map.get(item.parentId)!;
      parent.children.push(node);
    }
  });

  /**
   * Recursive helper to sort children at every level
   */
  const sortTree = (nodes: TreeNode[]) => {
    // Sort current level by 'order' property
    nodes.sort((a, b) => a.order - b.order);
    
    // Recurse into children
    nodes.forEach(node => {
      if (node.children.length > 0) {
        sortTree(node.children);
      }
    });
  };

  // Initial sort for root nodes and their descendants
  sortTree(roots);

  return roots;
}

/**
 * Example Usage:
 * 
 * const flatData = [
 *   { id: '1', text: 'Root', parentId: null, order: 1 },
 *   { id: '2', text: 'Child A', parentId: '1', order: 2 },
 *   { id: '3', text: 'Child B', parentId: '1', order: 1 },
 *   { id: '4', text: 'Grandchild', parentId: '2', order: 1 }
 * ];
 * 
 * const tree = transformToTree(flatData);
 * console.log(JSON.stringify(tree, null, 2));
 */
