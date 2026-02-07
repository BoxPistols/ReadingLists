import type { Bookmark } from '../types';

export const generateBookmarkHtml = (bookmarks: Bookmark[]): string => {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
It will be read and overwritten.
DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Reading List Export</TITLE>
<H1>Reading List Export</H1>
<DL><p>
`;

  const items = bookmarks.map(b => {
    // カスタム属性としてTAGSを追加。標準的なブラウザでは無視されるが、このアプリでの再インポート時に有効。
    const tagsAttr = b.tags && b.tags.length > 0 ? ` TAGS="${b.tags.join(',')}"` : '';
    const iconAttr = b.icon ? ` ICON="${b.icon}"` : '';
    // タイトルにタグを含めるオプションも考えられるが、今回は属性として保存
    
    return `    <DT><A HREF="${b.url}" ADD_DATE="${b.addDate}" LAST_MODIFIED="${b.lastModified || b.addDate}"${iconAttr}${tagsAttr}>${b.title}</A>`;
  }).join('\n');

  const footer = `
</DL><p>
`;

  return header + items + footer;
};

export const downloadHtml = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

