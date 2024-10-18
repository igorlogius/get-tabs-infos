/* global browser */

/*
const manifest = browser.runtime.getManifest();
const extname = manifest.name;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function iconBlink() {
  browser.browserAction.disable();
  setTimeout(() => {
    browser.browserAction.enable();
  }, 300);
}

*/

async function onCommand(cmd) {
  console.debug(cmd);

  let out = "";
  const lastSelectedScope = await getFromStorage(
    "string",
    "lastSelectedScope",
    "AllTabs",
  );

  const lastSelectedFormat = await getFromStorage(
    "string",
    "lastSelectedFormat",
    "%url",
  );

  switch (lastSelectedScope) {
    case "AllTabs":
      out = await getTabsInfos(
        {
          url: "<all_urls>",
          hidden: false,
          currentWindow: true,
        },
        lastSelectedFormat,
      );
      break;
    case "AllTabsAllWindows":
      out = await tabinfo2clip(
        {
          url: "<all_urls>",
          hidden: false,
        },
        lastSelectedFormat,
      );
      break;
    case "SelectedTabsAllWindows":
      out = await tabinfo2clip(
        {
          url: "<all_urls>",
          hidden: false,
          highlighted: true,
        },
        lastSelectedFormat,
      );
      break;
    case "SelectedTabs":
      out = await tabinfo2clip(
        {
          url: "<all_urls>",
          hidden: false,
          highlighted: true,
          currentWindow: true,
        },
        lastSelectedFormat,
      );
      break;
  }
  switch (cmd) {
    case "copyAsText":
      navigator.clipboard.writeText(out);
      break;
    case "copyAsHTML":
      copyToClipboardAsHTML(out);
      break;
    case "saveAsFile":
      saveToFile(out, "");
      break;
  }
}

browser.commands.onCommand.addListener(onCommand);
// EOF
