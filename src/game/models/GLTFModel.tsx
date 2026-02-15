import { useAnimations, useGLTF } from '@react-three/drei'
import type { ModelConfig } from '@/game/models/modelRegistry'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'
import { useEffect, useMemo, useRef } from 'react'
import { LoopOnce, LoopRepeat } from 'three'
import type { AnimationAction } from 'three'

interface ModelRendererProps {
  config: ModelConfig
}

// ---- Loads a GLTF/GLB scene, Clone rebuilds as proper R3F elements ----
function GLTFModelInner({ config }: ModelRendererProps) {
  const { scene, animations } = useGLTF(config.path)

  // ---- Deep clone unlinks bones from the original ----
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  const { actions, mixer } = useAnimations(animations, clone)
  const prevActionRef = useRef<AnimationAction | null>(null)

  // ---- Resolve animation state to clip name via animationMap ----
  const animState = config.animationState ?? 'idle'
  const animMap = config.animationMap

  useEffect(() => {
    const clipName =
      animMap?.[animState] ??
      (animState === 'walk'
        ? 'Walk'
        : animState === 'attack'
          ? 'Attack'
          : animState === 'death'
            ? 'Death'
            : 'Idle')
    const nextAction = actions[clipName]
    if (!nextAction) return

    const prevAction = prevActionRef.current

    if (animState === 'death') {
      // ---- Death plays once and stays on last frame ----
      nextAction.reset()
      nextAction.setLoop(LoopOnce, 1)
      nextAction.clampWhenFinished = true

      if (prevAction && prevAction !== nextAction) {
        prevAction.crossFadeTo(nextAction, 0.15, true)
      }
      nextAction.play()
      prevActionRef.current = nextAction

      return undefined
    }

    if (animState === 'attack') {
      // ---- Attack plays once, then returns to idle ----
      nextAction.reset()
      nextAction.setLoop(LoopOnce, 1)
      nextAction.clampWhenFinished = true

      if (prevAction && prevAction !== nextAction) {
        prevAction.crossFadeTo(nextAction, 0.15, true)
      }
      nextAction.play()
      prevActionRef.current = nextAction

      // ---- On finished, crossfade back to idle ----
      const onFinished = () => {
        const idleClipName = animMap?.['idle'] ?? 'Idle'
        const idleAction = actions[idleClipName]
        if (idleAction) {
          idleAction.reset()
          idleAction.setLoop(LoopRepeat, Infinity)
          nextAction.crossFadeTo(idleAction, 0.2, true)
          idleAction.play()
          prevActionRef.current = idleAction
        }
        mixer.removeEventListener('finished', onFinished)
      }
      mixer.addEventListener('finished', onFinished)

      return () => {
        mixer.removeEventListener('finished', onFinished)
      }
    }

    // ---- Idle and walk loop continuously ----
    nextAction.reset()
    nextAction.setLoop(LoopRepeat, Infinity)

    if (prevAction && prevAction !== nextAction) {
      prevAction.crossFadeTo(nextAction, 0.2, true)
    }
    nextAction.play()
    prevActionRef.current = nextAction

    return undefined
  }, [animState, animMap, actions, mixer])

  return <primitive object={clone} />
}

// ---- Renders a 3D model, auto-detecting format from file extension ----
// Wraps in a group for reliable transform application
function ModelRenderer({ config }: ModelRendererProps) {
  return (
    <group
      scale={config.scale}
      rotation={[0, config.rotationY, 0]}
      position={[0, config.yOffset, 0]}
    >
      <GLTFModelInner config={config} />
    </group>
  )
}

export default ModelRenderer
