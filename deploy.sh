#!/usr/bin/env bash
# Deploy Folio to production AND move the foli0.vercel.app alias onto the new build.
#
# Normally not needed: the Vercel project is connected to GitHub
# (Asanchi324/folio-app), so every push to main deploys to production, and
# foli0.vercel.app is a project domain that follows it. Use this script only
# to ship uncommitted local changes.
#
# Why this script exists:
#   foli0.vercel.app is a MANUAL Vercel alias. Plain `vercel --prod` only moves
#   the auto-generated domains (folio-sigma-steel.vercel.app, …) to the new
#   deployment — it leaves foli0 pinned to the PREVIOUS deployment. So without
#   this script, every deploy silently leaves the public site (and any new env
#   vars / code fixes) on the old build. Always deploy with: ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "▶ Deploying to production…"
# Capture output in a file and don't let a non-zero exit abort the script
# silently (set -e used to kill it right here with nothing printed).
log="$(mktemp)"
status=0
npx --yes vercel --prod --yes >"$log" 2>&1 || status=$?
cat "$log"

url="$(grep -oE 'https://folio-[a-z0-9]+-assans-projects-6f23b41d\.vercel\.app' "$log" | head -1 || true)"
rm -f "$log"

if [ "$status" -ne 0 ]; then
  echo "✗ vercel exited with status $status (see output above)."
  exit "$status"
fi

if [ -z "$url" ]; then
  echo "✗ Could not parse the new deployment URL from vercel output — re-point manually:"
  echo "    npx vercel alias set <new-deployment-url> foli0.vercel.app"
  exit 1
fi

echo "▶ Re-pointing foli0.vercel.app → $url"
npx --yes vercel alias set "$url" foli0.vercel.app

echo "✓ Done. https://foli0.vercel.app now serves the latest build."
