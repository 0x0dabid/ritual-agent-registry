# Hermes Agent Skill: Ritual Agent Notifier
# Telegram/Webhook notifications for agent registry events

## Purpose

Sends real-time Telegram (or webhook) notifications when:
- An agent's reputation drops ≥ 30 points in a single update
- An agent is deactivated (stale heartbeat)
- A new high-quality agent (quality score > 8) is registered
- Audit report is ready (triggered by `ritual agents audit --all`)

## Trigger

**Manual / Test:**
```
ritual agents notify --test
```

**Reputation Drop Watch:**
```
ritual agents notify --watch-drop --threshold 30
```

**Config Reload:**
```
ritual agents notify --reload-config
```

## Events Monitored

### 1. Reputation Spike Down
When `submitTaskCompletion` emits `ReputationUpdated` event with `delta < -30`:
```
⚠️ Agent Reputation Drop
Agent: Video Renderer (0xabc...)
Category: reliability
Delta: -35
New score: 45
Time: 2026-04-26 03:14 UTC
```

### 2. Agent Deactivated
When `AgentRegistry.setActive(agent, false)` is called:
```
🚫 Agent Deactivated
Agent: Old Bot (0xdef...)
Reason: Heartbeat timeout (last seen: 96h ago)
```

### 3. New Premium Agent
When `AgentRegistered` event fires with `capabilities` containing "video-gen" or "llm-inference" **and** quality score from last audit > 8:
"""
🎉 New High-Quality Agent Registered!
Name: Ritual Whisper ASR
Caps: audio-transcription, llm-inference
Endpoint: https://ritual-whisper.example.com
Registered: just now
"""

## Setup

```bash
# 1. Set Telegram bot token and chat ID in .env
export TELEGRAM_BOT_TOKEN="123456:ABC-..."
export TELEGRAM_CHAT_ID="123456789"

# 2. Test connection
ritual agents notify --test
# Should receive: "✅ Ritual Agent Registry notifier online"

# 3. Enable watchers (runs in background)
ritual agents notify --watch-drop --threshold 30 &
```

Or use Hermes profile integration:

Create `~/.hermes/profiles/ritual-notifier.yaml`:

```yaml
name: ritual-notifier
description: "Sends Telegram alerts for Ritual Agent Registry events"
model: stepfun/step-3.5-flash
skills:
  - ritual-dapp-contracts
  - ritual-dapp-http
system_prompt: |
  You are the notification agent for the Ritual Agent Registry.
  Watch for reputation drops, agent deactivations, and new registrations.
  When triggered, send formatted Telegram messages via the Telegram Bot API.
  Keep messages terse and actionable.
```

Then run:
```
hermes --profile ritual-notifier ritual agents notify --watch-drop
```

## Webhook Alternative

If not using Telegram, configure a generic webhook:

```env
NOTIFY_WEBHOOK_URL=https://hooks.slack.com/...
NOTIFY_WEBHOOK_METHOD=POST
NOTIFY_WEBHOOK_PAYLOAD='{"text":"{{message}}","channel":"#ritual-alerts"}'
```

CLI will POST JSON payload with `message`, `event`, `agent`, `timestamp` fields.

## Implementation Notes

- Uses `ritual-dapp-http` to make Telegram Bot API calls:
  `POST https://api.telegram.org/bot${TOKEN}/sendMessage`
  with `chat_id`, `text`, `parse_mode=Markdown`
- Message queues: If rate-limited (30 msg/s), batches alerts into digest
- Retry logic: 3 retries with exponential backoff on 429/timeout

## CLI Flags

| Flag | Meaning |
|------|---------|
| `--test` | Send test message to verify bot works |
| `--watch-drop` | Run continuous watcher for reputation drops |
| `--threshold N` | Minimum delta to trigger drop alert (default 30) |
| `--reload-config` | Re-read .env and reinitialize connections |
| `--format {telegram,json,slack}` | Override output format |

## Sample Messages

```
[Reputation Drop]
Agent:   SpamScanner v1.2
Address: 0x71C...9A2
Category: quality
Delta:   -42
Reason:  Failed 10/20 audit checks
Time:    2026-04-26 04:15 UTC

Link: https://ritual-explorer.example.com/agent/0x71C...9A2
```

```
[Agent Deactivated]
Agent:   LegacyBot
Address: 0x92B...4D1
Reason:  Heartbeat timeout (72h+ no pong)
Last seen: 2026-04-23 02:30 UTC
Action:  Consider removing from registry if not recovered.
```

## Exit Codes

- `0` — Running (for daemon mode)
- `1` — Configuration error (missing TOKEN)
- `2` — RPC/network failure
- `3` — Test message failed

## Cron Integration

```
# In crontab -e
0 */6 * * * cd /home/user/ritual-agent-registry && ritual-agents notify --watch-drop >> ~/.ritual-agent-registry/logs/notify.log 2>&1
```

Or use Hermes manager:
```
cronjob create --schedule "0 */6 * * *" --prompt "Run ritual agents notify --watch-drop"
```

## Future: Smart Contract Event Listening

Currently polls events every 5 minutes. Later, use `ritual-dapp-agents` sovereign agent pattern to:
1. Deploy agent with `precompile(0x0820)` that listens to `ReputationUpdated` events
2. Agent auto-sends Telegram via `ritual-dapp-http` precompile call
3. No external cron needed — fully onchain trigger.
