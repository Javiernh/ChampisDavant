// ==UserScript==
// @name         Champis d'avant
// @version      1
// @match        http://mush.vg/u/profile/*
// @match        http://mush.twinoid.com/u/profile/*
// @match        http://mush.twinoid.es/u/profile/*
// @grant        GM_xmlhttpRequest
// @connect      mush.vg
// @connect      mush.twinoid.com
// @connect      mush.twinoid.es
// ==/UserScript==

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
if (document.domain == 'mush.vg') {
	TXT = {
		shipsTogether: "Vaisseaux ensemble",
		analysis: "Lancer l'analyse",
		youPlayed: "Vous jouiez…",
		theyPlayed: "Il jouait…",
		days: "Jours",
		ship: "Vaisseau",
		shipLink: "Palmarès",
		resultsNumber: "Vous avez fait %1 vaisseaux ensemble.",
	}
}
else {
	TXT = {
		shipsTogether: "Ships together",
		analysis: "Start analysis",
		youPlayed: "You played…",
		theyPlayed: "They played…",
		days: "Days",
		ship: "Ship",
		shipLink: "Honours List",
		resultsNumber: "You played %1 ships together.",
	}
}

var block = addNewEl('div', addNewEl('div', sel('.data'), null, null, { class: 'bgtablesummar' }));
block.className = 'twinstyle';
addNewEl('h3', block, null, TXT.shipsTogether);
addNewEl('div', block, null, "<div class='butright'><div class='butbg'>" + TXT.analysis + "</div></div>", { class: 'but' }).addEventListener('click', function() {
	var button = this;
	sel('.butbg', button).innerHTML = "<img class='cdLoading' src='/img/icons/ui/loading1.gif' alt='loading…' /> " + TXT.analysis;
	GM_xmlhttpRequest({
		method: 'GET', url: 'http://' + document.domain + '/me?profile',
		onload: function(content) {
			block.removeChild(button);
			var trShipsB = selAll('.cdTripEntry'); //Their ships
			var content = content.responseText.replace(/<html>([\s\S]+)<body>/, '').replace(/<\/body>([\s\S]+)<\/html>/, '');
			var me = addNewEl('div', document.body, null, content);
			me.style.display = 'none';
			var trShipsA = selAll('.cdTripEntry', me); //Our ships
			var corrs = 0;
			var corrsResult = addNewEl('h4', block);
			corrsResult.style.textAlign = 'center';

			var table = addNewEl('table', block);
			table.className = 'summar';
			var thead = addNewEl('tr', table);
			addNewEl('th', thead, null, TXT.youPlayed, { colspan: 2 });
			addNewEl('th', thead, null, TXT.theyPlayed, { colspan: 2 });
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
			document.body.removeChild(me);
		}
	});
});
