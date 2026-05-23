import { useEffect, useRef } from 'react'
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Model({ currentAnimation, setCurrentAnimation }) {
    const group = useRef()
    const { scene, animations } = useGLTF('/idle_wave_talk_glb.glb')
    const { actions, mixer } = useAnimations(animations, group)
    const previousAction = useRef(null)
    const mouse = useRef({ x: 0, y: 0 })

    useEffect(() => {
        console.log('Available animations:', Object.keys(actions))
    }, [actions])

    useEffect(() => {
        if (!actions[currentAnimation]) {
            console.warn(`Animation "${currentAnimation}" not found`)
            return
        }

        const action = actions[currentAnimation]

        if (previousAction.current && previousAction.current !== action) {
            previousAction.current.fadeOut(0.5)
        }

        action.reset().fadeIn(0.5).play()
        action.timeScale = 0.5 // Slow down to 50% speed

        if (currentAnimation === 'idle') {
            action.setLoop(2201, Infinity)
        } else {
            action.setLoop(2200, 1)
            action.clampWhenFinished = true
        }

        previousAction.current = action

        const handleFinished = (e) => {
            if (e.action === action && currentAnimation !== 'idle') {
                setCurrentAnimation('idle')
            }
        }

        mixer.addEventListener('finished', handleFinished)

        return () => {
            mixer.removeEventListener('finished', handleFinished)
        }
    }, [currentAnimation, actions, mixer, setCurrentAnimation])

    useFrame((state, delta) => {
        mixer.update(delta)

        // Smooth horizontal rotation following cursor (full 360 degrees)
        mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, state.pointer.x, 0.1)

        if (group.current) {
            group.current.rotation.y = mouse.current.x * Math.PI // Full 360 degree rotation
            group.current.rotation.x = 0.3 // Fixed tilt forward
        }
    })

    return (
        <>
            <primitive ref={group} object={scene} />
            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={2}
                maxDistance={5}
                target={[0, 1, 0]}
            />
        </>
    )
}

useGLTF.preload('/idle_wave_talk_glb.glb')
