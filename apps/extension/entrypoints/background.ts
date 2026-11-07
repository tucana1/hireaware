import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { analyzeLocally } from '@/lib/analyze';
import { renderAnalysis, STYLES } from '@/lib/render';

const MENU_ID = 'hireaware-check-selection';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({ id: MENU_ID, title: 'Check with HireAware', contexts: ['selection'] });
  });

  // The popup sends text here so the model is only bundled once.
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const m = message as { type?: string; text?: string };
    if (m?.type === 'hireaware:analyze' && typeof m.text === 'string') {
      sendResponse(analyzeLocally(m.text));
    }
    return undefined;
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id || !info.selectionText) return;
    const analysis = analyzeLocally(info.selectionText);
    await browser.action.setBadgeText({ tabId: tab.id, text: analysis.verdict === 'high' ? '!' : analysis.verdict === 'caution' ? '?' : '' });
    await browser.action.setBadgeBackgroundColor({ tabId: tab.id, color: analysis.verdict === 'high' ? '#b42318' : '#b54708' });
    // Show the result in a small panel on the page (shadow DOM, so the site's CSS can't interfere).
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: showPanel,
      args: [renderAnalysis(analysis, { maxFlags: 3, maxQuestions: 4 }), STYLES],
    });
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
    .box{background:#fff;border:1px solid #e3e7e5;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:14px;max-height:80vh;overflow:auto}
    .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font:600 14px system-ui}
    button{border:0;background:none;font-size:18px;cursor:pointer;color:#5b6662}</style>
    <div class="box"><div class="top"><span>HireAware</span><button aria-label="Close">×</button></div>${html}</div>`;
  root.querySelector('button')?.addEventListener('click', () => host.remove());
  document.documentElement.appendChild(host);
}
