// api/upload.js
// Uploads an image (base64 data URL) to a private Vercel Blob store.
// Returns a URL served through /api/image (since private blobs cannot
// be fetched directly by the browser).

const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    const { dataUrl, filename } = body;

    if (!dataUrl || !filename) {
      res.status(400).json({ ok: false, error: 'dataUrl and filename are required' });
      return;
    }

    // Parse the data URL: data:image/png;base64,XXXX
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ ok: false, error: 'Invalid data URL' });
      return;
    }
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const blob = await put(filename, buffer, {
      access: 'private',
      contentType,
      allowOverwrite: true,
      addRandomSuffix: false
    });

    // Public-facing URL goes through our own image-serving endpoint,
    // since private blobs require authentication to fetch directly.
    res.status(200).json({ ok: true, url: '/api/image?name=' + encodeURIComponent(filename) });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
