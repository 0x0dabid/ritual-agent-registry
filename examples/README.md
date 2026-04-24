# Example Agents

This directory contains sample autonomous agents to test the registry.

## sample-agent

A minimal Flask-based agent with 3 endpoints:

- `GET /health` — returns 200 + JSON (required by auditor)
- `POST /tasks` — accepts tasks, echoes back payload
- `GET /capabilities` — lists agent capabilities

### Run locally
```bash
cd sample-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python agent.py
```

### Verify registration
```bash
ritual-agents register \
  --name "Sample Renderer" \
  --endpoint "http://localhost:8080" \
  --code-path sample-agent/agent.py \
  --capabilities video-rendering manim echo \
  --metadata "local"
```
