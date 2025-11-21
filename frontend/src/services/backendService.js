/**
 * Backend service configuration
 * Dynamically determines the backend URL based on the environment
 */

export const getBackendURL = () => {
  const envURL = process.env.REACT_APP_BACKEND_URL;
  if (envURL) return envURL;
  
  // If no env URL, use the same host but port 8000
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = 8000;
  
  return `${protocol}//${hostname}:${port}`;
};

export const BACKEND_URL = getBackendURL();
export const API_URL = `${BACKEND_URL}/api`;
export const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
