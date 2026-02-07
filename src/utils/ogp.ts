export interface OGPData {
  title?: string;
  description?: string;
  image?: string;
}

export const fetchOGP = async (url: string): Promise<OGPData | null> => {
  try {
    // ローカルのプロキシサーバーを経由
    const proxyUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (property: string) => {
      return doc.querySelector(`meta[property="${property}"]`)?.getAttribute('content') ||
             doc.querySelector(`meta[name="${property}"]`)?.getAttribute('content');
    };

    return {
      title: getMeta('og:title') || doc.title,
      description: getMeta('og:description') || getMeta('description') || '',
      image: getMeta('og:image') || undefined,
    };
  } catch (error) {
    console.error('OGP fetch error:', error);
    return null;
  }
};
