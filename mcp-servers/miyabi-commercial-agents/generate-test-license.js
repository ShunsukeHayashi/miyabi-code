#!/usr/bin/env node
/**
 * Generate valid test license keys for Miyabi Commercial Agents
 */

import crypto from 'crypto';

const SECRET_SALT = process.env.MIYABI_SECRET_SALT || 'MIYABI_DEFAULT_SALT_2025';

function generateLicenseKey(tier) {
  // Generate expected hash based on tier
  const expectedHash = crypto
    .createHash('sha256')
    .update(`${tier}-${SECRET_SALT}`)
    .digest('hex')
    .toUpperCase()
    .substring(0, 20);

  const licenseKey = `MIYABI-COMMERCIAL-${tier}-${expectedHash}`;
  return licenseKey;
}

console.log('🔑 Miyabi Commercial Agents - Test License Key Generator\n');

const tiers = ['STARTER', 'PRO', 'ENTERPRISE'];

tiers.forEach(tier => {
  const key = generateLicenseKey(tier);
  console.log(`${tier} tier:`);
  console.log(`  ${key}\n`);
});

console.log('📋 Usage:');
console.log('  export MIYABI_LICENSE_KEY="<key>"');
console.log('  node dist/index.js\n');
