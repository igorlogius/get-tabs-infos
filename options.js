/* global browser */

//const temporary = browser.runtime.id.endsWith('@temporary-addon');
//const manifest = browser.runtime.getManifest();
//const extname = manifest.name;

async function getActivPlaceholderStr() {
	const store = await browser.storage.local.get('placeholder_urls');
	for(const val of store.placeholder_urls) {
		if(typeof val.activ === 'boolean' && val.activ === true){
			return val.name;
		}

	}
	return "n/a";
}

function getAllTabs() {
	tabinfo2clip({
        url: "<all_urls>",
        hidden: false,
		currentWindow:true,
	});
}


function getSelectedTabs() {
	tabinfo2clip({
        url: "<all_urls>",
        hidden: false,
        currentWindow:true,
		highlighted: true,
	});
}

function getActiveTab() {
	tabinfo2clip({
        url: "<all_urls>",
        hidden: false,
        currentWindow:true,
        active: true,
    });
}
async function tabinfo2clip(queryObject) {

	// 1. get the format string from storage
	const tmp = await getActivPlaceholderStr();

	// 2. replace placeholders
	const replacers = [
        "active"
		,"attention"
		,"audible"
		,"autoDiscardable"
		,"cookieStoreId"
		,"discarded"
		,"favIconUrl"
		,"height"
		,"hidden"
		,"highlighted"
		,"id"
		,"incognito"
		,"index"
		,"isArticle"
		,"isInReaderMode"
		,"lastAccessed"
		,"openerTabId"
		,"pinned"
		,"sessionId"
		,"status"
		,"successorTabId"
		,"title"
		,"width"
		,"windowId"
        ,"url"
	];

	let out = "";

	let tmp2 = "";

	const tabs = await browser.tabs.query(queryObject);
	for(const tab of tabs) {
		tmp2 = tmp;
		for (const p of replacers) {
			tmp2 = tmp2.replaceAll("%"+p, (typeof tab[p] !== 'undefined'? tab[p] : "n/a"));
		}
		out = out + tmp2 + '\r\n';
	}

	// 3. write infos to textarea
    document.querySelector("#output").value = out;
}

function deleteRow(rowTr) {
	var mainTableBody = document.getElementById('mainTableBody');
	mainTableBody.removeChild(rowTr);
}

function createTableRow(feed) {
	var mainTableBody = document.getElementById('mainTableBody');
	var tr = mainTableBody.insertRow();

    var input;

	Object.keys(feed).sort().forEach( (key) => {

		if( key === 'activ'){
			//if(feed[key] !== null) {
				input = document.createElement('input');
				input.className = key;
				input.placeholder = key;
				input.style.width = '100%';
				input.type='radio';
				input.name="placeholdergroup";
				input.checked= (typeof feed[key] === 'boolean' && feed[key] === true)? true: false;
				input.addEventListener("change", saveOptions);
				tr.insertCell().appendChild(input);
			/*}else{
				tr.insertCell();
			}*/

		}else if( key === 'name'){
			//var input = document.createElement('textarea');
			input = document.createElement('input');
			input.className = key;
			input.placeholder = "%title - %url";
			//input.style.float = 'right';
			input.style.width = '99%';
			//input.style.width = '90%';
			//input.style.margin = '3px';
			input.value = feed[key];
            if(feed.action !== 'save'){
                input.disabled = true;
            }
			tr.insertCell().appendChild(input);
		}else
			if( key !== 'action'){
				input = document.createElement('input');
				input.className = key;
				input.placeholder = key;
				input.style.width = '0px';
				input.value = feed[key];
				tr.insertCell().appendChild(input);
			}
	});

	var button;
	if(feed.action === 'save'){
		button = createButton("Create", "saveButton", function() { saveOptions(); window.close(); },  true);
	}else{
		button = createButton("Delete", "deleteButton", function() { deleteRow(tr); saveOptions(); window.close(); }, true );
	}
	tr.insertCell().appendChild(button);
}

function collectConfig() {
	// collect configuration from DOM
	var mainTableBody = document.getElementById('mainTableBody');
	var feeds = [];
	for (var row = 0; row < mainTableBody.rows.length; row++) {
		try {
			var name = mainTableBody.rows[row].querySelector('.name').value;
			try {
			var activ = mainTableBody.rows[row].querySelector('.activ').checked;
			if(name !== '' && name.length > 1) {
				feeds.push({
					'activ': activ,
					'name': name
				});
			}
			}catch(e) {
				console.error(e);
			}
		}catch(e){
			console.error(e);
		}
	}
	return feeds;
}

function createButton(text, id, callback, submit) {
	var span = document.createElement('span');
	var button = document.createElement('button');
	button.id = id;
	button.textContent = text;
	button.className = "browser-style";
	if (submit) {
		button.type = "submit";
	} else {
		button.type = "button";
	}
	button.name = id;
	button.value = id;
	button.addEventListener("click", callback);
	span.appendChild(button);
	return span;
}

async function saveOptions(/*e*/) {
	var feeds = collectConfig();
	await browser.storage.local.set({ 'placeholder_urls': feeds });
}

async function restoreOptions() {
	//var mainTableBody = document.getElementById('mainTableBody');
	createTableRow({
		'activ': null,
		'name': '' ,
		'action':'save'
	});
	var res = await browser.storage.local.get('placeholder_urls');
	if ( !Array.isArray(res.placeholder_urls) ) {
		res.placeholder_urls = [
			{
				'activ': true,
				'name': 'Text: %title - %url' ,
				'action' : ''
			},
			{
				'activ': false,
				'name': 'HTML Link: <a href="%url">%title</a>' ,
				'action' : ''
			},
			{
				'activ': false,
				'name': 'Markdown: [%title](%url)' ,
				'action' : ''
			}
		]
		await browser.storage.local.set({ 'placeholder_urls': res.placeholder_urls });
	}
	res.placeholder_urls.forEach( (selector) => {
		selector.action = 'delete'
		createTableRow(selector);
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
//document.querySelector("form").addEventListener("submit", saveOptions);


document.querySelector("#btnActiveTab").addEventListener("click", getActiveTab);
document.querySelector("#btnAllTabs").addEventListener("click", getAllTabs);
document.querySelector("#btnSelectedTabs").addEventListener("click", getSelectedTabs);

