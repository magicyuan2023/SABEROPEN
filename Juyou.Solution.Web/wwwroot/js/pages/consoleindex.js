var layer,  flow;
layui.use(['element', 'layer',  'flow','form'], function () {
    layer = layui.layer;
    form = layui.form;
    flow = layui.flow;
    form.on('select(type)', function (data) {
        var elem = data.elem; // 获得 select 原始 DOM 对象
        var value = data.value; // 获得被选中的值
        loadData(value);
    });
    loadData(0);
});

function loadData(type) {
    $("#lightstylelist").html("");
    flow.load({
        elem: '#lightstylelist' //流加载容器
        , scrollElem: '#lightstylelist' //滚动条所在元素，一般不用填，此处只是演示需要。
        , isAuto: true
        , isLazyimg:true
        ,end:"There's no more now"
        , done: function (page, next) { //执行下一页的回调
            var pageSize = 20;
            
            $.get("/api/styles/GetPublishedList?page=" + page + "&limit=" + pageSize + "&type=" + type, function (res) {
                if (res.code == 0) {
                    var lis = [];

                    //假设你的列表返回在data集合中
                    layui.each(res.data, function (index, item) {

                        var img = location.origin + "/" + item.img;
                        var cardDiv = "<div class='layui-row image'>";
                        cardDiv += "<img lay-src='" + img + "'  />";
                        cardDiv += "</div>";

                       

                        cardDiv += "<div  id='div_name_" + item.id + "'class='layui-row title'>";
                        cardDiv += item.name ;
                        cardDiv += "</div>";

                        cardDiv += "<div id='div_desc_" + item.id + "' class='layui-row desc'>";
                        cardDiv += item.desc;
                        cardDiv += "</div>";

                        cardDiv += "<div class='layui-row owner'>";
                        cardDiv += "<span class='left'>" + getVersionName(item.type) + "</span>" + "<span class='right'>Author: " + item.owner + "</span>";
                        cardDiv += "</div>";

                        cardDiv += "<div class='layui-row operation'>";
                        cardDiv += "<a href='javascript:' onclick='showStyle(" + item.id +"," + item.type + ")'>Demonstrate</a>";
                        cardDiv += "<a href='javascript:' onclick='downloadData(" + item.id + ")'>Download</a>";
                        cardDiv += "<a href='javascript:' onclick='downloadCode(" + item.id + ")'>Code</a>";
                        cardDiv += "</div>";
                       
                        lis.push('<li><div class="card">' + cardDiv + '</div></li>');
                    });
                    //console.log(res);
                    //console.log(page,type);
                    //执行下一页渲染，第二参数为：满足“加载更多”的条件，即后面仍有分页
                    //pages为Ajax返回的总页数，只有当前页小于总页数的情况下，才会继续出现加载更多
                    next(lis.join(''), page * pageSize < res.count);
                }
                else {
                    layer.msg(res.message, { icon: 6 });
                }
            });

        }
    });
}


function downloadData(id) {
    var name = $("#div_name_" + id).text();
    var desc = $("#div_desc_" + id).text();
    downloadStyleData(id, name, desc);
}

function downloadCode(id) {
    var url = location.origin + "/api/styles/DownloadCode?id=" + id;
    window.open(url, "_blank");
}
