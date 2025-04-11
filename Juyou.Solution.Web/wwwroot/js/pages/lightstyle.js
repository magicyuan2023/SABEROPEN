
function showStyle(id,type)
{   
    var url = location.origin;
    var height = "200px";
    url += "/Styles/ShowStyle?id=" + id;
    
    layer.open({
        type: 2,
        title: "Show Style",
        shadeClose: false,
        // shade: 0.8,
        area: ['960px', height],
        content: url,
        success: function (layero) {
            var mask = $(".layui-layer-shade");
            mask.appendTo(layero.parent());
            //其中：layero是弹层的DOM对象
        }
    });
}

function downloadStyleData(id,name, desc) {
    var url = location.origin + "/api/styles/DownloadData?id=" + id;
    window.open(url,"_blank");
    downloadObject(name + "_readme.txt", desc, "text/plain");
}


function getVersionName(type) {
    switch (type) {
        case 64:
            return "Pro";
     
    }
}