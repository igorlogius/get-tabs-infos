/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

function getAllTabs() {
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
    currentWindow: true,
  });
}

function getSelectedTabs() {
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
    currentWindow: true,
    highlighted: true,
  });
}

function getAllTabsAllWindows() {
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
  });
}

function getSelectedTabsAllWindows() {
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
    highlighted: true,
  });
}

async function tabinfo2clip(queryObject) {
  // 1. get format string
  const tmp = document.getElementById("formatOptions").value;

  let formatOptionsSelect = document.getElementById("formatOptions");
  if (formatOptionsSelect.value === "") {
    document.querySelector("#output").value = "";
    return;
  }

  // 2. replace placeholders
  const tabAttrReplacers = [
    "url",
    "protocol",
    "search",
    "port",
    "origin",
    "pathname",
    "hostname",
    "audible",
    "discarded",
    "cookieStoreId",
    "favIconUrl",
    "hidden",
    "highlighted",
    "id",
    "incognito",
    "index",
    "lastAccessed",
    "pinned",
    "status",
    "title",
  ];

  let out = "";

  let tmp2 = "";
  let val = "";

  const tabs = await browser.tabs.query(queryObject);
  for (const tab of tabs) {
    tmp2 = tmp;
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

  // 3. write infos to textarea
  const txtarea_out = document.querySelector("#output");
  txtarea_out.value = out;

  txtarea_out.focus();
  txtarea_out.select();
}

function copyTxtArea() {
  const out = document.querySelector("#output").value;
  navigator.clipboard.writeText(out);
}

async function copyTxtAreaAsHTML() {
  let base_span = document.createElement("span"); // needs to be a <span> to prevent the final linebreak
  let span = document.createElement("span"); // needs to be a <span> to prevent the final linebreak
  span.style.position = "absolute";
  span.style.bottom = "-9999999"; // move it offscreen
  base_span.append(span);
  document.body.append(base_span);

  span.innerHTML = document
    .querySelector("#output")
    .value.replace(/\n/g, "<br/>");

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
    navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([base_span.innerHTML], {
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

function deleteRow(rowTr) {
  var mainTableBody = document.getElementById("mainTableBody");
  mainTableBody.removeChild(rowTr);
}

function createFormatOption(feed) {
  let formatOptionsSelect = document.getElementById("formatOptions");

  Object.keys(feed).forEach((key) => {
    if (key === "name") {
      formatOptionsSelect.add(new Option(feed[key], feed[key]));
    }
  });
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

function saveTxtArea() {
  const out = document.querySelector("#output").value;
  const saveFilename = document.querySelector("#saveFilename").value;
  //const nblines = out.split('\n').length -1;
  let a = document.createElement("a");
  if (saveFilename === "") {
    a.download = extname + " " + getTimeStampStr() + ".txt";
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

async function onLoad() {
  var res = await browser.storage.local.get("placeholder_urls");
  if (!Array.isArray(res.placeholder_urls)) {
    res.placeholder_urls = [
      {
        name: "All Placeholders: %id, %index, %linebreak, %url, %protocol, %search, %port, %pathname, %hostname, %origin, %title, %audible, %discarded, %lastAccessed, %pinned, %cookieStoreId, %favIconUrl, %hidden, %highlighted, %incognito, %status",
      },
      {
        name: "%url",
      },
      {
        name: "%title - %url",
      },
      {
        name: '<a href="%url">%title</a>',
      },
      {
        name: "[%title](%url)",
      },
    ];
    await browser.storage.local.set({ placeholder_urls: res.placeholder_urls });
  }
  res.placeholder_urls.forEach((selector) => {
    createFormatOption(selector);
  });
}

async function addNewEntry() {
  let newEntry = document.getElementById("newEntry");

  if (newEntry.value.trim() === "") {
    return;
  }

  var res = await browser.storage.local.get("placeholder_urls");
  if (!Array.isArray(res.placeholder_urls)) {
    return;
  }
  res.placeholder_urls.unshift({ name: newEntry.value });

  await browser.storage.local.set({ placeholder_urls: res.placeholder_urls });

  document.location.reload();
}

async function delEntry() {
  let formatOptionsSelect = document.getElementById("formatOptions");

  if (formatOptionsSelect.value === "") {
    return;
  }

  var res = await browser.storage.local.get("placeholder_urls");
  if (!Array.isArray(res.placeholder_urls)) {
    return;
  }

  res.placeholder_urls = res.placeholder_urls.filter((el) => {
    return el.name !== formatOptionsSelect.value;
  });

  await browser.storage.local.set({ placeholder_urls: res.placeholder_urls });

  document.location.reload();
}

document.addEventListener("DOMContentLoaded", onLoad);

document.querySelector("#btnAllTabs").addEventListener("click", getAllTabs);
document
  .querySelector("#btnSelectedTabs")
  .addEventListener("click", getSelectedTabs);
document
  .querySelector("#btnAllTabsAllWindows")
  .addEventListener("click", getAllTabsAllWindows);
document
  .querySelector("#btnSelectedTabsAllWindows")
  .addEventListener("click", getSelectedTabsAllWindows);
document.querySelector("#btnCopy").addEventListener("click", copyTxtArea);
document.querySelector("#btnSave").addEventListener("click", saveTxtArea);
document
  .querySelector("#btnCopyAsHTML")
  .addEventListener("click", copyTxtAreaAsHTML);

document.querySelector("#btnAddEntry").addEventListener("click", addNewEntry);
document.querySelector("#btnDelEntry").addEventListener("click", delEntry);
