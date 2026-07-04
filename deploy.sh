#!/usr/bin/env bash
# Deploy Folio to production AND move the foli0.vercel.app alias onto the new build.
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
out="$(npx --yes vercel --prod --yes 2>&1)"
echo "$out"

url="$(printf '%s\n' "$out" \
  | grep -oE 'https://folio-[a-z0-9]+-assans-projects-6f23b41d\.vercel\.app' \
  | head -1)"

if [ -z "$url" ]; then
  echo "✗ Could not parse the new deployment URL from vercel output — re-point manually:"
  echo "    npx vercel alias set <new-deployment-url> foli0.vercel.app"
  exit 1
fi

echo "▶ Re-pointing foli0.vercel.app → $url"
npx --yes vercel alias set "$url" foli0.vercel.app

echo "✓ Done. https://foli0.vercel.app now serves the latest build."
