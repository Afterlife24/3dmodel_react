export default function Controls({ currentAnimation, setCurrentAnimation }) {
    const buttons = ['idle', 'wave', 'talk']

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                {buttons.map((anim) => (
                    <button
                        key={anim}
                        onClick={() => setCurrentAnimation(anim)}
                        style={{
                            ...styles.button,
                            ...(currentAnimation === anim ? styles.buttonActive : {}),
                        }}
                        onMouseEnter={(e) => {
                            if (currentAnimation !== anim) {
                                e.target.style.background = 'rgba(59, 130, 246, 0.2)'
                                e.target.style.border = '2px solid #3b82f6'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentAnimation !== anim) {
                                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                                e.target.style.border = '2px solid rgba(255, 255, 255, 0.2)'
                            }
                        }}
                    >
                        {anim.charAt(0).toUpperCase() + anim.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    )
}

const styles = {
    container: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '2rem',
        pointerEvents: 'none',
    },
    panel: {
        display: 'flex',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        pointerEvents: 'auto',
    },
    button: {
        padding: '0.75rem 2rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textTransform: 'capitalize',
    },
    buttonActive: {
        background: 'rgba(59, 130, 246, 0.3)',
        border: '2px solid #3b82f6',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    },
}
