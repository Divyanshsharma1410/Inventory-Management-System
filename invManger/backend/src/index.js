import app from './app.js';
import { env } from './config/env.js';
import prisma from './lib/prisma.js';

// Bind to 0.0.0.0 so the container is reachable by Railway's proxy/healthcheck
// (the default host can bind in a way the platform can't reach). Log to stderr
// so the line is unbuffered and visible in platform logs.
const server = app.listen(env.port, '0.0.0.0', () => {
  process.stderr.write(`🚀 Inventory API running on 0.0.0.0:${env.port} (${env.nodeEnv})\n`);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
