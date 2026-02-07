import type { Bookmark } from '../types';

export const parseBookmarks = (htmlContent: string): Bookmark[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const links = Array.from(doc.querySelectorAll('a'));

  return links.map((link) => {
    const title = link.textContent || '';
    const url = link.getAttribute('href') || '';
    const addDateStr = link.getAttribute('add_date');
    const lastModifiedStr = link.getAttribute('last_modified');
    const icon = link.getAttribute('icon');
    const tagsStr = link.getAttribute('tags');

    const addDate = addDateStr ? parseInt(addDateStr, 10) : 0;
    const lastModified = lastModifiedStr ? parseInt(lastModifiedStr, 10) : undefined;
    const tags = tagsStr ? tagsStr.split(',').filter(Boolean) : [];

    return {
      title,
      url,
      addDate,
      lastModified,
      icon: icon || undefined,
      tags,
    };
  }).filter(b => b.url); // URLがないものは除外
};
