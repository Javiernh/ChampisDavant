// ==UserScript==
// @name     Champis d'avant
// @version  1.2.1
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
	if (attrs) { for (attr in attrs) { el.setAttribute(attr, attrs[attr]); } }
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
		shipsTogether: "Champis d'avant : Vaisseaux en commun",
		analysis: "Lancer l'analyse",
		youPlayed: "Vous jouiez…",
		hePlayed: "Il jouait…",
		shePlayed: "Elle jouait…",
		theyPlayed: "Il/Elle jouait…",
		days: "Jours",
		ship: "Vaisseau",
		shipLink: "Palmarès",
		resultsNumberSingular: "Vous avez fait %1 vaisseau ensemble.",
		resultsNumberPlural: "Vous avez fait %1 vaisseaux ensemble.",

		//Own profile
		peopleMet: "Champis d'avant : Personnes croisées en partie",
		pseudo: "Pseudo",
		shipsNumber: "Vaisseaux",
		noFriend: "Pas de données disponibles. Allez sur le profil Mush d'un joueur et lancez une analyse de vaisseaux communs.",

		//Popup
		popup: "Champis d'avant : parties avec ",
		popupTitle: "Parties jouées avec %1",
	}
}
else if (document.domain == 'mush.twinoid.es') {
	lang = 'es';
	TXT = {
		shipsTogether: "Mushes Reunidos: Naves juntos",
		analysis: "Comenzar análisis",
		youPlayed: "Tú jugaste…",
		hePlayed: "Él jugó…",
		shePlayed: "Ella jugó…",
		theyPlayed: "Él/Ella jugó…",
		days: "Días",
		ship: "Nave",
		shipLink: "Fama",
		resultsNumberSingular: "Ambos jugasteis %1 nave juntos.",
		resultsNumberPlural: "Ambos jugasteis %1 naves juntos.",

		peopleMet: "Mushes Reunidos: Gente encontrada en el juego",
		pseudo: "Nick",
		shipsNumber: "Naves",
		noFriend: "Sin datos disponibles. Entra en el perfil de Mush de alguien y comienza el análisis.",

		popup: "Mushes Reunidos : naves con ",
		popupTitle: "Partidas jugadas con %1",
	}
}
else {
	lang = 'en';
	TXT = {
		shipsTogether: "Mushes Reunited: Ships together",
		analysis: "Start analysis",
		youPlayed: "You played…",
		hePlayed: "He played…",
		shePlayed: "She played…",
		theyPlayed: "They played…",
		days: "Days",
		ship: "Ship",
		shipLink: "Honours List",
		resultsNumberSingular: "You played %1 ship together.",
		resultsNumberPlural: "You played %1 ships together.",

		peopleMet: "Mushes Reunited: People met ingame",
		pseudo: "Pseudo",
		shipsNumber: "Ships",
		noFriend: "No data available. Go on someone's Mush profile and start a mutual ships analysis.",

		popup: "Mushes Reunited : ships with ",
		popupTitle: "Games played with %1",
	}
}

function updateStorage(friendId, friendName, corrs, remove=false) {
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
			if (remove) {
				friends.splice(i, 1);
				inList = true;
			}
			else {
				friends[i] = [friendId, friendName, corrs].join(':');
				inList = true;
			}
		}
	}
	if (!inList && friendId != /[0-9]+/.exec(sel('#tid_openRight').getAttribute('href'))[0]) { //Add if it's not yourself
		friends.push([friendId, friendName, corrs].join(':'));
	}
	localStorage['ChampisDavant-friends-' + lang] = friends.join(';');
}


function analyseProfiles(me, them, block, friendId, friendName, forceWoman, forceMan) {
	var trShipsB = selAll('.cdTripEntry', them); //Their ships
	var trShipsA = selAll('.cdTripEntry', me); //Our ships
	var corrs = 0;
	var corrsResult = addNewEl('h4', block);
	corrsResult.style.textAlign = 'center';

	var gender = TXT.theyPlayed;
	if (sel('[src$="icons/female.png"]') || forceWoman) {
		gender = TXT.shePlayed;
	}
	else if (sel('[src$="icons/male.png"]') || forceMan) {
		gender = TXT.hePlayed;
	}

	var table = addNewEl('table', block);
	table.className = 'summar';
	var thead = addNewEl('tr', table);
	addNewEl('th', thead, null, TXT.youPlayed, { colspan: 2 });
	addNewEl('th', thead, null, gender, { colspan: 2 });
	addNewEl('th', thead, null, TXT.days);
	addNewEl('th', thead, null, TXT.ship);

	var shipsA = {}
	for (var i = 0; i < trShipsA.length; i++) {
		var id = /[0-9]+/.exec(sel('.butmini', trShipsA[i]).getAttribute('href'))[0];
		shipsA[id] = [trShipsA[i].children[0].innerHTML, trShipsA[i].children[8].textContent, trShipsA[i].children[1].textContent]; //Charname, death, days
	}
	for (var i = 0; i < trShipsB.length; i++) {
		var id = /[0-9]+/.exec(sel('.butmini', trShipsB[i]).getAttribute('href'))[0];
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

	if (corrs == 1) {
		corrsResult.textContent = TXT.resultsNumberSingular.replace('%1', corrs);
	}
	else {
		corrsResult.textContent = TXT.resultsNumberPlural.replace('%1', corrs);
	}
	if (corrs == 0) {
		block.removeChild(table);
	}

	updateStorage(friendId, friendName, corrs);
}


function updateFriend(img, friendId) {
	GM_xmlhttpRequest({
		method: 'GET', url: 'http://' + document.domain + '/u/profile/' + friendId,
		onload: function(content) {
			var them = addNewEl('div', document.body, null, content.responseText.replace('cdTrips', 'CDA-cdTrips'));
			them.style.display = 'none';
			if (!sel('.cdTripEntry', them)) {
				document.body.removeChild(them);
				img.setAttribute('src', '/img/icons/ui/broken.png');
				return false;
			}
			var name = sel('title', them).textContent;
			switch (lang) {
				case 'fr':
					name = /Profil de (\S+)/.exec(name)[1];
					break;
				case 'es':
					name = /Perfil de (\S+)/.exec(name)[1];
					break;
				case 'en':
				default:
					name = /(\S+)'s Profile/.exec(name)[1];
			}

			var trShipsB = selAll('.cdTripEntry', them); //Their ships
			var trShipsA = selAll('.cdTripEntry', sel('#cdTrips')); //Our ships
			var corrs = 0;
			var shipsA = [];
			var id;
			for (var i = 0; i < trShipsA.length; i++) {
				id = /[0-9]+/.exec(sel('.butmini', trShipsA[i]).getAttribute('href'))[0];
				shipsA.push(id);
			}
			for (var j = 0; j < trShipsB.length; j++) {
				id = /[0-9]+/.exec(sel('.butmini', trShipsB[j]).getAttribute('href'))[0];
				if (shipsA.indexOf(id) != -1) {
					corrs++;
				}
			}
			updateStorage(friendId, name, corrs);
			doOwnProfile();
			document.body.removeChild(them);
			img.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAB7BAAAewQHDaVRTAAAAB3RJTUUH3wQPAAkQTioZ4QAAARZJREFUKM910qFKRFEQxvHfXDcIgtoMt5gMBhGfwGYWzGJ1n0CwKvgAos1gMFmMBt/CZLJssKmwsEE5BufI4bIOHA73zvznY745gd5vfBlEKeXNPzHCMq6xOsjtRcQaLvCBK0xLKRPo8IljvA/A9Txb2MUtdiKihy47fGNxAL7muccs86dYgi47jDMxa5VzxlscNvA4Ivoua7bzfsJZwqOEJ5jioa0NrOGxGlKBBgJp1F/daM4KJv9sYKX96FKhznVUXasqEXGXavv5+x2jOuNz3vtYamFs4rIBnyFKKSJiI92rzj7gJgsfmyYzHJZSXqriFOeN5QfNAzAAFyKij1JKnafP5Y7TiJM5inXG4z9wXqQp8963H0CpVRH+JJ0LAAAAAElFTkSuQmCC');
		}
	});
}


function doOwnProfile() {
	block = sel('#CDA-owntable');
	block.innerHTML = '';
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

	var half = Math.ceil(friends.length / 2);
	var friendsA = friends.slice(0, half);
	var friendsB = friends.slice(half);

	for (var i = 0; i < half; i++) {
		(function() {
			var friendA = friendsA[i].split(':');
			tr = addNewEl('tr', table);
			var a = addNewEl('td', tr, null, '<a href="/u/profile/' + friendA[0] + '" target="_blank">' + friendA[1] + '</a>');
			var b = addNewEl('td', tr, null, friendA[2], { style: 'position: relative;' });
			b.className = 'ChampisDavantTD';
			addNewEl('img', a, null, null, {
				style: 'margin-left: 6px; cursor: pointer;',
				src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAB7BAAAewQHDaVRTAAAAB3RJTUUH3wQPAAkQTioZ4QAAARZJREFUKM910qFKRFEQxvHfXDcIgtoMt5gMBhGfwGYWzGJ1n0CwKvgAos1gMFmMBt/CZLJssKmwsEE5BufI4bIOHA73zvznY745gd5vfBlEKeXNPzHCMq6xOsjtRcQaLvCBK0xLKRPo8IljvA/A9Txb2MUtdiKihy47fGNxAL7muccs86dYgi47jDMxa5VzxlscNvA4Ivoua7bzfsJZwqOEJ5jioa0NrOGxGlKBBgJp1F/daM4KJv9sYKX96FKhznVUXasqEXGXavv5+x2jOuNz3vtYamFs4rIBnyFKKSJiI92rzj7gJgsfmyYzHJZSXqriFOeN5QfNAzAAFyKij1JKnafP5Y7TiJM5inXG4z9wXqQp8963H0CpVRH+JJ0LAAAAAElFTkSuQmCC'
			}).addEventListener('click', function() {
				this.setAttribute('src', '/img/icons/ui/loading1.gif');
				updateFriend(this, friendA[0]);
			});
			addNewEl('img', b, null, null, {
				style: 'position: absolute; top: 4px; right: 4px; cursor: pointer;',
				src: '/img/icons/ui/close.png'
			}).addEventListener('click', function() {
				updateStorage(friendA[0], null, null, true);
				doOwnProfile();
			});

			var friendB = friendsB[i];
			if (friendB) {
				friendB = friendB.split(':');
				var c = addNewEl('td', tr, null, '<a href="/u/profile/' + friendB[0] + '" target="_blank">' + friendB[1] + '</a>');
				var d = addNewEl('td', tr, null, friendB[2], { style: 'position: relative;' });
				addNewEl('img', c, null, null, {
					style: 'margin-left: 6px; cursor: pointer;',
					src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAB7BAAAewQHDaVRTAAAAB3RJTUUH3wQPAAkQTioZ4QAAARZJREFUKM910qFKRFEQxvHfXDcIgtoMt5gMBhGfwGYWzGJ1n0CwKvgAos1gMFmMBt/CZLJssKmwsEE5BufI4bIOHA73zvznY745gd5vfBlEKeXNPzHCMq6xOsjtRcQaLvCBK0xLKRPo8IljvA/A9Txb2MUtdiKihy47fGNxAL7muccs86dYgi47jDMxa5VzxlscNvA4Ivoua7bzfsJZwqOEJ5jioa0NrOGxGlKBBgJp1F/daM4KJv9sYKX96FKhznVUXasqEXGXavv5+x2jOuNz3vtYamFs4rIBnyFKKSJiI92rzj7gJgsfmyYzHJZSXqriFOeN5QfNAzAAFyKij1JKnafP5Y7TiJM5inXG4z9wXqQp8963H0CpVRH+JJ0LAAAAAElFTkSuQmCC'
				}).addEventListener('click', function() {
					this.setAttribute('src', '/img/icons/ui/loading1.gif');
					updateFriend(this, friendB[0]);
				});
				addNewEl('img', d, null, null, {
					style: 'position: absolute; top: 4px; right: 4px; cursor: pointer;',
					src: '/img/icons/ui/close.png'
				}).addEventListener('click', function() {
					updateStorage(friendB[0], null, null, true);
					doOwnProfile();
				});
			}
			else { //After last profile with odd number of friends
				addNewEl('td', tr, null, '');
				addNewEl('td', tr, null, '');
			}
		})();
	}
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
	var block = addNewEl('div', addNewEl('div', sel('.data'), 'CDA-owntable', null, { class: 'bgtablesummar twinstyle' }));
	doOwnProfile();
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
		var man = sel('[src$="icons/male.png"]', popup);
		var link = addNewEl('a', minorLinks, null, TXT.popup + sel('.tid_avatarImg', popup).getAttribute('alt'), { href: '#', onclick: 'return false;' });
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
								resultPopup.className = 'bgtablesummar twinstyle';
								resultPopup.style.position = 'absolute';
								resultPopup.style.width = '500px';
								resultPopup.style.maxHeight = '500px';
								resultPopup.style.overflowY = 'auto';
								resultPopup.style.padding = '0';
								resultPopup.style.zIndex = '3000';
								resultPopup.style.left = Math.floor((window.innerWidth - 500) / 2) + 'px';
								resultPopup.style.top = (window.scrollY + 50) + 'px';
								resultPopup.style.border = '2px #008 solid';
								resultPopup.style.borderRadius = '5px';
							}
							resultPopup.innerHTML = '';
							addNewEl('h3', resultPopup, null, TXT.popupTitle.replace('%1', popupName), { style: 'font-size: 1em;' }).className = 'summar';
							addNewEl('div', resultPopup, null, "<div class='butright'><div class='butbg'>X</div></div>", {
								style: 'position: absolute; right: 5px; top: 5px;',
								class: 'but',
							}).addEventListener('click', function() { document.body.removeChild(sel('#CDA-popup')); });

							analyseProfiles(me, them, resultPopup, id, popupName, woman, man);
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
