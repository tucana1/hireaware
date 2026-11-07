import { browser } from 'wxt/browser';
import type { Analysis } from '@hireaware/engine';
import { extractPageText } from '@/lib/page';
import { renderAnalysis, STYLES } from '@/lib/render';

const result = document.getElementById('result')!;
const textarea = document.getElementById('text') as HTMLTextAreaElement;
const scanPage = document.getElementById('scan-page') as HTMLButtonElement;
const scanText = document.getElementById('scan-text') as HTMLButtonElement;

const style = document.createElement('style');
style.textContent = STYLES;
document.head.appendChild(style);

async function show(text: string) {
  if (!text.trim()) {
    result.innerHTML = '<p class="error">No text found. Select the job description on the page, or paste it above.</p>';
    return;
  }
  const analysis = (await browser.runtime.sendMessage({ type: 'hireaware:analyze', text })) as Analysis;
  result.innerHTML = renderAnalysis(analysis);
}

scanText.addEventListener('click', () => show(textarea.value));

scanPage.addEventListener('click', async () => {
  scanPage.disabled = true;
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab');
    const [injection] = await browser.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageText });
    const text = (injection?.result as string | undefined) ?? '';
    textarea.value = text.slice(0, 2000);
    await show(text);
  } catch {
    result.innerHTML = '<p class="error">This page can\'t be read (browser pages and the Web Store are off-limits). Paste the text instead.</p>';
  } finally {
    scanPage.disabled = false;
  }
});
