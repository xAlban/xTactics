import { useAnimations, useGLTF } from '@react-three/drei'
import type { ModelConfig } from '@/game/models/modelRegistry'
import { SkeletonUtils } from 'three/examples/jsm/Addons.js'
import { useEffect, useMemo } from 'react'

interface ModelRendererProps {
  config: ModelConfig
}

// ---- Loads a GLTF/GLB scene, Clone rebuilds as proper R3F elements ----
function GLTFModelInner({ config }: ModelRendererProps) {
  const { scene, animations } = useGLTF(config.path)

  // Create a "Deep Clone" that unlinks the bones from the original
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])

  const {actions} = useAnimations(animations, clone)

  useEffect(() => {
    if (config.isMoving) {
      actions['Walk']?.play()

      return undefined
    }

    actions['Idle']?.play()
  }, [config])

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
