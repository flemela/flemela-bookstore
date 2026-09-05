// server/api/admin/books/import/excel.post.ts
// =============================================================================
// Protocol-aware streaming forwarder supporting Render HTTPS (443) & local HTTP
// =============================================================================

import http from 'http';
import https from 'https';
import { URL } from 'url';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const token = getCookie(event, 'flemela_admin_session') || event.context.authToken;

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized session' });
  }

  const backendBaseUrl = config.sokoApiBaseUrl.replace(/\/$/, '');
  const targetUrl = new URL(`${backendBaseUrl}/books/import/excel`);

  // Detect whether target is HTTPS (Render production) or HTTP (local dev)
  const isHttps = targetUrl.protocol === 'https:';
  const transport = isHttps ? https : http;
  const defaultPort = isHttps ? 443 : 3000;

  return new Promise((resolve, reject) => {
    const headers: Record<string, string | string[] | undefined> = {
      ...event.node.req.headers,
      host: targetUrl.host,
      authorization: `Bearer ${token}`,
    };

    const options = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || defaultPort,
      path: targetUrl.pathname + targetUrl.search,
      method: 'POST',
      headers,
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        const statusCode = proxyRes.statusCode || 200;
        if (statusCode >= 200 && statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ success: true, data });
          }
        } else {
          let errorMsg = `Upload failed with HTTP ${statusCode}`;
          try {
            const errJson = JSON.parse(data);
            errorMsg = errJson.message || errJson.error?.message || errorMsg;
          } catch {
            // Use default error string
          }
          reject(createError({ statusCode, statusMessage: errorMsg }));
        }
      });
    });

    proxyReq.on('error', (err) => {
      reject(createError({ statusCode: 502, statusMessage: `Proxy connection error: ${err.message}` }));
    });

    // Pipe raw incoming file stream directly to the backend
    event.node.req.pipe(proxyReq);
  });
});