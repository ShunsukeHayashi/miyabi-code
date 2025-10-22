// Simple .env file parser for Node.js
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    
    if (!fs.existsSync(envPath)) {
        console.warn('⚠️  .env file not found, using environment variables');
        return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
        line = line.trim();
        
        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
            return;
        }
        
        // Parse KEY=VALUE
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            
            // Only set if not already set
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
    
    console.log('✅ Loaded .env configuration');
}

module.exports = { loadEnv };
