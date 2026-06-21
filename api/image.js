// api/image.js
// Serves an image stored in the private Vercel Blob store publicly,
// since private blobs cannot be fetched directly by the browser.
// Usage: /api/image?name=coach-photo.jpg

const { get } = require('@vercel/blob');

module.exports = async (req, res) => {
  const name = req.query && req.query.name;
  if (!name) {
    res.status(400).send('Missing name parameter');
    return;
  }

  try {
    const result = await get(name, { access: 'private' });
    if (!result || !result.stream) {
      res.status(404).send('Not found');
      return;
    }

    res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    res.status(200).send(buffer);
  } catch (err) {
    console.error('Image serve error:', err);
    res.status(404).send('Not found');
  }
};
