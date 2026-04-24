# Hermes Agent Skill: Ritual Agent Auditor
# Part of ritual-agent-registry project

## Purpose

Automatically audits all registered autonomous agents on Ritual Chain by:
1. Fetching all registered agents from the onchain registry
2. Pinging each agent's HTTP endpoint (health check)
3. Parsing agent descriptions + capabilities using LLM (`ritual-dapp-llm` skill)
4. Scoring each agent for clarity, honesty, and specificity
5. Submitting audit scores to the reputation tracker (`ritual-dapp-reputation`)

## Trigger

```
ritual agents audit --all
```

## Steps

### Step 1 — Load Required Skills

Load these skills before execution:
- `ritual-dapp-http` — for endpoint GET requests
- `ritual-dapp-contracts` — for onchain reads
- `ritual-dapp-llm` — for LLM-based quality scoring
- `ritual-dapp-reputation` — for submitting audit scores

### Step 2 — Fetch All Agents

Use `ritual-dapp-contracts` to call `AgentRegistry.getAgents()` → returns array of:
- `address agent`
- `string name`
- `string endpoint`
- `string[] capabilities`
- `string description`

Store as `agents = [...]`.

### Step 3 — Health Check Each Agent

For each agent in `agents`:
- GET `<agent.endpoint>/health` (or `/ping`, `/status`)
- If 200 OK within 5s → mark `healthy = true`
- If timeout/error → mark `healthy = false`, log reason

Collect: `{agent, healthy, responseTimeMs}`

### Step 4 — LLM Quality Scoring

For each agent with `healthy == true`:
- Construct prompt:
  ```
  Score this autonomous agent description on a scale 1-10 for:
  1. Clarity: Is the purpose clearly stated?
  2. Honesty: Does it overpromise or sound like spam?
  3. Specificity: Are capabilities concrete or vague buzzwords?

  Agent name: {name}
  Capabilities: {capabilities.join(', ')}
  Description: {description}

  Return JSON: {"clarity": int, "honesty": int, "specificity": int, "notes": "brief explanation"}
  ```

- Call LLM via `ritual-dapp-llm` with temperature 0.3
- Parse JSON response

### Step 5 — Submit Reputation Updates

For each audited agent:
- Calculate `auditScore = (clarity + honesty + specificity) / 3` (0-10 scale)
- Call `ReputationTracker.updateReputation(agent, "quality", auditScore, "audit")`
- Also update `"reliability"` based on health check: +10 if healthy, -10 if dead

### Step 6 — Log Results

Print table:

```
Agent                     Status  Response(ms)  Clarity  Honesty  Spec  Quality  Reliability
──────────────────────────────────────────────────────────────────────────────────
Video Renderer            ✅      142           8        9        7     8.0      +10
Spam Bot                  ❌      timeout       3        2        2     2.3      -10
Memory Scanner            ✅      89            9        8        8     8.3      +10
```

Write full results to `~/.ritual-agent-registry/audit/latest.json`.

## Error Handling

- If contract read fails → log to stderr, continue with next agent
- If LLM call fails → log error, skip scoring (reputation unchanged)
- If reputation update fails → retry once, then mark for manual review

## Scheduling

This agent should run **daily at 00:00 UTC** via cron:
```
0 0 * * * cd /home/user/ritual-agent-registry && ritual-agents audit --all >> /var/log/ritual-audit.log 2>&1
```

Or via Hermes cronjob system:
```
hermes cronjob create --schedule "0 0 * * *" --prompt "Run ritual agents audit --all"
```

## Output

Returns:
- `audited_count`: number of agents audited
- `healthy_count`: how many passed health check
- `avg_quality_score`: average across all scored agents
- `report_path`: path to JSON results file

Example:
```json
{
  "audited_at": "2026-04-26T00:00:00Z",
  "total_agents": 42,
  "healthy": 38,
  "unhealthy": 4,
  "avg_quality_score": 7.2,
  "results": [
    {"agent": "0xabc...", "name": "...", "healthy": true, "quality": 8.1}
  ]
}
```

## Dependencies

- Python: `requests`, `web3`, `click`, `python-dotenv`
- Hermes Skills: `ritual-dapp-http`, `ritual-dapp-contracts`, `ritual-dapp-llm`
- Environment: `.env` with RPC, contract addresses

## Notes

- Agents endpoint **must** implement `GET /health` returning `200 OK` + JSON `{"status":"ok"}`
- LLM prompts should be deterministic (temp=0.3) for consistent scoring
- Store audit history in ~/.ritual-agent-registry/audit/ for trend analysis

</content>