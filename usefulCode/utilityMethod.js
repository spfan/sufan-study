/**
 *  获取字符串长度（区分半角、全角）
 **/
function getStringLength(str) {
  var totalLength = 0;
  var list = str.split("");
  for(var i = 0; i < list.length; i++) {
   var s = list[i];
   if (s.match(/[\u0000-\u00ff]/g)) { //半角
    totalLength += 1; 
   } else if (s.match(/[\u4e00-\u9fa5]/g)) { //中文
    totalLength += 2; 
   } else if (s.match(/[\uff00-\uffff]/g)) { //全角
    totalLength +=2;
   }
  }   
  return totalLength;
}

function binaryToSring(number, map, split){
    var arr = number.toString(2).split('');
    var split = split || '、';
    while( arr.length < keys(maps).length ) arr.unshift('0');
    arr = arr.map(function(e, i, a){
        return map[ e * Math.pow(2, a.length - i - 1) ];
    }).filter(function(e, i){
        return e;
    });
    return arr.join(split);
}

/**
*  jquery插件一般写法
*/
(function ($) {
	var Plugin = {};
	Plugin.prototype = {};

	$.fn.extend({
		pluginName: function(option) {
			var args = [].slice.call(arguments, 1);
			return this.each(function() {
				var ui = $._data(this, pluginName);
				if(!ui){
					var options = $.extend(true, {}, $.fn.pluginName.defaults, typeof options === 'object' ? option : {});
					ui = new Plugin(options);
					$._data(this. pluginName, ui);
				}
				if( typeof option === 'string' && typeof ui[option] === 'function' ){
					ui[option].apply(this, args);
				}
			});
			$.fn.pluginName.defaults = {};
		}
	});

})(jQuery)
