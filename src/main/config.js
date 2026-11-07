const DEFAULT_CONFIG = Object.freeze({
  idleThresholdSeconds: 300,
  port: 4747,
  petName: 'Ghost',
  selectedPet: 'Built-in:ghost',
  reactionDurationMs: 4000,
  position: null,
});

function normalizeConfig(value = {}) {
  const config = { ...DEFAULT_CONFIG };
  if (Number.isFinite(value.idleThresholdSeconds) && value.idleThresholdSeconds > 0) {
    config.idleThresholdSeconds = value.idleThresholdSeconds;
  }
  if (Number.isInteger(value.port) && value.port >= 1 && value.port <= 65535) {
    config.port = value.port;
  }
  if (typeof value.petName === 'string' && value.petName.trim()) {
    config.petName = value.petName.trim().slice(0, 80);
  }
  if (typeof value.selectedPet === 'string' && value.selectedPet.trim()) {
    config.selectedPet = value.selectedPet.trim().slice(0, 80);
  }
  if (Number.isFinite(value.reactionDurationMs) && value.reactionDurationMs > 0) {
    config.reactionDurationMs = value.reactionDurationMs;
  }
  if (value.position && Number.isFinite(value.position.x) && Number.isFinite(value.position.y)) {
    config.position = { x: Math.round(value.position.x), y: Math.round(value.position.y) };
  }
  return config;
}

function loadConfig(configPath) {
  try {
    return normalizeConfig(JSON.parse(require('node:fs').readFileSync(configPath, 'utf8')));
  } catch {
    return normalizeConfig();
  }
}

function saveConfig(configPath, value) {
  const fs = require('node:fs');
  const path = require('node:path');
  const config = normalizeConfig(value);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const temporaryPath = `${configPath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, configPath);
  return config;
}

module.exports = { DEFAULT_CONFIG, normalizeConfig, loadConfig, saveConfig };
