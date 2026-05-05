import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Model from './components/Model'
import Controls from './components/Controls'

function App() {
    const [currentAnimation, setCurrentAnimation] = useState('idle')

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
            <Canvas
                camera={{ position: [0, 1, 3], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />
                <Model currentAnimation={currentAnimation} setCurrentAnimation={setCurrentAnimation} />
            </Canvas>
            <Controls currentAnimation={currentAnimation} setCurrentAnimation={setCurrentAnimation} />
        </div>
    )
}

export default App
