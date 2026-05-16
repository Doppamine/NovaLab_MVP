import React from 'react';
import { useLocale } from '../../i18n/LocalizationContext';
import './Header.css';

function Header({ children }) {
    const { t } = useLocale();

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
                            <span>{t('Help')}</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
