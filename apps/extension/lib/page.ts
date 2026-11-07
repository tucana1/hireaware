/**
 * Runs in the page (via chrome.scripting): the selected text if any, otherwise the main readable text,
 * preferring job-post containers used by common job sites.
 */
export function extractPageText(): string {
  const selection = window.getSelection()?.toString().trim();
  if (selection && selection.length > 20) return selection;
  const selectors = ['[data-automation="jobDescription"]', '.jobs-description', '#jobDescriptionText', '.job-description',
    '[class*="jobDescription"]', '[class*="job-description"]', 'article', 'main', '[role="main"]'];
  for (const s of selectors) {
    const el = document.querySelector<HTMLElement>(s);
    const text = el?.innerText?.trim();
    if (text && text.length > 80) return text;
  }
  return document.body?.innerText?.trim() ?? '';
}
