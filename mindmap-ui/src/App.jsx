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
  "#0f0f1a","#1a1a2e","#0d1117","#111827","#0c0c0c",
  "#1e1b4b","#0f172a","#18181b","#1c1917","#162032",
  "#e8e8e0","#f0ece4","#faf7f2","#f5f0eb","#fffbf5",
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

const EdgeStylePanel = ({ 
  edgeColor, setEdgeColor, edgeWidth, setEdgeWidth, 
  edgeStyle, setEdgeStyle, edgeAnimated, setEdgeAnimated,
  selectedEdgeId, applyEdgeStyle,setEdges
}) => {
  const handleEdgeColorChange = (color) => {
    setEdgeColor(color);
    if (selectedEdgeId) {
      applyEdgeStyle({ stroke: color });
    }
  };

  const handleEdgeWidthChange = (width) => {
    setEdgeWidth(width);
    if (selectedEdgeId) {
      applyEdgeStyle({ strokeWidth: width });
    }
  };

  const handleEdgeStyleChange = (style) => {
    setEdgeStyle(style);
    if (selectedEdgeId) {
      const dash = style === "dashed" ? "8,4" : style === "dotted" ? "2,4" : "none";
      applyEdgeStyle({ strokeDasharray: dash });
    }
  };

  const handleAnimatedChange = (animated) => {
    setEdgeAnimated(animated);
    if (selectedEdgeId) {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === selectedEdgeId ? { ...e, animated } : e
        )
      );
    }
  };

  return (
    <div className="panel" style={{ top: "calc(100% + 8px)", right: 0, minWidth: 280 }}>
      <div className="panel-title">
        Edge Style {selectedEdgeId && <span style={{ color: '#4ECDC4' }}> (Selected)</span>}
      </div>
      
      {/* Edge Color */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
          Color
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {edgeColorPresets.map(c => (
            <div 
              key={c} 
              className="color-swatch" 
              style={{
                background: c,
                boxShadow: c === edgeColor ? `0 0 0 2px #a78bfa, 0 0 10px rgba(167,139,250,0.4)` : undefined,
              }} 
              onClick={() => handleEdgeColorChange(c)} 
            />
          ))}
        </div>
      </div>

      {/* Edge Width */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
          Thickness: {edgeWidth}px
        </div>
        <input
          type="range"
          min="1"
          max="8"
          step="0.5"
          value={edgeWidth}
          onChange={(e) => handleEdgeWidthChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#a78bfa',
            background: 'rgba(124,58,237,0.2)',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 10, color: '#c4b5fd' }}>Thin</span>
          <span style={{ fontSize: 10, color: '#c4b5fd' }}>Thick</span>
        </div>
      </div>

      {/* Edge Style (Solid/Dashed/Dotted) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
          Line Style
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {edgeStyleOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleEdgeStyleChange(option.value)}
              style={{
                flex: 1,
                padding: '8px',
                background: edgeStyle === option.value ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${edgeStyle === option.value ? '#a78bfa' : 'rgba(167,139,250,0.2)'}`,
                borderRadius: 8,
                color: edgeStyle === option.value ? '#fff' : '#c4b5fd',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 2 }}>{option.preview}</div>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Toggle */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8,
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={edgeAnimated}
            onChange={(e) => handleAnimatedChange(e.target.checked)}
            style={{
              accentColor: '#a78bfa',
              width: 18,
              height: 18,
              cursor: 'pointer',
            }}
          />
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
            Animated (flowing dash)
          </span>
        </label>
      </div>

      {!selectedEdgeId && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          background: 'rgba(124,58,237,0.1)',
          borderRadius: 6,
          fontSize: 11,
          color: '#a78bfa',
          textAlign: 'center',
        }}>
          Click an edge to edit existing connections
        </div>
      )}
    </div>
  );
};

// ─── Toolbar Component ────────────────────────────────────────────────────
const Toolbar = ({
  selectedShape, showShapeDropdown, setShowShapeDropdown,
  showColorPanel, setShowColorPanel, showBgPanel, setShowBgPanel,
  showEdgePanel, setShowEdgePanel,  // Add these
  nodeColor, textColor, bgColor, fontSize, addNode, applyShapeToNode,
  applyColorToNode, setBgColor, applyFontSize, autoArrange, resetView,
  selectedNodeId,
  edgeColor, edgeWidth, edgeStyle, edgeAnimated,  // Add these
  setEdgeColor, setEdgeWidth, setEdgeStyle, setEdgeAnimated,  // Add these
  selectedEdgeId, applyEdgeStyle, setEdges // Add these
}) => (
  <>
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

    <div className="desktop-toolbar" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", display: "flex", gap: 8 }}>
        <button onClick={addNode} className="toolbar-btn">+ Add {selectedShape}</button>
        <button
          className={`toolbar-btn ${showShapeDropdown ? "active" : ""}`}
          onClick={() => { setShowShapeDropdown(p => !p); setShowColorPanel(false); setShowBgPanel(false); }}
        >
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

      {/* Font Size Control - Now visible in main toolbar! */}
      <FontSizeControl 
        fontSize={fontSize} 
        onFontSizeChange={applyFontSize}
      />

      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${showColorPanel ? "active" : ""}`}
          onClick={() => { setShowColorPanel(p => !p); setShowBgPanel(false); setShowShapeDropdown(false); }}
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          <span style={{
            display: "inline-block", width: 14, height: 14,
            borderRadius: "50%", background: nodeColor,
            border: "1.5px solid rgba(255,255,255,0.3)",
          }} />
          Colors
        </button>
        {showColorPanel && (
          <div className="panel" style={{ top: "calc(100% + 8px)", left: 0, minWidth: 240 }}>
            <div className="panel-title">Node Fill Color</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {colorPresets.map(c => (
                <div key={c} className="color-swatch" style={{
                  background: c,
                  boxShadow: c === nodeColor ? `0 0 0 2px #a78bfa, 0 0 10px rgba(167,139,250,0.4)` : undefined,
                }} onClick={() => applyColorToNode(c, "node")} />
              ))}
            </div>
            <div className="panel-title">Text Color</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["#1a1a1a","#ffffff","#7c3aed","#FFD966","#4ECDC4","#FF6B6B"].map(c => (
                <div key={c} className="color-swatch" style={{
                  background: c,
                  border: c === textColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                }} onClick={() => applyColorToNode(c, "text")} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${showBgPanel ? "active" : ""}`}
          onClick={() => { setShowBgPanel(p => !p); setShowColorPanel(false); setShowShapeDropdown(false); }}
          style={{ display: "flex", alignItems: "center", gap: 7 }}
        >
          <span style={{
            display: "inline-block", width: 14, height: 14,
            borderRadius: 3, background: bgColor,
            border: "1.5px solid rgba(255,255,255,0.3)",
          }} />
          Canvas
        </button>
        {showBgPanel && (
          <div className="panel" style={{ top: "calc(100% + 8px)", right: 0 }}>
            <div className="panel-title">Canvas Background</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {bgPresets.map(c => (
                <div key={c} className="color-swatch" style={{
                  background: c,
                  border: c === bgColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                  boxShadow: c === bgColor ? "0 0 10px rgba(167,139,250,0.4)" : undefined,
                }} onClick={() => setBgColor(c)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

        <div className="desktop-toolbar" style={{ position: "relative" }}>
      <button
        className={`toolbar-btn ${showEdgePanel ? "active" : ""}`}
        onClick={() => { 
          setShowEdgePanel(p => !p); 
          setShowColorPanel(false); 
          setShowBgPanel(false); 
          setShowShapeDropdown(false); 
        }}
        style={{ display: "flex", alignItems: "center", gap: 7 }}
      >
        <span style={{
          display: "inline-block", 
          width: 20, 
          height: 3,
          borderRadius: 2,
          background: edgeColor,
          border: "1px solid rgba(255,255,255,0.3)",
        }} />
        Edge
      </button>
      {showEdgePanel && (
      <EdgeStylePanel
        edgeColor={edgeColor}
        setEdgeColor={setEdgeColor}
        edgeWidth={edgeWidth}
        setEdgeWidth={setEdgeWidth}
        edgeStyle={edgeStyle}
        setEdgeStyle={setEdgeStyle}
        edgeAnimated={edgeAnimated}
        setEdgeAnimated={setEdgeAnimated}
        selectedEdgeId={selectedEdgeId}
        applyEdgeStyle={applyEdgeStyle}
        setEdges={setEdges}
      />
      )}
      </div>
  


    <div className="desktop-toolbar" style={{ display: "flex", gap: 8 }}>
      <button className="toolbar-btn" onClick={autoArrange}>⊞ Arrange</button>
      <button
        className="toolbar-btn"
        onClick={resetView}
        style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}
      >↺ Reset</button>
    </div>
  </>
);

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
  const [edgeStyle, setEdgeStyle] = useState("solid"); // "solid", "dashed", "dotted"
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

  const [nodes, setNodes, onNodesChange] = useNodesState(
    makeInitialNodes(handleLabelChange, handleResize)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
  },
  [edgeColor, edgeWidth, edgeStyle, edgeAnimated]
);

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
  };

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
  
  // Highlight selected edge
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
  };

  const applyShapeToNode = (shape) => {
    setSelectedShape(shape);
    setShowShapeDropdown(false);
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId ? { ...n, data: { ...n.data, shape } } : n
      )
    );
  };

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
};

  const resetView = () => {
    setNodes(makeInitialNodes(handleLabelChange, handleResize));
    setEdges([]);
    setSelectedNodeId(null);
    setBgColor("#0f0f1a");
    setFontSize(16);
    setNodeColor("#FFD966");
    setTextColor("#1a1a1a");
    setSelectedShape("hexagon");
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
  };

  return (
    <div style={{ width: "100%", height: "100vh", fontFamily: "'Syne', sans-serif", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
      <GlobalStyles />

      {/* Toolbar */}
      <div style={{
        position: "relative", 
        minHeight: 64,
        flexShrink: 0,
        background: "rgba(10,6,25,0.95)",
        borderBottom: "1px solid rgba(124,58,237,0.25)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 50,
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
      }}>
        <Toolbar
          selectedShape={selectedShape}
          showShapeDropdown={showShapeDropdown}
          setShowShapeDropdown={setShowShapeDropdown}
          showColorPanel={showColorPanel}
          setShowColorPanel={setShowColorPanel}
          showBgPanel={showBgPanel}
          setShowBgPanel={setShowBgPanel}
          showEdgePanel={showEdgePanel}
          setShowEdgePanel={setShowEdgePanel}
          nodeColor={nodeColor}
          textColor={textColor}
          bgColor={bgColor}
          fontSize={fontSize}
          addNode={addNode}
          applyShapeToNode={applyShapeToNode}
          applyColorToNode={applyColorToNode}
          setBgColor={setBgColor}
          applyFontSize={applyFontSize}
          autoArrange={autoArrange}
          resetView={resetView}
          selectedNodeId={selectedNodeId}
          edgeColor={edgeColor}
          edgeWidth={edgeWidth}
          edgeStyle={edgeStyle}
          edgeAnimated={edgeAnimated}
          setEdgeColor={setEdgeColor}
          setEdgeWidth={setEdgeWidth}
          setEdgeStyle={setEdgeStyle}
          setEdgeAnimated={setEdgeAnimated}
          selectedEdgeId={selectedEdgeId}
          applyEdgeStyle={applyEdgeStyle}
          setEdges={setEdges}
        />

        <button className="mobile-menu-toggle" onClick={() => setShowMobileMenu(!showMobileMenu)}>☰</button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Add Node</div>
            <button onClick={() => { addNode(); setShowMobileMenu(false); }} className="toolbar-btn">+ Add {selectedShape}</button>
          </div>
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Shape</div>
            {SHAPES.map(s => (
              <div key={s} className="shape-option" style={{ background: s === selectedShape ? "rgba(124,58,237,0.25)" : undefined }}
                onClick={() => { applyShapeToNode(s); setShowMobileMenu(false); }}>
                <span>{shapeIcons[s]}</span> <span>{s}</span>
              </div>
            ))}
          </div>
          
          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Node Colors</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Fill</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {colorPresets.map(c => (
                  <div key={c} className="color-swatch" style={{
                    background: c,
                    boxShadow: c === nodeColor ? `0 0 0 2px #a78bfa, 0 0 10px rgba(167,139,250,0.4)` : undefined,
                  }} onClick={() => applyColorToNode(c, "node")} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 6, fontWeight: 600 }}>Text</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["#1a1a1a","#ffffff","#7c3aed","#FFD966","#4ECDC4","#FF6B6B"].map(c => (
                  <div key={c} className="color-swatch" style={{
                    background: c,
                    border: c === textColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                  }} onClick={() => applyColorToNode(c, "text")} />
                ))}
              </div>
            </div>
          </div>

          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Font Size</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <button className="font-size-btn" onClick={() => { const currentIndex = FONT_SIZES.indexOf(fontSize); if (currentIndex > 0) applyFontSize(FONT_SIZES[currentIndex - 1]); }} title="Decrease font size">
                A<span style={{ fontSize: 10 }}>▼</span>
              </button>
              <div style={{ flex: 1, padding: '6px 8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                {fontSize}px
              </div>
              <button className="font-size-btn" onClick={() => { const currentIndex = FONT_SIZES.indexOf(fontSize); if (currentIndex < FONT_SIZES.length - 1) applyFontSize(FONT_SIZES[currentIndex + 1]); }} title="Increase font size">
                A<span style={{ fontSize: 10 }}>▲</span>
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <button
                  key={size}
                  className="font-size-preset-btn"
                  onClick={() => applyFontSize(size)}
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

          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Edge Style</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>Color</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {edgeColorPresets.map(c => (
                  <div 
                    key={c} 
                    className="color-swatch" 
                    style={{
                      background: c,
                      boxShadow: c === edgeColor ? `0 0 0 2px #a78bfa, 0 0 10px rgba(167,139,250,0.4)` : undefined,
                    }} 
                    onClick={() => { setEdgeColor(c); if (selectedEdgeId) applyEdgeStyle({ stroke: c }); }} 
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>
                Thickness: {edgeWidth}px
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={edgeWidth}
                onChange={(e) => { const width = parseFloat(e.target.value); setEdgeWidth(width); if (selectedEdgeId) applyEdgeStyle({ strokeWidth: width }); }}
                style={{
                  width: '100%',
                  accentColor: '#a78bfa',
                  background: 'rgba(124,58,237,0.2)',
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#a78bfa', fontSize: 11, marginBottom: 8, fontWeight: 600 }}>Line Style</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {edgeStyleOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => { setEdgeStyle(option.value); if (selectedEdgeId) { const dash = option.value === "dashed" ? "8,4" : option.value === "dotted" ? "2,4" : "none"; applyEdgeStyle({ strokeDasharray: dash }); } }}
                    style={{
                      flex: 1,
                      minWidth: 60,
                      padding: '8px',
                      background: edgeStyle === option.value ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${edgeStyle === option.value ? '#a78bfa' : 'rgba(167,139,250,0.2)'}`,
                      borderRadius: 8,
                      color: edgeStyle === option.value ? '#fff' : '#c4b5fd',
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={edgeAnimated}
                  onChange={(e) => { setEdgeAnimated(e.target.checked); if (selectedEdgeId) { setEdges((eds) => eds.map((edge) => edge.id === selectedEdgeId ? { ...edge, animated: e.target.checked } : edge)); } }}
                  style={{
                    accentColor: '#a78bfa',
                    width: 18,
                    height: 18,
                    cursor: 'pointer',
                  }}
                />
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Animated</span>
              </label>
            </div>
          </div>

          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Canvas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {bgPresets.map(c => (
                <div key={c} className="color-swatch" style={{
                  background: c,
                  border: c === bgColor ? "2px solid #a78bfa" : "2px solid rgba(255,255,255,0.1)",
                  boxShadow: c === bgColor ? "0 0 10px rgba(167,139,250,0.4)" : undefined,
                }} onClick={() => setBgColor(c)} />
              ))}
            </div>
          </div>

          <div className="mobile-drawer-section">
            <div className="mobile-drawer-title">Actions</div>
            <button className="toolbar-btn" onClick={() => { autoArrange(); setShowMobileMenu(false); }}>⊞ Arrange</button>
            <button className="toolbar-btn" onClick={() => { resetView(); setShowMobileMenu(false); }} style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171" }}>↺ Reset</button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ flex: 1, background: bgColor, transition: "background 0.4s ease" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          connectionMode={ConnectionMode.Loose}
          connectionRadius={40}
          defaultEdgeOptions={{
            type: "default",
            style: { 
              stroke: edgeColor, 
              strokeWidth: edgeWidth,
              strokeDasharray: edgeStyle === "dashed" ? "8,4" : edgeStyle === "dotted" ? "2,4" : "none",
            },
            animated: edgeAnimated,
          }}
        >
          <Background color={bgColor > "#cccccc" ? "rgba(0,0,0,0.12)" : "rgba(167,139,250,0.12)"} gap={28} size={1.5} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Hint */}
      <div className="hint-tag">
        <div>✏️ Double-click node → edit label</div>
        <div>⚡ Drag from center → connect nodes</div>
        <div>🎯 Click node → select & style</div>
        <div>🔗 Click edge → select & style</div>
        <div>📏 Drag node corners → resize</div>
        <div>🔤 Use toolbar to change font size</div>
      </div>
    </div>
  );
}