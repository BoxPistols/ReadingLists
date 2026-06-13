import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import axios from 'axios';
import * as cheerio from 'cheerio';

initializeApp();

interface OgpResult {
  title?: string;
  description?: string;
  image?: string;
  loaded: boolean;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const resolveUrl = (rel: string | undefined, base: string): string | undefined => {
  if (!rel) return undefined;
  try {
    return new URL(rel, base).href;
  } catch {
    return rel;
  }
};

// 追加されたブックマークの URL を 1 回だけ取得し OGP を doc に書き戻す。
// onDocumentCreated は作成時のみ発火するため、書き戻しによる再帰は起きない。
export const enrichBookmark = onDocumentCreated(
  {
    document: 'users/{userId}/bookmarks/{bookmarkId}',
    region: 'asia-northeast1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data() as { url?: string; ogp?: { loaded?: boolean } };
    const url = data.url;

    // 既に取得済み、または URL が無ければ何もしない。
    if (!url || data.ogp?.loaded) return;

    const result: OgpResult = { loaded: true };

    try {
      const res = await axios.get<string>(url, {
        headers: { 'User-Agent': UA },
        timeout: 8000,
        maxContentLength: 5 * 1024 * 1024,
        responseType: 'text',
      });

      const $ = cheerio.load(res.data);
      const meta = (prop: string) =>
        $(`meta[property="${prop}"]`).attr('content') ||
        $(`meta[name="${prop}"]`).attr('content');

      result.title = meta('og:title') || meta('twitter:title') || $('title').text() || undefined;
      result.description =
        meta('og:description') || meta('twitter:description') || meta('description') || undefined;
      result.image = resolveUrl(meta('og:image') || meta('twitter:image'), url);
    } catch (err) {
      // 取得失敗でも loaded:true を書いて再処理を防ぐ。
      logger.warn(`OGP fetch failed for ${url}`, (err as Error).message);
    }

    // undefined を除いて Firestore に書き戻す。
    const ogp: Record<string, unknown> = { loaded: true };
    if (result.title) ogp.title = result.title;
    if (result.description) ogp.description = result.description;
    if (result.image) ogp.image = result.image;

    await snap.ref.update({ ogp });
  },
);
