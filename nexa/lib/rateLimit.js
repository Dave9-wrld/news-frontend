// Simple sliding-window in-memory rate limiter for serverless Next.js API routes

const ipRequests = new Map();

// Periodic cleanup of stale IP records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequests.entries()) {
      if (now - data.resetTime > 60000) {
        ipRequests.delete(ip);
      }
    }
  }, 300000);
}

/**
 * Check if a request exceeds rate limit.
 * @param {string} ip - Client IP identifier
 * @param {number} limit - Maximum requests allowed in window
 * @param {number} windowMs - Window duration in milliseconds (default: 60s)
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(ip = "anonymous", limit = 30, windowMs = 60000) {
  const now = Date.now();
  const clientData = ipRequests.get(ip);

  if (!clientData || now > clientData.resetTime) {
    ipRequests.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (clientData.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((clientData.resetTime - now) / 1000),
    };
  }

  clientData.count += 1;
  return {
    allowed: true,
    remaining: limit - clientData.count,
    resetInSeconds: Math.ceil((clientData.resetTime - now) / 1000),
  };
}

export function getClientIp(request) {
  const forwarded = request?.headers?.get?.("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request?.headers?.get?.("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
