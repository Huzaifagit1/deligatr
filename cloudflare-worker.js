/**
 * Cloudflare Worker — Email/Link Tracking Page
 *
 * DEPLOY STEPS:
 *   1. Go to dash.cloudflare.com > Workers & Pages > Create Application > Create Worker
 *   2. Replace the default worker code with this entire file
 *   3. Update WEBHOOK_URL and REDIRECT_URL in the HTML_PAGE template below
 *   4. Click "Save and Deploy"
 *   5. Send tracking links in the format:
 *        https://your-worker.your-subdomain.workers.dev/?trackingId=abc123
 *
 * CUSTOM DOMAIN (optional):
 *   Workers & Pages > your worker > Settings > Triggers > Add Custom Domain
 */

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting…</title>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f9f9f9;
      font-family: system-ui, sans-serif;
      color: #555;
    }
    p { font-size: 1rem; letter-spacing: 0.02em; }
  </style>
</head>
<body>
  <p>Please wait, redirecting…</p>

  <script>
    // ─── CONFIGURATION ────────────────────────────────────────────────────────
    const WEBHOOK_URL  = 'https://your-n8n-instance.com/webhook/your-webhook-id';
    const REDIRECT_URL = 'https://your-destination.com';
    // ─────────────────────────────────────────────────────────────────────────

    function isRealBrowser() {
      if (typeof screen === 'undefined' || screen.width <= 0) return false;
      if (!navigator.cookieEnabled) return false;
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f';
        ctx.fillRect(10, 10, 80, 30);
        ctx.fillStyle = '#0ff';
        ctx.font = '18px Arial';
        ctx.fillText('tracker_check', 20, 32);
        ctx.beginPath();
        ctx.arc(150, 25, 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#ff0';
        ctx.stroke();
        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl || dataUrl.length < 500) return false;
      } catch (_) {
        return false;
      }
      return true;
    }

    function collectSignals() {
      const params     = new URLSearchParams(window.location.search);
      const trackingId = params.get('trackingId') || '';
      return {
        trackingId,
        userAgent:     navigator.userAgent     || '',
        screenWidth:   screen.width            || 0,
        screenHeight:  screen.height           || 0,
        timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        language:      navigator.language      || '',
        colorDepth:    screen.colorDepth       || 0,
        cookieEnabled: navigator.cookieEnabled,
        platform:      navigator.platform      || '',
        timestamp:     new Date().toISOString(),
        referrer:      document.referrer       || '',
        href:          window.location.href    || '',
      };
    }

    async function run() {
      if (isRealBrowser()) {
        try {
          await fetch(WEBHOOK_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(collectSignals()),
          });
        } catch (_) {}
      }
      window.location.replace(REDIRECT_URL);
    }

    run();
  <\/script>
</body>
</html>`;

export default {
  async fetch(request) {
    // Only serve GET requests to the root path (or any path — tracking links
    // may include query strings but the path is always /)
    return new Response(HTML_PAGE, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Prevent the tracking page itself from being cached
        'Cache-Control': 'no-store',
      },
    });
  },
};
