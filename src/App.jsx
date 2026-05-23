import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Model from './components/Model'
import StatusIndicator from './components/StatusIndicator'
import { useLiveKit } from './hooks/useLiveKit'

function App() {
    const [currentAnimation, setCurrentAnimation] = useState('idle')

    const handleAnimationChange = useCallback((anim) => {
        setCurrentAnimation(anim)
    }, [])

    const { status, agentText, userText, errorMsg } = useLiveKit({
        onAnimationChange: handleAnimationChange,
    })

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
            <Canvas
                camera={{ position: [0, 1, 3], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                <Model
                    currentAnimation={currentAnimation}
                    setCurrentAnimation={setCurrentAnimation}
                />
            </Canvas>

            <StatusIndicator
                status={status}
                agentText={agentText}
                userText={userText}
                errorMsg={errorMsg}
            />
        </div>
    )
}

export default App
