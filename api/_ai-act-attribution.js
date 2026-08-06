const crypto = require('node:crypto');

const PRODUCT_LANDING = 'https://ai-team.pl/ai-act';

function cleanId(value) {
  const cleaned = String(value || '').trim();
  return /^[A-Za-z0-9_-]{1,40}$/.test(cleaned) ? cleaned : '';
}

function buildLeadReference({ email, attribution = {}, secret }) {
  const hmacSecret = String(secret || '').trim();
  if (!hmacSecret) return '';

  const campaignId = cleanId(attribution.campaign_id);
  const adsetId = cleanId(attribution.adset_id);
  const adId = cleanId(attribution.ad_id);
  const leadId = cleanId(attribution.lead_id);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const digest = crypto
    .createHmac('sha256', hmacSecret)
    .update([normalizedEmail, leadId, campaignId, adsetId, adId].join('|'))
    .digest('hex')
    .slice(0, 20);

  if (campaignId || adsetId || adId || leadId) {
    return `meta_${campaignId || 'unknown'}_${adId || 'unknown'}_${digest}`;
  }
  return `web_${digest}`;
}

function buildAiActProductUrl({ email, attribution = {}, secret }) {
  const campaignId = cleanId(attribution.campaign_id);
  const adsetId = cleanId(attribution.adset_id);
  const adId = cleanId(attribution.ad_id);
  const fromMeta = Boolean(campaignId || adsetId || adId || cleanId(attribution.lead_id));
  const url = new URL(PRODUCT_LANDING);
  url.searchParams.set('utm_source', fromMeta ? 'meta' : 'ai_team');
  url.searchParams.set('utm_medium', fromMeta ? 'lead_email' : 'email');
  url.searchParams.set(
    'utm_campaign',
    fromMeta && campaignId ? `ai_act_radar_${campaignId}` : 'ai_act_checklista',
  );
  url.searchParams.set('utm_content', fromMeta && adId ? `ad_${adId}` : 'welcome');
  if (fromMeta && adsetId) url.searchParams.set('utm_term', `adset_${adsetId}`);

  const reference = buildLeadReference({ email, attribution, secret });
  if (reference) url.searchParams.set('lead_ref', reference);
  url.hash = 'pakiet';
  return url.toString();
}

module.exports = {
  buildAiActProductUrl,
  buildLeadReference,
};
