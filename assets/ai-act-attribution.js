(function (root) {
  'use strict';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  function sanitizeTrackingValue(value) {
    var cleaned = String(value || '').trim();
    return /^[A-Za-z0-9_-]{1,150}$/.test(cleaned) ? cleaned : '';
  }

  function buildCheckoutUrl(baseUrl, searchParams) {
    var url = new URL(baseUrl);
    UTM_KEYS.forEach(function (key) {
      var value = sanitizeTrackingValue(searchParams.get(key));
      if (value) url.searchParams.set(key, value);
    });
    var reference = sanitizeTrackingValue(searchParams.get('lead_ref'));
    if (reference) url.searchParams.set('client_reference_id', reference);
    return url.toString();
  }

  function buildInitiateCheckoutParams() {
    return {
      content_ids: ['prod_UqMFmFSxB5XZ5x'],
      content_type: 'product',
      content_name: 'AI Act dla małej firmy, pakiet zgodności',
      value: 67,
      currency: 'PLN',
    };
  }

  var api = {
    buildCheckoutUrl: buildCheckoutUrl,
    buildInitiateCheckoutParams: buildInitiateCheckoutParams,
    sanitizeTrackingValue: sanitizeTrackingValue,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AiActAttribution = api;

  if (typeof document === 'undefined' || typeof location === 'undefined') return;
  var applyTracking = function () {
    var query = new URLSearchParams(location.search);
    document.querySelectorAll('[data-ai-act-checkout]').forEach(function (link) {
      link.href = buildCheckoutUrl(link.href, query);
      link.addEventListener('click', function () {
        if (typeof root.fbq === 'function') {
          root.fbq('track', 'InitiateCheckout', buildInitiateCheckoutParams());
        }
      });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTracking, { once: true });
  } else {
    applyTracking();
  }
})(typeof window !== 'undefined' ? window : globalThis);
