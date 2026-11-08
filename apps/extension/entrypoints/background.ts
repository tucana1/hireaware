import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { analyzeLocally } from '@/lib/analyze';
import { extractPageText } from '@/lib/page';
import { renderAnalysis, STYLES } from '@/lib/render';

const MENU_ID = 'hireaware-check-selection';

/** Right-click "Check with Parakh": analyse the selection, badge the icon, show a panel on the page. */
async function checkSelection(tabId: number, text: string) {
  const analysis = analyzeLocally(text);
  await browser.action.setBadgeText({ tabId, text: analysis.verdict === 'high' ? '!' : analysis.verdict === 'caution' ? '?' : '' });
  await browser.action.setBadgeBackgroundColor({ tabId, color: analysis.verdict === 'high' ? '#b42318' : '#b54708' });
  // Shadow DOM, so the site's CSS can't interfere.
  await browser.scripting.executeScript({
    target: { tabId },
    func: showPanel,
    args: [renderAnalysis(analysis, { maxFlags: 3, maxQuestions: 4 }), STYLES],
  });
  return analysis;
}

/** "Scan this page" from the popup: read the selection or the job description, then analyse it. */
async function scanTab(tabId: number) {
  const [injection] = await browser.scripting.executeScript({ target: { tabId }, func: extractPageText });
  const text = (injection?.result as string | undefined) ?? '';
  return { text, analysis: text.trim() ? analyzeLocally(text) : null };
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({ id: MENU_ID, title: 'Check with Parakh', contexts: ['selection'] });
  });

  // Messages from the popup. The model lives only here, so it is bundled once.
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const m = message as { type?: string; text?: string; tabId?: number };
    if (m?.type === 'hireaware:analyze' && typeof m.text === 'string') {
      sendResponse(analyzeLocally(m.text));
    } else if (m?.type === 'hireaware:scan-tab' && typeof m.tabId === 'number') {
      scanTab(m.tabId).then(sendResponse, (e: Error) => sendResponse({ error: e.message }));
      return true;
    } else if (import.meta.env.WXT_E2E === 'true' && m?.type === 'hireaware:test-check-selection' && typeof m.tabId === 'number') {
      // Test builds only: lets the end-to-end test run the right-click handler, which scripts can't click.
      checkSelection(m.tabId, m.text ?? '').then(sendResponse, (e: Error) => sendResponse({ error: e.message }));
      return true;
    }
    return undefined;
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id || !info.selectionText) return;
    await checkSelection(tab.id, info.selectionText);
  });
});

/** Injected into the page. Must be self-contained. */
function showPanel(html: string, css: string) {
  document.getElementById('hireaware-panel')?.remove();
  const host = document.createElement('div');
  host.id = 'hireaware-panel';
  host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;width:360px;max-height:80vh;';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${css}
    .box{background:#fff;border:1px solid #e4e7ec;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:14px;max-height:80vh;overflow:auto}
    .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font:600 14px system-ui}
    button{border:0;background:none;font-size:18px;cursor:pointer;color:#5a6273}</style>
    <div class="box"><div class="top"><span>Parakh</span><button aria-label="Close">×</button></div>${html}</div>`;
  root.querySelector('button')?.addEventListener('click', () => host.remove());
  document.documentElement.appendChild(host);
}
