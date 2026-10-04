#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
TASK_ROOT="$(cd ../.. && pwd)"
export PATH="/Users/krestenbork/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$TASK_ROOT/work/toolchain/solana-release/bin:$PATH"
if ! curl -sf http://127.0.0.1:8899 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | rg -q 'ok'; then
 solana-test-validator --ledger "$TASK_ROOT/work/test-ledger" --bind-address 127.0.0.1 > "$TASK_ROOT/work/validator-console.log" 2>&1 &
fi
exec node "$TASK_ROOT/work/toolchain/npm/bin/npm-cli.js" run dev
