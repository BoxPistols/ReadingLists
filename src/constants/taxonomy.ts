// 単一カテゴリの分類タクソノミー（AI 自動分類が必ずこの中から1つを選ぶ）。
// 注意: functions/src/index.ts にも同一の配列を持つ。変更時は両方を同期すること。
export const CATEGORIES = [
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

export type Category = (typeof CATEGORIES)[number];
