// ==UserScript==
// @name           CerealOgameStats
// @description    Make alliance stats from ogame to post in forums
// @namespace      http://userscripts.org/users/68563/scripts
// @downloadURL    https://userscripts.org/scripts/source/134405.user.js
// @updateURL      https://userscripts.org/scripts/source/134405.meta.js
// @icon           http://s3.amazonaws.com/uso_ss/icon/134405/large.png
// @version        2.1.1
// @include        *://*.ogame.*/game/index.php?*page=alliance*
// ==/UserScript==
/*!

	CerealOgameStats

	Makes alliance stats from the ogame alliance memberdata and
	transforms it into a forum friendly code.

	Copyright (C) 2012 Elías Grande Cásedas

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see http://www.gnu.org/licenses/

*/
(function(){

var script =
{
	name : 'CerealOgameStats',
	home : 'http://userscripts.org/scripts/show/134405'
}
	
// extend prototypes

String.prototype.replaceAll = function (search, replacement)
{
	return this.split(search).join(replacement);
}


var _StringReplaceMap = function (str, org, rep, index)
{
	if (index==0)
		return str.split(org[0]).join(rep[0]);

	var i, arr;
	arr = str.split(org[index]);
	for (i in arr)
	{
		arr[i] = _StringReplaceMap(arr[i], org, rep, index-1);
	}
	
	return arr.join(rep[index]);
}

String.prototype.replaceMap = function (replaceMap)
{
	var key, org, rep, count;
	org = new Array();
	rep = new Array();
	
	count = 0;
	for (key in replaceMap)
	{
		org.push(key);
		rep.push(replaceMap[key]);
		count ++;
	}
	
	if (count==0)
		return this;
	else
		return _StringReplaceMap (this,org,rep,count-1);
}

String.prototype.trimNaN = function ()
{
	return this.replace(/^\D*(\d)/,'$1').replace(/(\d)\D*$/,'$1');
}

// crossbrowser unsafeWindow & document

var win = window, doc;

try
{
	if (unsafeWindow)
	{
		win = unsafeWindow;
	}
}
catch(e){}

doc = win.document;

var onDOMContentLoaded = function()
{

////////////////////////////////////
//                                //
//   START onDOMContentLoaded()   //
//                                //
////////////////////////////////////

// ogame info

var OgameInfo = function()
{
	this.getMeta("version"    ,"ogame-version"    ,null);
	this.getMeta("language"   ,"ogame-language"   ,"en");
	this.getMeta("timestamp"  ,"ogame-timestamp"  ,null);
	this.getMeta("universe"   ,"ogame-universe"   ,null);
	this.getMeta("alliance_id","ogame-alliance-id",null);
}

OgameInfo.prototype =
{
	getMeta : function (name, search, def)
	{
		try
		{
			this[name] =
				doc.querySelector('meta[name="'+search+'"]'
				).getAttribute('content');
		}
		catch(e)
		{
			this[name] = def;
		}
	}
}

var ogameInfo = new OgameInfo();

// local storage

var storage =
{
	id : function(id)
	{
		return script.name+'_'+
			ogameInfo.universe+'_'+
			ogameInfo.alliance_id+'_'+
			id;
	},
	set : function(id,txt)
	{
		var key = this.id(id);
		try
		{
			win.localStorage.setItem(key, txt);
		}
		catch(e)
		{
			win.localStorage[key] = txt;
		}
		return txt;
	},
	get : function(id)
	{
		var key = this.id(id);
		try
		{
			return win.localStorage.getItem(key);
		}
		catch(e)
		{
			var val = win.localStorage[key];
			return (val == 'undefined') ? null : val;
		}
	}
}

// internationalization (i18n)

var I18n = function()
{
	this.lc = {};
}

I18n.prototype =
{
	get : function (key)
	{
		if (this.lc[key])
			return this.lc[key];
		return key;
	},
	set : function (prop)
	{
		for (var attr in prop)
			this.lc[attr] = prop[attr];
	},
	/*! addCommas | mredkj.com/javascript/nfbasic.html */
	number : function (n)
	{
		var nStr, x, x1, x2;
		nStr = n+'';
		x = nStr.split('.');
		x1 = x[0];
		x2 = x.length > 1 ? this.lc.s_dec + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + this.lc.s_tho + '$2');
		}
		return x1 + x2;
	},
	date : function (d)
	{
		return d.trimNaN().split(/\D+/).join(this.lc.s_dat);
	},
	time : function (t)
	{
		return t.trimNaN().split(/\D+/).join(this.lc.s_tim);
	},
	period : function (seconds)
	{
		var w, d, h, m, s = parseInt(seconds), output = '', n = 0;
		
		w = Math.floor(s/604800);s -= w*604800;
		d = Math.floor(s/ 86400);s -= d* 86400;
		h = Math.floor(s/  3600);s -= h*  3600;
		m = Math.floor(s/    60);s -= m*    60;
		
		if (w>0)
		{
			output += this.number(w) + this.lc.a_wee + ' ';
			n++;
		}
		
		if (d>0)
		{
			output += this.number(d) + this.lc.a_day + ' ';
			n++;
		}
		
		if (h>0||n<1||m+s<1)
		{
			output += this.number(h) + this.lc.a_hou + ' ';
			n++;
		}
		
		if (m>0||n<2||(n==2&&s<1))
		{
			output += this.number(m) + this.lc.a_min + ' ';
			n++;
		}
		
		if (s>0||n<3)
		{
			output += this.number(s) + this.lc.a_sec;
		}
		
		return output.trim();
	}
}

var i18n = new I18n();

var _ = function (text)
{
	return i18n.get(text);
}

// default locale [en] english

i18n.set(
{	
	// separators
	s_dec: ".",
	s_tho: ",",
	s_dat: "/",
	s_tim: ":",
	// abb time units
	a_wee: "w",
	a_day: "d",
	a_hou: "h",
	a_min: "m",
	a_sec: "s",
	// buttons
	b_sel:'Select',
	b_del:'Erase',
	b_get:'Get from this page',
	b_sav:'Save as "Old data"',
	b_loa:'Load saved data',
	// titles
	t_odt:'Old data',
	t_ndt:'New data',
	t_fmt:'Format',
	t_col:'Colors',
	t_inc:'Include',
	t_out:'Statistics (code)',
	t_stb:'Status',
	t_pre:'Preview (using "Dark background" colors)',
	// period
	p_ago:'{period} ago',
	p_now:'now',
	// colors
	c_dbg:'Dark background',
	c_lbg:'Light background',
	// status (errors)
	e_nod:'No old data',
	e_nnd:'No new data',
	e_odf:'The old data has wrong format',
	e_ndf:'The new data has wrong format',
	e_unk:'Unexpected error',
	e_ndt:'No data',
	e_wft:'Wrong format',
	// status (success)
	w_dne:'Done',
	w_pcs:'Processing',
	// output
	o_tdt:'Evolution of the alliance since {oldDate} to {newDate}',
	o_tet:'Elapsed time',
	o_tas:'Alliance summary',
	o_ptl:'Total points',
	o_ppm:'Points per member',
	o_tts:'Top 3 by score',
	o_ttp:'Top 3 by percent',
	o_ttg:'Top 3 by gained positions',
	o_trs:'Score rank',
	o_trp:'Percent rank',
	o_trg:'Gained positions rank',
	o_tsc:'Special cases',
	o_cnm:'new member',
	o_cla:'leaves the alliance',
	o_bdg:'banned',
	o_bdq:'unbanned',
	o_ldt:'Latest data (for future statistics)',
	o_abt:'Statistics performed with {link}',
	// OGame Error
	e_oga:'OGame Error, reload this page may fix it'
});

// locale [es] español

if (/es|ar|mx/.test(ogameInfo.language))i18n.set(
{
	// separators
	s_dec: ",",
	s_tho: ".",
	// abb time units
	a_wee: "s",
	a_day: "d",
	a_hou: "h",
	a_min: "m",
	a_sec: "s",
	// buttons
	b_sel:'Seleccionar',
	b_del:'Borrar',
	b_get:'Obtener de esta página',
	b_sav:'Guardar como "Datos antiguos"',
	b_loa:'Cargar datos guardados',
	// titles
	t_odt:'Datos antiguos',
	t_ndt:'Datos nuevos',
	t_fmt:'Formato',
	t_col:'Colores',
	t_inc:'Incluir',
	t_out:'Estadísticas (código)',
	t_stb:'Estado',
	t_pre:'Previsualización (usando colores de "Fondo oscuro")',
	// period
	p_ago:'hace {period}',
	p_now:'ahora',
	// colors
	c_dbg:'Fondo oscuro',
	c_lbg:'Fondo claro',
	// status (errors)
	e_nod:'No hay datos antiguos',
	e_nnd:'No hay datos nuevos',
	e_odf:'Los datos antiguos tienen un formato erróneo',
	e_ndf:'Los datos nuevos tienen un formato erróneo',
	e_unk:'Error inesperado',
	e_ndt:'Sin datos',
	e_wft:'Formato erróneo',
	// status (success)
	w_dne:'Terminado',
	w_pcs:'Procesando',
	// output
	o_tdt:'Evolución de la alianza desde el {oldDate} hasta el {newDate}',
	o_tet:'Tiempo transcurrido',
	o_tas:'Resumen de la alianza',
	o_ptl:'Puntos totales',
	o_ppm:'Puntos por miembro',
	o_tts:'Top 3 por puntos',
	o_ttp:'Top 3 por porcentaje',
	o_ttg:'Top 3 por posiciones subidas',
	o_trs:'Ranking por puntos',
	o_trp:'Ranking por porcentaje',
	o_trg:'Ranking por posiciones subidas',
	o_tsc:'Casos especiales',
	o_cnm:'nuevo miembro',
	o_cla:'abandona la alianza',
	o_bdg:'baneado',
	o_bdq:'desbaneado',
	o_ldt:'Datos más recientes (para futuras estadísticas)',
	o_abt:'Estadísticas realizadas con {link}',
	// OGame Error
	e_oga:'Error de OGame, recargar esta página puede arreglarlo'
})

// locale [fr] francais
//
// thanks to Elvara
// http://userscripts.org/topics/116649

else if (/fr/.test(ogameInfo.language))i18n.set(
{
	// separators
	s_dec: ".",
	s_tho: ",",
	s_dat: "/",
	s_tim: ":",
	// abb time units
	a_wee: "s",
	a_day: "j",
	a_hou: "h",
	a_min: "m",
	a_sec: "s",
	// buttons
	b_sel:'Sélectionner',
	b_del:'Effacer',
	b_get:'Recharger de cette page',
	b_sav:'Sauvegarder comme anciennes données"',
	b_loa:'Charger anciennes données',
	// titles
	t_odt:'Anciennes données',
	t_ndt:'Nouvelles données',
	t_fmt:'Format',
	t_col:'Couleur',
	t_inc:'Inclure',
	t_out:'Statistiques (code)',
	t_stb:'Statut',
	t_pre:'Aperçu (en utilisant l’arrière plan foncé)',
	// period
	p_ago:'{period} depuis le début',
	p_now:'maintenant',
	// colors
	c_dbg:'Arrière plan foncé',
	c_lbg:'Arrière plan clair',
	// status (errors)
	e_nod:'Pas d\'anciennes données',
	e_nnd:'Pas de nouvelles données',
	e_odf:'Les anciennes données ont un mauvais format',
	e_ndf:'Les nouvelles données ont un mauvais format',
	e_unk:'Erreur inattendu',
	e_ndt:'Pas de données',
	e_wft:'Mauvais format',
	// status (success)
	w_dne:'Prêt',
	w_pcs:'Traitement en cours',
	// output
	o_tdt:'Évolution de l\'alliance du {oldDate} au {newDate}',
	o_tet:'Temps passé',
	o_tas:'Résumé de l\'Alliance ',
	o_ptl:'Points Totaux',
	o_ppm:'Points par membres',
	o_tts:'Top 3 par score',
	o_ttp:'Top 3 par pourcentage',
	o_ttg:'Top 3 par places gagnées',
	o_trs:'Rang par score',
	o_trp:'Rang par pourcentage',
	o_trg:'Rang par places gagnées',
	o_tsc:'Cas spéciaux',
	o_cnm:'Nouveaux Membres',
	o_cla:'A quitter l\'alliance',
	o_bdg:'Banni',
	o_bdq:'Débanni',
	o_ldt:'Dernières données (pour statistiques futures)',
	o_abt:'Statistiques obtenues avec {link}',
	// OGame Error
	e_oga:'Erreur OGame, recharger la page peut régler le problème'
});

// colors

var Colors = function ()
{
	this.names = new Array();
	this.colors = new Array();
	this.selected = null;
}

Colors.prototype =
{
	add : function (name, colors)
	{
		this.names.push(name);
		this.colors.push(colors);
	},
	select : function (index)
	{
		this.selected = this.colors[index];
	},
	replace : function (tpl)
	{
		return tpl.replaceMap(this.selected);
	}
}

var colors = new Colors();

// color profiles

colors.add(
	_('c_dbg'),
	{
		'{nameColor}'      : 'white',
		'{growsColor}'     : '#00FF40',
		'{decreasesColor}' : '#ED7010',
		'{remainsColor}'   : '#00DDDD'
	}
);

colors.add(
	_('c_lbg'),
	{
		'{nameColor}'      : 'purple',
		'{growsColor}'     : 'green',
		'{decreasesColor}' : 'red',
		'{remainsColor}'   : 'blue'
	}
);

// operations

var Calc =
{
	diffScore : function (oldScore, newScore)
	{
		var diff = newScore - oldScore;
		var percent = ((newScore/oldScore)-1)*100;
		return {
			score: diff,
			percent: percent
		}
	}
}

// format

var Format = function()
{
	this.formats   = new Array();
	this.selected  = null;
	this.escapeMap =
	{
		'[':"[[u][/u]",
		']':"[u][/u]]"
	}
	this.lastReplace =
	{
		'{grows}'     : "\u00BB", // »
		'{decreases}' : "\u00AB", // «
		'{remains}'   : "\u007E", // ~
		'{remainsNo}' : "\u00D8", // Ø
		'{up}'        : "\u2191", // ?
		'{down}'      : "\u2193", // ?
		'{rank}'      : '#',
		'{\\'         : '{',
		'\\}'         : '}'
	}
	this.layout = {
		sectionStart : '[size=big]{title}[/size]',
		sectionEnd   : "\n\n",
		dateTime : '{date} ([i]{time}[/i])',
		header :
		'[b]{title}[/b]'+"\n"+
		'{elapsedTitle}: {elapsedTime}'+
		"\n\n",
		allianceLine : "\n"+
		'[color={diffColor}]{diff}[/color] '+
		'[b][color={nameColor}]{title}[/color][/b] '+
		'- {newScore} '+
		'([b][color={diffColor}]{diffScore}[/color][/b]) '+
		'([b][color={diffColor}]{diffPercent}[/color][/b] '+
		'[color={diffColor}][size=small]%[/size][/color])',
		top3ScoreLine : "\n"+
		'[color={diffColor}]{position} {diff} [/color] '+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'([b][color={diffColor}]{diffScore}[/color][/b])',
		top3PercentLine : "\n"+
		'[color={diffColor}]{position} {diff} [/color] '+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'([b][color={diffColor}]{diffPercent}[/color][/b] '+
		'[color={diffColor}][size=small]%[/size][/color])',
		top3PositionsLine : "\n"+
		'[color={diffColor}]{position} {diff} [/color] '+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'([b][color={diffColor}]{diffPos}[/color][/b])',
		rankLine : "\n"+
		'[color={diffColor}]{position} {diff} [/color]'+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'- {newScore} '+
		'([b][color={diffColor}]{diffScore}[/color][/b]) '+
		'([b][color={diffColor}]{diffPercent}[/color][/b] '+
		'[color={diffColor}][size=small]%[/size][/color])',
		rank :
		' [size=small]{rank}[/size]{newPos} '+
		'([b][color={diffColor}]{diffPos}[/color][/b])',
		rankNoDiff :
		' [size=small]{rank}[/size]{newPos} '+
		'([b][color={remainsColor}]{remainsNo}[/color][/b])',
		rankLineNoDiff : "\n"+
		'[color={diffColor}]{position} {diff} [/color]'+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'- {oldScore} '+
		'([b][color={remainsColor}]{remainsNo}[/color][/b])',
		from0Member : "\n"+
		'[color={growsColor}]{grows} [/color] '+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'- [b][color={growsColor}]{score}[/color][/b] '+
		'[size=small]({reason})[/size]',
		to0Member : "\n"+
		'[color={decreasesColor}]{decreases} [/color] '+
		'[color={nameColor}][b]{name}[/b][/color] '+
		'- [b][color={decreasesColor}]{score}[/color][/b] '+
		'[size=small]({reason})[/size]',
		scriptData : "\n"+
		'[i]{scriptDataTitle}:[/i]'+"\n"+
		'[spoiler][code]{scriptData}[/code][/spoiler]',
		scriptLink :"\n"+'[i]'+
		_('o_abt').replace('{link}','[url={scriptHome}]{scriptName}[/url]')
		+'[/i]'
	}
		
}

Format.prototype =
{
	add : function (name, patterns)
	{
		this.formats.push({
			name: name,
			patterns: patterns,
			escapeMap: (arguments.length>2)
				? arguments[2]
				: false
		});
	},
	select : function (index)
	{
		this.selected = this.formats[index];
	},
	escape : function (text)
	{
		if (this.selected.escapeMap)
			return text.replaceMap(this.selected.escapeMap);
		else
			return text.replaceMap(this.escapeMap);
	},
	diff : function (input, diff)
	{
		var output = input;
		if (diff < 0)
		{
			output = output.replaceMap({
				'{diffColor}' : '{decreasesColor}',
				'{diff}'      : '{decreases}'
			});
		}
		else
		{	
			if (diff > 0)
				output = output.replaceMap({
					'{diffColor}' : '{growsColor}',
					'{diff}'      : '{grows}'
				});
			else
				output = output.replaceMap({
					'{diffColor}' : '{remainsColor}',
					'{diff}'      : '{remains}'
				});
		}
		return output;
	},
	header : function (allyInfo)
	{
		return this.layout.header.replaceMap(
		{
			'{title}' :
				_('o_tdt'
				).replaceMap(
				{
					'{oldDate}' : this.layout.dateTime.replaceMap(
					{
						'{date}' : allyInfo.oldDate,
						'{time}' : allyInfo.oldTime
					}),
					'{newDate}' : this.layout.dateTime.replaceMap(
					{
						'{date}' : allyInfo.newDate,
						'{time}' : allyInfo.newTime
					})
				}),
			'{elapsedTitle}' : _('o_tet'),
			'{elapsedTime}'  :
				this.escape(i18n.period(
					allyInfo.newTimestamp -
					allyInfo.oldTimestamp
				))
		});
	},
	alliance : function (allyInfo)
	{
		if (allyInfo.oldScore==0)
			return '';
		
		return this.layout.sectionStart.replaceAll(
			'{title}', _('o_tas')
		)+
		this.diff(
			this.layout.allianceLine,
			allyInfo.diffScore
		).replaceMap(
		{
			'{title}'       : _('o_ptl'),
			'{newScore}'    : allyInfo.formatted.newScore,
			'{diffScore}'   : allyInfo.formatted.diffScore,
			'{diffPercent}' : allyInfo.formatted.diffPercent
		})+
		this.diff(
			this.layout.allianceLine,
			allyInfo.diffMemberScore
		).replaceMap({
			'{title}'       : _('o_ppm'),
			'{newScore}'    : allyInfo.formatted.newMemberScore,
			'{diffScore}'   : allyInfo.formatted.diffMemberScore,
			'{diffPercent}' : allyInfo.formatted.diffMemberPercent
		})+
		this.layout.sectionEnd;
	},
	position : function (n,end)
	{
		var out = n+'', from = (out).length, to = (end+'').length;
		for (var i=from; i<to; i++)
			out = '0'+out;
		return out;
	},
	top3 : function (membersInfo, key, title, lineLayout)
	{
		var output = (this.layout.sectionStart+'').replace(
			'{title}', title
		);
		
		var end = Math.min(membersInfo.length, 3);
		var i, info;
		for (i=0; i<end; i++)
		{
			info = membersInfo[i];
			output = output + this.diff(
				lineLayout,
				info.diffScore
			).replaceMap({
				'{position}' : this.position(i+1,end),
				'{name}'     : this.escape(info.name),
				'{diffPos}'  : info.formatted.diffPos.replaceMap({
					'+': '{up}',
					'-': '{down}'
				})
			}).replaceAll(
				'{'+key+'}', info.formatted[key]
			);
		}
		return output + this.layout.sectionEnd;
	},
	rank : function (membersInfo, title)
	{
		var output = (this.layout.sectionStart+'').replace(
			'{title}', title
		);
		var end = membersInfo.length;
		var i, info;
		for (i=0; i<end; i++)
		{
			info = membersInfo[i];
			var layout = (info.diffScore==0)
				? this.layout.rankLineNoDiff
				: this.layout.rankLine;
			output = output + this.diff(
				layout,
				info.diffScore
			).replaceMap({
				'{position}'     : this.position(i+1,end),
				'{name}'         : this.escape(info.name),
				'{oldScore}'     : info.formatted.oldScore,
				'{newScore}'     : info.formatted.newScore,
				'{diffScore}'    : info.formatted.diffScore,
				'{diffPercent}'  : info.formatted.diffPercent
			});
			
			layout = (info.diffPos==0)
				? this.layout.rankNoDiff
				: this.layout.rank;
			
			output = output + this.diff(
				layout,
				info.diffPos
			).replaceMap({
				'{newPos}'  : info.formatted.newPos,
				'{diffPos}' : info.formatted.diffPos.replaceMap({
					'+': '{up}',
					'-': '{down}'
				})
			});
		}
		return output + this.layout.sectionEnd;
	},
	specialCases : function (to0MembersInfo, from0MembersInfo)
	{
		if ((to0MembersInfo.length + from0MembersInfo.length) == 0)
			return '';
		
		var output = this.layout.sectionStart.replace(
			'{title}', _('o_tsc')
		);
		var key, info;
		
		for (key in from0MembersInfo)
		{
			info = from0MembersInfo[key];
			output = output + this.layout.from0Member.replaceMap({
				'{name}'   : this.escape(info.name),
				'{score}'  : info.score,
				'{reason}' : info.reason
			});
		}
		
		for (key in to0MembersInfo)
		{
			info = to0MembersInfo[key];
			output = output + this.layout.to0Member.replaceMap({
				'{name}'   : this.escape(info.name),
				'{score}'  : info.score,
				'{reason}' : info.reason
			});
		}
		
		return output + this.layout.sectionEnd;
	},
	format : function (
		include, allyInfo, membersInfo,
		to0MembersInfo, from0MembersInfo,
		scriptData
	)
	{
		var output = this.header(allyInfo);
		
		if (include.alliance)
				output = output + this.alliance(allyInfo);
		
		var top3Score     = '';
		var top3Percent   = '';
		var top3Positions = '';
		var scoreRank     = '';
		var percentRank   = '';
		var positionsRank = '';
		
		if(membersInfo.length > 0)
		{	
			membersInfo = membersInfo.sort(function(a,b)
			{
				return (a.diffScore>=b.diffScore) ? -1 : 1;
			});
			
			if(include.top3Score&&(membersInfo.length>5||!include.score))
			{
				top3Score = this.top3(
					membersInfo,
					'diffScore',
					_('o_tts'),
					this.layout.top3ScoreLine
				);
			}
			
			if (include.score)
				scoreRank = this.rank(membersInfo,_('o_trs'));
			
			membersInfo = membersInfo.sort(function(a,b)
			{
				return (a.diffPercent>=b.diffPercent) ? -1 : 1;
			});
			
			if(include.top3Percent&&(membersInfo.length>5||!include.percent))
			{
				top3Percent = this.top3(
					membersInfo,
					'diffPercent',
					_('o_ttp'),
					this.layout.top3PercentLine
				);
			}
				
			if (include.percent)
				percentRank = this.rank(membersInfo,_('o_trp'));
			
			membersInfo = membersInfo.sort(function(a,b)
			{
				return (a.diffPos>=b.diffPos) ? -1 : 1;
			});
			
			if(include.top3Positions&&(membersInfo.length>5||!include.positions))
			{
				top3Positions = this.top3(
					membersInfo,
					'diffPos',
					_('o_ttg'),
					this.layout.top3PositionsLine
				);
			}
			
			if (include.positions)
				positionsRank = this.rank(membersInfo,_('o_trg'));
		}
		
		output = output +
			top3Score + top3Percent + top3Positions +
			scoreRank + percentRank + positionsRank;
		
		if (include.special)
			output = output + this.specialCases(
				to0MembersInfo,
				from0MembersInfo
			);
		
		if (include.data)
			output = output + this.layout.scriptData.replace(
				'{scriptDataTitle}', _('o_ldt'));
		
		output = output + this.layout.scriptLink;
		output = output.replaceMap(
			this.selected.patterns
		).replaceMap(
			colors.selected
		).replaceMap({
			'{scriptName}' : script.name,
			'{scriptHome}' : script.home
		}).replaceMap(
			this.lastReplace
		).replace(
			'{scriptData}',
			scriptData.replaceMap({
				'<' : "\\u003C",
				'>' : "\\u003E",
				'[' : "\\u005B",
				']' : "\\u005D"
			})
		);
			
		return output.trim();
	}
}

var format = new Format();

format.add(
	'phpBB',
	{
		'[size=big]'   : '[size=20]',
		'[size=small]' : '[size=10]'
	}
);

format.add(
	'phpBB3',
	{
		'[size=big]'   : '[size=140]',
		'[size=small]' : '[size=80]'
	}
);

format.add(
	'SMF',
	{
		'[size=big]'   : '[size=14pt]',
		'[size=small]' : '[size=7pt]'
	}
);

format.add(
	'vBulletin',
	{
		'[size=big]'   : '[size=4]',
		'[size=small]' : '[size=1]'
	}
);

format.add(
	'HTML',
	{
		'{grows}'      : '&raquo;',
		'{decreases}'  : '&laquo;',
		'{remains}'    : '&sim;',
		'{remainsNo}'  : '&Oslash;', // Ø
		'{up}'         : "&uarr;", // ?
		'{down}'       : "&darr;", // ?
		'[size=big]'   : '<span style="font-size: 140%;">',
		'[size=small]' : '<span style="font-size: 80%;">',
		'[/size]'      : '</span>',
		'[color={'     : '<span style="color: {',
		'Color}]'      : 'Color}">',
		'[/color]'     : '</span>',
		'[b]'          : '<b>',
		'[/b]'         : '</b>',
		'[i]'          : '<i>',
		'[/i]'         : '</i>',
		"\n"           : '<br />'+"\n",
		'[spoiler]'    : '<div>',
		'[/spoiler]'   : '</div>',
		'[code]'       : '<textarea onclick="this.select();" rows="5" cols="20">',
		'[/code]'      : '</textarea>',
		'[url={scriptHome}]{scriptName}[/url]' : '<a href="{scriptHome}">{scriptName}</a>'
	},
	{
		'&':'&amp;',
		'<':'&lt;',
		'>':'&gt;'
	}
);

// convert

var Conversor = function() {}

Conversor.prototype =
{
	reset : function ()
	{
		this.allyInfo =
		{
			oldCount: 0,
			oldScore: 0,
			newCount: 0,
			newScore: 0
		};
		this.membersInfo = new Array();
		this.oldMembersInfo = new Array();
		this.newMembersInfo = new Array();
		this.to0MembersInfo = new Array();
		this.from0MembersInfo = new Array();
	},
	readData : function (text, oldNew)
	{
		var name, data = JSON.parse(text);
		this.allyInfo[oldNew+'Timestamp'] = data.timestamp;
		this.allyInfo[oldNew+'Date'] = data.strDate;
		this.allyInfo[oldNew+'Time'] = data.strTime;
		for (name in data.members)
		{
			this[oldNew+'MembersInfo'].push({
				id    : ('i' in data.members[name])
					? data.members[name].i
					: -1,
				name  : name,
				score : data.members[name].s,
				pos   : data.members[name].p,
				coord : data.members[name].c,
				date  : data.members[name].d,
				noPartner : true
			});
			this.allyInfo[oldNew+'Count']++;
			this.allyInfo[oldNew+'Score'] =
				this.allyInfo[oldNew+'Score'] + data.members[name].s;
		}
		return data;
	},
	merge : function ()
	{
		var newKey, oldKey, oldEnd, oldInfo, newInfo, mergeInfo, diff;
		oldEnd = this.allyInfo.oldCount;
		for (newKey in this.newMembersInfo)
		{
			newInfo = this.newMembersInfo[newKey];
			for (oldKey = 0; oldKey < oldEnd; oldKey++)
			{
				oldInfo = this.oldMembersInfo[oldKey];
				if (
					(oldInfo.noPartner)&&
					(
						(
							(oldInfo.id >= 0)&&
							(oldInfo.id == newInfo.id)
						)||
						(oldInfo.name  == newInfo.name)||
						(oldInfo.coord == newInfo.coord)
					)
				)
					break;
			}
			if (oldKey != oldEnd)
			{
				this.oldMembersInfo[oldKey].noPartner = false;
				this.newMembersInfo[newKey].noPartner = false;
				if (newInfo.score == 0)
				{
					this.to0MembersInfo.push({
						name   : newInfo.name,
						score  : i18n.number(oldInfo.score),
						reason : _('o_bdg')
					});
				}
				else if (oldInfo.score == 0)
				{
					this.from0MembersInfo.push({
						name   : newInfo.name,
						score  : i18n.number(newInfo.score),
						reason : _('o_bdq')
					});
				}
				else
				{
					diff = Calc.diffScore(oldInfo.score, newInfo.score);
					mergeInfo = {
						name        : newInfo.name,
						oldScore    : oldInfo.score,
						newScore    : newInfo.score,
						oldPos      : oldInfo.pos,
						newPos      : newInfo.pos,
						diffPos     : oldInfo.pos-newInfo.pos,
						diffScore   : diff.score,
						diffPercent : diff.percent
					};
					mergeInfo.formatted = {
						oldScore  : i18n.number(mergeInfo.oldScore),
						newScore  : i18n.number(mergeInfo.newScore),
						oldPos    : i18n.number(mergeInfo.oldPos.toFixed()),
						newPos    : i18n.number(mergeInfo.newPos.toFixed()),
						diffPos   : ((mergeInfo.diffPos<0)?'':'+')+
							i18n.number(mergeInfo.diffPos.toFixed()),
						diffScore : ((mergeInfo.diffScore<0)?'':'+')+
							i18n.number(mergeInfo.diffScore.toFixed()),
						diffPercent : ((mergeInfo.diffPercent<0)?'':'+')+
							i18n.number(mergeInfo.diffPercent.toFixed(2))
					}
					this.membersInfo.push(mergeInfo);
				}
			}
		}
		var info, key;
		for (key in this.newMembersInfo)
		{
			info = this.newMembersInfo[key];
			if(info.noPartner)
			{
				this.from0MembersInfo.push({
					name   : info.name,
					score  : i18n.number(info.score),
					reason : _('o_cnm')
				});
			}
		}
		for (key in this.oldMembersInfo)
		{
			info = this.oldMembersInfo[key];
			if(info.noPartner)
			{
				this.to0MembersInfo.push({
					name   : info.name,
					score  : i18n.number(info.score),
					reason : _('o_cla')
				});
			}
		}
		
		this.to0MembersInfo.sort(function(a,b){
			return parseInt(a.score)-parseInt(b.score);
		});
		this.from0MembersInfo.sort(function(a,b){
			return parseInt(b.score)-parseInt(a.score);
		});
		
		delete this.oldMembersInfo;
		delete this.newMembersInfo;
		
		diff = Calc.diffScore(this.allyInfo.oldScore, this.allyInfo.newScore);
		this.allyInfo.diffScore   = diff.score;
		this.allyInfo.diffPercent = diff.percent;
		this.allyInfo.oldMemberScore =
			this.allyInfo.oldScore / this.allyInfo.oldCount;
		this.allyInfo.newMemberScore =
			this.allyInfo.newScore / this.allyInfo.newCount;
		diff = Calc.diffScore(this.allyInfo.oldMemberScore, this.allyInfo.newMemberScore);
		this.allyInfo.diffMemberScore   = diff.score;
		this.allyInfo.diffMemberPercent = diff.percent;
		
		this.allyInfo.formatted =
		{
			oldScore        : i18n.number(this.allyInfo.oldScore),
			newScore        : i18n.number(this.allyInfo.newScore),
			diffScore       : ((this.allyInfo.diffScore<0)?'':'+')+
				i18n.number(this.allyInfo.diffScore.toFixed()),
			diffPercent     : ((this.allyInfo.diffPercent<0)?'':'+')+
				i18n.number(this.allyInfo.diffPercent.toFixed(2)),
			
			oldMemberScore    : i18n.number(this.allyInfo.oldMemberScore.toFixed()),
			newMemberScore    : i18n.number(this.allyInfo.newMemberScore.toFixed()),
			diffMemberScore   : ((this.allyInfo.diffMemberScore<0)?'':'+')+
				i18n.number(this.allyInfo.diffMemberScore.toFixed()),
			diffMemberPercent : ((this.allyInfo.diffMemberPercent<0)?'':'+')+
				i18n.number(this.allyInfo.diffMemberPercent.toFixed(2))
		};
	},
	
	doIt : function (form)
	{
		form.setStats();
		form.setPreview();
		format.select(parseInt(form.selectFormat.selectedIndex));
		colors.select(parseInt(form.selectColors.selectedIndex));
		form.setOkStatus(_('w_pcs')+'...');
		this.reset();
		var data, title, oldListError = false;
		if (form.oldList.value.trim()=='')
		{
			form.setErrorStatus(_('e_nod'));
			form.setTitle('old', _('e_ndt'), false);
			oldListError = true;
		}
		if (!oldListError) try
		{
			data = this.readData(form.oldList.value,'old');
			title = data.strDate+
				' (<i>'+data.strTime+'</i>) &rarr; '+
				((ogameInfo.timestamp==data.timestamp)
					? _('p_now')
					: _('p_ago').replace(
						'{period}',
						i18n.period(ogameInfo.timestamp-data.timestamp)
					));
			if (this.oldMembersInfo.length==0||/NaN|undefined/.test(title))
				throw 0;
			form.setTitle('old',title,true);
		}
		catch (e)
		{
			form.setTitle('old', _('e_wft'), false);
			form.setErrorStatus(_('e_odf'));
			oldListError = true;
		}
		if (form.newList.value.trim()=='')
		{
			form.setErrorStatus(_('e_nnd'));
			form.setTitle('new', _('e_ndt'), false);
			return;
		}
		try
		{
			data = this.readData(form.newList.value,'new');
			title = data.strDate+
				' (<i>'+data.strTime+'</i>) &rarr; '+
				((ogameInfo.timestamp==data.timestamp)
					? _('p_now')
					: _('p_ago').replace(
						'{period}',
						i18n.period(ogameInfo.timestamp-data.timestamp)
					));
			if (this.newMembersInfo.length==0||/NaN|undefined/.test(title))
				throw 0;
			form.setTitle('new',title,true);
			if(oldListError) return;
		}
		catch (e)
		{
			form.setErrorStatus(_('e_ndf'));
			return;
		}
		try
		{
			this.merge();
			/*if (/NaN|Infinity/.test(
				this.allyInfo.formatted.diffScore +
				this.allyInfo.formatted.diffPercent
			)){
				throw 'NaN|Infinity';
			}*/
			var include = {
				alliance      : form.doAlliance.checked,
				top3Score     : form.doTop3Score.checked,
				top3Percent   : form.doTop3Percent.checked,
				top3Positions : form.doTop3Positions.checked,
				score         : form.doScore.checked,
				percent       : form.doPercent.checked,
				positions     : form.doPositions.checked,
				special       : form.doSpecial.checked,
				data          : form.doData.checked
			};
			form.setStats(format.format(
				include,
				this.allyInfo,
				this.membersInfo,
				this.to0MembersInfo,
				this.from0MembersInfo,
				form.newList.value.trim()
			));
			include.data = false;
			format.select(format.formats.length-1);
			colors.select(0);
			form.setPreview(format.format(
				include,
				this.allyInfo,
				this.membersInfo,
				this.to0MembersInfo,
				this.from0MembersInfo,
				form.newList.value.trim()
			).replaceAll(
				format.selected.patterns['[size=small]'],'<span>'
			).replaceAll(
				format.selected.patterns['[size=big]'],'<span style="font-size:20px">'
			));
			form.setOkStatus(_('w_dne'));
		}
		catch (e)
		{
			form.setErrorStatus(_('e_unk')+': '+e);
		}
	}
}

var conversor = new Conversor();

// DOM

var Dom = function(){}

Dom.prototype =
{
	addTextarea : function (parent)
	{
		var ta = doc.createElement('textarea');
		ta.setAttribute('cols','120');
		ta.setAttribute('rows','40');
		ta.setAttribute('class','textBox');
		parent.appendChild(ta);
		return ta;
	},
	addSelect : function (parent)
	{
		var s = doc.createElement('select');
		s.setAttribute('class','dropdown');
		parent.appendChild(s);
		return s;
	},
	addOption : function (text, value, parent)
	{
		var option = doc.createElement('option');
		option.appendChild(doc.createTextNode(text));
		option.setAttribute('value',value);
		parent.appendChild(option);
		return option;
	},
	addAnchor : function (parent, text)
	{
		var a = doc.createElement('a');
		a.setAttribute('href','javascript:void(0);');
		a.appendChild(doc.createTextNode(text));
		parent.appendChild(a);
		return a;
	},
	addTitle : function (parent, text)
	{
		//var b = doc.createElement('span');
		var b = doc.createElement('b');
		b.appendChild(doc.createTextNode(text));
		//b.setAttribute('style','display:block;color:#6F9FC8;font-size:12px');
		b.setAttribute('style','display:block;font-size:12px');
		parent.appendChild(b);
		return b;
	},
	newCell : function () {
		var td = doc.createElement('td');
		return td;
	},
	addText : function (parent, text)
	{
		var t = doc.createTextNode(text);
		parent.appendChild(t);
		return t;
	},
	addBr : function (parent)
	{
		parent.appendChild(doc.createElement('br'));
	},
	addEvent : function (node, event, func)
	{
		node.addEventListener(event, func, false);
	},
	addOnChange : function (node, func)
	{
		node.addEventListener('change', func, false);
		node.addEventListener('keyup' , func, false);
	},
	addCheckbox : function (parent, text, id, def, func)
	{
		var cb = doc.createElement('input');
		cb.setAttribute('type','checkbox');
		cb.setAttribute('id',script.name+'_'+id);
		cb.setAttribute('style','cursor:pointer;');
		parent.appendChild(cb);
		var label = doc.createElement('label');
		label.setAttribute('for',script.name+'_'+id);
		label.setAttribute('style','cursor:pointer;');
		label.innerHTML='&nbsp;'+text;
		parent.appendChild(label);
		this.addBr(parent);
		var checked = storage.get(id);
		cb.checked = (checked==null)
			? def
			: (parseInt(checked)==1);
		storage.set(id,(cb.checked)?1:0);
		cb.addEventListener('change', function()
			{
				storage.set(id,(cb.checked)?1:0);
				func();
			}
			,false
		);
		label.addEventListener('mouseover',function()
			{label.setAttribute('class','undermark');},
			false
		);
		label.addEventListener('mouseout',function()
			{label.removeAttribute('class');},
			false
		);
		return cb;
	},
	makeTogleable : function (elHide,buttonContainer,bar)
	{
		var a = doc.createElement('a');
		a.setAttribute('href','javascript:void(0);');
		a.setAttribute('class',script.name+'_toggle_button');
		var el = elHide;
		var isOpen = true;
		var open = function()
		{
			isOpen = true;
			el.removeAttribute('style');
			bar.setAttribute('class',bar.getAttribute('class').replace(
				'_toggle_bar_open', '_toggle_bar_close'
			));
		}
		var close = function()
		{
			isOpen = false;
			el.setAttribute('style','display:none;');
			bar.setAttribute('class',bar.getAttribute('class').replace(
				'_toggle_bar_close', '_toggle_bar_open'
			));
		}
		var toggle = function()
		{
			if (isOpen)
				close();
			else
				open();
		}
		bar.setAttribute('class',bar.hasAttribute('class')
			? bar.getAttribute('class')+' '+script.name+'_toggle_bar_close'
			: script.name+'_toggle_bar_close'
		);
		bar.addEventListener('click',toggle,false);
		toggle();
		buttonContainer.setAttribute('style','position:relative;');
		buttonContainer.appendChild(a);
		return {
			open:open,
			close:close,
			toggle:toggle
		}
	},
	addCss : function (css)
	{
		var text;
		/*if (typeof css == "object")
		{
			var selector, property;
			text = '';
			for (selector in css)
			{
				text = text + selector + '{';
				for (property in css[selector])
					text = text + property +':'+ css[selector][property] +' !important;';
				text = text + '}';
			}	
		}
		else*/
			text = css;
		
		var el = doc.createElement('style');
		el.setAttribute('type','text/css');
		
		if (el.styleSheet)
			el.styleSheet.cssText = text;
		else
			el.appendChild(doc.createTextNode(text));
		
		var head = doc.getElementsByTagName("head")[0];
		head.appendChild(el);
	}
}

var dom = new Dom();
dom.addCss
(
	'#'+script.name+' textarea'+
	'{'+
		'width: 350px !important;'+
		'height: 70px !important;'+
		'margin: 0 !important;'+
		'padding: 5px !important;'+
	'}'+
	'#'+script.name+' a'+
	'{'+
		'display: block !important;'+
		'padding: 5px 0 0 0 !important;'+
	'}'+
	'#'+script.name+' select'+
	'{'+
		'width: 250px !important;'+
	'}'+
	'#'+script.name+' td'+
	'{'+
		'padding: 5px !important;'+
		'text-align: left !important;'+
	'}'+
	'#'+script.name+' td.col2'+
	'{'+
		'width: 364px !important;'+
	'}'+
	'#'+script.name+' tr.tit td'+
	'{'+
		'line-height: 18px !important;'+
	'}'+
	'#'+script.name+'_preview'+
	'{'+
		'color: #6F9FC8 !important;'+
		'border-top: 2px dotted #242E38 !important;'+
		'padding-top: 15px !important;'+
	'}'+
	'#'+script.name+'_preview a'+
	'{'+
		'display: inline !important;'+
		'padding: 0 !important;'+
	'}'+
	'.'+script.name+'_toggle_button'+
	'{'+
		'background-color: transparent !important;'+
		'background-image: url(\'http://gf2.geo.gfsrv.net/cdn71/fc7a8ede3499a0b19ea17613ff0cb1.gif\') !important;'+
		'display  : block !important;'+
		'position : absolute !important;'+
		'top      : 0 !important;'+
		'right    : 0 !important;'+
		'height   : 13px !important;'+ // 18 - 5
		'width    : 20px !important;'+
	'}'+
	'.'+script.name+'_toggle_bar_open,' +
	'.'+script.name+'_toggle_bar_close' +
	'{'+
		'cursor: pointer !important;'+
	'}'+
	'.'+script.name+'_toggle_bar_open .'+script.name+'_toggle_button'+
	'{'+
		'background-position: 0 0 !important;'+
	'}'+
	'.'+script.name+'_toggle_bar_close .'+script.name+'_toggle_button'+
	'{'+
		'background-position: 0 -18px !important;'+
	'}'+
	'.'+script.name+'_toggle_bar_open:hover .'+script.name+'_toggle_button'+
	'{'+
		'background-position: -20px 0 !important;'+
	'}'+
	'.'+script.name+'_toggle_bar_close:hover .'+script.name+'_toggle_button'+
	'{'+
		'background-position: -20px -18px !important;'+
	'}'
);

// form

var Form = function (parent)
{	
	var tbody, tr, td, a, _this, key, index, doIt, toggleCont, toggleBar;
	_this = this;
	
	doIt = function(){_this.doIt();}
	
	var useToggles = /WebKit|Gecko|Presto/i.test(win.navigator.userAgent);
	
	// table
	
	this.table = doc.createElement('table');
	this.table.setAttribute('cellpadding','0');
	this.table.setAttribute('cellspacing','0');
	this.table.setAttribute('class','members bborder');
	this.table.setAttribute('style','width:90%;');
	parent.appendChild(this.table);
	
	// tbody
	
	tbody = doc.createElement('tbody');
	this.table.appendChild(tbody);
	
	// old data title row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	dom.addTitle(td,_('t_odt')+':');
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	toggleCont = doc.createElement('div');
	this.oldTitle = doc.createElement('span');
	toggleCont.appendChild(this.oldTitle);
	td.appendChild(toggleCont);
	tr.appendChild(td);
	toggleBar = tr;
	
	// old data content row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	a = dom.addAnchor(td,_('b_sel'));
	a.addEventListener('click', function(){_this.oldList.select();}, false);
	a = dom.addAnchor(td,_('b_del'));
	a.addEventListener('click', function(){_this.setOldList();}, false);
	a = dom.addAnchor(td,_('b_loa'));
	a.addEventListener('click', function(){_this.load();}, false);
	a = dom.addAnchor(td,_('b_sav'));
	a.addEventListener('click', function(){_this.save('old');}, false);
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.oldList = dom.addTextarea(td);
	dom.addOnChange(this.oldList, doIt, false);
	tr.appendChild(td);
	if (useToggles) dom.makeTogleable(tr,toggleCont,toggleBar);
	
	// new data title row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	dom.addTitle(td,_('t_ndt')+':');
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	toggleCont = doc.createElement('div');
	this.newTitle = doc.createElement('span');
	toggleCont.appendChild(this.newTitle);
	td.appendChild(toggleCont);
	tr.appendChild(td);
	toggleBar = tr;
	
	// new data content row
	
	tr = doc.createElement('tr');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	a = dom.addAnchor(td,_('b_sel'));
	a.addEventListener('click', function(){_this.newList.select();}, false);
	a = dom.addAnchor(td,_('b_del'));
	a.addEventListener('click', function(){_this.setNewList();}, false);
	a = dom.addAnchor(td,_('b_get'));
	a.addEventListener('click', function(){_this.setNewListFromPage();}, false);
	a = dom.addAnchor(td,_('b_sav'));
	a.addEventListener('click', function(){_this.save('new');}, false);
	a.setAttribute('title',_('b_svt'));
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.newList = dom.addTextarea(td);
	dom.addOnChange(this.newList, doIt, false);
	tr.appendChild(td);
	if (useToggles) dom.makeTogleable(tr,toggleCont,toggleBar);
	
	// forum type
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	dom.addTitle(td,_('t_fmt')+':');
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.selectFormat = dom.addSelect(td);
	for (key in format.formats)
		dom.addOption(format.formats[key].name, key, this.selectFormat);
	index = storage.get('selectFormat');
	this.selectFormat.selectedIndex = (index==null) ? 0 : parseInt(index);
	this.selectFormat.addEventListener('change', function()
	{
		storage.set('selectFormat', _this.selectFormat.selectedIndex+'');
		doIt();
	},
	false);
	tr.appendChild(td);
	
	// color profile
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	dom.addTitle(td,_('t_col')+':');
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.selectColors = dom.addSelect(td);
	for (key in colors.names)
		dom.addOption(colors.names[key], key, this.selectColors);
	index = storage.get('selectColors');
	this.selectColors.selectedIndex = (index==null) ? 0 : parseInt(index);
	this.selectColors.addEventListener('change', function()
	{
		storage.set('selectColors', _this.selectColors.selectedIndex+'');
		doIt();
	},
	false);
	tr.appendChild(td);
	
	// sections title row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	td.setAttribute('colspan','2');
	td.setAttribute('class','col2');
	toggleCont = doc.createElement('div');
	dom.addTitle(toggleCont,_('t_inc')+':');
	td.appendChild(toggleCont);
	tr.appendChild(td);
	toggleBar = tr;
	
	// sections content row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt');
	tbody.appendChild(tr);
	
	tr.appendChild(dom.newCell());
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.doAlliance = dom.addCheckbox(td,_('o_tas'),'doAlliance',true,doIt);
	this.doTop3Score = dom.addCheckbox(td,_('o_tts'),'doTop3Score',true,doIt);
	this.doTop3Percent = dom.addCheckbox(td,_('o_ttp'),'doTop3Percent',true,doIt);
	this.doTop3Positions = dom.addCheckbox(td,_('o_ttg'),'doTop3Positions',false,doIt);
	this.doScore = dom.addCheckbox(td,_('o_trs'),'doScore',true,doIt);
	this.doPercent = dom.addCheckbox(td,_('o_trp'),'doPercent',true,doIt);
	this.doPositions = dom.addCheckbox(td,_('o_trg'),'doPositions',false,doIt);
	this.doSpecial = dom.addCheckbox(td,_('o_tsc'),'doSpecial',true,doIt);
	this.doData = dom.addCheckbox(td,_('o_ldt'),'doData',true,doIt);
	tr.appendChild(td);
	if (useToggles) dom.makeTogleable(tr,toggleCont,toggleBar);
	
	// forum code title row
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	td.setAttribute('colspan','2');
	td.setAttribute('class','col2');
	toggleCont = doc.createElement('div');
	dom.addTitle(toggleCont,_('t_out')+':');
	td.appendChild(toggleCont);
	tr.appendChild(td);
	toggleBar = tr;
	
	// forum code content row
	
	tr = doc.createElement('tr');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	a = dom.addAnchor(td,_('b_sel'));
	a.addEventListener('click', function(){_this.stats.select();}, false);
	tr.appendChild(td);
	
	td = dom.newCell();
	td.setAttribute('class','col2');
	this.stats = dom.addTextarea(td);
	this.stats.setAttribute('readonly','readonly');
	this.stats.addEventListener('click', function(){_this.stats.select();}, false);
	tr.appendChild(td);
	if (useToggles) dom.makeTogleable(tr,toggleCont,toggleBar).open();
	
	// status line
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','alt tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	dom.addTitle(td,_('t_stb')+':');
	tr.appendChild(td);
	
	this.statusLine = (td = dom.newCell());
	td.setAttribute('class','col2');
	this.statusText = dom.addText(td,'');
	tr.appendChild(td);
	
	// preview
	
	tr = doc.createElement('tr');
	tr.setAttribute('class','tit');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	td.setAttribute('colspan','2');
	td.setAttribute('class','col2');
	toggleCont = doc.createElement('div');
	dom.addTitle(toggleCont,_('t_pre')+':');
	td.appendChild(toggleCont);
	tr.appendChild(td);
	toggleBar = tr;
	
	tr = doc.createElement('tr');
	tbody.appendChild(tr);
	
	td = dom.newCell();
	td.setAttribute('colspan','2');
	td.setAttribute('id',script.name+'_preview');
	tr.appendChild(td);
	if (useToggles) dom.makeTogleable(tr,toggleCont,toggleBar).open();
	this.preview = td;
	this.previewRow = tr;
	this.setPreview();
}

Form.prototype =
{
	load : function ()
	{
		this.setOldList(storage.get('oldData'));
	},
	save : function (oldNew)
	{
		storage.set('oldData',this[oldNew+'List'].value);
	},
	setOldList : function (text)
	{
		if(arguments.length>0)
			this.oldList.value=text;
		else
			this.oldList.value='';
		this.doIt();
	},
	setNewList : function (text)
	{
		if(arguments.length>0)
			this.newList.value=text;
		else
			this.newList.value='';
		this.doIt();
	},
	setStats : function (text)
	{
		if(arguments.length>0)
			this.stats.value=text;
		else
			this.stats.value='';
	},
	setPreview : function (html)
	{
		if(arguments.length>0)
			this.preview.innerHTML = html;
		else
			this.preview.innerHTML = '';
	},
	setNewListFromPage : function ()
	{
		if (this.currentPageData)
		{
			this.setNewList(this.currentPageData);
			return;
		}
		
		var clock = doc.getElementById('OGameClock'); // ogame<5 compatibility
                if (clock==null)
                    clock = doc.querySelector('li.OGameClock');
		var data =
		{	
			timestamp : ogameInfo.timestamp,
			strDate : i18n.date(clock.innerHTML.split('<')[0]),
			strTime : i18n.time(clock.getElementsByTagName('span')[0].innerHTML),
			members : {}
		};
			
		var memberList = doc.getElementById('member-list');
		var trs =
			memberList.getElementsByTagName('tbody')[0
			].getElementsByTagName('tr');
		
		for (var i=0; i<trs.length; i++)
		{
			var tds = trs[i].getElementsByTagName('td');
			
			var user = tds[0].innerHTML.trim();
			
			var rank;
			var sel = tds[2].getElementsByTagName('select');
			if(sel.length > 0)
				rank = sel[0].options[sel[0].selectedIndex].innerHTML;
			else
				rank = tds[2].innerHTML;
			rank = rank.trim();
			
			var score = tds[3].getElementsByTagName('span');
                        if (score.length > 0)
                            score = score[0]; // ogame<5 compatibility
                        else
                            score = tds[3];
			var position = score.getElementsByTagName('a')[0];
			score = score.getAttribute('title');
			score = parseInt(score.replace(/\D/gi,''));
			var id = position.getAttribute('href');
			id = parseInt(id.replace(/^.*searchRelId\=(\d+)(\D.*)?$/,'$1'));
			position = parseInt(position.innerHTML.replace(/\D/gi,''));
			
			var coord = tds[4].getElementsByTagName('a')[0].innerHTML;
			coord = coord.replace(/[^\d\:]/gi,'');
			
			var date = i18n.date(tds[5].innerHTML);
			
			data.members[user]=
			{
				i: id,
				r: rank,
				s: score,
				p: position,
				c: coord,
				d: date
			};
			
			var info = data.members[user];
			if (
				/NaN|undefined|null/.test(info.i+'') ||
				(info.r) == null || typeof info.r == 'undefined' ||
				/NaN|undefined|null/.test(info.s+'') ||
				/NaN|undefined|null/.test(info.p+'') ||
				(!(/^\d+\:\d+\:\d+$/.test(info.c+''))) ||
				(info.d) == null || typeof info.r == 'undefined'
			)
			{
				return false;
			}
		}
		this.currentPageData = JSON.stringify(data);
		this.setNewList(this.currentPageData);
		return true;
	},
	setErrorStatus : function (text)
	{
		this.statusText.nodeValue = '';
		this.statusLine.setAttribute('class','overmark');
		if(arguments.length>0)
			this.statusText.nodeValue = text;
	},
	setOkStatus : function (text)
	{
		this.statusText.nodeValue = '';
		this.statusLine.setAttribute('class','undermark');
		if(arguments.length>0)
			this.statusText.nodeValue = text;
	},
	setTitle : function (oldNew, html, success)
	{
		this[oldNew+'Title'].setAttribute(
			'class',(success)?'undermark':'overmark');
		this[oldNew+'Title'].innerHTML = html;
	},
	doIt : function ()
	{	
		conversor.doIt(this);
	}
}

var Section = function(parent)
{
	var _this = this;
	
	// section title
	
	this.section = doc.createElement('div');
	this.section.setAttribute('class','section');
	var h3 = doc.createElement('h3');
	var span = doc.createElement('span');
	this.button = doc.createElement('a');
	this.button.setAttribute('class','closed'); // toggle -> opened
	this.button.setAttribute('href','javascript:void(0);');
	this.button.addEventListener('click', function(){_this.toggle();}, false);
	
	dom.addText(span, script.name);
	this.button.appendChild(span);
	h3.appendChild(this.button);
	this.section.appendChild(h3);
	parent.appendChild(this.section);
	
	// section content
	
	this.sectioncontent = doc.createElement('div');
	this.sectioncontent.setAttribute('class','sectioncontent');
	this.sectioncontent.setAttribute('id',script.name);
	this.sectioncontent.setAttribute('style','display:none;');
	this.content = doc.createElement('div');
	this.content.setAttribute('class','contentz');
	var footer = doc.createElement('div');
	footer.setAttribute('class','footer');
	
	this.sectioncontent.appendChild(this.content);
	this.sectioncontent.appendChild(footer);
	parent.appendChild(this.sectioncontent);
	
	// form (load on demand)
	
	this.form = null;
	this.canLoad = true;
	this.wTime = 30;
	this.toggleTimer = null;
}

var offset = function (obj)
{
	var l=0,t=0;
	if (obj.offsetParent) do
	{
		l += obj.offsetLeft;
		t += obj.offsetTop;
	}
	while (obj = obj.offsetParent);
	return {l:l,t:t};
}

Section.prototype =
{
	loadForm : function()
	{
		this.canLoad = false;
		try
		{
			var memberList = doc.getElementById('allyMemberlist');
			memberList = memberList.getElementsByTagName('div')[0];
			if (!memberList) throw 0;
		}
		catch (e)
		{
			this.wTime = Math.round(this.wTime*1.1);
			var _this = this;
			setTimeout(function(){_this.loadForm();}, this.wTime);
			return;
		}
		
		this.form = new Form (this.content);
		this.form.setErrorStatus(_('e_nod'));
		if (!this.form.setNewListFromPage())
		{
			this.sectioncontent.innerHTML =
				'<div style="color:red;text-align:center;font-weigth:bold;padding:30px">'+
				_('e_oga')+
				'</div>';
		}
		this.form.load();
		if (this.form.oldList.value=='')
		{
			this.form.save('new');
			this.form.load();
		}
	},
	toggle : function()
	{
		if (this.canLoad)
			this.loadForm();
		
		if (this.button.getAttribute('class')=='closed')
		{
			this.button.setAttribute('class','opened');
			this.sectioncontent.setAttribute('style','display:block;');
			var o = offset(this.section);
			for (var i=10; i<=100; i+=30)
				setTimeout(function(){try{win.scroll(o.l,o.t);}catch(e){}},i);
		}
		else
		{
			this.button.setAttribute('class','closed');
			this.sectioncontent.setAttribute('style','display:none;');
		}
	}
}

script.domWait = 30;
script.domLoader = function()
{
	clearTimeout(this.domTimer);
	if (doc.getElementById('allyInternText'))
	{
		delete this.dom;
		this.dom = new Section(doc.getElementById('eins'));
	}
	else
	{
		this.domWait = Math.round(this.domWait*1.1);
		this.domTimer = setTimeout(function()
		{
			script.domLoader();
		},
		this.domWait);
	}
}

script.init = function()
{
	this.domLoader();
	try
	{
		doc.querySelector("a.navi.overview").addEventListener(
			'click',
			function()
			{
				script.domWait = 30;
				script.domLoader();
			},
			false
		);
		var save = doc.querySelector("#form_assignRank a.save_bigger");
		if (save)
			save.addEventListener(
				'click',
				function()
				{
					script.domWait = 30;
					script.domTimer = setTimeout(function()
					{
						script.domLoader();
					},
					500);
				},
				false
			);
	}
	catch(e){}
}

script.init();

//////////////////////////////////
//                              //
//   END onDOMContentLoaded()   //
//                              //
//////////////////////////////////
}

// Dean Edwards/Matthias Miller/John Resig
var init = function()
{
	// quit if this function has already been called
	if (arguments.callee.done) return;

	// flag this function so we don't do the same thing twice
	arguments.callee.done = true;

	// kill the timer
	if (_timer) clearInterval(_timer);

	// do stuff
	onDOMContentLoaded();
};

/* for Mozilla/Opera9 */
if (doc.addEventListener)
	doc.addEventListener("DOMContentLoaded", init, false);

/* for Safari */
if (/WebKit/i.test(win.navigator.userAgent)) { // sniff
	var _timer = setInterval(
		function()
		{
			if (/loaded|complete/.test(doc.readyState))
				init(); // call the onload handler
		},
		10
	);
}

/* for other browsers */
win.onload = init;

})();