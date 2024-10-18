/* global browser */

/*
const manifest = browser.runtime.getManifest();
const extname = manifest.name;
*/

async function setToStorage(id, value) {
  let obj = {};
  obj[id] = value;
  return browser.storage.local.set(obj);
}

async function getFromStorage(type, id, fallback) {
  let tmp = await browser.storage.local.get(id);
  return typeof tmp[id] === type ? tmp[id] : fallback;
}

function getAllTabs() {
  browser.storage.local.set({ lastSelectedScope: "AllTabs" });
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
    currentWindow: true,
  });
}

function getSelectedTabs() {
  browser.storage.local.set({ lastSelectedScope: "SelectedTabs" });
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
    currentWindow: true,
    highlighted: true,
  });
}

function getAllTabsAllWindows() {
  browser.storage.local.set({ lastSelectedScope: "AllTabsAllWindows" });
  tabinfo2clip({
    url: "<all_urls>",
    hidden: false,
  });
}

function getSelectedTabsAllWindows() {
  browser.storage.local.set({ lastSelectedScope: "SelectedTabsAllWindows" });
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
  copyToClipboardAsHTML(document.querySelector("#output").value);
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

async function onLoad() {
  let res = await browser.storage.local.get("placeholder_urls");
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

  const lastSelectedFormat = await getFromStorage(
    "string",
    "lastSelectedFormat",
    "",
  );

  let formatOptionsSelect = document.getElementById("formatOptions");
  formatOptionsSelect.value = lastSelectedFormat;

  const lastSelectedScope = await getFromStorage(
    "string",
    "lastSelectedScope",
    "",
  );

  let scopeOptionsSelect = document.getElementById("scopeOptions");
  scopeOptionsSelect.value = lastSelectedScope;

  updateOutput();
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

  await browser.storage.local.set({ lastSelectedFormat: newEntry.value });
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

  await browser.storage.local.set({ lastSelectedFormat: "" });
  await browser.storage.local.set({ placeholder_urls: res.placeholder_urls });

  document.location.reload();
}

async function updateOutput() {
  const formatOptionValue = document.getElementById("formatOptions").value;
  const scopeOptionValue = document.getElementById("scopeOptions").value;
  setToStorage("lastSelectedScope", scopeOptionValue);
  setToStorage("lastSelectedFormat", formatOptionValue);

  const txtarea_out = document.querySelector("#output");
  if (scopeOptionValue !== "" && formatOptionValue !== "") {
    const out = await getTabsInfos(scopeOptionValue, formatOptionValue);

    txtarea_out.value = out;
  } else {
    txtarea_out.value = "";
  }
}

document.addEventListener("DOMContentLoaded", onLoad);

document.querySelector("#btnCopy").addEventListener("click", copyTxtArea);
document.querySelector("#btnSave").addEventListener("click", () => {
  const out = document.querySelector("#output").value;
  const saveFilename = document.querySelector("#saveFilename").value;
  saveToFile(out, saveFilename);
});
document
  .querySelector("#btnCopyAsHTML")
  .addEventListener("click", copyTxtAreaAsHTML);

document.querySelector("#btnAddEntry").addEventListener("click", addNewEntry);
document.querySelector("#btnDelEntry").addEventListener("click", delEntry);

document
  .querySelector("#formatOptions")
  .addEventListener("change", updateOutput);

document
  .querySelector("#scopeOptions")
  .addEventListener("change", updateOutput);
