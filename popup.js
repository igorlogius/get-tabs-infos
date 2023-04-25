/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function getActivPlaceholderStr() {
  const store = await browser.storage.local.get("placeholder_urls");
  for (const val of store.placeholder_urls) {
    if (typeof val.activ === "boolean" && val.activ === true) {
      return val.name;
    }
  }
  return "n/a";
}

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
  // 1. get the format string from storage
  const tmp = await getActivPlaceholderStr();

  // 2. replace placeholders
  const tabAttrReplacers = [
    "active",
    "attention",
    "audible",
    "autoDiscardable",
    "cookieStoreId",
    "discarded",
    "favIconUrl",
    "height",
    "hidden",
    "highlighted",
    "id",
    "incognito",
    "index",
    "isArticle",
    "isInReaderMode",
    "lastAccessed",
    "openerTabId",
    "pinned",
    "sessionId",
    "status",
    "successorTabId",
    "title",
    "width",
    "windowId",
    "url",
    "protocol",
    "password",
    "search",
    "port",
    "origin",
    "pathname",
    "hostname",
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
        case "password":
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

function deleteRow(rowTr) {
  var mainTableBody = document.getElementById("mainTableBody");
  mainTableBody.removeChild(rowTr);
}

function createTableRow(feed) {
  var mainTableBody = document.getElementById("mainTableBody");
  var tr = mainTableBody.insertRow();

  var input;

  var button;
  if (feed.action === "save") {
    tr.insertCell();
  } else {
    button = createButton("Delete", function () {
      if (confirm("Are you sure?")) {
        deleteRow(tr);
        saveOptions();
      }
    });
    tr.insertCell().appendChild(button);
  }

  Object.keys(feed)
    .sort()
    .reverse()
    .forEach((key) => {
      if (key === "activ" && feed.action !== "save") {
        input = document.createElement("input");
        input.className = key;
        input.placeholder = key;
        input.style.width = "100%";
        input.type = "radio";
        input.name = "placeholdergroup";
        input.checked =
          typeof feed[key] === "boolean" && feed[key] === true ? true : false;
        input.addEventListener("change", saveOptions);
        tr.insertCell().appendChild(input);
      } else if (key === "name") {
        input = document.createElement("input");
        input.className = key;
        input.placeholder = "Write your own copy rule here then click create";
        input.style.width = "99%";
        input.value = feed[key];
        if (feed.action !== "save") {
          input.disabled = true;
        }
        tr.insertCell().appendChild(input);
      } else if (key !== "action" && feed.action !== "save") {
        input = document.createElement("input");
        input.className = key;
        input.placeholder = key;
        input.style.width = "0px";
        input.value = feed[key];
        tr.insertCell().appendChild(input);
      }
    });

  if (feed.action === "save") {
    button = createButton("Create", function () {
      saveOptions();
      restoreOptions();
    });
    tr.insertCell().appendChild(button);
  }
}

function collectConfig() {
  // collect configuration from DOM
  var mainTableBody = document.getElementById("mainTableBody");
  var feeds = [];
  for (var i = 0; i < mainTableBody.rows.length; i++) {
    try {
      let row = mainTableBody.rows[i];
      var name = row.querySelector(".name")?.value;
      var activ = row.querySelector(".activ")?.checked;
      if (name !== "" && name.length > 1) {
        feeds.push({
          activ: activ,
          name: name,
        });
      }
    } catch (e) {
      console.error("" + e);
    }
  }
  return feeds;
}

function createButton(text /*,title*/, callback) {
  var button = document.createElement("button");
  button.className = "browser-style action";
  button.textContent = text;
  button.addEventListener("click", callback);
  return button;
}

async function saveOptions(/*e*/) {
  var feeds = collectConfig();
  await browser.storage.local.set({ placeholder_urls: feeds });
}

async function restoreOptions() {
  var mainTableBody = document.getElementById("mainTableBody");
  mainTableBody.textContent = ""; // faster than innerHTML
  createTableRow({
    activ: null,
    name: "",
    action: "save",
  });
  var res = await browser.storage.local.get("placeholder_urls");
  if (!Array.isArray(res.placeholder_urls)) {
    res.placeholder_urls = [
      {
        activ: false,
        name: "%url",
        action: "",
      },
      {
        activ: true,
        name: "%title - %url",
        action: "",
      },
      {
        activ: false,
        name: '<a href="%url">%title</a>',
        action: "",
      },
      {
        activ: false,
        name: "[%title](%url)",
        action: "",
      },
    ];
    await browser.storage.local.set({ placeholder_urls: res.placeholder_urls });
  }
  res.placeholder_urls.forEach((selector) => {
    selector.action = "delete";
    createTableRow(selector);
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
  console.log("saveTxtArea");
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
    "data:text/plain;charset=utf-8," + encodeURIComponent(out)
  );
  a.click();
  a.remove();
}

document.addEventListener("DOMContentLoaded", restoreOptions);

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
