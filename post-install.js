#!/usr/bin/env node
'use strict';
const { get } = require('https');
const { createHash } = require('crypto');
const { writeFileSync, existsSync } = require('fs');

const CONFIG_LOCATION = 'https://gist.githubusercontent.com/ankjevel/36ce6f5b18147ebf11dcc304a197c86e/raw/deployment-config.json';
const LIB_D_TS_FILE = 'main.d.ts';
const DEPLOYMENT_JSON = 'deployment.json';

async function getConfig() {
  const headers = {
    'Cache-Control': 'no-cache'
  };

  return new Promise((resolve, reject) => {
    function callback(response) {
      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('error', reject);
      response.on('end', () => {
        try {
          const { headers: { etag = '' } } = response;
          resolve({
            json: JSON.parse(data),
            hash: etag ? etag.replace(/\"/g, '') : createHash('sha256').update(data).digest('hex'),
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    get(CONFIG_LOCATION, { headers }, callback).on('error', reject);
  })
}

function tsFile(enum_reference, type_reference, hash) {
  return `// ${hash}
export enum DeploymentConfig {
${enum_reference}
}

declare const deployment_config: { ${type_reference} };
export default deployment_config;
`;
}

function produceContent({ json, hash }) {
  const config = {};

  const enum_reference = Object.entries(json).map(([key, value]) => {
    config[key.toUpperCase()] = value;
    return `  ${key.toUpperCase()} = '${value}'`;
  }).join(',\n');

  const type_reference = Object.entries(config).reduce((out, [key, value]) => {
    return `${out ? `${out}, ` : ''}${key}: ${typeof value}`;
  }, '');

  writeFileSync(LIB_D_TS_FILE, tsFile(enum_reference, type_reference, hash), { encoding: 'utf-8' });
  writeFileSync(DEPLOYMENT_JSON, JSON.stringify(config, null, 2), { encoding: 'utf-8' });
}

async function main() {
  try {
    if (existsSync(LIB_D_TS_FILE) && existsSync(DEPLOYMENT_JSON)) {
      process.exit(0);
    }

    const { json, hash } = await getConfig();
    if (typeof json !== 'object' || json === null || !Object.keys(json).length) {
      console.error('config is in wrong format');
      process.exit(2);
    }
    produceContent({ json, hash });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void main();
