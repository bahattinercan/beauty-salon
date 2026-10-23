#!/usr/bin/env bash
#
# check_toolchain.sh -- compares the local node/flutter versions against the
# pins declared in the repo-root .tool-versions file.
#
# Offline by design: no network access, no installation, no `flutter upgrade`.
# Exit 0  -> local versions match the pins
# Exit 1  -> mismatch, or a tool / pin could not be read or parsed
set -euo pipefail

# --- resolve the repo root from this script's own location -------------------
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
repo_root="$(dirname -- "$script_dir")"
tool_versions_file="$repo_root/.tool-versions"

if [[ ! -f "$tool_versions_file" ]]; then
  echo "toolchain ERROR: missing $tool_versions_file" >&2
  exit 1
fi

# --- read the expected pins (asdf-style "<name> <version>") ------------------
read_pin() {
  local name="$1"
  tr -d '\r' <"$tool_versions_file" | awk -v n="$name" '$1 == n { print $2; exit }'
}

node_pin="$(read_pin nodejs)"
flutter_pin="$(read_pin flutter)"

if [[ -z "$node_pin" || -z "$flutter_pin" ]]; then
  echo "toolchain ERROR: nodejs and/or flutter pin missing from $tool_versions_file" >&2
  exit 1
fi

# --- actual node version: strip the leading "v" from "v22.23.4" -------------
if ! command -v node >/dev/null 2>&1; then
  echo "toolchain ERROR: node not found on PATH" >&2
  exit 1
fi

node_raw="$(node --version 2>/dev/null || true)"
node_actual="${node_raw#"${node_raw%%[![:space:]]*}"}"   # trim leading space
node_actual="${node_actual%"${node_actual##*[![:space:]]}"}" # trim trailing space
node_actual="${node_actual#v}"                            # drop leading "v"
node_actual="${node_actual#V}"

if [[ -z "$node_actual" ]]; then
  echo "toolchain ERROR: could not parse 'node --version' output" >&2
  exit 1
fi

# --- actual flutter version: version number on the first line of output ------
# First line looks like: "Flutter 3.47.7 • channel stable • https://github.com/..."
if ! command -v flutter >/dev/null 2>&1; then
  echo "toolchain ERROR: flutter not found on PATH" >&2
  exit 1
fi

# Capture the whole output first; piping straight into `head` can kill flutter
# with SIGPIPE under `set -o pipefail`.
flutter_output="$(flutter --version 2>/dev/null || true)"
flutter_first_line="$(printf '%s\n' "$flutter_output" | sed -n '1p')"
flutter_actual="$(printf '%s' "$flutter_first_line" \
  | sed -n 's/^[Ff]lutter[[:space:]]\{1,\}\([0-9][0-9]*\(\.[0-9][0-9]*\)*[A-Za-z0-9.+-]*\).*/\1/p')"

if [[ -z "$flutter_actual" ]]; then
  echo "toolchain ERROR: could not parse the version from 'flutter --version' first line: $flutter_first_line" >&2
  exit 1
fi

# --- compare -----------------------------------------------------------------
if [[ "$node_actual" == "$node_pin" && "$flutter_actual" == "$flutter_pin" ]]; then
  echo "toolchain OK: node $node_actual, flutter $flutter_actual"
  exit 0
fi

mismatches=()
if [[ "$node_actual" != "$node_pin" ]]; then
  mismatches+=("node expected $node_pin, got $node_actual")
fi
if [[ "$flutter_actual" != "$flutter_pin" ]]; then
  mismatches+=("flutter expected $flutter_pin, got $flutter_actual")
fi

echo "toolchain MISMATCH: $(printf '%s; ' "${mismatches[@]}")(pinned in $tool_versions_file)" >&2
exit 1
