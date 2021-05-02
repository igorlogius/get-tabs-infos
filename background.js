
const temporary = browser.runtime.id.endsWith('@temporary-addon'); 
const manifest = browser.runtime.getManifest();
const extname = manifest.name;

function log() {
	if(arguments.length < 2){
		throw 'invalid number of arguments';
	}
	const level = arguments[0].trim().toLowerCase();
	let msg = '';
	for (let i=1; i < arguments.length; i++) {
		msg = msg + arguments[i];
	}
	if (['error','warn'].includes(level) || ( temporary && ['debug','info','log'].includes(level))) {
		console[level]('[' + extname + '] [' + level.toUpperCase() + '] ' + msg);
	}
}

function getTimeStampStr() {
	let ts = ""
	const d = new Date();
	[d.getFullYear(), d.getMonth()+1, d.getDate()+1].forEach((t,i) => {
		ts = ts + ((i===0)?"":"-") + ((t<10)?"0":"") + t;
	});

	[d.getHours(), d.getMinutes() , d.getSeconds()].forEach((t,i) => {
		ts = ts + ((i===0)?" ":":") + ((t<10)?"0":"") + t;
	});
	return ts.trim();
}

//browser.browserAction.onClicked.addListener();
async function onClicked(atab,clickData, button) {
	// 1. get the format string from storage
	

	const store = await browser.storage.local.get('placeholder_urls');
	//store.placeholder_urls.forEach( async (val) => {

	tmp = typeof tmp[id] === 'string'? tmp[id]: "";

	tmp = tmp.trim();

	//console.log(tmp);
	//
	if( tmp === "") {
		tmp = "%title - %url\n"
	}

	//
	// 2. replace placeholders 
	//
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

	if (clickData.modifiers.includes('Ctrl')) {

		const tabs = await browser.tabs.query({});

		for(let tab of tabs) {
			tmp2 = tmp;
			for (const p of replacers) {
				//console.log(p);
				tmp2 = tmp2.replaceAll("%"+p, (typeof tab[p] !== 'undefined'? tab[p] : "not available"));
			}
			out = out + tmp2 + '\n';
		}

	}else{
		tmp2 = tmp;
		for (const p of replacers) {
			//console.log(p);
			tmp2 = tmp2.replaceAll("%"+p, (typeof atab[p] !== 'undefined'? atab[p] : "not available"));
		}
		out = out + tmp2 + '\n';
	}
	//
	// 3. copy text to clipboard
	navigator.clipboard.writeText(out);

	// 4. notify user 
	browser.notifications.create(extname + (new Date()).toString(), {
		"type": "basic",
		"title": 'copyTabInfo', 
		"message":  'copied tabinfo in clipboard' 
	});

}
