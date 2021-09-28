#!/usr/bin/env node
'use strict';

const get = require('https').get;
const writeFileSync = require('fs').writeFileSync;

const CONFIG_LOCATION = 'https://gist.githubusercontent.com/ankjevel/36ce6f5b18147ebf11dcc304a197c86e/raw/deployment-config.json';

async function getConfig() {
  const headers = {
    'Cache-Control': 'no-cache'
  };

  return new Promise((resolve, reject) => {
    function callback(response) {
      let data = '';
      response.on('data', (chunk) => (data += chunk));
      response.on('end', () => resolve(JSON.parse(data)));
    }

    get(CONFIG_LOCATION, {
      headers
    }, callback).on('error', reject);
  })
}

function produceContent(json) {
  const config = {};
  let deployment_config = 'export enum DeploymentConfig {\n';

  Object.entries(json).forEach(([key, value]) => {
    config[key.toUpperCase()] = value;
    deployment_config += `  ${key.toUpperCase()} = '${value}',\n`;
  });

  deployment_config += `}\n\ndeclare const deployment_config: { ${
    Object.entries(config).reduce((out, [key, value]) => `${out ? `${out}, ` : ''}${key}: ${typeof value}`, '')
  } };\nexport default deployment_config;\n`;

  writeFileSync('main.d.ts', deployment_config, { encoding: 'utf-8' });
  writeFileSync('deployment.json', JSON.stringify(config, null, 2), { encoding: 'utf-8' });
}

async function main() {
  try {
    const json = await getConfig();
    if (typeof json !== 'object' || json === null) {
      console.error('config is in wrong format');
      process.exit(2);
    }
    produceContent(json);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

void main();
