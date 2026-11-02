import http from 'node:http';
import { spawn } from 'node:child_process';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;

function parseColor(str) {
  if (!str) return null;
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const a = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
    return { r, g, b, a };
  }
  return null;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1, rgb2) {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// In-browser evaluation function
const evaluateScript = `
(() => {
  function getEffectiveBg(el) {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = window.getComputedStyle(cur).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
        if (m && (m[4] === undefined || parseFloat(m[4]) > 0.05)) {
          return bg;
        }
      }
      cur = cur.parentElement;
    }
    return window.getComputedStyle(document.body).backgroundColor || 'rgb(255, 255, 255)';
  }

  function luminance(r, g, b) {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function contrast(rgb1, rgb2) {
    const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

  function parseColor(str) {
    const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    return m ? { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) } : null;
  }

  const results = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const seenElements = new Set();

  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (!text || text.length < 2) continue;
    const el = node.parentElement;
    if (!el || seenElements.has(el)) continue;
    seenElements.add(el);

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fgStr = style.color;
    const bgStr = getEffectiveBg(el);
    const fg = parseColor(fgStr);
    const bg = parseColor(bgStr);
    if (!fg || !bg) continue;

    const ratio = contrast(fg, bg);
    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
    const threshold = isLarge ? 3.0 : 4.5;

    results.push({
      text: text.slice(0, 50),
      tag: el.tagName.toLowerCase(),
      fg: fgStr,
      bg: bgStr,
      ratio: Math.round(ratio * 100) / 100,
      threshold,
      isLarge,
      pass: ratio >= threshold
    });
  }

  return results;
})()
`;

async function runAudit() {
  const tmpDir = `C:\\Users\\matth\\AppData\\Local\\Temp\\chrome-debug-${Date.now()}`;
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless',
    '--disable-gpu',
    `--user-data-dir=${tmpDir}`,
    `--remote-debugging-port=${PORT}`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    const wsUrl = pageTarget?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error("No webSocketDebuggerUrl found");

    const ws = new WebSocket(wsUrl);
    await new Promise(r => {
      ws.addEventListener('open', r, { once: true });
    });

    let id = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (event) => {
          const res = JSON.parse(event.data);
          if (res.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const pages = [
      { name: "Accueil (/)", url: "http://localhost:4173/" },
      { name: "Tarifs (/tarifs)", url: "http://localhost:4173/tarifs" }
    ];

    await sendCommand('Page.enable');

    for (const p of pages) {
      console.log(`\n=== Audit Contraste : ${p.name} ===`);
      await sendCommand('Page.navigate', { url: p.url });
      await new Promise(r => setTimeout(r, 3000));

      const debugRes = await sendCommand('Runtime.evaluate', {
        expression: 'JSON.stringify({ href: window.location.href, len: document.body ? document.body.innerText.length : 0 })',
        returnByValue: true
      });
      console.log(`Debug page:`, debugRes?.result?.value);

      const evalRes = await sendCommand('Runtime.evaluate', {
        expression: evaluateScript,
        returnByValue: true
      });

      const elements = evalRes?.result?.value || [];
      const failing = elements.filter(e => !e.pass);
      console.log(`Total éléments textuels testés : ${elements.length}`);
      console.log(`Éléments sous le seuil (< ${failing.length > 0 ? '4.5:1 / 3:1' : 'seuil'}) : ${failing.length}`);

      if (failing.length > 0) {
        console.log("Liste des éléments en échec :");
        for (const f of failing) {
          console.log(` - [${f.ratio}:1 < ${f.threshold}:1] <${f.tag}> "${f.text}" (fg: ${f.fg}, bg: ${f.bg})`);
        }
      } else {
        console.log("✅ 100% des éléments textuels respectent WCAG AA !");
      }
    }

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

runAudit().catch(err => {
  console.error("Erreur audit contraste:", err);
  process.exit(1);
});
