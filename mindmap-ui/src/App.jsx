import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeResizer,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// ─── Shape SVG Polygons ────────────────────────────────────────────────────
const getPolygonPoints = (shape, w, h) => {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  const sides = {
    triangle: 3, square: 4, pentagon: 5, hexagon: 6,
    heptagon: 7, octagon: 8, nonagon: 9, decagon: 10,
  };
  if (shape === "sphere") return null;
  if (shape === "rectangle") return `0,0 ${w},0 ${w},${h} 0,${h}`;
  const n = sides[shape] || 4;
  const offset = shape === "triangle" ? -Math.PI / 2 : -Math.PI / 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = offset + (2 * Math.PI * i) / n;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
};

const SHAPES = [
  "rectangle", "triangle", "square", "pentagon", "hexagon",
  "heptagon", "octagon", "nonagon", "decagon", "sphere",
];

// ─── Custom Node ──────────────────────────────────────────────────────────
function ShapeNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);
  const shape = data.shape || "rectangle";
  const color = data.color || "#FFD966";
  const textColor = data.textColor || "#1a1a1a";
  const w = 120, h = 80;
  const isSphere = shape === "sphere";

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
    data.onLabelChange?.(id, label);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBlur();
  };

  const points = getPolygonPoints(shape, w, h);

  const handleStyle = (pos) => ({
    background: "#a78bfa",
    border: "2px solid #7c3aed",
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "all 0.2s",
  });

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{ width: w, height: h, position: "relative", cursor: "default" }}
    >
      {/* Handles on all 4 sides */}
      <Handle type="source" position={Position.Top}    id="top"    style={{ ...handleStyle(), top: -5, left: "50%" }} />
      <Handle type="target" position={Position.Top}    id="top-t"  style={{ ...handleStyle(), top: -5, left: "50%", opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle(), bottom: -5, left: "50%" }} />
      <Handle type="target" position={Position.Bottom} id="bot-t"  style={{ ...handleStyle(), bottom: -5, left: "50%", opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ ...handleStyle(), left: -5, top: "50%" }} />
      <Handle type="target" position={Position.Left}   id="left-t" style={{ ...handleStyle(), left: -5, top: "50%", opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ ...handleStyle(), right: -5, top: "50%" }} />
      <Handle type="target" position={Position.Right}  id="right-t" style={{ ...handleStyle(), right: -5, top: "50%", opacity: 0, width: 1, height: 1 }} />

      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}
      >
        <defs>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation={selected ? "3" : "1"} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {isSphere ? (
          <>
            <defs>
              <radialGradient id={`sph-${id}`} cx="35%" cy="35%">
                <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="1" />
              </radialGradient>
            </defs>
            <ellipse
              cx={w / 2} cy={h / 2}
              rx={Math.min(w, h) / 2 - 2}
              ry={Math.min(w, h) / 2 - 2}
              fill={`url(#sph-${id})`}
              stroke={selected ? "#a78bfa" : "#444"}
              strokeWidth={selected ? 2.5 : 1.5}
              filter={`url(#glow-${id})`}
            />
          </>
        ) : (
          <polygon
            points={points}
            fill={color}
            stroke={selected ? "#a78bfa" : "#444"}
            strokeWidth={selected ? 2.5 : 1.5}
            filter={`url(#glow-${id})`}
          />
        )}
      </svg>

      {/* Label */}
      <div
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: editing ? "all" : "none",
          zIndex: 5,
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: "transparent",
              border: "none",
              outline: "1px solid #a78bfa",
              color: textColor,
              fontSize: 11,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              textAlign: "center",
              width: "80%",
              borderRadius: 4,
              padding: "2px 4px",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              color: textColor,
              textAlign: "center",
              wordBreak: "break-word",
              padding: "0 8px",
              lineHeight: 1.2,
              userSelect: "none",
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

const nodeTypes = { shapeNode: ShapeNode };

// ─── Initial State ────────────────────────────────────────────────────────
const makeInitialNodes = (onLabelChange) => [
  {
    id: "1",
    type: "shapeNode",
    position: { x: 300, y: 200 },
    data: { label: "Main Idea", shape: "hexagon", color: "#FFD966", textColor: "#1a1a1a", onLabelChange },
  },
];

// ─── Color Presets ────────────────────────────────────────────────────────
const colorPresets = [
  "#FFD966","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
  "#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE",
  "#85C1E9","#F8C471","#82E0AA","#F1948A","#AED6F1",
  "#FAD7A0","#A9DFBF","#D2B4DE","#A3E4D7","#FDFEFE",
];

const bgPresets = [
  "#0f0f1a","#1a1a2e","#0d1117","#111827","#0c0c0c",
  "#1e1b4b","#0f172a","#18181b","#1c1917","#162032",
  "#e8e8e0","#f0ece4","#faf7f2","#f5f0eb","#fffbf5",
];

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const [bgColor, setBgColor] = useState("#0f0f1a");
  const [selectedShape, setSelectedShape] = useState("hexagon");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showShapeDropdown, setShowShapeDropdown] = useState(false);
  const [nodeColor, setNodeColor] = useState("#FFD966");
  const [textColor, setTextColor] = useState("#1a1a1a");

  const handleLabelChange = useCallback((id, newLabel) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)
    );
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(makeInitialNodes(handleLabelChange));
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, style: { stroke: "#a78bfa", strokeWidth: 2 }, animated: true }, eds)),
    []
  );

  const addNode = () => {
    const id = Date.now().toString();
    const newNode = {
      id,
      type: "shapeNode",
      // This places it at a default position; 
      // Use { x: 0, y: 0 } if you want it at the top-left of the coordinate system
      position: { x: Math.random() * 100 + 100, y: Math.random() * 100 + 100 },
      data: {
        label: "New Idea",
        shape: selectedShape,
        color: nodeColor,
        textColor: textColor,
        onLabelChange: handleLabelChange,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = (_, node) => {
    setSelectedNodeId(node.id);
    setNodeColor(node.data.color || "#FFD966");
    setTextColor(node.data.textColor || "#1a1a1a");
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, opacity: n.id === node.id ? 1 : 0.4 },
      }))
    );
  };

  const onPaneClick = (event) => {
    setSelectedNodeId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
    setShowColorPanel(false);
    setShowBgPanel(false);
    setShowShapeDropdown(false);
  };

  const applyColorToNode = (color, field) => {
    if (!selectedNodeId) return;
    if (field === "node") setNodeColor(color);
    if (field === "text") setTextColor(color);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, [field === "node" ? "color" : "textColor"]: color } }
          : n
      )
    );
  };

  const applyShapeToNode = (shape) => {
    if (!selectedNodeId) {
      setSelectedShape(shape);
      setShowShapeDropdown(false);
      return;
    }
    setSelectedShape(shape);
    setShowShapeDropdown(false);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, shape } } : n
      )
    );
  };

  const resetView = () => {
    setNodes(makeInitialNodes(handleLabelChange));
    setEdges([]);
    setSelectedNodeId(null);
    setBgColor("#0f0f1a");
  };

  const autoArrange = () => {
    setNodes((nds) =>
      nds.map((node, index) => {
        const cols = Math.ceil(Math.sqrt(nds.length));
        return {
          ...node,
          position: {
            x: (index % cols) * 200 + 100,
            y: Math.floor(index / cols) * 160 + 100,
          },
        };
      })
    );
  };

  const shapeIcons = {
    rectangle: "▬", triangle: "▲", square: "■", pentagon: "⬠",
    hexagon: "⬡", heptagon: "7", octagon: "⬢", nonagon: "9",
    decagon: "10", sphere: "●",
  };

  return (
    <div style={{ width: "100vw", height: "100vh", fontFamily: "'Syne', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 2px; }
        .toolbar-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid rgba(167,139,250,0.3);
          background: rgba(124,58,237,0.15);
          color: #c4b5fd;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
          letter-spacing: 0.02em;
        }
        .toolbar-btn:hover {
          background: rgba(124,58,237,0.35);
          border-color: rgba(167,139,250,0.7);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(124,58,237,0.3);
        }
        .toolbar-btn.active {
          background: rgba(124,58,237,0.5);
          border-color: #a78bfa;
          color: #fff;
          box-shadow: 0 0 12px rgba(124,58,237,0.4);
        }
        .shape-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.15s;
          color: #c4b5fd;
          font-size: 13px;
          font-weight: 600;
          text-transform: capitalize;
        }
        .shape-option:hover {
          background: rgba(124,58,237,0.3);
          color: #fff;
        }
        .color-swatch {
          width: 26px; height: 26px;
          border-radius: 6px;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .color-swatch:hover {
          transform: scale(1.2);
          border-color: #a78bfa;
          box-shadow: 0 0 8px rgba(167,139,250,0.5);
        }
        .panel {
          position: absolute;
          background: rgba(15,10,30,0.97);
          border: 1px solid rgba(167,139,250,0.25);
          border-radius: 16px;
          padding: 16px;
          z-index: 100;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.1);
          min-width: 220px;
          animation: panelIn 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .panel-title {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7c3aed;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(124,58,237,0.3);
        }
        .react-flow__handle {
          opacity: 0;
          transition: opacity 0.2s !important;
        }
        .react-flow__node:hover .react-flow__handle {
          opacity: 1 !important;
        }
        .react-flow__node.selected .react-flow__handle {
          opacity: 1 !important;
        }
        .react-flow__edge path {
          filter: drop-shadow(0 0 3px rgba(167,139,250,0.4));
        }
        .react-flow__controls {
          bottom: 20px !important;
          left: 20px !important;
          background: rgba(15,10,30,0.9) !important;
          border: 1px solid rgba(167,139,250,0.2) !important;
          border-radius: 12px !important;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4) !important;
        }
        .react-flow__controls button {
          background: transparent !important;
          border-bottom: 1px solid rgba(167,139,250,0.1) !important;
          color: #a78bfa !important;
          border-radius: 0 !important;
        }
        .react-flow__controls button:hover {
          background: rgba(124,58,237,0.2) !important;
        }
        .hint-tag {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(15,10,30,0.8);
          border: 1px solid rgba(167,139,250,0.15);
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 11px;
          color: rgba(167,139,250,0.6);
          font-family: 'JetBrains Mono', monospace;
          backdrop-filter: blur(10px);
          z-index: 5;
          line-height: 1.8;
        }

        <div style={{ position: 'absolute', zIndex: 10, top: 10, left: 10 }}>
        <button 
          onClick={addNode} 
          style={{ 
            padding: '8px 16px', 
            cursor: 'pointer', 
            borderRadius: '4px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            fontWeight: 'bold'
          }}
        >
          + Add {selectedShape}
        </button>
      </div>
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 64,
        background: "rgba(10,6,25,0.95)",
        borderBottom: "1px solid rgba(124,58,237,0.25)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 50,
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 0 16px rgba(124,58,237,0.5)",
          }}>⬡</div>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: 18,
            background: "linear-gradient(135deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>KALAM</span>
        </div>

        {/* Center Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>

          {/* Shape Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className={`toolbar-btn ${showShapeDropdown ? "active" : ""}`}
              onClick={() => { setShowShapeDropdown(p => !p); setShowColorPanel(false); setShowBgPanel(false); }}
            >
              <button
                onClick={addNode}
                className="toolbar-btn"
              >
                + Add {selectedShape}
              </button>
              <span style={{ marginRight: 6 }}>{shapeIcons[selectedShape]}</span>
              {selectedShape.charAt(0).toUpperCase() + selectedShape.slice(1)}
              <span style={{ marginLeft: 6, opacity: 0.6 }}>▾</span>
            </button>
            {showShapeDropdown && (
              <div className="panel" style={{ top: "calc(100% + 8px)", left: 0, minWidth: 180 }}>
                <div className="panel-title">Select Shape</div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {SHAPES.map(s => (
                    <div
                      key={s}
                      className="shape-option"
                      style={{ background: s === selectedShape ? "rgba(124,58,237,0.25)" : undefined }}
                      onClick={() => applyShapeToNode(s)}
                    >
                      <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{shapeIcons[s]}</span>
                      <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                      {s === selectedShape && <span style={{ marginLeft: "auto", color: "#a78bfa" }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Node Color */}
          <div style={{ position: "relative" }}>
            <button
              className={`toolbar-btn ${showColorPanel ? "active" : ""}`}
              onClick={() => { setShowColorPanel(p => !p); setShowBgPanel(false); setShowShapeDropdown(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
              <span style={{
                display: "inline-block", width: 14, height: 14,
                borderRadius: "50%",
                background: nodeColor,
                border: "1.5px solid rgba(255,255,255,0.3)",
              }} />
              Node Color
            </button>
            {showColorPanel && (
              <div className="panel" style={{ top: "calc(100% + 8px)", left: 0 }}>
                <div className="panel-title">Node Fill Color</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {colorPresets.map(c => (
                    <div key={c} className="color-swatch" style={{
                      background: c,
                      boxShadow: c === nodeColor ? `0 0 0 2px #a78bfa, 0 0 10px rgba(167,139,250,0.4)` : undefined,
                    }} onClick={() => applyColorToNode(c, "node")} />
                  ))}
                </div>
                <div className="panel-title" style={{ marginTop: 4 }}>Custom</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={nodeColor}
                    onChange={(e) => applyColorToNode(e.target.value, "node")}
                    style={{ width: 40, height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }}
                  />
                  <span style={{ color: "#7c7caa", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{nodeColor}</span>
                </div>
                <div className="panel-title" style={{ marginTop: 12 }}>Text Color</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {["#1a1a1a","#ffffff","#7c3aed","#FFD966","#4ECDC4","#FF6B6B"].map(c => (
                    <div key={c} className="color-swatch" style={{
                      background: c,
                      border: c === textColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                    }} onClick={() => applyColorToNode(c, "text")} />
                  ))}
                </div>
                <input type="color" value={textColor}
                  onChange={(e) => applyColorToNode(e.target.value, "text")}
                  style={{ width: 40, height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }}
                />
              </div>
            )}
          </div>

          {/* BG Color */}
          <div style={{ position: "relative" }}>
            <button
              className={`toolbar-btn ${showBgPanel ? "active" : ""}`}
              onClick={() => { setShowBgPanel(p => !p); setShowColorPanel(false); setShowShapeDropdown(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7 }}
            >
              <span style={{
                display: "inline-block", width: 14, height: 14,
                borderRadius: 3,
                background: bgColor,
                border: "1.5px solid rgba(255,255,255,0.3)",
              }} />
              Canvas BG
            </button>
            {showBgPanel && (
              <div className="panel" style={{ top: "calc(100% + 8px)", right: 0 }}>
                <div className="panel-title">Canvas Background</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {bgPresets.map(c => (
                    <div key={c} className="color-swatch" style={{
                      background: c,
                      border: c === bgColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                      boxShadow: c === bgColor ? "0 0 10px rgba(167,139,250,0.4)" : undefined,
                    }} onClick={() => setBgColor(c)} />
                  ))}
                </div>
                <div className="panel-title">Custom</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                    style={{ width: 40, height: 32, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }}
                  />
                  <span style={{ color: "#7c7caa", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{bgColor}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="toolbar-btn" onClick={autoArrange}>⊞ Arrange</button>
          <button
            className="toolbar-btn"
            onClick={resetView}
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
          >↺ Reset</button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ width: "100%", height: "100%", paddingTop: 64 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: bgColor, transition: "background 0.4s ease" }}
          defaultEdgeOptions={{
            style: { stroke: "#a78bfa", strokeWidth: 2 },
            animated: true,
          }}

        >
          <Background
            color={
              bgColor.startsWith("#f") || bgColor.startsWith("#e") || bgColor > "#cccccc"
                ? "rgba(0,0,0,0.12)"
                : "rgba(167,139,250,0.12)"
            }
            gap={28}
            size={1.5}
          />
          <Controls />
        </ReactFlow>
      </div>

      {/* ── Hint Tag ── */}
      <div className="hint-tag">
        <div>✏️ Double-click node → edit label</div>
        <div>⚡ Drag handle → connect nodes</div>
        <div>🎯 Click node → select & style</div>
      </div>
    </div>
  );
}