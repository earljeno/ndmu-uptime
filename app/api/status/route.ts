import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: recentLogs, error: recentError } = await supabase
      .from('uptime_logs')
      .select('site_id, status, latency, created_at')
      .order('created_at', { ascending: false })
      .limit(360);

    if (recentError) throw recentError;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysIso = thirtyDaysAgo.toISOString();

    const siteIds = ["main", "sms", "satp", "alumni"];
    
    const formattedData = await Promise.all(siteIds.map(async (id) => {
      
      const siteRecentLogs = recentLogs ? recentLogs.filter((log) => log.site_id === id) : [];
      const latestLog = siteRecentLogs[0];
      const history: Array<{ status: any; timestamp: any } | null> = siteRecentLogs.map((log) => ({
        status: log.status,
        timestamp: log.created_at
      })).reverse();

      while (history.length < 90) {
        history.unshift(null);
      }
      
      const { count: totalCount } = await supabase
        .from('uptime_logs')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', id)
        .gte('created_at', thirtyDaysIso);

      const { count: upCount } = await supabase
        .from('uptime_logs')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', id)
        .or('status.ilike.online,status.ilike.degraded')
        .gte('created_at', thirtyDaysIso);

      let uptime30Day = 100.00;
      
      if (totalCount !== null && totalCount > 0) {
        uptime30Day = ((upCount || 0) / totalCount) * 100;
      }

      return {
        id,
        current: latestLog ? {
          status: latestLog.status,
          latency: latestLog.latency,
          checkedAt: new Date(latestLog.created_at)
        } : null,
        history: history.slice(-90),
        uptime30Day: parseFloat(uptime30Day.toFixed(2)) 
      };
    }));

    return NextResponse.json({ success: true, systems: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
