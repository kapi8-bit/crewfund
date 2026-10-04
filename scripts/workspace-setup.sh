#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/Users/krestenbork/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
exec node node_modules/tsx/dist/cli.mjs scripts/setup.ts "$@"
