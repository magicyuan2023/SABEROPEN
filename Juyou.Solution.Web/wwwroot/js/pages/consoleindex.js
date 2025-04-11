var layer,  flow;
layui.use(['element', 'layer',  'flow','form'], function () {
    layer = layui.layer;
    form = layui.form;
    flow = layui.flow;
    form.on('select(type)', function (data) {
        var elem = data.elem; // ��� select ԭʼ DOM ����
        var value = data.value; // ��ñ�ѡ�е�ֵ
        loadData(value);
    });
    loadData(0);
});

function loadData(type) {
    $("#lightstylelist").html("");
    flow.load({
        elem: '#lightstylelist' //����������
        , scrollElem: '#lightstylelist' //����������Ԫ�أ�һ�㲻����˴�ֻ����ʾ��Ҫ��
        , isAuto: true
        , isLazyimg:true
        ,end:"There's no more now"
        , done: function (page, next) { //ִ����һҳ�Ļص�
            var pageSize = 20;
            
            $.get("/api/styles/GetPublishedList?page=" + page + "&limit=" + pageSize + "&type=" + type, function (res) {
                if (res.code == 0) {
                    var lis = [];

                    //��������б�����data������
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
                    //ִ����һҳ��Ⱦ���ڶ�����Ϊ�����㡰���ظ��ࡱ�����������������з�ҳ
                    //pagesΪAjax���ص���ҳ����ֻ�е�ǰҳС����ҳ��������£��Ż�������ּ��ظ���
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
