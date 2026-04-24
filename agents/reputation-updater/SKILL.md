# Hermes Agent Skill: Ritual Reputation Updater
# Periodic reputation decay and refresh for Ritual Agent Registry

## Purpose

Runs daily to:
1. **Decay old reputation scores** (prevent accumulation inflation)
2. **Refresh active agent heartbeat status** (mark stale agents inactive)
3. **Reward consistent performers** with small boosts

Integrates with the `ritual-dapp-scheduler` skill for cron-triggered execution.

## Trigger

**Manual:**
```
ritual agents reputation update --all
```

**Cron (automated):**
```
hermes cronjob create --schedule "0 2 * * *" --prompt "Run ritual agents reputation update --all"
```

## Steps

### Step 1 — Load Skills

Required:
- `ritual-dapp-contracts` — read/write reputation and agent status
- `ritual-dapp-scheduler` — provide last-run timestamp context
- `ritual-dapp-llm` (optional) — for contextual comments

### Step 2 — Calculate Decay

For each agent:
- Get `lastHeartbeat` from `AgentRegistry`
- If `now - lastHeartbeat > HEARTBEAT_TIMEOUT (86400 * 3 = 3 days)`:
  - Set `agent.active = false` via `setActive(agent, false)`
- Else:
  - Get `lastAuditDate` from reputation log
  - If `now - lastAuditDate > 1 day`:
    - Apply decay: `newScore = oldScore * (1 - DECAY_RATE)`
    - DECAY_RATE = 0.01 (1% per day)
    - Minimum score floor = 0

### Step 3 — Consistency Bonus

For agents with ≥3 consecutive days of `active = true`:
- Add `+5` to `reliability` score (rewards stability)

### Step 4 — Write Updates

For each affected agent:
- Call `ReputationTracker.updateReputation(agent, category, delta, "decay")`
- Or `AgentRegistry.setActive(agent, false)` if stale

Batch transactions if supported (Ritual precompile allows multi-call).

## Configuration

```env
# ~/.ritual-agent-registry/.env
REPUTATION_DECAY_RATE=0.01          # 1% daily decay
HEARTBEAT_TIMEOUT_DAYS=3            # Mark inactive after 3 days
CONSISTENCY_BONUS_DAYS=3            # Need 3+ days streak for bonus
CONSISTENCY_BONUS_POINTS=5          # Reliability boost amount
```

## Output

```
Updating reputation for 142 agents...
  ✓ decayed 89 agents (avg -2.4 points)
  ✓ awarded consistency bonus to 34 agents (+5 reliability)
  ✓ deactivated 12 stale agents (no heartbeat > 3d)
  ✓ updated 135 agents total

Results saved to ~/.ritual-agent-registry/updates/2026-04-26.json
```

## Sample Output JSON

```json
{
  "date": "2026-04-26",
  "agents_checked": 142,
  "agents_modified": 135,
  "agents_deactivated": 12,
  "agents_bonused": 34,
  "avg_decay": -2.4,
  "details": [
    {"agent": "0xabc...", "changes": {"reliability": -3, "quality": -1}},
    {"agent": "0xdef...", "changes": {"reliability": +5}}
  ]
}
```

## Integration

This skill **must** be triggered by `ritual-dapp-scheduler` for reliability.
Alternatively, set up Hermes cronjob:

```
hermes config set --key skills.ritual-meta-scheduler.enabled true
hermes cronjob create --name "ritual-reputation-update" --schedule "0 2 * * *" --prompt "Run ritual agents reputation update --all"
```

## Notes

- Reputation is **category-scoped**: decay applies only to `reliability` and `quality` scores by default; `speed` and `cost-efficiency` decay faster (2%/day) if agent is inactive.
- Agents can opt-out of decay by setting `active=false` themselves (preserves score until re-activated).
- Full audit (via `agents/auditor`) overrides decay for that day's scores.
