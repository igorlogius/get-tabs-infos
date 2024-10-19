/* global browser */

async function saveConfig() {
  shortcutconfig = [];

  Array.from(document.querySelectorAll("tr")).forEach((tr) => {
    let tmp = Array.from(tr.querySelectorAll("select")).map((e) => e.value);

    shortcutconfig.push({ format: tmp[0], scope: tmp[1], action: tmp[2] });
  });

  setToStorage("shortcutconfig", shortcutconfig);
}

async function restoreConfig() {
  const shortcutconfig = await getFromStorage("object", "shortcutconfig", []);

  if (shortcutconfig.length > 0) {
    Array.from(document.querySelectorAll("tr")).forEach((tr) => {
      const selects = tr.querySelectorAll("select");

      selects[0].value = shortcutconfig[0].format;
      selects[1].value = shortcutconfig[0].scope;
      selects[2].value = shortcutconfig[0].action;

      shortcutconfig.shift();
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  let formatStrings = await getFromStorage("object", "formatStrings", []);

  let formatlists = document.querySelectorAll('select[name="formatlist"]');

  formatlists.forEach((fl) => {
    fl.add(new Option("-- Format --", ""));
    formatStrings.forEach((feed) => {
      Object.keys(feed).forEach((key) => {
        if (key === "name") {
          fl.add(new Option(feed[key], feed[key]));
        }
      });
    });
  });

  let scopelists = document.querySelectorAll('select[name="scopelist"]');

  scopelists.forEach((sl) => {
    sl.add(new Option("-- Scope --", ""));
    sl.add(new Option("Current Window", "AllTabs"));
    sl.add(new Option("Selected Current Window ", "SelectedTabs"));
    sl.add(new Option("All Windows", "AllTabsAllWindows"));
    sl.add(new Option("Selected All Windows", "SelectedTabsAllWindows"));
  });

  let actionlists = document.querySelectorAll('select[name="actionlist"]');

  actionlists.forEach((al) => {
    al.add(new Option("-- Action --", ""));
    al.add(new Option("Copy as Text", "ct"));
    al.add(new Option("Copy as HTML", "ch"));
    al.add(new Option("Save to File", "s"));
  });

  // monitor all dropdown for changes and save the entire tabe into a config on change

  Array.from(document.querySelectorAll("select")).forEach((select) => {
    select.addEventListener("change", saveConfig);
  });

  restoreConfig();
});
