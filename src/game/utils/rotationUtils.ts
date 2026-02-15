// ---- Compute shortest angle delta with wrapping ----
export function shortestAngleDelta(current: number, target: number): number {
  let delta = target - current
  // ---- Normalize to [-PI, PI] ----
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return delta
}

// ---- Compute facing angle from a direction vector ----
export function facingAngleFromDirection(dx: number, dz: number): number {
  return Math.atan2(dx, dz)
}
