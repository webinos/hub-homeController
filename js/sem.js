/**
 * sem.js
 */
if (typeof sem === "undefined") {
	sem = {};
}

sem.deserialize = function(url){
	var result = {};
	var split = url.split('?');
	if (split.length>1) {
		var params = split[split.length-1];
		split = params.split('&');
		for ( var i in split) {
			var item = split[i].split("=");
			var name = decodeURIComponent(item[0]);
			var value = decodeURIComponent(item[1]);
			result[name]=value;
		}
	}
	return result;
};

sem.serialize = function(obj){
	var result = "";
	for ( var key in obj) {
		var value = encodeURIComponent(obj[key]);
		key = encodeURIComponent(key);
		if (result) {
			result += "&";
		}
		result += key+"="+value;
	}
	return result;
};