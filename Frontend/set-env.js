const fs = require('fs');
const path = require('path');

// Candidate locations for .env
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', 'Backend', '.env'),
  path.join(__dirname, '..', '.env')
];

let googleClientId = '';
let apiBaseUrl = 'http://localhost:8081/api';
let prodApiBaseUrl = 'https://feisty-recreation-production-c4e5.up.railway.app/api';

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx !== -1) {
        const key = trimmed.substring(0, equalsIdx).trim();
        let val = trimmed.substring(equalsIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key === 'GOOGLE_CLIENT_ID' && !googleClientId && val) {
          googleClientId = val;
        } else if (key === 'API_BASE_URL' && val) {
          apiBaseUrl = val;
        }
      }
    }
  }
}

// Fallback to process.env for CI/CD and deployment platforms (Railway, Docker, etc.)
if (!googleClientId && process.env.GOOGLE_CLIENT_ID) {
  googleClientId = process.env.GOOGLE_CLIENT_ID.trim();
}
if (process.env.API_BASE_URL) {
  apiBaseUrl = process.env.API_BASE_URL.trim();
}
if (process.env.PROD_API_BASE_URL) {
  prodApiBaseUrl = process.env.PROD_API_BASE_URL.trim();
}

const envDir = path.join(__dirname, 'src', 'environments');
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Development environment file
const devContent = `export const environment = {
  production: false,
  apiBaseUrl: '${apiBaseUrl}',
  googleClientId: '${googleClientId}'
};
`;

// Production environment file
const prodContent = `export const environment = {
  production: true,
  apiBaseUrl: '${prodApiBaseUrl}',
  googleClientId: '${googleClientId}'
};
`;

fs.writeFileSync(path.join(envDir, 'environment.ts'), devContent, 'utf8');
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), prodContent, 'utf8');

console.log('[set-env.js] Successfully synchronized environment variables to Angular environments:');
console.log(` - Google Client ID configured: ${googleClientId ? 'YES (' + googleClientId.substring(0, 20) + '...)' : 'NO'}`);
console.log(` - Development API Base URL: ${apiBaseUrl}`);
