import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Fetch the last 90 records per site for the real-time visual bars
    const { data: recentLogs, error: recentError } = await supabase
      .from('uptime_logs')
      .select('site_id, status, latency, created_at')
      .order('created_at', { ascending: false })
      .limit(360);

    if (recentError) throw recentError;

    // 2. Fetch the last 30 days of status data for the long-term percentage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: monthLogs, error: monthError } = await supabase
      .from('uptime_logs')
      .select('site_id, status')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (monthError) throw monthError;

    const siteIds = ["main", "sms", "satp", "alumni"];
    
    const formattedData = siteIds.map((id) => {
      // Process the 90-bar history
      const siteRecentLogs = recentLogs ? recentLogs.filter((log) => log.site_id === id) : [];
      const latestLog = siteRecentLogs[0];
      const history: Array<{ status: any; timestamp: any } | null> = siteRecentLogs.map((log) => ({
        status: log.status,
        timestamp: log.created_at
      })).reverse();

      while (history.length < 90) {
        history.unshift(null);
      }
      // Process the 30-day uptime percentage
      const siteMonthLogs = monthLogs ? monthLogs.filter(log => log.site_id === id) : [];
      let uptime30Day = 100.00;
      
      if (siteMonthLogs.length > 0) {
        const operationalCount = siteMonthLogs.filter(log => log.status === 'online' || log.status === 'degraded').length;
        uptime30Day = (operationalCount / siteMonthLogs.length) * 100;
      }

      return {
        id,
        current: latestLog ? {
          status: latestLog.status,
          latency: latestLog.latency,
          checkedAt: new Date(latestLog.created_at)
        } : null,
        history: history.slice(-90),
        uptime30Day: parseFloat(uptime30Day.toFixed(2)) // Round to 2 decimal places
      };
    });

    return NextResponse.json({ success: true, systems: formattedData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}