/* global browser */

document.addEventListener("DOMContentLoaded", async () => {
  const formatStrings = await getFromStorage("object", "formatStrings", []);

  // fill format dropdown
  let formatOptions = getDocElById("formatOptions");
  formatStrings.forEach((feed) => {
    Object.keys(feed).forEach((key) => {
      if (key === "name") {
        formatOptions.add(new Option(feed[key], feed[key]));
      }
    });
  });

  // select last format value
  getDocElById("formatOptions").value = await getFromStorage(
    "string",
    "lastSelectedFormat",
    "",
  );

  // select last scope value
  getDocElById("scopeOptions").value = await getFromStorage(
    "string",
    "lastSelectedScope",
    "",
  );

  //
  updateOutput();

  // add UI action-listeners

  getDocElById("btnCopyAsText").addEventListener("click", () => {
    const out = getDocElById("output").value;
    navigator.clipboard.writeText(out);
  });
  getDocElById("btnSaveToFile").addEventListener("click", () => {
    const out = getDocElById("output").value;
    const saveFilename = getDocElById("saveFilename").value;
    saveToFile(out, saveFilename);
  });
  getDocElById("btnCopyAsHTML").addEventListener("click", () => {
    copyToClipboardAsHTML(getDocElById("output").value);
  });

  getDocElById("btnAddFormat").addEventListener("click", async () => {
    let newFormat = getDocElById("newEntry").value.trim();

    if (newFormat === "") {
      return;
    }

    let formatStrings = await getFromStorage("object", "formatStrings", []);
    formatStrings.unshift({ name: newFormat });
    await setToStorage("lastSelectedFormat", newFormat);
    await setToStorage("formatStrings", formatStrings);

    document.location.reload();
  });
  getDocElById("btnDeleteFormat").addEventListener("click", async () => {
    let formatOptionsValue = getDocElById("formatOptions").value;

    if (formatOptionsValue === "") {
      return;
    }

    let formatStrings = await getFromStorage("object", "formatStrings", []);

    formatStrings = formatStrings.filter((el) => {
      return el.name !== formatOptionsValue;
    });

    await setToStorage("lastSelectedFormat", "");
    await setToStorage("formatStrings", formatStrings);

    document.location.reload();
  });

  ["formatOptions", "scopeOptions"].forEach((el) => {
    getDocElById(el).addEventListener("change", updateOutput);
  });
});

async function updateOutput() {
  const formatOptionValue = getDocElById("formatOptions").value;
  const scopeOptionValue = getDocElById("scopeOptions").value;
  await setToStorage("lastSelectedScope", scopeOptionValue);
  await setToStorage("lastSelectedFormat", formatOptionValue);

  const txtarea_out = getDocElById("output");
  if (scopeOptionValue !== "" && formatOptionValue !== "") {
    txtarea_out.value = await getTabsInfos(scopeOptionValue, formatOptionValue);
  } else {
    txtarea_out.value = "";
  }
}
