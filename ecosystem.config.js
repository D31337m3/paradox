// PM2 Ecosystem — PARADOX
// Reference config. The install.sh script uses pm2 CLI directly.
// You can also use: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "paradox-frontend",
      script: "serve",
      interpreter: "none",
      args: "-s /root/projects/paradox/frontend/dist -l 3000",
      cwd: "/root/projects/paradox",
      restart_delay: 3000,
      max_restarts: 10,
    },
    {
      name: "paradox-chat",
      script: "/root/projects/paradox/chat-server/index.js",
      cwd: "/root/projects/paradox/chat-server",
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
