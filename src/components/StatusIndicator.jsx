export default function StatusIndicator({ status, agentText, userText, errorMsg }) {
    const config = {
        connecting:   { label: '⏳ Connecting...', dot: '#f59e0b' },
        connected:    { label: '⏳ Starting...', dot: '#f59e0b' },
        listening:    { label: '🎙 Listening...',   dot: '#22c55e' },
        speaking:     { label: '🗣 Speaking...',    dot: '#3b82f6' },
        disconnected: { label: '🔌 Disconnected',   dot: '#6b7280' },
        error:        { label: '❌ Error',           dot: '#ef4444' },
    }[status] || { label: '', dot: 'transparent' }

    return (
        <div style={styles.wrapper}>

            {/* Error message */}
            {status === 'error' && errorMsg && (
                <div style={{ ...styles.bubble, borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' }}>
                    <span style={styles.label}>Error:</span>
                    <span style={styles.text}>{errorMsg}</span>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                        Make sure the Python server is running: <code>python web_agnet_server.py</code>
                    </div>
                </div>
            )}

            {/* Status pill */}
            {config.label && (
                <div style={styles.pill}>
                    <span style={{ ...styles.dot, background: config.dot }} />
                    {config.label}
                </div>
            )}

            {/* What user said */}
            {userText && (
                <div style={styles.bubble}>
                    <span style={styles.label}>You:</span>
                    <span style={styles.text}>{userText}</span>
                </div>
            )}

            {/* What agent said */}
            {agentText && (
                <div style={{ ...styles.bubble, ...styles.agentBubble }}>
                    <span style={styles.label}>Assistant:</span>
                    <span style={styles.text}>{agentText}</span>
                </div>
            )}
        </div>
    )
}

const styles = {
    wrapper: {
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        pointerEvents: 'none',
        zIndex: 10,
        width: '90%',
        maxWidth: '520px',
    },
    pill: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '999px',
        padding: '0.45rem 1.1rem',
        color: '#e2e8f0',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: 0,
        animation: 'pulse 1.2s ease-in-out infinite',
    },
    bubble: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '0.75rem',
        padding: '0.6rem 1rem',
        color: '#cbd5e1',
        fontSize: '0.85rem',
        width: '100%',
        textAlign: 'center',
        lineHeight: '1.5',
    },
    agentBubble: {
        borderColor: 'rgba(59,130,246,0.3)',
        color: '#93c5fd',
    },
    label: {
        fontWeight: '600',
        marginRight: '0.4rem',
        opacity: 0.6,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    text: {
        fontStyle: 'italic',
    },
}
