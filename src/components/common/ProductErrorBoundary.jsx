import React from 'react';
import { LocalizationContext } from '../../i18n/LocalizationContext';

class ProductErrorBoundary extends React.Component {
  static contextType = LocalizationContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('NovaLab module error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    const { t } = this.context;

    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="product-error-state" role="alert">
        <span className="status-pill status-pill-warning">{t('Pilot recovery')}</span>
        <h2>{t('The module could not be loaded.')}</h2>
        <p>{t('Something went wrong while preparing this activity. Please try again or return to the module list.')}</p>
        <div className="state-actions">
          <button className="btn btn-primary" onClick={this.handleRetry}>{t('Try again')}</button>
          <button className="btn btn-secondary" onClick={this.props.onBack}>{t('Back to modules')}</button>
        </div>
      </div>
    );
  }
}

export default ProductErrorBoundary;
