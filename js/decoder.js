/**
 * decoder.js - Decodes BTD Battles 1 Profile.save binary files in the browser.
 *
 * Integration Points:
 * 1. Requires pako 2.1.0 loaded prior to running (e.g. from cdnjs: https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js).
 * 2. Fetches raw base64 data from NinjaKiwi static storage API:
 *    https://priority-static-api.nkstatic.com/storage/static/2/{id}/Profile.save
 * 3. Base64 decodes data -> inflates zlib stream using pako -> undoes byte shifting algorithm -> strips DGDATA header + 8-char CRC -> parses JSON.
 * 4. Exported to window.decodeProfile(id) for static site consumption.
 */

async function decodeProfile(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) {
    throw new Error("Invalid Player ID provided.");
  }

  // Try static storage buckets (2, 1, 3, 0)
  const urls = [
    `https://priority-static-api.nkstatic.com/storage/static/2/${encodeURIComponent(cleanId)}/Profile.save`,
    `https://priority-static-api.nkstatic.com/storage/static/1/${encodeURIComponent(cleanId)}/Profile.save`,
    `https://priority-static-api.nkstatic.com/storage/static/3/${encodeURIComponent(cleanId)}/Profile.save`,
    `https://priority-static-api.nkstatic.com/storage/static/0/${encodeURIComponent(cleanId)}/Profile.save`,
  ];

  let res = null;
  let fetchError = null;

  for (const url of urls) {
    try {
      res = await fetch(url, { cache: "no-store" });
      if (res.ok) break;
    } catch (err) {
      fetchError = err;
    }
  }

  // Fallback to CORS proxy if direct fetch is blocked by CORS or network filter
  if (!res || !res.ok) {
    for (const url of urls) {
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        res = await fetch(proxyUrl);
        if (res.ok) break;
      } catch (err) {
        fetchError = err;
      }
    }
  }

  if (!res || !res.ok) {
    if (res && res.status === 404) {
      throw new Error("Profile.save not found for this Player ID.");
    }
    throw new Error(`Failed to fetch Profile.save (${fetchError?.message || res?.statusText || "Network Error"}).`);
  }

  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error("Profile.save contains empty data.");
  }

  if (typeof pako === "undefined") {
    throw new Error("Required dependency 'pako' is not loaded. Please include pako 2.1.0 CDN.");
  }

  try {
    // Step 1: Base64 string to byte array
    const bytes = Uint8Array.from(atob(text.trim()), (c) => c.charCodeAt(0));

    // Step 2: Zlib inflate via pako
    const inflated = pako.inflate(bytes);

    // Step 3: Undo NinjaKiwi byte shift algorithm
    const shifted = inflated.map((v, i) => v - (21 + ((i - 14) % 6)));

    // Step 4: Decode string and strip 14-char header ("DGDATA" + 8-char CRC checksum)
    const jsonStr = new TextDecoder().decode(shifted).substr(14);

    // Step 5: Parse and return decoded JSON save structure
    return JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Profile decoding failed: ${err.message || err}`);
  }
}

// Global window registration for non-module static script tag usage
if (typeof window !== "undefined") {
  window.decodeProfile = decodeProfile;
}
