import React from 'react';
import './Header.css';

function Header({ children }) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo-section">
                    <div className="logo-icon">NL</div>
                    <h1 className="logo-text">
                        Nova<span className="logo-accent">Lab</span>
                    </h1>
                </div>


                <div className="header-actions">
                    {children || (
                        <button className="btn btn-primary">
                            <span>Help</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
