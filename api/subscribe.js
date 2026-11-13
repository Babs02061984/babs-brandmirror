// Vercel-Funktion: trägt eine E-Mail-Adresse in Brevo ein.
// Der Schlüssel liegt NUR bei Vercel (Environment Variable BREVO_API_KEY),
// nie im Browser und nie im Code.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var key = process.env.BREVO_API_KEY;
  if (!key) {
    console.error('BREVO_API_KEY fehlt in den Vercel-Einstellungen');
    return res.status(500).json({ error: 'Server not configured' });
  }

  var body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  var email = String(body.email || '').trim();
  var archetype = String(body.archetype || '').slice(0, 40);

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    var r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'api-key': key
      },
      body: JSON.stringify({
        email: email,
        listIds: [2],
        updateEnabled: true,
        attributes: { ARCHETYP: archetype, SOURCE: 'Brand Mirror' }
      })
    });
    if (!r.ok) {
      console.error('Brevo-Fehler', r.status, await r.text());
      return res.status(502).json({ error: 'Brevo error' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Brevo nicht erreichbar', e);
    return res.status(502).json({ error: 'Upstream error' });
  }
};