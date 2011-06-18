/**
 * Created by JetBrains PhpStorm.
 * User: Keyston
 * Date: 6/17/11
 * Time: 9:24 PM
 * To change this template use File | Settings | File Templates.
 */
var fs = require("fs");

var Density = exports.KeywordDensity = function() {
    this.options = {
        min_occurance:1,
        min_length:3
    };
    this.init();
}


Density.prototype.init = function() {
    var words = String(fs.readFileSync(__dirname + '/stop_words.txt'));
    words = words.split("\n");
    var i;


    this._words = [];
    for (i in words) {
        this._words.push(this.trim(words[i]));
    }
}


Density.prototype.compress = function(text) {
    while (text.indexOf('  ') != -1) text = text.replace("  ", " ");
    return text;
    //return text.replace(/\/\/.*?\n/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/[ \f\r\t\v\u00A0\u2028\u2029]+/g, ' ').replace(/\s*\n+/g, '\n').replace(/^\s+/gm, '').replace(/\s*$/gm, '');
}
Density.prototype.textOnly = function(text) {
    text = text.replace(/&[#0-9a-z]+/gi, '');
    var search = [/<script[^>]*?>.*?<\/script>/g,  // Strip out javascript
        /<style[^>]*?>.*?<\/style>/g,
        /<[/!]*?[^<>]*?>/g,          // Strip out HTML tags
        /*/([\\r\\n])[s]+/g,                // Strip out white space*/
        /&(quot|#34);/g,                // Replace HTML entities
        /&(amp|#38);/g,
        /&(lt|#60);/g,
        /&(gt|#62);/g,
        /&(nbsp|#160);/g,
        /&(iexcl|#161);/g,
        /&(cent|#162);/g,
        /&(pound|#163);/g,
        /&(copy|#169);/g,
        /&#(d+);/g];                   // evaluate as php
    var replace = ["",
        " ",
        " ",
        /*  "",*/
        "\"",
        "&",
        "<",
        ">",
        " ",
        String.fromCharCode(161),
        String.fromCharCode(162),
        String.fromCharCode(163),
        String.fromCharCode(169),
        " "];

    text = text.toLowerCase();

    text = text.replace(/\r|\n/g, " ")
    text = this.replace(text, search, replace);
    text = this.strip_tags(text);

    search = ['“','’','”','»'];
    replace = ['"',"'",'"',''];
    text = this.replace(text, search, replace);

    text = this.html_entity_decode(text);
    text = text.replace(/&[#0-9a-z]+/g, ' ');
    text = text.replace(/[^a-z]+/g, " ");
    text = text.replace(/[\W]+/g, "  ");

    text = this.compress(text);
    var buffer;
    for (i in this._words) {
        text = text.replace(new RegExp(" " + this._words[i] + " ", "g"), " ");
    }
    return this.compress(text);

    /**
     * Make sure to compress the file in some cases were the site is poorly
     * coded and has a lot of newline and carriage return's'
     * example: fortworthchamber.com ><
     */


}
Density.prototype.occurance = function(word, text) {

    var matches = text.match(new RegExp(word, "g"));

    if (matches) {

        return matches.length;
    }
    return 0;
}
Density.prototype.passes = function(word, count) {
    return (count >= this.options.min_occurance && word.length >= this.options.min_length);
}
Density.prototype.getDensity = function(text, level) {
    text = this.textOnly(text);
    var words = text.split(" ");

    var cleaned = [];
    for (var i in words) {
        if (words[i].length)cleaned.push(words[i]);
    }
    var obj;
    var tmp;
    var has = true;

    var hash = {};
    do{
        tmp = [];
        for (var i = 0; i < level; i++) {
            obj = this.each(cleaned);

            if (obj) {
                tmp.push(obj.value);
            } else {
                has = false;
                break;
            }
        }
        if (tmp.length) {
            tmp = tmp.join(" ");

            count = this.occurance(tmp, text);

            if (this.passes(tmp, count)) {

                hash[tmp] = count;
            }
            tmp = [];
        }
    } while (has);
    return hash;

}
Density.prototype.replace = function(text, search, replace) {
    var length = search.length;
    for (var i = 0; i < length; i++) {
        text = text.replace(search[i], replace[i]);
    }
    return text;
}

Density.prototype.get_html_translation_table = function (table, quote_style) {
    // http://kevin.vanzonneveld.net
    // +   original by: Philip Peterson
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: noname
    // +   bugfixed by: Alex
    // +   bugfixed by: Marco
    // +   bugfixed by: madipta
    // +   improved by: KELAN
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Frank Forte
    // +   bugfixed by: T.Wild
    // +      input by: Ratheous
    // %          note: It has been decided that we're not going to add global
    // %          note: dependencies to phDensity.prototype.js, meaning the constants are not
    // %          note: real constants, but strings instead. Integers are also supported if someone
    // %          note: chooses to create the constants themselves.
    // *     example 1: get_html_translation_table('HTML_SPECIALCHARS');
    // *     returns 1: {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}
    var entities = {},
            hash_map = {},
            decimal = 0,
            symbol = '';
    var constMappingTable = {},
            constMappingQuoteStyle = {};
    var useTable = {},
            useQuoteStyle = {};

    // Translate arguments
    constMappingTable[0] = 'HTML_SPECIALCHARS';
    constMappingTable[1] = 'HTML_ENTITIES';
    constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
    constMappingQuoteStyle[2] = 'ENT_COMPAT';
    constMappingQuoteStyle[3] = 'ENT_QUOTES';

    useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
    useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() : 'ENT_COMPAT';

    if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
        throw new Error("Table: " + useTable + ' not supported');
        // return false;
    }

    entities['38'] = '&amp;';
    if (useTable === 'HTML_ENTITIES') {
        entities['160'] = '&nbsp;';
        entities['161'] = '&iexcl;';
        entities['162'] = '&cent;';
        entities['163'] = '&pound;';
        entities['164'] = '&curren;';
        entities['165'] = '&yen;';
        entities['166'] = '&brvbar;';
        entities['167'] = '&sect;';
        entities['168'] = '&uml;';
        entities['169'] = '&copy;';
        entities['170'] = '&ordf;';
        entities['171'] = '&laquo;';
        entities['172'] = '&not;';
        entities['173'] = '&shy;';
        entities['174'] = '&reg;';
        entities['175'] = '&macr;';
        entities['176'] = '&deg;';
        entities['177'] = '&plusmn;';
        entities['178'] = '&sup2;';
        entities['179'] = '&sup3;';
        entities['180'] = '&acute;';
        entities['181'] = '&micro;';
        entities['182'] = '&para;';
        entities['183'] = '&middot;';
        entities['184'] = '&cedil;';
        entities['185'] = '&sup1;';
        entities['186'] = '&ordm;';
        entities['187'] = '&raquo;';
        entities['188'] = '&frac14;';
        entities['189'] = '&frac12;';
        entities['190'] = '&frac34;';
        entities['191'] = '&iquest;';
        entities['192'] = '&Agrave;';
        entities['193'] = '&Aacute;';
        entities['194'] = '&Acirc;';
        entities['195'] = '&Atilde;';
        entities['196'] = '&Auml;';
        entities['197'] = '&Aring;';
        entities['198'] = '&AElig;';
        entities['199'] = '&Ccedil;';
        entities['200'] = '&Egrave;';
        entities['201'] = '&Eacute;';
        entities['202'] = '&Ecirc;';
        entities['203'] = '&Euml;';
        entities['204'] = '&Igrave;';
        entities['205'] = '&Iacute;';
        entities['206'] = '&Icirc;';
        entities['207'] = '&Iuml;';
        entities['208'] = '&ETH;';
        entities['209'] = '&Ntilde;';
        entities['210'] = '&Ograve;';
        entities['211'] = '&Oacute;';
        entities['212'] = '&Ocirc;';
        entities['213'] = '&Otilde;';
        entities['214'] = '&Ouml;';
        entities['215'] = '&times;';
        entities['216'] = '&Oslash;';
        entities['217'] = '&Ugrave;';
        entities['218'] = '&Uacute;';
        entities['219'] = '&Ucirc;';
        entities['220'] = '&Uuml;';
        entities['221'] = '&Yacute;';
        entities['222'] = '&THORN;';
        entities['223'] = '&szlig;';
        entities['224'] = '&agrave;';
        entities['225'] = '&aacute;';
        entities['226'] = '&acirc;';
        entities['227'] = '&atilde;';
        entities['228'] = '&auml;';
        entities['229'] = '&aring;';
        entities['230'] = '&aelig;';
        entities['231'] = '&ccedil;';
        entities['232'] = '&egrave;';
        entities['233'] = '&eacute;';
        entities['234'] = '&ecirc;';
        entities['235'] = '&euml;';
        entities['236'] = '&igrave;';
        entities['237'] = '&iacute;';
        entities['238'] = '&icirc;';
        entities['239'] = '&iuml;';
        entities['240'] = '&eth;';
        entities['241'] = '&ntilde;';
        entities['242'] = '&ograve;';
        entities['243'] = '&oacute;';
        entities['244'] = '&ocirc;';
        entities['245'] = '&otilde;';
        entities['246'] = '&ouml;';
        entities['247'] = '&divide;';
        entities['248'] = '&oslash;';
        entities['249'] = '&ugrave;';
        entities['250'] = '&uacute;';
        entities['251'] = '&ucirc;';
        entities['252'] = '&uuml;';
        entities['253'] = '&yacute;';
        entities['254'] = '&thorn;';
        entities['255'] = '&yuml;';
    }

    if (useQuoteStyle !== 'ENT_NOQUOTES') {
        entities['34'] = '&quot;';
    }
    if (useQuoteStyle === 'ENT_QUOTES') {
        entities['39'] = '&#39;';
    }
    entities['60'] = '&lt;';
    entities['62'] = '&gt;';


    // ascii decimals to real symbols
    for (decimal in entities) {
        symbol = String.fromCharCode(decimal);
        hash_map[symbol] = entities[decimal];
    }

    return hash_map;
}
Density.prototype.html_entity_decode = function (string, quote_style) {
    // http://kevin.vanzonneveld.net
    // +   original by: john (http://www.jd-tech.net)
    // +      input by: ger
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: marc andreu
    // +    revised by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Ratheous
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // +      input by: Nick Kolosov (http://sammy.ru)
    // +   bugfixed by: Fox
    // -    depends on: get_html_translation_table
    // *     example 1: html_entity_decode('Kevin &amp; van Zonneveld');
    // *     returns 1: 'Kevin & van Zonneveld'
    // *     example 2: html_entity_decode('&amp;lt;');
    // *     returns 2: '&lt;'
    var hash_map = {},
            symbol = '',
            tmp_str = '',
            entity = '';
    tmp_str = string.toString();

    if (false === (hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style))) {
        return false;
    }

    // fix &amp; problem
    // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
    delete(hash_map['&']);
    hash_map['&'] = '&amp;';

    for (symbol in hash_map) {
        entity = hash_map[symbol];
        tmp_str = tmp_str.split(entity).join(symbol);
    }
    tmp_str = tmp_str.split('&#039;').join("'");

    return tmp_str;
}
Density.prototype.explode = function(delimiter, string, limit) {

// http://kevin.vanzonneveld.net
// +     original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +     improved by: kenneth
// +     improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// +     improved by: d3x
// +     bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// *     example 1: explode(' ', 'Kevin van Zonneveld');
// *     returns 1: {0: 'Kevin', 1: 'van', 2: 'Zonneveld'}
// *     example 2: explode('=', 'a=bc=d', 2);
// *     returns 2: ['a', 'bc=d']
    var emptyArray = {
        0: ''
    };

// third argument is not required
    if (arguments.length < 2 || typeof arguments[0] == 'undefined' || typeof arguments[1] == 'undefined') {
        return null;
    }

    if (delimiter === '' || delimiter === false || delimiter === null) {
        return false;
    }

    if (typeof delimiter == 'function' || typeof delimiter == 'object' || typeof string == 'function' || typeof string == 'object') {
        return emptyArray;
    }

    if (delimiter === true) {
        delimiter = '1';
    }

    if (!limit) {
        return string.toString().split(delimiter.toString());
    } else {
        // support for limit argument
        var splitted = string.toString().split(delimiter.toString());
        var partA = splitted.splice(0, limit - 1);
        var partB = splitted.join(delimiter.toString());
        partA.push(partB);
        return partA;
    }
}
Density.prototype.trim = function(str, charlist) {
    // http://kevin.vanzonneveld.net
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: mdsjack (http://www.mdsjack.bo.it)
    // +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
    // +      input by: Erkekjetter
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: DxGx
    // +   improved by: Steven Levithan (http://blog.stevenlevithan.com)
    // +    tweaked by: Jack
    // +   bugfixed by: Onno Marsman
    // *     example 1: trim('    Kevin van Zonneveld    ');
    // *     returns 1: 'Kevin van Zonneveld'
    // *     example 2: trim('Hello World', 'Hdle');
    // *     returns 2: 'o Wor'
    // *     example 3: trim(16, 1);
    // *     returns 3: 6
    var whitespace, l = 0,
            i = 0;
    str += '';

    if (!charlist) {
        // default list
        whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
    } else {
        // preg_quote custom list
        charlist += '';
        whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    }

    l = str.length;
    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i);
            break;
        }
    }

    l = str.length;
    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }

    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}
Density.prototype.each = function(arr) {
    // http://kevin.vanzonneveld.net
    // +   original by: Ates Goral (http://magnetiq.com)
    // +    revised by: Brett Zamir (http://brett-zamir.me)
    // %        note 1: Uses global: php_js to store the array pointer
    // *     example 1: each({a: "apple", b: "balloon"});
    // *     returns 1: {0: "a", 1: "apple", key: "a", value: "apple"}
    //  Will return a 4-item object unless a class property 'returnArrayOnly'
    //  is set to true on this function if want to only receive a two-item
    //  numerically-indexed array (for the sake of array destructuring in
    //  JavaScript 1.7+ (similar to list() in PHP, but as PHP does it automatically
    //  in that context and JavaScript cannot, we needed something to allow that option)
    //  See https://developer.mozilla.org/en/New_in_JavaScript_1.7#Destructuring_assignment
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function (value) {
        for (var i = 0, length = this.length; i < length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
        pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
        pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    var pos = 0;

    if (Object.prototype.toString.call(arr) !== '[object Array]') {
        var ct = 0;
        for (var k in arr) {
            if (ct === cursor) {
                pointers[arrpos + 1] += 1;
                if (this.returnArrayOnly) {
                    return [k, arr[k]];
                } else {
                    return {
                        1: arr[k],
                        value: arr[k],
                        0: k,
                        key: k
                    };
                }
            }
            ct++;
        }
        return false; // Empty
    }
    if (arr.length === 0 || cursor === arr.length) {
        return false;
    }
    pos = cursor;
    pointers[arrpos + 1] += 1;
    if (this.returnArrayOnly) {
        return [pos, arr[pos]];
    } else {
        return {
            1: arr[pos],
            value: arr[pos],
            0: pos,
            key: pos
        };
    }
}
Density.prototype.strip_tags = function (input, allowed) {
    // http://kevin.vanzonneveld.net
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Luke Godfrey
    // +      input by: Pul
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +      input by: Alex
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Marc Palau
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Eric Nagel
    // +      input by: Bobby Drake
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Tomasz Wesolowski
    // +      input by: Evertjan Garretsen
    // +    revised by: RafaÅ‚ Kukawski (http://blog.kukawski.pl/)
    // *     example 1: strip_tags('<p>Kevin</p> <br /><b>van</b> <i>Zonneveld</i>', '<i><b>');
    // *     returns 1: 'Kevin <b>van</b> <i>Zonneveld</i>'
    // *     example 2: strip_tags('<p>Kevin <img src="someimage.png" onmouseover="someFunction()">van <i>Zonneveld</i></p>', '<p>');
    // *     returns 2: '<p>Kevin van Zonneveld</p>'
    // *     example 3: strip_tags("<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>", "<a>");
    // *     returns 3: '<a href='http://kevin.vanzonneveld.net'>Kevin van Zonneveld</a>'
    // *     example 4: strip_tags('1 < 5 5 > 1');
    // *     returns 4: '1 < 5 5 > 1'
    // *     example 5: strip_tags('1 <br/> 1');
    // *     returns 5: '1  1'
    // *     example 6: strip_tags('1 <br/> 1', '<br>');
    // *     returns 6: '1  1'
    // *     example 7: strip_tags('1 <br/> 1', '<br><br/>');
    // *     returns 7: '1 <br/> 1'
    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
            commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
}
