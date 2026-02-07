export interface OGPData {
  title?: string;
  description?: string;
  image?: string;
}

export const fetchOGP = async (url: string): Promise<OGPData | null> => {
  try {
    // ローカルのプロキシサーバーを経由
    const proxyUrl = `http://localhost:3005/api/proxy?url=${encodeURIComponent(url)}`;
    
    // タイムアウトを設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
        console.warn(`Proxy returned status ${response.status} for ${url}`);
        return null;
    }
    
    const html = await response.text();
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (property: string) => {
      return doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ||
             doc.querySelector(`meta[name="${property}"]`)?.getAttribute('content');
    };

    const baseUrl = new URL(url);
    const resolveUrl = (relUrl: string | null | undefined) => {
      if (!relUrl) return undefined;
      if (relUrl.startsWith('http')) return relUrl;
      try {
        // スラッシュで始まる場合は origin から、そうでない場合は現在のパスから解決
        return new URL(relUrl, url).href;
      } catch (e) {
        return relUrl;
      }
    };

    return {
      title: getMeta('og:title') || getMeta('twitter:title') || doc.title,
      description: getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '',
      image: resolveUrl(getMeta('og:image') || getMeta('twitter:image')),
    };
  } catch (error) {
    console.warn(`OGP fetch failed for ${url}:`, error);
    return null;
  }
};
