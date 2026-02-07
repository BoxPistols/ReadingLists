import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 3005;

app.use(cors());

app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    res.send(response.data);
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) {
      // 404はよくあることなので、警告程度に留める
      console.warn(`[Proxy] 404 Not Found: ${targetUrl}`);
    } else {
      console.error(`[Proxy] Error ${status || 'unknown'} fetching ${targetUrl}: ${error.message}`);
    }
    res.status(status || 500).send('Failed to fetch the URL');
  }
});

app.get('/api/favicon', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).send('Domain is required');

  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  
  try {
    const response = await axios.get(googleFaviconUrl, {
      responseType: 'arraybuffer',
      timeout: 3000
    });
    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    // 失敗した場合は透明な1x1ピクセル、または適当なデフォルトアイコンを返す
    // ここでは1x1の透明なPNGを返すことでエラーを回避
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    res.set('Content-Type', 'image/png');
    res.send(transparentPixel);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
