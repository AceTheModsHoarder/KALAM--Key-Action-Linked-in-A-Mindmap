# KALAM: Key-Action-Linked-in-A-Mindmap

## Executive Summary

KALAM is a sophisticated, canvas-based visual knowledge mapping platform designed to revolutionize the way users organize, visualize, and interconnect complex ideas. Unlike traditional linear note-taking applications, KALAM provides an intuitive, spatially-oriented workspace where users create semantic networks through interactive node creation, dynamic connections, and real-time styling capabilities.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
  - [Core Interactions](#core-interactions)
  - [Styling and Customization](#styling-and-customization)
  - [Edge Management](#edge-management)
- [Architecture](#architecture)
- [Build and Deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

KALAM (Key-Action-Linked-in-A-Mindmap) is a cross-platform knowledge visualization application built with modern web technologies. It provides a canvas-based interface for creating interactive mindmaps, conceptual diagrams, and knowledge graphs. The application is optimized for both desktop and mobile platforms through Capacitor, enabling seamless deployment to native iOS and Android environments.

### Use Cases

- Knowledge management and organization
- Brainstorming and ideation sessions
- Concept mapping for educational purposes
- Business process visualization
- Project planning and dependency mapping
- Semantic network creation

---

## Key Features

### 1. Dynamic Node Management
- Create nodes with customizable shapes (rectangle, triangle, square, pentagon, hexagon, heptagon, octagon, nonagon, decagon, sphere)
- Real-time label editing with double-click activation
- Resizable nodes with configurable dimensions
- Font size control with preset options (8px to 72px)
- Opacity and depth layering

### 2. Advanced Styling System
- **Node Customization**
  - 20+ color presets for node fill
  - Independent text color selection
  - Shape morphing across 10+ geometric forms
  - Dynamic text rendering with anti-aliasing

- **Canvas Appearance**
  - 15 background color presets
  - Dark and light theme support
  - Background grid visualization
  - Smooth color transitions

- **Edge Styling**
  - 10 color presets for connections
  - Adjustable stroke width (1-8px)
  - Multiple line styles (solid, dashed, dotted)
  - Animated flowing dash effect
  - Real-time edge highlighting

### 3. Intuitive Connection System
- Drag-based connection creation from node centers
- Visual feedback during connection attempts
- Edge selection and individual styling
- Connection validation and management

### 4. Responsive Design
- Desktop-optimized toolbar with multiple control panels
- Mobile-first drawer navigation system
- Adaptive UI for screens up to 768px width
- Touch-friendly controls on mobile devices

### 5. Layout Automation
- Auto-arrange functionality for node distribution
- Grid-based node positioning
- Reset functionality to restore initial state

---

## System Requirements

### Hardware
- **Minimum RAM**: 2GB
- **Storage**: 100MB for application installation
- **Display**: Minimum 320px width (mobile) to 1920px (desktop)

### Software

#### Desktop
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### Mobile
- **Android**: API Level 24 (7.0) or higher
- **iOS**: 12.0 or higher (requires Xcode 12+)

#### Development
- **Vite**: v6.0.0+
- **React**: v18.0.0+
- **Capacitor**: v5.0.0+
- **XY Flow**: Latest version

---

## Installation

### Prerequisites
Ensure you have Node.js and npm installed on your system:

```bash
node --version  # v18.0.0 or higher
npm --version   # v8.0.0 or higher
```

### Clone Repository

```bash
git clone <repository-url>
cd KALAM--Key-Action-Linked-in-A-Mindmap
```

### Install Dependencies

```bash
cd mindmap-ui
npm install
```

### Install Capacitor CLI (for mobile development)

```bash
npm install -g @capacitor/cli
```

---

## Configuration

### Project Structure

```
mindmap-ui/
├── public/              # Static assets
├── src/
│   ├── App.jsx         # Main application component
│   ├── App.css         # Application styles
│   ├── index.jsx       # React entry point
│   └── index.css       # Global styles
├── android/            # Android-specific configuration
├── vite.config.js      # Build configuration
├── package.json        # Project dependencies
└── capacitor.config.ts # Capacitor platform configuration
```

### Environment Configuration

The application uses the following configuration file for Capacitor:

**capacitor.config.json** (root directory):
```json
{
  "appId": "com.kalam.mindmap",
  "appName": "KALAM",
  "webDir": "mindmap-ui/dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 0
    }
  }
}
```

---

## Usage Guide

### Core Interactions

#### 1. Creating Nodes
- Click the **"+ Add [Shape]"** button to create a new node
- Default shape is "Hexagon" (configurable via Shape selector)
- New nodes appear with default styling and "New Idea" label

#### 2. Editing Node Labels
- **Double-click** on any node to enter edit mode
- Type new label text
- Press **Enter** to confirm or **Escape** to cancel

#### 3. Resizing Nodes
- Select a node to display resize handles
- **Drag corner handles** to resize
- Constrained dimensions: min 80×60px, max 500×400px

#### 4. Creating Connections
- **Drag from node center** to initiate connection
- Drag to target node center
- Release to create edge

#### 5. Selecting Elements
- **Click node** to select and edit styling
- **Click edge** to select and edit connection style
- **Click canvas** to deselect all elements

### Styling and Customization

#### Node Colors
1. Select a node
2. Click **Colors** button in toolbar
3. Choose **Fill Color** or **Text Color**
4. Click desired color swatch

#### Node Shapes
1. Select a node
2. Click **Shape** dropdown
3. Select desired shape
4. Shape applies immediately

#### Font Size
1. Select a node
2. Click **Font Size** display or use **A▼/A▲** buttons
3. Choose from presets or enter custom value (8-72px)

#### Canvas Background
1. Click **Canvas** button in toolbar
2. Select desired background color from presets
3. Transition occurs smoothly over 400ms

### Edge Management

#### Selecting Edges
- **Click any connection line** to select
- Selected edge highlights and allows styling

#### Styling Edges
1. Select edge
2. Open **Edge** panel (desktop) or **Edge Style** section (mobile)
3. Customize:
   - **Color**: Choose from 10 presets
   - **Thickness**: Adjust 1-8px via slider
   - **Line Style**: Select Solid, Dashed, or Dotted
   - **Animation**: Toggle flowing dash effect

#### Default Edge Styling
- All new edges inherit current toolbar settings
- Applies selected color, width, and style automatically
- Animated state persists per edge

---

## Architecture

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18.0+ |
| Build Tool | Vite | 6.0+ |
| Graph Visualization | XY Flow | Latest |
| Mobile Platform | Capacitor | 5.0+ |
| Platform Targets | Android/iOS | 7.0+/12.0+ |

### Component Hierarchy

```
App
├── GlobalStyles
├── Toolbar
│   ├── FontSizeControl
│   ├── EdgeStylePanel
│   └── [Various Control Buttons]
├── MobileMenu (Mobile Only)
│   └── Mobile Drawer Sections
├── ReactFlow Canvas
│   ├── ShapeNode (Custom)
│   ├── Nodes Collection
│   └── Edges Collection
└── HintTag
```

### State Management

The application uses React hooks for state management:

```javascript
useState() // Component-level state
useCallback() // Memoized callbacks
useRef() // DOM references
useNodesState() // XY Flow node management
useEdgesState() // XY Flow edge management
```

---

## Build and Deployment

### Development Server

Start local development environment:

```bash
cd mindmap-ui
npm run dev
```

Access application at `http://localhost:5173`

### Production Build

Create optimized production bundle:

```bash
npm run build
```

Output generated in `dist/` directory with optimizations:
- Code minification
- Asset compression
- Tree-shaking
- CSS optimization

### Mobile Deployment

#### Android

1. **Sync web assets to Android project**:
```bash
npx cap sync android
```

2. **Open Android Studio**:
```bash
npx cap open android
```

3. **Build APK** in Android Studio:
   - Select "Build" → "Build Bundle(s) / APK(s)" → "Build APK(s)"
   - Output: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Deploy to device**:
   - Connect Android device
   - Run: `npx cap run android`

#### iOS (macOS only)

1. **Sync web assets to iOS project**:
```bash
npx cap sync ios
```

2. **Open Xcode**:
```bash
npx cap open ios
```

3. **Configure signing**:
   - Set team ID and provisioning profile
   - Configure bundle identifier

4. **Build and run**:
   - Select target device
   - Click "Run" button in Xcode

---

## Troubleshooting

### Common Issues

#### Issue: Application won't build
**Solution**: Clear cache and reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Issue: Android app won't sync
**Solution**: Ensure Capacitor configuration is correct
```bash
npx cap add android  # Reinitialize if necessary
npx cap sync android
```

#### Issue: Mobile menu controls go off-screen
**Solution**: This has been addressed in the latest version. All mobile controls are bundled in the drawer menu (hamburger icon) with proper scrolling support.

#### Issue: Nodes not responding to clicks
**Solution**: Ensure you have deselected any previous elements by clicking canvas background

#### Issue: Performance degradation with many nodes
**Solution**: Reduce node count or use "Auto Arrange" feature to optimize layout

### Logs and Debugging

**Enable debug logging**:
```javascript
// In App.jsx console
localStorage.setItem('DEBUG', 'true');
```

**Check browser console**: Press `F12` or `Ctrl+Shift+I` for developer tools

**Mobile debugging**:
- **Android**: Use Android Studio logcat or `adb logcat`
- **iOS**: Use Xcode console

---

## Contributing

### Development Guidelines

1. **Code Style**: Follow React best practices and ESLint configuration
2. **Commits**: Use descriptive commit messages
3. **Testing**: Test on both desktop and mobile platforms
4. **Documentation**: Update README for new features

### Submitting Changes

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test thoroughly
3. Commit changes: `git commit -m "feat: description"`
4. Push to repository: `git push origin feature/your-feature`
5. Submit pull request with detailed description

### Reporting Issues

When reporting bugs, include:
- Clear description of issue
- Steps to reproduce
- Expected vs. actual behavior
- Platform and browser/device information
- Screenshots or screen recordings

---

## License

KALAM is released under the MIT License. See LICENSE file for details.

---

## Support and Resources

### Documentation
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [XY Flow Documentation](https://xyflow.com)
- [Capacitor Documentation](https://capacitorjs.com)

### Community
- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for general questions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-21 | Initial release with core features |
| 1.1.0 | 2026-04-21 | Mobile drawer optimization, fixed off-screen panel issue |

---

## Contact

For questions, suggestions, or collaboration opportunities, please contact the development team.

**Last Updated**: April 21, 2026
