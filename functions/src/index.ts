import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';

initializeApp();

// Claude API キー（firebase functions:secrets:set ANTHROPIC_API_KEY で設定）。
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// 単一カテゴリの分類タクソノミー。src/constants/taxonomy.ts と同期すること。
const CATEGORIES = [
  '技術・開発',
  'デザイン',
  'ビジネス・経済',
  'ニュース・時事',
  '学習・教育',
  'ライフスタイル',
  'エンタメ・趣味',
  'ツール・サービス',
  'その他',
] as const;

interface OgpResult {
  title?: string;
  description?: string;
  image?: string;
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

// タイトル・説明・本文抜粋から Claude で単一カテゴリ + タグを推定する。
const classify = async (
  apiKey: string,
  input: { title: string; description: string; url: string; snippet: string },
): Promise<{ category: string; tags: string[] } | null> => {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    system:
      'あなたはブックマークURLを分類するアシスタントです。与えられたページ情報から、' +
      `指定カテゴリ一覧の中から最も適切な単一カテゴリを1つ選び、内容を表す日本語タグを最大5個（簡潔な単語）付与してください。` +
      `出力は必ず以下のJSON形式のみで行ってください（思考プロセスなどは不要です）。\n` +
      `{"category": "...", "tags": ["tag1", "tag2"]}\n\n` +
      `カテゴリ一覧: ${CATEGORIES.join(', ')}`,
    messages: [
      {
        role: 'user',
        content:
          `URL: ${input.url}\n` +
          `タイトル: ${input.title}\n` +
          `説明: ${input.description}\n` +
          `本文抜粋: ${input.snippet}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;
  
  try {
    const parsed = JSON.parse(textBlock.text) as { category: string; tags: string[] };
    return parsed;
  } catch (err) {
    logger.error('JSON parse error from Claude', textBlock.text);
    return null;
  }
};

// 追加されたブックマークの URL を 1 回だけ取得し、OGP と AI 分類を doc に書き戻す。
// onDocumentCreated は作成時のみ発火するため、書き戻しによる再帰は起きない。
export const enrichBookmark = onDocumentCreated(
  {
    document: 'users/{userId}/bookmarks/{bookmarkId}',
    region: 'asia-northeast1',
    timeoutSeconds: 60,
    memory: '256MiB',
    secrets: [ANTHROPIC_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data() as {
      url?: string;
      title?: string;
      tags?: string[];
      category?: string;
      ogp?: { loaded?: boolean };
    };
    const url = data.url;

    // 既に処理済み、または URL が無ければ何もしない。
    if (!url || data.ogp?.loaded) return;

    const result: OgpResult = {};
    let snippet = '';

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
      // 分類用に本文テキストを抜粋（最大2000文字）。
      snippet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);
    } catch (err) {
      logger.warn(`OGP fetch failed for ${url}`, (err as Error).message);
    }

    // OGP を書き戻す（undefined は除外）。
    const ogp: Record<string, unknown> = { loaded: true };
    if (result.title) ogp.title = result.title;
    if (result.description) ogp.description = result.description;
    if (result.image) ogp.image = result.image;

    const update: Record<string, unknown> = { ogp };

    // タイトルが未設定 or プレースホルダ（URL/ホスト名）の場合のみ OGP タイトルで補完。
    // インポート済みブックマークのユーザー編集タイトルは保持する。
    let hostname = '';
    try {
      hostname = new URL(url).hostname;
    } catch {
      /* noop */
    }
    const isPlaceholderTitle = !data.title || data.title === url || data.title === hostname;
    if (result.title && isPlaceholderTitle) {
      update.title = result.title;
    }

    // AI 分類（best-effort）。キー未設定や失敗時は OGP のみ書き戻す。
    const apiKey = ANTHROPIC_API_KEY.value();
    if (apiKey) {
      try {
        const classified = await classify(apiKey, {
          title: result.title || '',
          description: result.description || '',
          url,
          snippet,
        });
        if (classified) {
          update.category = classified.category;
          // 既存タグ（インポート由来）と AI タグを重複なくマージ。
          const existing = data.tags || [];
          const merged = Array.from(new Set([...existing, ...classified.tags]));
          update.tags = merged;
        }
      } catch (err) {
        logger.warn(`Classification failed for ${url}`, (err as Error).message);
      }
    }

    await snap.ref.update(update);
  },
);
