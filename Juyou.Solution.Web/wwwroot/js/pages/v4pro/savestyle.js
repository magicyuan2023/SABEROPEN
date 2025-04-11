
var layer, table
layui.use(['element', 'layer', 'table', 'form'], function () {
    layer = layui.layer;
    table = layui.table;
    form = layui.form;
    form.verify({
        name: function (value, item) { //value：表单的值、item：表单的DOM对象
            if (value == null || value.length <= 0) {
                return "Please enter the name";
            }

            if (value.length < 5) {
                return "The name is too short and must be greater than 5 characters";
            }
            if (value.length > 20) {
                return "The name is too long,, less than 20 characters";
            }

            if (!(/^[\w,.;:\s\\[\]?/{}<>!#$~^*+()-\\%&"'/=@`|]+$/.test(value))) {
                return 'The name must be in English';
            }
        }
        , desc: function (value, item) {
            if (value == null || value.length <= 0) {
                return "Please enter the description";
            }
            if (value.length < 5) {
                return "The description is too short and must be greater than 5 characters";
            }
            if (value.length > 66) {
                return "The description is too long,, less than 66 characters";
            }

            if (!(/^[\w,.;:\s\\[\]?/{}<>!#$~^*+()-\\%&"'/=@`|]+$/.test(value))) {
                return 'The description must be in English';
            }
        }
    });


    form.on('submit(*)', function (formData) {

        var l = layer.load(0, { shade: false });

        generateRGBData(function () {
            var fd = new FormData();
            var id = formData.field["Id"];

            fd.append("Id", id);
            fd.append("type", 0x40);
            var name = formData.field["Name"];
            fd.append("Name", name);
            var desc = formData.field["Desc"];
            fd.append("Desc", desc);
            fd.append("Shared", formData.field["Shared"] == "on" ? true : false);
            var code = FIND("style").value;
            fd.append("Code", code);
            var data = new File([getRGBData()], name + "_light1.bin", { type: "application/octet-stream" });
            fd.append('Data', data);

            fd.append("Readonly", formData.field["Readonly"] == "1");
            var thumImg = getThumImg();
            var img = new File([thumImg], code + ".jpg", { type: "image/jpg" });
            fd.append('Img', img);
            var token = new URL(window.location.href).searchParams.get("token");
            if (token) {
                fd.append('token', token);
            }
            try {
                $.ajax({
                    url: '/api/Styles/Save',
                    type: 'post',
                    data: fd,
                    cache: false,
                    contentType: false,  //需要设置为false,不然后台拿不到数据
                    processData: false,  //传送DOM信息,所以设为false
                    success: function (res) {

                        if (res.code == 1) {
                            if (id == 0 && res.data == 0) {
                                layer.msg('Save failed', { icon: 6 });
                                return;
                            }
                            FIND("Id").value = res.data;
                            layer.msg('Save successful', { icon: 6 }, function () {
                                layer.closeAll();
                            });
                            if (isdownload) {
                                download(name + "_light1", desc);
                            }


                        } else {
                            layer.msg(res.message, { icon: 5 });
                        }

                    },
                    error: function (res) {
                        console.log(res);
                    },
                    complete: function () {
                        layer.close(l);
                    }
                })

            }
            catch (e) {
                console.log(e);
            }
        });

        return false; //阻止表单跳转。如果需要表单跳转，去掉这段即可。
    });
});

var isdownload = false;
function showSaveDialog(downloadIt, area) {
    if (!STATE_ON) {
        layer.msg("Please power on first");
        return;
    }
    recordImage();
    isdownload = downloadIt;
    if (!area) {
        area = ['400px', '500px'];
    }
    layer.open({
        type: 1,
        title: "Save Style",
        shadeClose: false,
        // shade: 0.8,
        area: area,
        content: $('#savedialog'),
        success: function (layero) {
            var mask = $(".layui-layer-shade");
            mask.appendTo(layero.parent());
            //其中：layero是弹层的DOM对象
        }
    });

}