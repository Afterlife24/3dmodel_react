<<<<<<< HEAD
import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Model from './components/Model'
import StatusIndicator from './components/StatusIndicator'
import { useLiveKit } from './hooks/useLiveKit'
=======
import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Model from './components/Model'
import Controls from './components/Controls'
>>>>>>> c39dfe77af4089584a5a57c9565e5884a5c47c3e

function App() {
    const [currentAnimation, setCurrentAnimation] = useState('idle')

<<<<<<< HEAD
    const handleAnimationChange = useCallback((anim) => {
        setCurrentAnimation(anim)
    }, [])

    const { status, agentText, userText, errorMsg } = useLiveKit({
        onAnimationChange: handleAnimationChange,
    })

=======
>>>>>>> c39dfe77af4089584a5a57c9565e5884a5c47c3e
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
            <Canvas
                camera={{ position: [0, 1, 3], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />
<<<<<<< HEAD
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
=======
                <Model currentAnimation={currentAnimation} setCurrentAnimation={setCurrentAnimation} />
            </Canvas>
            <Controls currentAnimation={currentAnimation} setCurrentAnimation={setCurrentAnimation} />
>>>>>>> c39dfe77af4089584a5a57c9565e5884a5c47c3e
        </div>
    )
}

export default App
