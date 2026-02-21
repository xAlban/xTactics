# xTactics

Tactical turn-based RPG with isometric 3D view, inspired by Dofus and Final Fantasy Tactics.

## Tech

- **Renderer**: React Three Fiber + Three.js (3D isometric view)
- **Physics**: @react-three/rapier (Rapier WASM) — used for normal-mode player movement and collision detection. Player is a dynamic rigid body with capsule collider; obstacles and walkable surfaces are fixed rigid bodies with cuboid colliders.
- **UI**: React 18, shadcn/ui, Tailwind CSS v4
- **Desktop**: Electron (via vite-plugin-electron)
- **State**: Zustand
- **Build**: Vite 6, TypeScript 5

## Development

### Commands

- `npm run dev` - Browser dev server (fast iteration, no Electron)
- `npm run electron:dev` - Electron dev window
- `npm run build` - TypeScript check + Vite production build
- `npm run electron:build` - Full Electron production build
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## 3D Model Guide

### File Format

- **Format**: GLB (Binary glTF 2.0)
- **Why GLB**: Single file, binary-compressed, industry standard for web 3D
- **Tools**: Export from Blender (File > Export > glTF 2.0, select `.glb`)

### Directory Structure

```
public/
  models/
    units/           # Player and enemy character models
      bomberman.glb
      archer.glb
      knight.glb
      mage.glb
      enemy_default.glb
    objects/          # World objects (portals, props, etc.)
      combat_portal.glb
```

### Model Specifications

#### Unit Models (Characters)

- **Polygon count**: 1,000 - 5,000 triangles recommended
  - Combat scenes show up to ~20 units; keep them lightweight
  - Desktop target (not mobile), so slightly higher counts are OK
- **Texture size**: 512x512 or 1024x1024 max
  - Use a single texture atlas per model when possible
  - PBR materials supported (baseColor, metalRoughness, normal)
- **Scale**: Model at 1 unit = 1 meter. The game scales via `ModelConfig.scale`
- **Origin**: Model origin should be at the feet (ground level, center of model)
- **Facing direction**: Model should face +Z (forward) by default
- **Animations** (optional):
  - `Idle` - Standing idle loop
  - `Walk` - Walking loop (used for grid movement)
  - `Attack` - Attack animation (used for spell casting)
  - Name animations exactly as listed; the system maps them by name

#### World Objects

- **Polygon count**: Varies by object size and importance
- **Same texture/PBR guidelines as units**

### How to Add a New Model

1. Export your model as `.glb` from Blender or your 3D tool
2. Place the file in the appropriate `public/models/` subdirectory
3. Update `src/game/models/modelRegistry.ts`:
   - Add or modify the `ModelConfig` entry
   - Set `scale`, `rotationY`, `yOffset` to position it correctly on the tile
4. The model will automatically be used — if the file is missing, a colored cube fallback renders instead

### Optimization Tips

- **Draco compression**: `npx gltf-pipeline -i model.glb -o model.glb -d`
- **Remove unused data**: Strip unused UV channels, vertex colors, empty nodes
- **Share materials**: Models sharing the same textures reduce GPU memory
- **Texture compression**: Use KTX2/Basis Universal for significant size reduction (supported by Three.js via `KTX2Loader`)
- **Recommended tool**: [gltf.report](https://gltf.report/) — online GLTF inspector and optimizer
