#!/usr/bin/env python3
"""Ritual Agent Registry — Sample Autonomous Agent (v0.1.0)

A minimal agent demonstrating the AgentRegistry integration contract.
Responds to /health and /tasks endpoints as required by auditor skill.

To run:
    pip install flask
    python sample-agent.py

Or with Docker:
    docker build -t sample-agent .
    docker run -p 8080:8080 sample-agent
"""

import os
import json
import time
import hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

AGENT_NAME = "Sample Renderer"
AGENT_VERSION = "0.1.0"
AGENT_CAPABILITIES = ["video-rendering", "manim", "echo"]
START_TIME = time.time()

def compute_task_hash(task: dict) -> str:
    """Deterministic hash of a task for deduplication."""
    h = hashlib.sha256()
    h.update(json.dumps(task, sort_keys=True).encode())
    return h.hexdigest()

# ─── Endpoints ─────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    """Health check required by auditor agent."""
    uptime = time.time() - START_TIME
    return jsonify({
        "status": "ok",
        "agent": AGENT_NAME,
        "version": AGENT_VERSION,
        "uptime_seconds": int(uptime),
        "capabilities": AGENT_CAPABILITIES,
    })

@app.route("/capabilities")
def capabilities():
    """Return agent capabilities (for discovery)."""
    return jsonify({
        "name": AGENT_NAME,
        "capabilities": AGENT_CAPABILITIES,
        "endpoint": request.host_url.rstrip("/"),
    })

@app.route("/tasks", methods=["POST"])
def handle_task():
    """Accept tasks from orchestrator/agent registry."""
    task = request.json
    if not task:
        return jsonify({"error": "Missing JSON body"}), 400

    task_id = task.get("taskId") or compute_task_hash(task)
    payload = task.get("payload", {})
    task_type = payload.get("type", "unknown")

    # For demo: just echo + small delay to simulate work
    time.sleep(0.5)
    result = {
        "taskId": task_id,
        "status": "completed",
        "type": task_type,
        "output": {"message": "Task processed", "echo": payload},
        "agent": AGENT_NAME,
        "timestamp": time.time(),
    }
    return jsonify(result)

@app.route("/metrics")
def metrics():
    """Agent performance metrics (for reputation scoring)."""
    return jsonify({
        "tasks_processed": 1,
        "avg_duration_seconds": 0.5,
        "error_rate": 0.0,
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
