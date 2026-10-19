import { brandIcon } from '@/lib/brand-icon';

// 512px PNG icon for the web manifest.
export const dynamic = 'force-static';

export function GET() {
  return brandIcon(512);
}
