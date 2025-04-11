var layer;
layui.use(['element', 'laypage', 'layer', 'table', 'form'], function () {
    layer = layui.layer
    table = layui.table
    laypage = layui.laypage
    form = layui.form;


    //监听工具条
    table.on('tool(lstyleTable)', function (obj) { //注：tool是工具条事件名，test是table原始容器的属性 lay-filter="对应的值"
        var data = obj.data //获得当前行数据
            , layEvent = obj.event; //获得 lay-event 对应的值
        switch (layEvent) {
            case "del":
                layer.confirm('Are you sure you want to delete it', function (index) {

                    $.get('/api/Styles/Delete?id=' + data.id, function (res) {
                        if (res.code == 1) {
                            obj.del(); //删除对应行（tr）的DOM结构
                            layer.close(index);
                            layer.msg('Deleted successful', { icon: 6 });
                        } else {
                            layer.msg('Deleted failed', { icon: 5 });
                        }
                    })
                });
                break;
            case "edity":
                var url = "";
                url = "/Styles/V4Pro/StyleEditor";
                if (url) {
                    window.location.href = url +  "?id=" + data.id;
                }
                break;
            case "view":
                showStyle(data.id,data.type);  
                break;
            case "download":
                downloadStyleData(data.id, data.name, data.desc);
                break;
            case "approval":
                layer.confirm('Are you sure you want to pass the review?', {
                    title: 'Release Review',
                    btn: ['Pass', 'Reject']
                    , yes: function (index, layero) {
                        $.get('/api/Styles/Approval?passed=true&id=' + data.id, function (res) {
                            if (res.code == 1) {

                                obj.del();
                                layer.msg('Passed successful', { icon: 6 });
                                layer.close(index);
                            } else {
                                layer.msg('Audit failed', { icon: 5 });
                            }

                        });
                    }, btn2: function (index, layero) {
                        $.get('/api/Styles/Approval?passed=false&id=' + data.id, function (res) {
                            if (res.code == 1) {
                                obj.del();
                                
                                layer.msg('Rejected successful', { icon: 6 });
                                layer.close(index);
                            } else {
                                layer.msg('Audit failed', { icon: 5 });

                            }

                        });
                    }
                });
                break;
        }

    });



    form.on('submit(sreach)', function (data) {
        //  layer.load();
        table.reload('lstyleGrid', {
            url: "/api/Styles/" + data.field["actionName"],
            page: {
                curr: 1 //重新从第 1 页开始
            },
            where: {
                name: data.field.name,
                type:data.field.type

            }
        });

        return false; //阻止表单跳转。如果需要表单跳转，去掉这段即可。
    });

   
});

function getStatusName(d) {
    switch (d.status) {
        case 0:
            return "In review";
        case 1:
            return "Normal";
        case 2:
            return "Rejected";
    }
}



function getSharedName(d) {
    return d.shared ? "Yes" : "No";
  
}


function getYesOrNo(d) {
    return d ? "Yes" : "No";

}

function getImage(d) {
    var url = location.origin + "/" + d.img;
    return '<img src=\"' + url + '\" />';
}

