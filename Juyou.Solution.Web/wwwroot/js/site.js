// Write your Javascript code.

function getFormObj(formName, repairForm) {
	formName = "#" + formName;
	var obj = {};
	var formValues = $(formName).serializeArray();
	$.each(formValues, function (index) {
		var name = this['name'];
		var val = this["value"];
		if (name.indexOf('.') > 0) { //第二层
			var names = name.split('.');
			name = names[0];
			var subObj = obj[name];
			if (!subObj) {
				obj[name] = subObj = {};
			}
			name = names[1];
			if (subObj[name]) {
				subObj[name] += "," + val;
			}
			else {
				subObj[name] = val;
			}
		}
		else {
			if (obj[name]) {
				obj[name] += "," + val;
			} else {
				obj[name] = val;
			}
		}
	});
	if (repairForm != null) {
		obj = repairForm(obj);
	}

	return obj;
} 

function getQueryStringByName(name) {

	var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));

	if (result == null || result.length < 1) {

		return "";

	}

	return result[1];

}

function getQueryStringFromForm(formName) {
	formName = "#" + formName;
	var formValues = $(formName).serializeArray();
	var str = "";
	$.each(formValues, function (index) {
		var name = this['name'];
		var val = this["value"];
		str += name + "=" + val + "&";
	});
	if (str.length > 0) {
		str = str.slice(0, str.length - 1);
    }
	return str;
} 

function toThousands(num) {
	return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}

function getResourceUrl(url) {
	if (!url) {
		return "";
	}
	if (url.indexOf("http") == 0) {
		return url;
	}
	return "https://its-test.oss-cn-hangzhou.aliyuncs.com/" + url;
}


function showMedia(layer,url) {
	layer.open({
		type: 1,
		title: '媒介信息',
		shadeClose: false,
		shade: 0.8,
		area: ['600px', '90%'],
		content: getMediaContent(url)
	});	
}

function getMediaContent(url, width, height, vwidth, vheight) {
	if (!width) {
		width = 200;
	}
	if (!height) {
		height = 200;
	}
	if (!vwidth) {
		vwidth = 440;
	}
	if (!vheight) {
		vheight = 440;
	}
	var html = "";
	var isVideo = url.lastIndexOf('#video') > -1;
	if (isVideo) {
		var urlsStr = getResourceUrl(url);
		html = '<video controls style="width:' + vwidth + 'px;height:' + vheight + 'px;" controlslist="nodownload" object-fit="cover"; ><source src="' + urlsStr + '" type="video/mp4"></source></video>';
	}
	else {
		if (url && url.length > 0) {
			var arr = url.split(",");
			for (var i = 0; i < arr.length; i++) {
				var urlsStr = getResourceUrl(arr[i]);
				html += renderImageItem(urlsStr, width, height);
			}
		}
	}

	return '<div style="height:calc( 100% - 20px);margin:10px auto;text-align:center;">' + html + '</div>';
}

function renderImageItem(imgUrl, width, height) {

	return "<img style='padding:5px;width: " + width + "px; height: " + height + "px; margin - right: 5px; '  onclick='lookImage(this)' src='" + imgUrl + "'/>";
}


function lookImage(e) {
	window.open(e.src);
}


function downloadObject(fileName, data, minType) {

	var blob = new Blob([data], {
		type: minType
	})
	// 根据 blob生成 url链接
	var objectURL = URL.createObjectURL(blob)

	// 创建一个 a 标签Tag
	var aTag = document.createElement('a')
	// 设置文件的下载地址
	aTag.href = objectURL
	// 设置保存后的文件名称
	aTag.download = fileName;
	// 给 a 标签添加点击事件
	aTag.click()
	// 释放一个之前已经存在的、通过调用 URL.createObjectURL() 创建的 URL 对象。
	// 当你结束使用某个 URL 对象之后，应该通过调用这个方法来让浏览器知道不用在内存中继续保留对这个文件的引用了。
	URL.revokeObjectURL(objectURL);
}


function downloadiamge(img) {

	// 创建一个 a 标签Tag
	var aTag = document.createElement('a')
	// 设置文件的下载地址
	aTag.href = img
	// 设置保存后的文件名称
	aTag.download = "test.jpg";
	// 给 a 标签添加点击事件
	aTag.click()
}

