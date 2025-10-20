const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
  '.map': 'application/json'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/test-dashboard.html' : req.url;
  
  // Remove query parameters
  filePath = filePath.split('?')[0];
  
  // Security: prevent directory traversal
  if (filePath.includes('..')) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  
  // Serve files from current directory
  const fullPath = path.join(__dirname, filePath);
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Get file extension
    const ext = path.extname(fullPath);
    const contentType = mimeTypes[ext] || 'text/plain';
    
    // Read and serve file
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🌐 UltraFastBuilder Test Server');
  console.log('===============================');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Available pages:');
  console.log(`  📊 Test Dashboard: http://localhost:${PORT}/test-dashboard.html`);
  console.log(`  🔬 Import Test: http://localhost:${PORT}/test-import.html`);
  console.log('');
  console.log('Full Dashboards (High Resolution):');
  console.log(`  📈 Builder Visual: http://localhost:${PORT}/builder_visual_dashboard.html`);
  console.log(`  🚀 Functional Visual: http://localhost:${PORT}/functional_visual_dashboard.html`);
  console.log(`  🎯 CustomPicker Performance: http://localhost:${PORT}/customPicker_dashboard.html`);
  console.log('');
  console.log('Compact Dashboards (Low Resolution):');
  console.log(`  📱 Builder Compact: http://localhost:${PORT}/builder_visual_dashboard_compact.html`);
  console.log(`  📱 Functional Compact: http://localhost:${PORT}/functional_visual_dashboard_compact.html`);
  console.log(`  📱 CustomPicker Compact: http://localhost:${PORT}/customPicker_dashboard_compact.html`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
  console.log('💡 Tip: Use compact dashboards for mobile/lower resolution screens!');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please try a different port.`);
  } else {
    console.log('❌ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
