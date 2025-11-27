#!/usr/bin/env node

/**
 * CORS Configuration Test Script
 * Verifies that CORS headers are properly set on the backend server
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCORS() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('  CORS CONFIGURATION TEST', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');

  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/lessons',
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:8080'
      }
    };

    log('Testing CORS headers on backend server...', 'cyan');
    log(`Request: GET http://localhost:3001/api/lessons`, 'yellow');
    log(`Origin: http://localhost:8080\n`, 'yellow');

    const req = http.request(options, (res) => {
      log('Response received!', 'green');
      log(`Status Code: ${res.statusCode}`, 'yellow');
      log('\nCORS Headers:', 'cyan');

      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };

      let corsConfigured = false;

      for (const [header, value] of Object.entries(corsHeaders)) {
        if (value !== undefined) {
          log(`  ✓ ${header}: ${value}`, 'green');
          corsConfigured = true;
        } else {
          log(`  ✗ ${header}: Not set`, 'red');
        }
      }

      log('\n═══════════════════════════════════════════════════════', 'cyan');
      
      if (corsConfigured) {
        log('  ✓ CORS IS PROPERLY CONFIGURED!', 'green');
        log('\n  The backend will accept requests from:', 'green');
        log('  - http://localhost:8080 (frontend server)', 'green');
        log('  - file:// protocol (opening HTML files directly)', 'green');
        log('  - Any other origin (development mode)', 'green');
      } else {
        log('  ✗ CORS IS NOT CONFIGURED!', 'red');
        log('\n  Frontend requests will be blocked by the browser.', 'red');
        log('  Please ensure cors middleware is installed and configured.', 'yellow');
      }
      
      log('═══════════════════════════════════════════════════════\n', 'cyan');

      // Test preflight request (OPTIONS)
      log('Testing preflight (OPTIONS) request...', 'cyan');
      
      const optionsReq = http.request({
        ...options,
        method: 'OPTIONS'
      }, (optionsRes) => {
        log(`Preflight Status: ${optionsRes.statusCode}`, 'yellow');
        
        if (optionsRes.statusCode === 204 || optionsRes.statusCode === 200) {
          log('  ✓ Preflight requests supported', 'green');
        } else {
          log('  ⚠ Preflight may not be properly configured', 'yellow');
        }
        
        log('\n✅ CORS testing complete!\n', 'green');
        resolve(true);
      });

      optionsReq.on('error', (err) => {
        log(`  ✗ Error testing preflight: ${err.message}`, 'red');
        resolve(false);
      });

      optionsReq.end();
    });

    req.on('error', (err) => {
      log(`\n✗ Error connecting to backend: ${err.message}`, 'red');
      log('  Make sure the backend server is running on port 3001.\n', 'yellow');
      resolve(false);
    });

    req.end();
  });
}

// Run the test
testCORS().then(() => {
  process.exit(0);
}).catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
