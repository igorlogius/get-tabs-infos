/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getDocElById(id) {
  return document.getElementById(id);
}

async function setToStorage(id, value) {
  let obj = {};
  obj[id] = value;
  return browser.storage.local.set(obj);
}

function iconBlink() {
  browser.browserAction.disable();
  setTimeout(() => {
    browser.browserAction.enable();
  }, 300);
}

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

async function copyToClipboardAsHTML(out) {
  let base_span = document.createElement("span"); // needs to be a <span> to prevent the final linebreak
  let span = document.createElement("span"); // needs to be a <span> to prevent the final linebreak
  span.style.position = "absolute";
  span.style.bottom = "-9999999"; // move it offscreen
  base_span.append(span);
  document.body.append(base_span);

  span.innerHTML = out.replace(/\n/g, "<br/>");

  if (
    typeof navigator.clipboard.write === "undefined" ||
    typeof ClipboardItem === "undefined"
  ) {
    base_span.focus();
    document.getSelection().removeAllRanges();
    var range = document.createRange();
    range.selectNode(base_span);
    document.getSelection().addRange(range);
    document.execCommand("copy");
  } else {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([out.trim()], {
          type: "text/plain",
        }),
        "text/html": new Blob([base_span.innerHTML], {
          type: "text/html",
        }),
      }),
    ]);
  }
  base_span.remove();
}

async function getTabsInfos(scope, format) {
  let queryObject = {};
  switch (scope) {
    case "AllTabs":
      queryObject = {
        url: "<all_urls>",
        hidden: false,
        currentWindow: true,
      };
      break;
    case "AllTabsAllWindows":
      queryObject = {
        url: "<all_urls>",
        hidden: false,
      };
      break;
    case "SelectedTabsAllWindows":
      queryObject = {
        url: "<all_urls>",
        hidden: false,
        highlighted: true,
      };
      break;
    case "SelectedTabs":
      queryObject = {
        url: "<all_urls>",
        hidden: false,
        highlighted: true,
        currentWindow: true,
      };
      break;
  }

  const tabAttrReplacers = [
    "url",
    "protocol",
    "search",
    "port",
    "origin",
    "pathname",
    "hostname",
    "title",
  ];

  let out = "";

  let tmp2 = "";
  let val = "";

  const tabs = await browser.tabs.query(queryObject);
  for (const tab of tabs) {
    tmp2 = format;
    for (const p of tabAttrReplacers) {
      switch (p) {
        case "protocol":
        case "search":
        case "port":
        case "origin":
        case "pathname":
        case "hostname":
          val = new URL(tab.url)[p];
          break;
        default:
          val = typeof tab[p] !== "undefined" ? tab[p] : "n/a";
          break;
      }
      tmp2 = tmp2.replaceAll("%" + p, val);
    }
    tmp2 = tmp2.replaceAll("%linebreak", "\r\n");
    out = out + tmp2 + "\r\n";
  }

  return out;
}

function getTimeStampStr() {
  const d = new Date();
  let ts = "";
  [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate() + 1,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].forEach((t, i) => {
    ts = ts + (i !== 3 ? "-" : "_") + (t < 10 ? "0" : "") + t;
  });
  return ts.substring(1);
}

function saveToFile(out, saveFilename) {
  //const nblines = out.split('\n').length -1;
  let a = document.createElement("a");
  if (saveFilename === "") {
    a.download = getTimeStampStr() + " Get Tabs Infos.txt";
  } else {
    a.download = saveFilename + ".txt";
  }
  a.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(out),
  );
  a.click();
  a.remove();
}

function iconBlink() {
  browser.browserAction.setBadgeText({ text: "✅" });
  browser.browserAction.disable();
  setTimeout(() => {
    browser.browserAction.enable();
    browser.browserAction.setBadgeText({ text: null });
  }, 500);
}
