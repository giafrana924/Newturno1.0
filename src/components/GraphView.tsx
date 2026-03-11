import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Note, Link } from '../types';

interface GraphViewProps {
  notes: Note[];
  onNoteClick: (id: string) => void;
  activeNoteId: string;
}

export const GraphView: React.FC<GraphViewProps> = ({ notes, onNoteClick, activeNoteId }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Extract links from content [[Title]]
    const links: Link[] = [];
    notes.forEach(note => {
      const matches = note.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const match of matches) {
        const targetTitle = match[1];
        const targetNote = notes.find(n => n.title === targetTitle);
        if (targetNote) {
          links.push({ source: note.id, target: targetNote.id });
        }
      }
      // Also link parent-child
      if (note.parentId) {
        links.push({ source: note.parentId, target: note.id });
      }
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<Note & d3.SimulationNodeDatum>(notes)
      .force("link", d3.forceLink<Note & d3.SimulationNodeDatum, any>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const link = g.append("g")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const node = g.append("g")
      .selectAll("g")
      .data(notes as (Note & d3.SimulationNodeDatum)[])
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => onNoteClick(d.id))
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 6)
      .attr("fill", d => d.id === activeNoteId ? "#10b981" : "#64748b")
      .attr("stroke", d => d.id === activeNoteId ? "#fff" : "none")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(d => d.title)
      .attr("fill", d => d.id === activeNoteId ? "#fff" : "#94a3b8")
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [notes, activeNoteId, onNoteClick]);

  return (
    <div className="w-full h-full bg-brand-bg overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 font-mono">
        DRAG TO PAN • SCROLL TO ZOOM • CLICK TO NAVIGATE
      </div>
    </div>
  );
};
