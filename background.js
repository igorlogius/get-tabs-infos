/* global browser */

//const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function iconBlink() {
  browser.browserAction.setBadgeText({ text: "✅" });
  browser.browserAction.disable();
  setTimeout(() => {
    browser.browserAction.enable();
    browser.browserAction.setBadgeText({ text: null });
  }, 500);
}

async function onCommand(cmd) {
  const shortcutconfig = await getFromStorage("object", "shortcutconfig", null);

  if (shortcutconfig === null) {
    return;
  }

  const out = await getTabsInfos(
    shortcutconfig[cmd].scope,
    shortcutconfig[cmd].format,
  );

  switch (shortcutconfig[cmd].action) {
    case "ct":
      navigator.clipboard.writeText(out);
      break;
    case "ch":
      copyToClipboardAsHTML(out);
      break;
    case "s":
      saveToFile(out, "");
      break;
  }
  iconBlink();
}

async function onInstalled(details) {
  let tmp;
  if (details.reason === "install") {
    tmp = await getFromStorage("object", "formatStrings", []);
    if (tmp.length < 1) {
      tmp = await fetch("formatStrings.json");
      tmp = await tmp.json();
      await setToStorage("formatStrings", tmp);
    }
  }
}

browser.browserAction.setBadgeBackgroundColor({ color: "#00000000" });

browser.commands.onCommand.addListener(onCommand);
browser.runtime.onInstalled.addListener(onInstalled);
// EOF
