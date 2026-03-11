import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Note } from '../types';

interface MindMapProps {
  notes: Note[];
  rootNoteId: string;
  onNoteClick: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
}

export const MindMap: React.FC<MindMapProps> = ({ 
  notes, 
  rootNoteId, 
  onNoteClick,
  onAddChild,
  onDeleteNote,
  onEditNote,
  onIndent,
  onOutdent
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Build hierarchy
    const stratify = d3.stratify<Note>()
      .id(d => d.id)
      .parentId(d => d.parentId);

    try {
      const rootNotes = notes.filter(n => !n.parentId);
      let root: d3.HierarchyNode<Note>;

      if (rootNotes.length > 1) {
        const virtualRootId = "virtual-root-id";
        const virtualNotes = [
          { id: virtualRootId, title: "Knowledge Base", parentId: null, content: "", updatedAt: Date.now(), tags: [] } as Note,
          ...notes.map(n => n.parentId === null ? { ...n, parentId: virtualRootId } : n)
        ];
        root = d3.stratify<Note>()
          .id(d => d.id)
          .parentId(d => d.parentId)(virtualNotes);
      } else {
        root = stratify(notes);
      }

      // Auto-layout tree structure with clear spacing
      const treeLayout = d3.tree<Note>()
        .nodeSize([60, 240]) // [height, width] spacing between nodes
        .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));
      
      const treeData = treeLayout(root);

      const link = g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#334155")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(treeData.links())
        .join("path")
        .attr("d", d3.linkHorizontal<any, any>()
          .x(d => d.y)
          .y(d => d.x));

      const node = g.append("g")
        .selectAll("g")
        .data(treeData.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);

      // Node Circle
      node.append("circle")
        .attr("fill", d => d.data.id === rootNoteId ? "#10b981" : "#1e293b")
        .attr("stroke", d => d.data.id === rootNoteId ? "#fff" : "#334155")
        .attr("stroke-width", d => d.data.id === rootNoteId ? 2 : 1)
        .attr("r", 6)
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          onNoteClick(d.data.id);
        });

      // Node Text
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", 12)
        .attr("text-anchor", "start")
        .text(d => d.data.title)
        .attr("fill", d => d.data.id === rootNoteId ? "#fff" : "#94a3b8")
        .attr("font-size", "12px")
        .attr("font-family", "Inter, sans-serif")
        .attr("font-weight", d => d.data.id === rootNoteId ? "600" : "400")
        .style("pointer-events", "none")
        .clone(true).lower()
        .attr("stroke", "#020617")
        .attr("stroke-width", 4);

      // Action Buttons Group (Visible on hover or always for simplicity in SVG)
      const actions = node.append("g")
        .attr("class", "node-actions")
        .attr("transform", "translate(12, 18)");

      // Add Child Button (+)
      const addChild = actions.append("g")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.id !== "virtual-root-id") onAddChild(d.data.id);
        });
      
      addChild.append("circle").attr("r", 8).attr("fill", "#10b981").attr("opacity", 0.8);
      addChild.append("text").text("+").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "10px").attr("font-weight", "bold");

      // Edit Button (E)
      const editBtn = actions.append("g")
        .attr("transform", "translate(20, 0)")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.id !== "virtual-root-id") onEditNote(d.data.id);
        });
      
      editBtn.append("circle").attr("r", 8).attr("fill", "#3b82f6").attr("opacity", 0.8);
      editBtn.append("text").text("✎").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "10px");

      // Delete Button (X)
      const deleteBtn = actions.append("g")
        .attr("transform", "translate(40, 0)")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.id !== "virtual-root-id") onDeleteNote(d.data.id);
        });
      
      deleteBtn.append("circle").attr("r", 8).attr("fill", "#ef4444").attr("opacity", 0.8);
      deleteBtn.append("text").text("✕").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "10px");

      // Outdent Button (<)
      const outdentBtn = actions.append("g")
        .attr("transform", "translate(60, 0)")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.id !== "virtual-root-id") onOutdent?.(d.data.id);
        });
      
      outdentBtn.append("circle").attr("r", 8).attr("fill", "#64748b").attr("opacity", 0.8);
      outdentBtn.append("text").text("←").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "10px");

      // Indent Button (>)
      const indentBtn = actions.append("g")
        .attr("transform", "translate(80, 0)")
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.id !== "virtual-root-id") onIndent?.(d.data.id);
        });
      
      indentBtn.append("circle").attr("r", 8).attr("fill", "#64748b").attr("opacity", 0.8);
      indentBtn.append("text").text("→").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "10px");

      // Hide actions for virtual root
      actions.filter(d => d.data.id === "virtual-root-id").remove();

      // Center on the active node
      const targetNode = treeData.descendants().find(d => d.data.id === rootNoteId);
      if (targetNode) {
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(1.2)
          .translate(-targetNode.y, -targetNode.x);
        
        svg.transition()
          .duration(750)
          .ease(d3.easeCubicInOut)
          .call(zoom.transform, transform);
      } else {
        const initialTransform = d3.zoomIdentity.translate(width / 4, height / 2).scale(0.8);
        svg.transition().duration(750).call(zoom.transform, initialTransform);
      }

    } catch (e) {
      console.error("Hierarchy error", e);
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#ef4444")
        .text("Unable to render mind map: Circular dependency or multiple roots detected.");
    }

  }, [notes, rootNoteId, onNoteClick]);

  return (
    <div className="w-full h-full bg-brand-bg overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mind Map View</span>
      </div>
    </div>
  );
};
