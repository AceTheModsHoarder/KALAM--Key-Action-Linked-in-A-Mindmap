import React, { useCallback, useState, useRef, useEffect, memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ConnectionMode,
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

const shapeIcons = {
  rectangle: "▬", triangle: "▲", square: "■", pentagon: "⬠",
  hexagon: "⬡", heptagon: "7", octagon: "⬢", nonagon: "9",
  decagon: "10", sphere: "●",
};

const colorPresets = [
  "#FFD966","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
  "#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE",
  "#85C1E9","#F8C471","#82E0AA","#F1948A","#AED6F1",
  "#FAD7A0","#A9DFBF","#D2B4DE","#A3E4D7","#FDFEFE",
];

const bgPresets = [
  "#060606","#7f0639","#1b4a90","#0e9460","#6d1792",
  "#1e1b4b","#8a9517","#8a6812","#1393ce","#139f88",
  "#ffffff","#769e13","#ad9d0c","#9c0808","#200d8b",
];

const edgeColorPresets = [
  "#a78bfa", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFD966",
  "#96CEB4", "#DDA0DD", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

const edgeStyleOptions = [
  { value: "solid", label: "Solid", preview: "────" },
  { value: "dashed", label: "Dashed", preview: "╌ ╌ ╌" },
  { value: "dotted", label: "Dotted", preview: "· · · ·" },
];

// Font size options (like Microsoft Word)
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72];

// ═══════════════════════════════════════════════════════════════════════════
// ADD 1: History & Save/Load Utilities
// ═══════════════════════════════════════════════════════════════════════════

const MAX_HISTORY = 50;
const SAVE_KEY = 'kalam-mindmap-save';

const useHistory = (initialPresent) => {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialPresent);
  const [future, setFuture] = useState([]);

  const pushState = useCallback((newPresent) => {
    setPast((prev) => {
      const newPast = [...prev, present];
      return newPast.length > MAX_HISTORY ? newPast.slice(1) : newPast;
    });
    setPresent(newPresent);
    setFuture([]);
  }, [present]);

  const undo = useCallback(() => {
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [present, ...prev]);
    setPresent(previous);
    return previous;
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return null;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev, present]);
    setPresent(next);
    return next;
  }, [future, present]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return { present, pushState, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, clearHistory };
};

const saveToStorage = (data) => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save:', e);
    return false;
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load:', e);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// END ADD 1
// ═══════════════════════════════════════════════════════════════════════════

// ─── Custom Node Component ─────────────────────────────────────────────────────
const HANDLE_SIZE = 18;

const getHandleStyle = () => ({
  opacity: 0,
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: "50%",
  background: "transparent",
  border: "none",
  transition: "all 0.2s ease",
});

const ShapeNode = memo(function ShapeNode({ id, data, selected }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);

  const shape = data.shape || "rectangle";
  const color = data.color || "#FFD966";
  const textColor = data.textColor || "#1a1a1a";
  const fontSize = data.fontSize || 14;
  const w = data.width || 140;
  const h = data.height || 100;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    data.onLabelChange?.(id, label);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLabel(data.label);
      setEditing(false);
    }
  };

  const handleResize = useCallback((event, params) => {
      data.onResize?.(id, params.width, params.height);
    }, [id, data]);


  const edgeColorPresets = [
    "#a78bfa", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFD966",
    "#96CEB4", "#DDA0DD", "#F7DC6F", "#BB8FCE", "#85C1E9",
  ];

  const edgeStyleOptions = [
    { value: "solid", label: "Solid", preview: "────" },
    { value: "dashed", label: "Dashed", preview: "╌ ╌ ╌" },
    { value: "dotted", label: "Dotted", preview: "· · · ·" },
  ];

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{
        width: w,
        height: h,
        position: "relative",
        cursor: editing ? "text" : "grab",
      }}
    >
      <NodeResizer 
        isVisible={selected} 
        minWidth={80} 
        minHeight={60}
        maxWidth={500}
        maxHeight={400}
        onResize={handleResize}
        handleStyle={{ 
          backgroundColor: '#a78bfa',
          width: 8,
          height: 8,
          border: '2px solid #fff'
        }}
        lineStyle={{ borderColor: '#a78bfa', borderWidth: 1 }}
      />
      
      {/* Centered Handles */}
      <Handle type="source" position={Position.Top} style={getHandleStyle()} />
      <Handle type="target" position={Position.Top} style={getHandleStyle()} />

      {/* Shape Background */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        {shape === "sphere" ? (
          <circle
            cx="50%"
            cy="50%"
            r={Math.min(w, h) / 2 - 2}
            fill={color}
            stroke={selected ? "#a78bfa" : "#444"}
            strokeWidth={selected ? 2 : 1.5}
          />
        ) : (
          <polygon
            points={getPolygonPoints(shape, w, h)}
            fill={color}
            stroke={selected ? "#a78bfa" : "#444"}
            strokeWidth={selected ? 2 : 1.5}
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: editing ? "all" : "none",
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
              width: "80%",
              textAlign: "center",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid #a78bfa",
              borderRadius: 6,
              color: "#1a1a1a",
              fontSize: fontSize,
              fontWeight: 600,
              padding: "4px 8px",
              outline: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            style={{
              color: textColor,
              fontWeight: 700,
              fontSize: fontSize,
              textAlign: "center",
              padding: "0 8px",
              userSelect: "none",
              textShadow: color === "#FFD966" ? "none" : "0 1px 2px rgba(0,0,0,0.2)",
              wordBreak: "break-word",
              maxWidth: "90%",
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
});

const nodeTypes = { shapeNode: ShapeNode };

// ─── Initial State ────────────────────────────────────────────────────────
const makeInitialNodes = (onLabelChange, onResize) => [
  {
    id: "1",
    type: "shapeNode",
    position: { x: 300, y: 200 },
    data: { 
      label: "Main Idea", 
      shape: "hexagon", 
      color: "#FFD966", 
      textColor: "#1a1a1a", 
      fontSize: 16,
      width: 150,
      height: 110,
      onLabelChange,
      onResize
    },
  },
];

// ─── Styles Component ─────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    
    * { box-sizing: border-box; }
    html, body, #root {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    body {
      background: #090712;
      color: #f8f8ff;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
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
      white-space: nowrap;
      pointer-events: auto;
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
    
    .toolbar-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
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
      z-index: 200;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.1);
      min-width: 260px;
      animation: panelIn 0.2s cubic-bezier(0.16,1,0.3,1);
      pointer-events: auto;
      max-height: 400px;
      overflow-y: auto;
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

    .color-swatch {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.15s;
      flex-shrink: 0;
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
    
    .font-size-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(124,58,237,0.1);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid rgba(167,139,250,0.2);
    }
    
    .font-size-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: #c4b5fd;
      cursor: pointer;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      transition: all 0.2s;
    }
    
    .font-size-btn:hover {
      background: rgba(124,58,237,0.3);
      color: #fff;
    }
    
    .font-size-display {
      min-width: 50px;
      text-align: center;
      font-size: 13px;
      font-weight: 600;
      color: #534bc5;
      padding: 0 4px;
    }
    
    .font-size-selector-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .font-size-input-group {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.05);
      padding: 8px;
      border-radius: 8px;
    }
    
    .font-size-label {
      color: #a78bfa;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 70px;
    }
    
    .font-size-number-input {
      width: 70px;
      padding: 6px 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(167,139,250,0.3);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      text-align: center;
      font-weight: 600;
    }
    
    .font-size-number-input:focus {
      outline: none;
      border-color: #a78bfa;
      background: rgba(255,255,255,0.15);
    }
    
    .font-size-dropdown {
      flex: 1;
      padding: 6px 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(167,139,250,0.3);
      border-radius: 6px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      font-weight: 600;
    }
    
    .font-size-dropdown option {
      background: #1a1a2e;
      padding: 4px;
    }
    
    .font-size-presets {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-top: 4px;
    }
    
    .font-size-preset-btn {
      padding: 6px 4px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(167,139,250,0.2);
      border-radius: 6px;
      color: #c4b5fd;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .font-size-preset-btn:hover {
      background: rgba(124,58,237,0.3);
      border-color: #a78bfa;
      color: #fff;
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
    
    @media (max-width: 768px) {
      .toolbar-btn {
        font-size: 11px;
        padding: 8px 10px;
        min-width: 72px;
      }
      .desktop-toolbar { display: none !important; }
      .mobile-menu-toggle { display: flex !important; }
      .panel {
        min-width: calc(100vw - 32px);
        left: 50% !important;
        transform: translateX(-50%);
        top: auto !important;
        bottom: 10px;
      }
      .hint-tag {
        right: 10px;
        left: 10px;
        bottom: 10px;
      }
      .react-flow__controls {
        left: 10px !important;
        right: auto !important;
        bottom: 10px !important;
      }
    }
    
    @media (min-width: 769px) {
      .mobile-menu-toggle { display: none !important; }
      .mobile-drawer { display: none !important; }
    }
    
    .mobile-menu-toggle {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(167,139,250,0.3);
      background: rgba(124,58,237,0.15);
      color: #c4b5fd;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      display: flex;
    }
    
    .mobile-drawer {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      background: rgba(10,6,25,0.98);
      border-bottom: 1px solid rgba(124,58,237,0.25);
      backdrop-filter: blur(20px);
      z-index: 40;
      max-height: calc(100vh - 64px);
      overflow-y: auto;
      animation: drawerSlide 0.3s ease;
      pointer-events: auto;
    }
    
    @keyframes drawerSlide {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .mobile-drawer-section {
      padding: 16px;
      border-bottom: 1px solid rgba(124,58,237,0.15);
    }
    
    .mobile-drawer-title {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7c3aed;
      margin-bottom: 12px;
    }
    
    .mobile-drawer-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .mobile-drawer-buttons .toolbar-btn {
      flex: 1;
      min-width: 100px;
    }

    .panel {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    transform: translate(-50%, -50%) !important;
    max-width: calc(100vw - 32px) !important;
    max-height: 80vh !important;
    overflow-y: auto !important;
    }
    
    @media (max-width: 768px) {
      .mobile-drawer {
        max-height: calc(100vh - 74px);
      }
      .mobile-drawer-section {
        padding: 12px;
      }
      .color-swatch {
        width: 24px;
        height: 24px;
      }
      .font-size-preset-btn {
        padding: 4px 2px;
        font-size: 11px;
      }
    }
  `}</style>
);

// ─── Font Size Control Component ──────────────────────────────────────────
const FontSizeControl = ({ fontSize, onFontSizeChange }) => {
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [inputValue, setInputValue] = useState(fontSize);

  const handleFontSizeChange = (newSize) => {
    const size = Math.max(8, Math.min(72, newSize));
    setInputValue(size);
    onFontSizeChange(size);
  };

  const increaseFont = () => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      handleFontSizeChange(FONT_SIZES[currentIndex + 1]);
    }
  };

  const decreaseFont = () => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex > 0) {
      handleFontSizeChange(FONT_SIZES[currentIndex - 1]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div className="font-size-toolbar">
        <button className="font-size-btn" onClick={decreaseFont} title="Decrease font size">
          A<span style={{ fontSize: 10 }}>▼</span>
        </button>
        <button 
          className="font-size-display"
          onClick={() => setShowFontPanel(!showFontPanel)}
          style={{ cursor: 'pointer' }}
        >
          {fontSize}px
        </button>
        <button className="font-size-btn" onClick={increaseFont} title="Increase font size">
          A<span style={{ fontSize: 10 }}>▲</span>
        </button>
      </div>

      {showFontPanel && (
        <>
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 199 
            }} 
            onClick={() => setShowFontPanel(false)} 
          />
          <div className="panel" style={{ top: "calc(100% + 8px)", right: 0, minWidth: 280 }}>
            <div className="panel-title">Font Size</div>
            <div className="font-size-selector-panel">
              <div className="font-size-input-group">
                <span className="font-size-label">Size</span>
                <input
                  type="number"
                  className="font-size-number-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(parseInt(e.target.value) || 8)}
                  onBlur={() => handleFontSizeChange(inputValue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFontSizeChange(inputValue);
                      setShowFontPanel(false);
                    }
                  }}
                  min={8}
                  max={72}
                />
                <span style={{ color: '#a78bfa', fontSize: 11 }}>px</span>
              </div>
              
              <div className="font-size-input-group">
                <span className="font-size-label">Preset</span>
                <select 
                  className="font-size-dropdown"
                  value={fontSize}
                  onChange={(e) => {
                    handleFontSizeChange(parseInt(e.target.value));
                    setShowFontPanel(false);
                  }}
                >
                  {FONT_SIZES.map(size => (
                    <option key={size} value={size}>{size} px</option>
                  ))}
                </select>
              </div>

              <div className="font-size-presets">
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                  <button
                    key={size}
                    className="font-size-preset-btn"
                    onClick={() => {
                      handleFontSizeChange(size);
                      setShowFontPanel(false);
                    }}
                    style={{
                      background: fontSize === size ? 'rgba(124,58,237,0.5)' : undefined,
                      borderColor: fontSize === size ? '#675e80' : undefined,
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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
  const [fontSize, setFontSize] = useState(16);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [edgeColor, setEdgeColor] = useState("#a78bfa");
  const [edgeWidth, setEdgeWidth] = useState(2);
  const [edgeStyle, setEdgeStyle] = useState("solid");
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [showEdgePanel, setShowEdgePanel] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  const handleLabelChange = useCallback((id, newLabel) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n)
    );
  }, []);

  const handleResize = useCallback((id, width, height) => {
    setNodes((nds) =>
      nds.map((n) => n.id === id ? { 
        ...n, 
        data: { ...n.data, width, height },
        style: { ...n.style, width, height }
      } : n)
    );
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD 2: Initialize history with initial state
  // ═══════════════════════════════════════════════════════════════════════════
  
  const initialNodes = makeInitialNodes(handleLabelChange, handleResize);
  const { 
    present: historyState, 
    pushState, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    clearHistory 
  } = useHistory({ nodes: initialNodes, edges: [] });

  // ═══════════════════════════════════════════════════════════════════════════
  // END ADD 2
  // ═══════════════════════════════════════════════════════════════════════════

  const [nodes, setNodes, onNodesChange] = useNodesState(
    historyState?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    historyState?.edges || []
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD 3: History push helper
  // ═══════════════════════════════════════════════════════════════════════════
  
  const pushHistoryState = useCallback(() => {
    // Use setTimeout to ensure state is updated before pushing
    setTimeout(() => {
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          pushState({ nodes: currentNodes, edges: currentEdges });
          return currentEdges;
        });
        return currentNodes;
      });
    }, 0);
  }, [pushState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // END ADD 3
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 1: Update onConnect to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
  const onConnect = useCallback(
  (params) => {
    const getStrokeDasharray = () => {
      if (edgeStyle === "dashed") return "8,4";
      if (edgeStyle === "dotted") return "2,4";
      return "none";
    };
    
    setEdges((eds) => addEdge({ 
      ...params, 
      type: "default",
      style: { 
        stroke: edgeColor, 
        strokeWidth: edgeWidth,
        strokeDasharray: getStrokeDasharray(),
      },
      animated: edgeAnimated,
    }, eds));
    
    // ADD THIS LINE:
    pushHistoryState();
  },
  [edgeColor, edgeWidth, edgeStyle, edgeAnimated, pushHistoryState]
);

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 1
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 2: Update addNode to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addNode = () => {
    const id = Date.now().toString();
    const newNode = {
      id,
      type: "shapeNode",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: "New Idea",
        shape: selectedShape,
        color: nodeColor,
        textColor: textColor,
        fontSize: fontSize,
        width: 150,
        height: 110,
        onLabelChange: handleLabelChange,
        onResize: handleResize,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    // ADD THIS LINE:
    pushHistoryState();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 2
  // ═══════════════════════════════════════════════════════════════════════════

  const onNodeClick = (_, node) => {
    setSelectedNodeId(node.id);
    setNodeColor(node.data.color || "#FFD966");
    setTextColor(node.data.textColor || "#1a1a1a");
    setFontSize(node.data.fontSize || 16);
    setSelectedShape(node.data.shape || "hexagon");
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, opacity: n.id === node.id ? 1 : 0.4 },
      }))
    );
  };

  const onEdgeClick = (_, edge) => {
  setSelectedEdgeId(edge.id);
  setEdgeColor(edge.style?.stroke || "#a78bfa");
  setEdgeWidth(edge.style?.strokeWidth || 2);
  
  const dash = edge.style?.strokeDasharray;
  if (dash === "8,4") setEdgeStyle("dashed");
  else if (dash === "2,4") setEdgeStyle("dotted");
  else setEdgeStyle("solid");
  
  setEdgeAnimated(edge.animated || false);
  
  setEdges((eds) =>
    eds.map((e) => ({
      ...e,
      style: { 
        ...e.style, 
        opacity: e.id === edge.id ? 1 : 0.3,
        strokeWidth: e.id === edge.id ? edgeWidth + 1 : e.style?.strokeWidth || 2,
      },
    }))
  );
};

  const onPaneClick = () => {
  setSelectedNodeId(null);
  setSelectedEdgeId(null);
  setNodes((nds) => nds.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })));
  setEdges((eds) => eds.map((e) => ({ 
    ...e, 
    style: { ...e.style, opacity: 1, strokeWidth: e.style?.strokeWidth || 2 }
  })));
  setShowColorPanel(false);
  setShowBgPanel(false);
  setShowShapeDropdown(false);
  setShowEdgePanel(false);
  setShowMobileMenu(false);
};

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 3: Update applyColorToNode to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
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
    // ADD THIS LINE:
    pushHistoryState();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 3
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 4: Update applyFontSize to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
  const applyFontSize = (size) => {
    setFontSize(size);
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? { ...n, data: { ...n.data, fontSize: size } }
          : n
      )
    );
    // ADD THIS LINE:
    pushHistoryState();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 4
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 5: Update applyShapeToNode to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
  const applyShapeToNode = (shape) => {
    setSelectedShape(shape);
    setShowShapeDropdown(false);
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, shape } } : n
      )
    );
    // ADD THIS LINE:
    pushHistoryState();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 5
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFY 6: Update applyEdgeStyle to push history
  // ═══════════════════════════════════════════════════════════════════════════
  
  const applyEdgeStyle = (updates) => {
  if (!selectedEdgeId) return;
  
  setEdges((eds) =>
    eds.map((e) =>
      e.id === selectedEdgeId
        ? {
            ...e,
            style: { ...e.style, ...updates },
            animated: updates.animated !== undefined ? updates.animated : e.animated,
          }
        : e
    )
  );
  // ADD THIS LINE:
  pushHistoryState();
};

  // ═══════════════════════════════════════════════════════════════════════════
  // END MODIFY 6
  // ═══════════════════════════════════════════════════════════════════════════

  const resetView = () => {
    setNodes(makeInitialNodes(handleLabelChange, handleResize));
    setEdges([]);
    setSelectedNodeId(null);
    setBgColor("#0f0f1a");
    setFontSize(16);
    setNodeColor("#FFD966");
    setTextColor("#1a1a1a");
    setSelectedShape("hexagon");
    // ADD THIS LINE:
    pushHistoryState();
  };

  const autoArrange = () => {
    setNodes((nds) =>
      nds.map((node, index) => {
        const cols = Math.ceil(Math.sqrt(nds.length));
        return {
          ...node,
          position: {
            x: (index % cols) * 220 + 100,
            y: Math.floor(index / cols) * 180 + 100,
          },
        };
      })
    );
    // ADD THIS LINE:
    pushHistoryState();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD 4: Save & Load functions
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = useCallback(() => {
    const state = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.data.label,
          shape: n.data.shape,
          color: n.data.color,
          textColor: n.data.textColor,
          fontSize: n.data.fontSize,
          width: n.data.width,
          height: n.data.height,
        },
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        style: e.style,
        animated: e.animated,
      })),
      bgColor,
      edgeColor,
      edgeWidth,
      edgeStyle,
      edgeAnimated,
    };
    
    if (saveToStorage(state)) {
      alert('✅ Mind map saved successfully!');
    }
  }, [nodes, edges, bgColor, edgeColor, edgeWidth, edgeStyle, edgeAnimated]);

  const handleLoad = useCallback(() => {
    const saved = loadFromStorage();
    if (!saved) {
      alert('No saved mind map found');
      return;
    }
    
    const loadedNodes = saved.nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onLabelChange: handleLabelChange,
        onResize: handleResize,
      },
    }));
    
    setNodes(loadedNodes);
    setEdges(saved.edges || []);
    setBgColor(saved.bgColor || "#0f0f1a");
    if (saved.edgeColor) setEdgeColor(saved.edgeColor);
    if (saved.edgeWidth) setEdgeWidth(saved.edgeWidth);
    if (saved.edgeStyle) setEdgeStyle(saved.edgeStyle);
    setEdgeAnimated(saved.edgeAnimated || false);
    
    clearHistory();
    pushState({ nodes: loadedNodes, edges: saved.edges || [] });
  }, [handleLabelChange, handleResize, setNodes, setEdges, clearHistory, pushState]);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            label: n.data.label,
            shape: n.data.shape,
            color: n.data.color,
            textColor: n.data.textColor,
            fontSize: n.data.fontSize,
            width: n.data.width,
            height: n.data.height,
          },
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          style: e.style,
          animated: e.animated,
        })),
        bgColor,
        edgeColor,
        edgeWidth,
        edgeStyle,
        edgeAnimated,
      };
      saveToStorage(state);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [nodes, edges, bgColor, edgeColor, edgeWidth, edgeStyle, edgeAnimated]);

  // ═══════════════════════════════════════════════════════════════════════════
  // END ADD 4
  // ═══════════════════════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════════════════════
  // ADD 5: Keyboard shortcuts
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prevState = undo();
        if (prevState) {
          setNodes(prevState.nodes);
          setEdges(prevState.edges);
        }
      }
      
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const nextState = redo();
        if (nextState) {
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
        }
      }
      
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleSave, setNodes, setEdges]);

  // ═══════════════════════════════════════════════════════════════════════════
  // END ADD 5
  // ═══════════════════════════════════════════════════════════════════════════

  return (
  <div style={{ width: "100%", height: "100vh", fontFamily: "'Syne', sans-serif", overflow: "hidden", position: "relative", display: "flex" }}>
    <GlobalStyles />

    {/* LEFT SIDEBAR - All controls in one place */}
    <div style={{
      width: 280,
      height: '100vh',
      background: "rgba(10,6,25,0.95)",
      borderRight: "1px solid rgba(124,58,237,0.25)",
      display: "flex",
      flexDirection: "column",
      padding: 16,
      overflowY: 'auto',
      backdropFilter: "blur(20px)",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32,
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>⬡</div>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800, fontSize: 18,
          background: "linear-gradient(135deg, #a78bfa, #818cf8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>KALAM</span>
      </div>

      {/* Add Node */}
      <button onClick={addNode} className="toolbar-btn" style={{ marginBottom: 8, width: '100%' }}>
        + Add {selectedShape}
      </button>

      {/* Shape Selection */}
      <div className="panel-title" style={{ marginTop: 16 }}>Shape</div>
      <div style={{ marginBottom: 16 }}>
        {SHAPES.map(s => (
          <div
            key={s}
            className="shape-option"
            style={{ 
              background: s === selectedShape ? "rgba(124,58,237,0.25)" : undefined,
              marginBottom: 4,
            }}
            onClick={() => applyShapeToNode(s)}
          >
            <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{shapeIcons[s]}</span>
            <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* Font Size */}
      <div className="panel-title">Font Size</div>
      <div style={{ marginBottom: 16 }}>
        <FontSizeControl fontSize={fontSize} onFontSizeChange={applyFontSize} />
      </div>

      {/* Node Colors */}
      <div className="panel-title">Node Fill Color</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {colorPresets.map(c => (
          <div key={c} className="color-swatch" style={{
            background: c,
            width: 28, height: 28,
            boxShadow: c === nodeColor ? `0 0 0 2px #a78bfa` : undefined,
          }} onClick={() => applyColorToNode(c, "node")} />
        ))}
      </div>

      {/* Text Colors */}
      <div className="panel-title">Text Color</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {["#1a1a1a","#ffffff","#7c3aed","#FFD966","#4ECDC4","#FF6B6B"].map(c => (
          <div key={c} className="color-swatch" style={{
            background: c,
            width: 28, height: 28,
            border: c === textColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
          }} onClick={() => applyColorToNode(c, "text")} />
        ))}
      </div>

      {/* Edge Styling */}
      <div className="panel-title" style={{ marginTop: 8 }}>Edge Style</div>

      {/* Edge Color */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#c4b5fd', fontSize: 10, marginBottom: 4 }}>Color</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {edgeColorPresets.map(c => (
            <div key={c} className="color-swatch" style={{
              background: c,
              width: 28, height: 28,
              boxShadow: c === edgeColor ? `0 0 0 2px #a78bfa` : undefined,
            }} onClick={() => {
              setEdgeColor(c);
              if (selectedEdgeId) applyEdgeStyle({ stroke: c });
            }} />
          ))}
        </div>
      </div>

      {/* Edge Width */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ color: '#c4b5fd', fontSize: 10, marginBottom: 4 }}>
          Thickness: {edgeWidth}px
        </div>
        <input
          type="range"
          min="1"
          max="6"
          step="0.5"
          value={edgeWidth}
          onChange={(e) => {
            const width = parseFloat(e.target.value);
            setEdgeWidth(width);
            if (selectedEdgeId) applyEdgeStyle({ strokeWidth: width });
          }}
          style={{ width: '100%', accentColor: '#a78bfa' }}
        />
      </div>

      {/* Edge Style Buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {edgeStyleOptions.map(option => (
          <button
            key={option.value}
            onClick={() => {
              setEdgeStyle(option.value);
              const dash = option.value === "dashed" ? "8,4" : option.value === "dotted" ? "2,4" : "none";
              if (selectedEdgeId) applyEdgeStyle({ strokeDasharray: dash });
            }}
            style={{
              flex: 1,
              padding: '6px 4px',
              background: edgeStyle === option.value ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${edgeStyle === option.value ? '#a78bfa' : 'rgba(167,139,250,0.2)'}`,
              borderRadius: 6,
              color: edgeStyle === option.value ? '#fff' : '#c4b5fd',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {option.preview}
          </button>
        ))}
      </div>

      {/* Animated Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={edgeAnimated}
          onChange={(e) => {
            setEdgeAnimated(e.target.checked);
            if (selectedEdgeId) {
              setEdges((eds) => eds.map(edge => 
                edge.id === selectedEdgeId ? { ...edge, animated: e.target.checked } : edge
              ));
            }
          }}
          style={{ accentColor: '#a78bfa', width: 16, height: 16 }}
        />
        <span style={{ color: '#c4b5fd', fontSize: 11 }}>Animated edges</span>
      </label>

      {!selectedEdgeId && (
        <div style={{ 
          marginBottom: 16,
          padding: 6, 
          background: 'rgba(124,58,237,0.1)',
          borderRadius: 4,
          fontSize: 10,
          color: '#a78bfa',
          textAlign: 'center',
        }}>
          Click an edge to edit existing
        </div>
      )}

      {/* Canvas Colors */}
      <div className="panel-title">Canvas Background</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {bgPresets.map(c => (
          <div key={c} className="color-swatch" style={{
            background: c,
            width: 28, height: 28,
            border: c === bgColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
          }} onClick={() => setBgColor(c)} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ADD 6: Undo/Redo buttons in sidebar */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <div className="panel-title">History</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className="toolbar-btn"
          onClick={() => {
            const prevState = undo();
            if (prevState) {
              setNodes(prevState.nodes);
              setEdges(prevState.edges);
            }
          }}
          disabled={!canUndo}
          style={{ flex: 1 }}
        >
          ↩ Undo
        </button>
        <button
          className="toolbar-btn"
          onClick={() => {
            const nextState = redo();
            if (nextState) {
              setNodes(nextState.nodes);
              setEdges(nextState.edges);
            }
          }}
          disabled={!canRedo}
          style={{ flex: 1 }}
        >
          ↪ Redo
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* END ADD 6 */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ADD 7: Save/Load buttons in sidebar */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      
      <div className="panel-title">Save & Load</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className="toolbar-btn"
          onClick={handleSave}
          style={{ flex: 1 }}
        >
          💾 Save
        </button>
        <button
          className="toolbar-btn"
          onClick={handleLoad}
          style={{ flex: 1, color: '#4ECDC4' }}
        >
          📂 Load
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* END ADD 7 */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}

      {/* Actions */}
      <div className="panel-title">Actions</div>
      <button className="toolbar-btn" onClick={autoArrange} style={{ marginBottom: 8, width: '100%' }}>
        ⊞ Arrange
      </button>
      <button
        className="toolbar-btn"
        onClick={resetView}
        style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171", width: '100%' }}
      >
        ↺ Reset
      </button>
    </div>

    {/* CANVAS AREA */}
    <div style={{ flex: 1, background: bgColor, transition: "background 0.4s ease" }}>
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
        connectionMode={ConnectionMode.Loose}
        connectionRadius={40}
        defaultEdgeOptions={{
          type: "default",
          style: { stroke: "#a78bfa", strokeWidth: 2 },
          animated: false,
        }}
      >
        <Background color={bgColor > "#cccccc" ? "rgba(0,0,0,0.12)" : "rgba(167,139,250,0.12)"} gap={28} size={1.5} />
        <Controls />
      </ReactFlow>
    </div>

    {/* ═══════════════════════════════════════════════════════════════════════════ */}
    {/* MODIFY 7: Update hint tag with new shortcuts */}
    {/* ═══════════════════════════════════════════════════════════════════════════ */}
    
    <div className="hint-tag">
      <div>✏️ Double-click node → edit label</div>
      <div>⚡ Drag from center → connect nodes</div>
      <div>🎯 Click node → select & style</div>
      <div>📏 Drag node corners → resize</div>
      <div>⌨️ Ctrl+Z → undo | Ctrl+Shift+Z → redo</div>
      <div>💾 Ctrl+S → save mind map</div>
    </div>

    {/* ═══════════════════════════════════════════════════════════════════════════ */}
    {/* END MODIFY 7 */}
    {/* ═══════════════════════════════════════════════════════════════════════════ */}
  </div>
);
}