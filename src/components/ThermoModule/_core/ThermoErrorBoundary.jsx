import React from 'react';

/**
 * Catches any render/runtime error inside the Thermodynamics module and
 * displays a readable message instead of a blank screen.
 */
export default class ThermoErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('[ThermoModule] Crash:', error, info);
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    padding: '40px',
                    color: '#ff6b6b',
                    background: '#0a0e27',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontFamily: 'monospace',
                }}>
                    <div style={{ fontSize: '2rem' }}>⚠️ Ошибка модуля</div>
                    <div style={{
                        background: '#1a0000',
                        border: '1px solid #ff4444',
                        borderRadius: '8px',
                        padding: '16px',
                        maxWidth: '700px',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {this.state.error.toString()}
                        {'\n\n'}
                        {this.state.error.stack}
                    </div>
                    <button
                        onClick={() => this.setState({ error: null })}
                        style={{
                            padding: '10px 24px',
                            background: '#00f2ff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 700,
                        }}
                    >
                        Попробовать снова
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
