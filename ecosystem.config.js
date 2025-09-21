export const apps = [{
  name: 'ninsys-api',
  script: 'dist/server.js',
  interpreter: 'node',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env: {
    NODE_ENV: 'prod',
    PORT: 3001
  },
  error_file: './logs/err.log',
  out_file: './logs/out.log',
  log_file: './logs/combined.log',
  time: true
}];