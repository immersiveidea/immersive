# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "immersive" - a WebXR/VR diagramming application built with BabylonJS and React. It allows users to create and interact with 3D diagrams in both standard web browsers and VR environments, with real-time collaboration via PouchDB sync.

## Build and Development Commands

### Development
- `npm run dev` - Start Vite dev server on port 3001 (DO NOT USE per user instructions)
- `npm run build` - Build production bundle (includes version bump)
- `npm run preview` - Preview production build on port 3001
- `npm test` - Run tests with Vitest
- `npm run socket` - Start WebSocket server for collaboration (port 8080)
- `npm run serverBuild` - Compile TypeScript server code
- `npm run havok` - Copy Havok physics WASM files to Vite deps

### Testing
- Run all tests: `npm test`
- No single test command is configured; tests use Vitest

## Architecture

### Core Technologies
- **BabylonJS 8.x**: 3D engine with WebXR support and Havok physics
- **React + Mantine**: UI framework for 2D interface and settings
- **PouchDB**: Client-side database with CouchDB sync for collaboration
- **Auth0**: Authentication provider
- **Vite**: Build tool and dev server

### Key Architecture Patterns

#### Singleton Scene Management
The application uses a singleton pattern for the BabylonJS Scene via `DefaultScene` (src/defaultScene.ts). Always access the scene through `DefaultScene.Scene` rather than creating new instances.

#### Observable-Based Event System
The application heavily uses BabylonJS Observables for event handling:
- **DiagramManager.onDiagramEventObservable**: Central hub for diagram entity changes
- **DiagramManager.onUserEventObservable**: User position/state updates for multiplayer
- **AppConfig.onConfigChangedObservable**: Application settings changes
- **controllerObservable**: VR controller input events

Event observers use a mask system (`DiagramEventObserverMask`) to distinguish:
- `FROM_DB`: Events coming from database sync (shouldn't trigger database writes)
- `TO_DB`: Events that should be persisted to database

#### Diagram Entity System
All 3D objects in the scene are represented by `DiagramEntity` types (src/diagram/types/diagramEntity.ts):
- Entities have a template reference (e.g., `#image-template`)
- Managed by `DiagramManager` which maintains a Map of `DiagramObject` instances
- Changes propagate through the Observable system to database and other clients

#### VR Controller Architecture
Controllers inherit from `AbstractController` with specialized implementations:
- `LeftController`: Menu interactions, navigation
- `RightController`: Object manipulation, selection
- Controllers communicate via `controllerObservable` with `ControllerEvent` messages
- `Rigplatform` manages the player rig and handles locomotion

#### Database & Sync
- `PouchdbPersistenceManager` (src/integration/database/pouchdbPersistenceManager.ts) handles all persistence
- Supports optional encryption via `Encryption` class
- Syncs to remote CouchDB via proxy (configured in vite.config.ts)
- URL pattern `/db/public/:db` or `/db/private/:db` determines database name
- Uses `presence.ts` for broadcasting user positions over WebSocket

### Project Structure
- `src/vrcore/`: Engine initialization and core VR setup
- `src/controllers/`: VR controller implementations and input handling
- `src/diagram/`: 3D diagram entities, management, and scene interaction
- `src/integration/`: Database sync, encryption, and presence system
- `src/menus/`: In-VR 3D menus (not React components)
- `src/objects/`: Reusable 3D objects (buttons, handles, avatars)
- `src/react/`: React UI components for 2D interface
- `src/util/`: Shared utilities and configuration
- `server/`: WebSocket server for real-time presence

### Configuration System
Two configuration systems exist (being migrated):
1. **AppConfig class** (src/util/appConfig.ts): Observable-based config with typed properties
2. **ConfigType** (bottom of appConfig.ts): Legacy localStorage-based config

Settings include snapping values, physics toggles, fly mode, and turn snap angles.

## Important Development Notes

### Proxy Configuration
The dev and preview servers proxy certain routes to production:
- `/sync/*` - Database sync endpoint
- `/create-db` - Database creation
- `/api/images` - Image uploads

### Physics System
- Uses Havok physics engine (requires WASM file via `npm run havok`)
- Physics can be enabled/disabled via AppConfig
- `customPhysics.ts` provides helper functions

### WebGPU Support
The engine initializer supports both WebGL and WebGPU backends via the `useWebGpu` parameter.

### Encryption
Databases can be optionally encrypted. The `Encryption` class handles AES encryption with password-derived keys. Salt is stored in metadata document.

### Environment Variables
- `VITE_USER_ENDPOINT`: User authentication endpoint
- `VITE_SYNCDB_ENDPOINT`: Remote database sync endpoint

Check `.env.local` for local configuration.

## Naming Conventions

### Tool and Material Naming

**Material Names:** Materials follow the pattern `material-{color}` where `{color}` is the hex color string (e.g., `material-#ff0000` for red).

**Tool Mesh Names:** Tools use the pattern `tool-{toolType}-{color}`:
- Example: `tool-BOX-#ff0000` (red box tool)
- ToolTypes: `BOX`, `SPHERE`, `CYLINDER`, `CONE`, `PLANE`, `PERSON`

**Tool Instance Names:** `tool-instance-{toolType}-{color}` (e.g., `tool-instance-BOX-#ff0000`)

**Implementation details:**
- 16 predefined toolbox colors (see docs/NAMING_CONVENTIONS.md)
- Materials created in `src/toolbox/functions/buildColor.ts`
- Tool meshes created in `src/toolbox/functions/buildTool.ts`
- When extracting colors from materials, use: `emissiveColor || diffuseColor` (priority order)

### Rendering Modes

Three rendering modes affect material properties:
1. **Lightmap with Lighting**: Uses `diffuseColor` + `lightmapTexture` (expensive)
2. **Unlit with Emissive Texture** (default): Uses `emissiveColor` + `emissiveTexture` (lightmap)
3. **Flat Emissive**: Uses only `emissiveColor` (fastest)

See `src/util/renderingMode.ts` and `src/util/lightmapGenerator.ts` for implementation.