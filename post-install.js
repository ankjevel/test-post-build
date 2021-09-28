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
  const deployment_config_array = [...Object.entries(json).reduce((array, [key, value]) => {
    config[key.toUpperCase()] = value;
    return [...array, `  ${key.toUpperCase()} = '${value}',`];
  }, ['export enum DeploymentConfigs {']), '}', '', 'declare const config: DeploymentConfigs;', 'export default config;', ''];

  writeFileSync('lib.d.ts', deployment_config_array.join('\n'), { encoding: 'utf-8' });
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
