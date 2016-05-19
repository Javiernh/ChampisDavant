// ==UserScript==
// @name     Champis d'avant
// @version  1.1.1
// @match    http://mush.vg/*
// @match    http://mush.twinoid.com/*
// @match    http://mush.twinoid.es/*
// @grant    unsafeWindow
// @grant    GM_xmlhttpRequest
// @connect  mush.vg
// @connect  mush.twinoid.com
// @connect  mush.twinoid.es
// ==/UserScript==

var console = unsafeWindow.console;
var localStorage = unsafeWindow.localStorage;

/* GENERAL FUNCTIONS */
function sel(name, parent) {
	var context = parent || document;
	var simple = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/.test(name); //From jQuery
	if (name[0] == "." && simple)
		{ return context.getElementsByClassName(name.slice(1))[0]; }
	else if (name[0] == '#' && simple)
		{ return document.getElementById(name.slice(1)); }
	else
		{ return context.querySelector(name); }
}

function selAll(name, parent) {
	var context = parent || document;
	var simple = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/.test(name);
	if (simple)
		{ return [].slice.call(context.getElementsByClassName(name.slice(1))); }
	else
		{ return [].slice.call(context.querySelectorAll(name)); }
}

function addNewEl(type, parent, id, content, attrs) {
	if (['svg', 'path', 'rect', 'text'].indexOf(type) != -1)
		{ var el = document.createElementNS('http://www.w3.org/2000/svg', type); }
	else
		{ var el = document.createElement(type); }
	if (id) { el.id = id; }
	if (content) { el.innerHTML = content; }
	if (attrs) { for (i in attrs) { el.setAttribute(i, attrs[i]); } }
	if (parent) { parent.appendChild(el); }
	return el;
}

/* SCRIPT */
var TXT;
var lang;
if (document.domain == 'mush.vg') {
	lang = 'fr';
	TXT = {
		//Friend's profile
		shipsTogether: "Champis d'avant : Vaisseaux ensemble",
		analysis: "Lancer l'analyse",
		youPlayed: "Vous jouiez…",
		hePlayed: "Il jouait…",
		shePlayed: "Elle jouait…",
		days: "Jours",
		ship: "Vaisseau",
		shipLink: "Palmarès",
		resultsNumber: "Vous avez fait %1 vaisseaux ensemble.",

		//Own profile
		peopleMet: "Champis d'avant : Personnes croisées en partie",
		pseudo: "Pseudo",
		shipsNumber: "Vaisseaux",
		noFriend: "Pas de données disponibles. Allez sur le profil Mush d'un joueur et lancez une analyse de vaisseaux communs.",

		//Popup
		popup: "Champis d'avant : parties avec ",
		popupMale: "ce joueur",
		popupFemale: "cette joueuse",
		popupTitle: "Parties jouées avec %1",
	}
}
else if (document.domain == 'mush.twinoid.es') {
	lang = 'es';
	TXT = {
		shipsTogether: "Mushes Reunited: Ships together",
		analysis: "Start analysis",
		youPlayed: "You played…",
		hePlayed: "They played…",
		shePlayed: "They played…",
		days: "Days",
		ship: "Ship",
		shipLink: "Honours List",
		resultsNumber: "You played %1 ships together.",

		peopleMet: "Mushes Reunited: People met ingame",
		pseudo: "Pseudo",
		shipsNumber: "Ships",
		noFriend: "No data available. Go on someone's Mush profile and start a mutual ships analysis.",

		popup: "Mushes Reunited : ships with ",
		popupMale: "this player",
		popupFemale: "this player",
		popupTitle: "Games played with %1",
	}
}
else {
	lang = 'en';
	TXT = {
		shipsTogether: "Mushes Reunited: Ships together",
		analysis: "Start analysis",
		youPlayed: "You played…",
		hePlayed: "They played…",
		shePlayed: "They played…",
		days: "Days",
		ship: "Ship",
		shipLink: "Honours List",
		resultsNumber: "You played %1 ships together.",

		peopleMet: "Mushes Reunited: People met ingame",
		pseudo: "Pseudo",
		shipsNumber: "Ships",
		noFriend: "No data available. Go on someone's Mush profile and start a mutual ships analysis.",

		popup: "Mushes Reunited : ships with ",
		popupMale: "this player",
		popupFemale: "this player",
		popupTitle: "Games played with %1",
	}
}

function analyseProfiles(me, them, block, friendId, friendName, forceWoman) {
	var trShipsB = selAll('.cdTripEntry', them); //Their ships
	var trShipsA = selAll('.cdTripEntry', me); //Our ships
	var corrs = 0;
	var corrsResult = addNewEl('h4', block);
	corrsResult.style.textAlign = 'center';

	var table = addNewEl('table', block);
	table.className = 'summar';
	var thead = addNewEl('tr', table);
	addNewEl('th', thead, null, TXT.youPlayed, { colspan: 2 });
	addNewEl('th', thead, null, (sel('[src$="icons/female.png"]') || forceWoman ? TXT.shePlayed : TXT.hePlayed), { colspan: 2 });
	addNewEl('th', thead, null, TXT.days);
	addNewEl('th', thead, null, TXT.ship);

	var shipsA = {}
	for (var i = 0; i < trShipsA.length; i++) {
		var id = /[0-9]+/.exec(sel('.butmini', trShipsA[i]).getAttribute('href'));
		shipsA[id] = [trShipsA[i].children[0].innerHTML, trShipsA[i].children[8].textContent, trShipsA[i].children[1].textContent]; //Charname, death, days
	}
	for (var i = 0; i < trShipsB.length; i++) {
		var id = /[0-9]+/.exec(sel('.butmini', trShipsB[i]).getAttribute('href'));
		if (id in shipsA) {
			corrs++;
			var tr = addNewEl('tr', table);
			addNewEl('td', tr, null, shipsA[id][0]);
			addNewEl('td', tr, null, shipsA[id][1]);
			addNewEl('td', tr, null, trShipsB[i].children[0].innerHTML);
			addNewEl('td', tr, null, trShipsB[i].children[8].textContent);
			addNewEl('td', tr, null, shipsA[id][2]);
			addNewEl('td', tr, null, '<a href="/theEnd/' + id + '" class="butmini" target="_blank"><img src="/img/icons/ui/pageright.png"> ' + TXT.shipLink + '</a>');
		}
	}

	corrsResult.textContent = TXT.resultsNumber.replace('%1', corrs);
	if (corrs == 0) {
		block.removeChild(table);
	}

	var inList = false;
	var friends = localStorage['ChampisDavant-friends-' + lang];
	if (friends == undefined) {
		friends = '';
	}
	friends = friends.split(';');
	for (var i = 0; i < friends.length; i++) {
		if (!friends[i]) { //Empty string
			friends.splice(i, 1);
			continue;
		}
		var friend = friends[i].split(':');
		if (friend[0] == friendId) { //Update
			friends[i] = [friendId, friendName, corrs].join(':');
			inList = true;
		}
	}
	if (!inList && friendId != /[0-9]+/.exec(sel('#tid_openRight').getAttribute('href'))[0]) { //Add if it's not yourself
		friends.push([friendId, friendName, corrs].join(':'));
	}
	localStorage['ChampisDavant-friends-' + lang] = friends.join(';');
}


//Friend's profile
if (/profile\/[0-9]+/.test(document.location)) {
	var block = addNewEl('div', addNewEl('div', sel('.data'), null, null, { class: 'bgtablesummar' }));
	block.className = 'twinstyle';
	addNewEl('h3', block, null, TXT.shipsTogether);
	addNewEl('div', block, null, "<div class='butright'><div class='butbg'>" + TXT.analysis + "</div></div>", { class: 'but' }).addEventListener('click', function() {
		var button = this;
		sel('.butbg', button).innerHTML = "<img class='cdLoading' src='/img/icons/ui/loading1.gif' alt='loading…' /> " + TXT.analysis;
		GM_xmlhttpRequest({
			method: 'GET', url: 'http://' + document.domain + '/me',
			onload: function(content) {
				block.removeChild(button);
				var content = content.responseText.replace(/<html>([\s\S]+)<body>/, '').replace(/<\/body>([\s\S]+)<\/html>/, '');
				var me = addNewEl('div', document.body, null, content);
				me.style.display = 'none';
				var them = sel('#container_inside');
				var friendId = /[0-9]+/.exec(document.location)[0];
				var friendName = sel('#profile .tid_userName').textContent.trim();
				analyseProfiles(me, them, block, friendId, friendName);
				document.body.removeChild(me);
			}
		});
	});
}

//Own profile
else if (/\/me/.test(document.location)) {
	addNewEl('style', document.head, null, '.ChampisDavantTD { border-right: 1px dotted rgba(0, 0, 0, 0.5); }');
	var block = addNewEl('div', addNewEl('div', sel('.data'), null, null, { class: 'bgtablesummar' }));
	block.className = 'twinstyle';
	addNewEl('h3', block, null, TXT.peopleMet);
	var table = addNewEl('table', block);
	table.className = 'summar';
	table.style.width = '95%';
	var thead = addNewEl('tr', table);
	addNewEl('th', thead, null, TXT.pseudo);
	addNewEl('th', thead, null, TXT.shipsNumber).className = 'ChampisDavantTD';
	addNewEl('th', thead, null, TXT.pseudo);
	addNewEl('th', thead, null, TXT.shipsNumber);

	var tr;
	var newLine = true;
	var friends = localStorage['ChampisDavant-friends-' + lang];
	if (friends == undefined) {
		friends = '';
		addNewEl('tr', table, null, '<td colspan="4">' + TXT.noFriend + '</td>');
		return;
	}
	friends = friends.split(';');
	friends.sort(function(a, b) {
		//Beware: top to bottom!
		if (parseInt(a.split(':')[2]) > parseInt(b.split(':')[2])) {
			return -1;
		}
		else {
			return 1;
		}
	});
	for (var i = 0; i < friends.length; i++) {
		if (!friends[i]) {
			continue;
		}
		var friend = friends[i].split(':');
		if (newLine) {
			tr = addNewEl('tr', table);
			addNewEl('td', tr, null, '<a href="/u/profile/' + friend[0] + '" target="_blank">' + friend[1] + '</a>');
			addNewEl('td', tr, null, friend[2]).className = 'ChampisDavantTD';
			newLine = false;
		}
		else {
			addNewEl('td', tr, null, '<a href="/u/profile/' + friend[0] + '" target="_blank">' + friend[1] + '</a>');
			addNewEl('td', tr, null, friend[2]);
			newLine = true;
		}
	}
}

//Pseudo popups analysis
var popupName;
setInterval(function() {
	var minorLinks = sel('.tid_content.tid_modinit:not(.CDA-scripted) .tid_minorLinks');
	if (minorLinks) {
		if (!popupName) {
			return;
		}
		var popup = minorLinks.parentNode.parentNode;
		var id = /[0-9]+/.exec(sel('.tid_majorLinks a[href*="user/"]', popup).getAttribute('href'))[0];
		var woman = sel('[src$="icons/female.png"]', popup);
		var link = addNewEl('a', minorLinks, null, TXT.popup + (woman ? TXT.popupFemale : TXT.popupMale), { href: '#', onclick: 'return false;' });
		link.addEventListener('click', function() {
			link.innerHTML += " <img class='cdLoading' src='/img/icons/ui/loading1.gif' alt='loading…' />";
			GM_xmlhttpRequest({
				method: 'GET', url: 'http://' + document.domain + '/me',
				onload: function(content) {
					var content = content.responseText.replace(/<html>([\s\S]+)<body>/, '').replace(/<\/body>([\s\S]+)<\/html>/, '');
					var me = addNewEl('div', document.body, null, content);
					me.style.display = 'none';
					GM_xmlhttpRequest({
						method: 'GET', url: 'http://' + document.domain + '/u/profile/' + id,
						onload: function(content) {
							var content = content.responseText.replace(/<html>([\s\S]+)<body>/, '').replace(/<\/body>([\s\S]+)<\/html>/, '');
							var them = addNewEl('div', document.body, null, content);
							them.style.display = 'none';
							var resultPopup = sel('#CDA-popup');
							if (!resultPopup) {
								resultPopup = addNewEl('div', document.body, 'CDA-popup');
								resultPopup.style.position = 'absolute';
								resultPopup.style.width = '500px';
								resultPopup.style.maxHeight = '500px';
								resultPopup.style.overflowY = 'auto';
								resultPopup.style.padding = '20px 5px 5px 5px';
								resultPopup.style.zIndex = '3000';
								resultPopup.style.left = Math.floor((window.innerWidth - 500) / 2) + 'px';
								resultPopup.style.top = (window.scrollY + 50) + 'px';
								resultPopup.style.backgroundColor = '#33C';
								resultPopup.style.border = '2px #008 solid';
								resultPopup.style.borderRadius = '5px';
							}
							resultPopup.innerHTML = '';
							addNewEl('h1', resultPopup, null, TXT.popupTitle.replace('%1', popupName), { style: 'font-size: 1.3em; text-align: center;' });
							addNewEl('div', resultPopup, null, "<div class='butright'><div class='butbg'>X</div></div>", {
								style: 'position: absolute; right: 5px; top: 5px;',
								class: 'but',
							}).addEventListener('click', function() { document.body.removeChild(sel('#CDA-popup')); });
							
							analyseProfiles(me, them, resultPopup, id, popupName, woman);
							document.body.removeChild(me);
							document.body.removeChild(them);
							popup.parentNode.removeChild(popup);
							var noclick = sel('.tid_noclick');
							if (noclick) {
								noclick.parentNode.removeChild(noclick);
							}
						}
					});
				}
			});
			return false;
		});
		popup.className += ' CDA-scripted';
	}

	var players = selAll('.tid_user:not(.CDA-scripted)');
	if (players.length) {
		for (var i = 0; i < players.length; i++) {
			players[i].addEventListener('click', function() { popupName = this.textContent.trim(); });
			players[i].className += ' CDA-scripted';
		}
	}
}, 500);
