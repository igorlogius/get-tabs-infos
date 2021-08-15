
const temporary = browser.runtime.id.endsWith('@temporary-addon'); 
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

async function getActivPlaceholderStr() {
	const store = await browser.storage.local.get('placeholder_urls');
	for(const val of store.placeholder_urls) {
		if(typeof val.activ === 'boolean' && val.activ === true){
			return val.name;
		}

	}
	return "n/a";
}

async function copyAllTabs() {
	const tabs = await browser.tabs.query({
		currentWindow:true, 
		hidden:false
	});
	await tabinfo2clip(tabs);

	browser.notifications.create(extname + (new Date()).toString(), {
		"type": "basic",
		"title": extname, 
		"iconUrl": browser.runtime.getURL("icon.png"),
		"message":  'copied the current window tabs information into the clipboard' 
	});
}

async function copyTab() {
	const tabs = await browser.tabs.query({active: true, currentWindow:true});
	await tabinfo2clip(tabs);

	browser.notifications.create(extname + (new Date()).toString(), {
		"type": "basic",
		"title": extname, 
		"iconUrl": browser.runtime.getURL("icon.png"),
		"message":  'copied the active tab information into the clipboard' 
	});
}
async function tabinfo2clip(tabs) {

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

	for(const tab of tabs) {
		tmp2 = tmp;
		for (const p of replacers) {
			tmp2 = tmp2.replaceAll("%"+p, (typeof tab[p] !== 'undefined'? tab[p] : "n/a"));
		}
		out = out + tmp2 + '\n';
	}

	// 3. copy text to clipboard
	navigator.clipboard.writeText(out);
}

function deleteRow(rowTr) {
	var mainTableBody = document.getElementById('mainTableBody');
	mainTableBody.removeChild(rowTr);
}

function createTableRow(feed) {
	var mainTableBody = document.getElementById('mainTableBody');
	var tr = mainTableBody.insertRow();

	Object.keys(feed).sort().forEach( (key) => {

		if( key === 'activ'){
			//if(feed[key] !== null) {
				var input = document.createElement('input');
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
			var input = document.createElement('input');
			input.className = key;
			input.placeholder = "%title - %url";
			input.style.float = 'right';
			input.style.width = '90%';
			input.style.margin = '3px';
			input.value = feed[key];
			tr.insertCell().appendChild(input);
		}else
			if( key !== 'action'){
				var input = document.createElement('input');
				input.className = key;
				input.placeholder = key;
				input.style.width = '0px';
				input.value = feed[key];
				tr.insertCell().appendChild(input);
			}
	});

	var button;
	if(feed.action === 'save'){
		button = createButton("Create", "saveButton", function() {},  true);
		//tr.insertCell().appendChild(button);
	}else{
		button = createButton("Delete", "deleteButton", function() { deleteRow(tr); }, true );
		//var button2 = createButton("CopyTab", "copyButton", copyTab, false );
		//button.parentNode.insertBefore(button2,button);
		//button2 = createButton("CopyAllTabs", "copyAllButton", copyAllTabs, false );
		//button.parentNode.insertBefore(button2,button);
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

async function saveOptions(e) {
	var feeds = collectConfig();
	await browser.storage.local.set({ 'placeholder_urls': feeds });
}

async function restoreOptions() {
	var mainTableBody = document.getElementById('mainTableBody');
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
				'name': 'Plaintext: %title - %url' ,
				'action' : ''
			},
			{
				'activ': false,
				'name': 'HTML: <a href="%url">%title</a>' ,
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
document.querySelector("form").addEventListener("submit", saveOptions);


document.querySelector("#btnCopyTab").addEventListener("click", copyTab);
document.querySelector("#btnCopyAllTabs").addEventListener("click", copyAllTabs);

/*
const impbtnWrp = document.getElementById('impbtn_wrapper');
const impbtn = document.getElementById('impbtn');
const expbtn = document.getElementById('expbtn');

expbtn.addEventListener('click', async function (evt) {
    var dl = document.createElement('a');
    var res = await browser.storage.local.get('placeholder_urls');
    var content = JSON.stringify(res.placeholder_urls);
    //console.log(content);
    //	return;
    dl.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(content));
    dl.setAttribute('download', 'data.json');
    dl.setAttribute('visibility', 'hidden');
    dl.setAttribute('display', 'none');
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
});

// delegate to real Import Button which is a file selector
impbtnWrp.addEventListener('click', function(evt) {
	console.log('impbtnWrp');
	impbtn.click();
})

impbtn.addEventListener('input', function (evt) {

	console.log('impbtn');
	
	var file  = this.files[0];

	//console.log(file.name);
	
	var reader = new FileReader();
	        reader.onload = async function(e) {
            try {
                var config = JSON.parse(reader.result);
		//console.log("impbtn", config);
		await browser.storage.local.set({ 'placeholder_urls': config});
		document.querySelector("form").submit();
            } catch (e) {
                console.error('error loading file: ' + e);
            }
        };
        reader.readAsText(file);

});
*/
