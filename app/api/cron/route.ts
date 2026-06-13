import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SITES = [
  { id: "main", url: "https://ndmu.edu.ph" },
  { id: "sms", url: "https://sms.ndmu.edu.ph" },
  { id: "satp", url: "https://satp.ndmu.edu.ph" },
  { id: "alumni", url: "https://alumni.ndmu.edu.ph" },
];

export async function GET(request: Request) {
  // SECURITY: Check for a secret authorization header
  // This prevents random people on the internet from hitting this URL and spamming your database.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
  }

  const results = await Promise.all(
    SITES.map(async (site) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(site.url, { 
          method: 'HEAD', 
          signal: controller.signal,
          cache: 'no-store',
          // Use a custom User-Agent so the university servers don't block an unknown generic fetch
          headers: { 'User-Agent': 'NDMU-Unofficial-Status-Monitor/1.0' }
        });
        
        clearTimeout(timeout);
        const latency = Date.now() - start;
        
        return {
          site_id: site.id,
          status: response.ok ? (latency > 3000 ? 'degraded' : 'online') : 'offline',
          latency: latency
        };
      } catch (error) {
        // If the fetch fails entirely (DNS error, timeout, network down)
        return {
          site_id: site.id,
          status: 'offline',
          latency: null
        };
      }
    })
  );

  // Bulk insert the 4 results into Supabase
  const { error } = await supabase.from('uptime_logs').insert(results);

  if (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    timestamp: new Date().toISOString(),
    logs: results 
  });
}