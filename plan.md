# Plan: Rework Collision & Movement with Rapier Physics

## Context

xTactics currently uses a **custom collision system** for normal-mode exploration: visibility-graph pathfinding (Dijkstra) around AABB obstacles, Three.js raycasting for vertical positioning, and simplex noise for terrain heightmaps. This is fragile, doesn't scale well, and prevents features like walking on elevated surfaces naturally.

The goal is to replace all of this with **@react-three/rapier** — a React Three Fiber wrapper around the Rapier physics engine. The player becomes a physics body with gravity, collisions are handled by the engine, and all custom pathfinding/raycasting/heightmap code is deleted.

**Combat mode (BattleScene) is completely untouched** — it uses grid-based movement which doesn't need physics.

---

## Step 1: Install & Uninstall Packages

- `npm install @react-three/rapier` (v1.x — compatible with React 18 + R3F 8.x)
- `npm uninstall simplex-noise alea` (only used by terrainUtils.ts)

## Step 2: Delete Custom Physics Files

Delete entirely:

- `src/game/world/collisionUtils.ts` — visibility-graph + Dijkstra pathfinding
- `src/game/world/terrainUtils.ts` — simplex noise heightmap generation
- `src/game/hooks/useGroundRaycast.ts` — Three.js raycasting for Y positioning
- `src/test/collisionUtils.test.ts`
- `src/test/terrainUtils.test.ts`
- `src/test/useGroundRaycast.test.ts`

## Step 3: Update Types — `src/types/zone.ts`

- Delete `HeightmapConfig` interface (lines 30-37)
- Remove `heightmap?: HeightmapConfig` from `ZoneDefinition` (line 48)
- Keep `size`, `noCollision`, `walkable` on `ZoneObject` — these now control Rapier collider creation

## Step 4: Update Zone Definitions — `src/game/world/zoneDefinitions.ts`

- Remove `heightmap` config object from `GRASS_ZONE` (lines 462-468)
- Everything else stays (object positions, sizes, flags)

## Step 5: Rewrite ZoneGround — `src/game/world/ZoneGround.tsx`

**Remove:** terrain prop, vertex displacement, forwardRef, subdivided geometry
**Add:** Rapier `RigidBody type="fixed"` with `CuboidCollider`

New structure:

- Flat `PlaneGeometry` (no subdivision, no displacement)
- Wrapped in `<RigidBody type="fixed" colliders={false}>` + `<CuboidCollider args={[halfW, 0.1, halfH]} position={[0, -0.1, 0]} />`
- Keep click handler (simplified — use `e.point` directly, clamp to zone bounds)

## Step 6: Rewrite ZoneObjectRenderer — `src/game/world/ZoneObjectRenderer.tsx`

**Remove:** terrain prop, walkablesRef, forwardRef, `computeObjectY` terrain fallback
**Add:** Rapier `RigidBody` + `CuboidCollider` for collidable/walkable objects

- Objects with collision (`hasCollision && !noCollision`): wrap in `<RigidBody type="fixed" colliders={false}>` with `<CuboidCollider>` using the object's `size` property
- Walkable objects (`walkable=true`): same — `RigidBody type="fixed"` so player can physically walk on top
- Non-collidable objects: just visual, no physics body
- Object Y position: `obj.position.y ?? 0` + registry yOffset (no terrain fallback)
- Portal Y position: `obj.position.y ?? 1` (no terrain)
- Use collision groups: obstacles belong to group 2, only interact with player (group 0)

## Step 7: Rewrite NormalScene — `src/game/scenes/NormalScene.tsx`

This is the biggest change. **Replace waypoint pathfinding with physics-based movement.**

**Remove:**

- Imports of `findPath`, `getDecorationObstacles`, `getZoneTerrain`, `useGroundRaycast`
- `terrain` useMemo, `fallbackGetHeight`, `getYAt`
- `decorations` useMemo, `waypointsRef`, `waypointIndexRef`, `posRef`
- `groundMeshRef`, `walkablesRef` refs
- Waypoint computation useEffect
- Complex useFrame that follows waypoints + raycasts Y

**Add:**

- `<Physics gravity={[0, -30, 0]}>` wrapping all scene content (stronger gravity for snappy feel)
- Player `<RigidBody type="dynamic" lockRotations ccd>` with `<CapsuleCollider args={[0.25, 0.2]}>` — spawns at `y=10` (falls to ground)
- `rigidBodyRef` to read position and set velocity
- New `useFrame` logic:
  - Read position from `rigidBodyRef.current.translation()`
  - If `targetPosition` exists: compute XZ direction, set linear velocity `{x: dirX*MOVE_SPEED, y: currentVel.y, z: dirZ*MOVE_SPEED}` (preserve gravity Y)
  - When within `ARRIVAL_THRESHOLD` (~0.5): zero XZ velocity, call `setPlayerPosition`
  - Update `facingRef` from movement direction (keep rotation system)
  - Set `playerYRef.current` from body `translation().y` for camera
- Visual player model as child of RigidBody (position synced automatically)
- Teleport on zone change: detect `playerPosition` change without `targetPosition`, call `body.setTranslation({x, y:10, z})` + `body.setLinvel({0,0,0})`
- Destination marker: position at `[x, 0.05, z]` (flat ground, no raycasting)

**Key behavior change:** No pathfinding — Rapier collision response naturally slides the player along obstacles. The player walks directly toward the click target and physics handles obstacle avoidance.

## Step 8: FollowCamera — `src/game/camera/FollowCamera.tsx`

**No changes needed.** It already reads `playerYRef.current` which NormalScene will now populate from the Rapier body's Y position.

## Step 9: Update Tests — `src/test/App.test.tsx`

Add mock for `@react-three/rapier`:

```typescript
vi.mock('@react-three/rapier', () => ({
  Physics: ({ children }) => <>{children}</>,
  RigidBody: ({ children }) => <>{children}</>,
  CuboidCollider: () => null,
  CapsuleCollider: () => null,
  interactionGroups: () => 0,
}))
```

## Step 10: Update CLAUDE.md

- **Tech Stack**: Add `@react-three/rapier` (Rapier physics)
- **Project Structure**: Remove deleted files, add note about Physics
- **Architecture > Normal Mode**: Replace pathfinding description with Rapier physics description
- **Zone System**: Remove heightmap references, update collision description
- Mark the "Rework Collision and movement" feature as DONE

## Step 11: Update README.md

- Note the Rapier physics dependency and how it's used

## Step 12: xWorldBuilder Future Plan

Document these future updates needed in xWorldBuilder (not implemented now):

- Remove heightmap config from ZoneSettings
- Add collider preview wireframes in editor
- Update export to not include heightmap in ZoneDefinition
- Add per-object collision size tuning in properties panel

---

## Files Modified (summary)

| File                                    | Action                                  |
| --------------------------------------- | --------------------------------------- |
| `src/game/world/collisionUtils.ts`      | DELETE                                  |
| `src/game/world/terrainUtils.ts`        | DELETE                                  |
| `src/game/hooks/useGroundRaycast.ts`    | DELETE                                  |
| `src/test/collisionUtils.test.ts`       | DELETE                                  |
| `src/test/terrainUtils.test.ts`         | DELETE                                  |
| `src/test/useGroundRaycast.test.ts`     | DELETE                                  |
| `src/types/zone.ts`                     | Remove HeightmapConfig                  |
| `src/game/world/zoneDefinitions.ts`     | Remove heightmap from GRASS_ZONE        |
| `src/game/world/ZoneGround.tsx`         | Rewrite: flat + Rapier collider         |
| `src/game/world/ZoneObjectRenderer.tsx` | Rewrite: Rapier colliders for obstacles |
| `src/game/scenes/NormalScene.tsx`       | Major rewrite: Physics + dynamic body   |
| `src/test/App.test.tsx`                 | Add Rapier mock                         |
| `CLAUDE.md`                             | Update docs                             |
| `README.md`                             | Update docs                             |

## Verification

1. `npm run format` — Format code
2. `npm run lint` — TypeScript + ESLint pass (no references to deleted files)
3. `npm run build` — Build passes
4. `npm run test` — All tests pass (with Rapier mocked)
5. `npm run dev` — Manual testing:
   - Player spawns above ground and falls down
   - Click-to-move works on flat ground
   - Player slides along tree/rock obstacles (no phasing through)
   - Player can walk on `walkable` surfaces (paths, bridges)
   - Zone portals and combat portals still work
   - Camera follows player smoothly including Y changes
   - Zone transitions teleport correctly (player falls to new zone)
   - Combat mode still works unchanged
