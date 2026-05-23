import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { error: null }
    }
    static getDerivedStateFromError(error) {
        return { error }
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{
                    width: '100vw', height: '100vh', background: '#0f172a',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', color: '#f87171', fontFamily: 'monospace',
                    padding: '2rem', textAlign: 'center'
                }}>
                    <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
                    <pre style={{ color: '#fca5a5', fontSize: '0.8rem', maxWidth: '600px', whiteSpace: 'pre-wrap' }}>
                        {this.state.error.message}
                    </pre>
                </div>
            )
        }
        return this.props.children
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
