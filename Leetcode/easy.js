/**
 * judge anagram
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
var isAnagram = function(s, t) {
    var sLen = s.length,
        tLen = t.length;
    if(sLen != undefined && tLen != undefined && sLen === tLen){
        var indexs = [];
        for(var i=0;i < sLen;i++) indexs.push(i);
        for(var i=0;i < sLen;i++){
            for(var j = 0,len = indexs.length;j < len;j ++){
                if(s[i] === t[indexs[j]]){
                    indexs.splice(j,1);
                    break;
                }
            }
        }
        if(indexs.length === 0) return true;
    }
    return false;
};
