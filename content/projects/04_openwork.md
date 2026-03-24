---
title: "OpenWork"
description: "An agent orchestration platform for provisioning, configuring, and running AI agents at scale — with concurrency management, cron scheduling, batch processing, and a full chat interface."
image: "/projects/openwork.png"
github: "https://github.com/Vsageev/OpenWork"
---

I wanted a way to spin up AI agents, give them scoped access to a workspace, and let them actually do things — chat with users, run on schedules, process batches of work items — without babysitting each one. OpenWork is what came out of that.

At its core, it's an orchestration layer. You create an agent, pick a model (Claude, Codex, Cursor, Qwen, etc.), attach skills (markdown-based capability documents), set environment variables, and let it loose. Each agent gets its own service user account and a scoped API key, so it can interact with the workspace — cards, boards, folders, messages, storage — without having access to things it shouldn't.

The execution model has three modes: chat (user sends a message, agent responds), cron (agent runs on a schedule), and card assignment (batch processing with dependency resolution). All of these go through a global concurrency gate with rate limit detection and backoff, so you can run multiple agents in parallel without blowing through API limits.

On the infrastructure side, agents are spawned as separate processes. Stdout/stderr get captured per run, PIDs are tracked for live monitoring, and there's startup reconciliation to handle crashes gracefully. Runs are stored with full logs, duration, trigger info, and extracted responses.

The frontend has two main views: an agents page for configuration (model, skills, cron jobs, env vars, avatars) and a monitor page for real-time execution tracking with log streaming and queue status.

Tech stack is Fastify 5, React 19, Vite, TypeScript, Zod v4, pnpm workspaces. Data lives in a JSON file store. The whole thing also includes embeddable widgets (forms and chat) for external sites, Telegram integration, webhooks, and the usual workspace features (boards, folders, unified inbox, 2FA, audit logs).
