import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-K9C70TD9TJ';


/**
 * Initialize Google Analytics
 */
export const initGA = () => {
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('GA Initialized');
  } catch (error) {
    console.error('Failed to initialize GA', error);
  }
};

/**
 * Track a page view
 * @param {string} path - The path to track (e.g., '/', '/modules', '/demo')
 */
export const trackPageView = (path) => {
  try {
    ReactGA.send({ hitType: 'pageview', page: path });
  } catch (error) {
    console.error('Failed to send GA pageview', error);
  }
};

/**
 * Track a custom event
 * @param {string} category - The category of the event (e.g., 'Module', 'User Action')
 * @param {string} action - The action taken (e.g., 'Open', 'Click', 'Complete')
 * @param {string} [label] - Optional label for more details (e.g., 'car-3d', 'Start Simulation')
 * @param {number} [value] - Optional numeric value
 */
export const trackEvent = (category, action, label = undefined, value = undefined) => {
  try {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  } catch (error) {
    console.error('Failed to send GA event', error);
  }
};
