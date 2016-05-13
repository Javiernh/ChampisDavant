// ==UserScript==
// @name         Champis d'avant
// @version      0.1
// @match        http://mush.vg/user/*
// @match        http://mush.twinoid.com/user/*
// @match        http://mush.twinoid.es/user/*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      mush.vg
// @connect      mush.twinoid.com
// @connect      mush.twinoid.es
// ==/UserScript==

/* GENERAL FUNCTIONS */
function sel(name, parent) {
	var context = parent || document;
	var simple = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/.test(name);
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
var block = addNewEl('div', addNewEl('div', sel('.data'), null, null, { class: 'bgtablesummar' }));
block.className = 'twinstyle';
addNewEl('h3', block, null, "Vaisseaux avec cette personne");
addNewEl('div', block, null, "<div class='butright'><div class='butbg'>Lancer l'analyse</div></div>", { class: 'but' }).addEventListener('click', function() {
	
});
