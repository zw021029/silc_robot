const config = {
  apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3005',
  wsBaseUrl: process.env.VUE_APP_WS_BASE_URL || 'ws://localhost:3005',
  uploadUrl: process.env.VUE_APP_UPLOAD_URL || 'http://localhost:3005/upload'
};

export default config; 