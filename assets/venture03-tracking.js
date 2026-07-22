(function (root, factory) {
  const api = factory(root || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) root.Venture03Tracking = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  const STORAGE_KEY = 'venture03_attribution';
  const PURCHASE_KEY = 'venture03_purchase_147_v1';
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const PII_KEYS = new Set([
    'email', 'em', 'phone', 'ph', 'name', 'first_name', 'last_name', 'fn', 'ln',
    'external_id', 'user_data', 'client_ip_address', 'client_user_agent',
  ]);

  function parseAttribution(searchParams) {
    const params = searchParams && typeof searchParams.get === 'function'
      ? searchParams
      : new URLSearchParams(String(searchParams || ''));
    return Object.fromEntries(
      UTM_KEYS
        .map((key) => [key, String(params.get(key) || '').trim().slice(0, 160)])
        .filter(([, value]) => value)
    );
  }

  function sanitizeEventParams(params) {
    const input = params && typeof params === 'object' ? params : {};
    return Object.fromEntries(
      Object.entries(input).filter(([key]) => !PII_KEYS.has(String(key).toLowerCase()))
    );
  }

  function readStoredAttribution() {
    try {
      return JSON.parse(root.sessionStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function captureAttribution() {
    if (!root.location || !root.sessionStorage) return {};
    const current = parseAttribution(new URLSearchParams(root.location.search || ''));
    const stored = readStoredAttribution();
    const attribution = Object.keys(current).length ? { ...stored, ...current } : stored;
    if (Object.keys(attribution).length) {
      try {
        root.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
      } catch {
        return attribution;
      }
    }
    return attribution;
  }

  function getAttribution() {
    return captureAttribution();
  }

  function track(eventName, params) {
    if (typeof root.fbq !== 'function') return false;
    root.fbq('track', eventName, sanitizeEventParams(params));
    return true;
  }

  function bindCheckoutLinks() {
    if (!root.document) return;
    root.document.querySelectorAll('[data-venture03-checkout]').forEach((link) => {
      if (link.dataset.venture03Bound === '1') return;
      link.dataset.venture03Bound = '1';
      link.addEventListener('click', function () {
        track('InitiateCheckout', {
          content_name: 'Mapa Wdrożenia AI',
          content_category: 'produkt_cyfrowy',
          value: 147,
          currency: 'PLN',
        });
      });
    });
  }

  function trackPurchaseOnce() {
    if (!root.localStorage) return false;
    try {
      if (root.localStorage.getItem(PURCHASE_KEY) === '1') return false;
      const sent = track('Purchase', {
        content_name: 'Mapa Wdrożenia AI',
        content_category: 'produkt_cyfrowy',
        value: 147,
        currency: 'PLN',
      });
      if (sent) root.localStorage.setItem(PURCHASE_KEY, '1');
      return sent;
    } catch {
      return false;
    }
  }

  function init() {
    captureAttribution();
    if (!root.document) return;
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', bindCheckoutLinks, { once: true });
    } else {
      bindCheckoutLinks();
    }
  }

  init();

  return {
    parseAttribution,
    sanitizeEventParams,
    getAttribution,
    track,
    bindCheckoutLinks,
    trackPurchaseOnce,
  };
});
