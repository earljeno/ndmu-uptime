import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch the last 360 logs total (90 historical entries * 4 sites)
    const { data: logs, error } = await supabase
      .from('uptime_logs')
      .select('site_id, status, latency, created_at')
      .order('created_at', { ascending: false })
      .limit(360);

    if (error) throw error;

    const siteIds = ["main", "sms", "satp", "alumni"];
    
    const formattedData = siteIds.map((id) => {
      // Filter logs specific to this site
      const siteLogs = logs ? logs.filter((log) => log.site_id === id) : [];
      
      // The newest entry represents the current real-time state
      const latestLog = siteLogs[0];
      
      // Map out the history array (reversing so oldest is index 0, newest is on the right)
      const history = siteLogs.map((log) => log.status).reverse();
      
      // If history has fewer than 90 logs, pad the beginning with null (no data)
      while (history.length < 90) {
        history.unshift(null);
      }

      return {
        id,
        current: latestLog ? {
          status: latestLog.status,
          latency: latestLog.latency,
          checkedAt: new Date(latestLog.created_at)
        } : null,
        history: history.slice(-90) // Ensure exactly 90 elements
      };
    });

    return NextResponse.json({ success: true, systems: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}