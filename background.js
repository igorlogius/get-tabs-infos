
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

browser.browserAction.onClicked.addListener(async (tab) => {
	// 1. get the format string from storage
	
	const id = "formatstr"
	let tmp = await browser.storage.local.get(id);

	tmp = typeof tmp[id] === 'string'? tmp[id]: "";

	//console.log(tmp);

	//
	// 2. replace placeholders 
	//
	const browserInfo = await browser.runtime.getBrowserInfo();
	const platformInfo = await browser.runtime.getPlatformInfo();
	const replacers = {
		"u": () => tab.url
		,"t": () => tab.title
		,"i": () => tab.index
		,"bn": () => browserInfo.name
		,"bv": () => browserInfo.version
		,"po": () => platformInfo.os
		,"pa": () => platformInfo.arch
		,"d": getTimeStampStr 
	}

	for (const p in replacers) {
		tmp = tmp.replaceAll("%"+p, replacers[p]());
	}
	//
	// 3. copy text to clipboard
	//const text = tmp; //`<a href="${tab.url}">${tab.title}</a>`;
	//console.log(text);
	navigator.clipboard.writeText(tmp);
});
