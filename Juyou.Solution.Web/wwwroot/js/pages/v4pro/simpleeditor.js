var _BaseSelectColor = "Rgb&lt;255,0,0&gt;";

function initBladeStyle() {
    onStyleChanged("duplexStyle1");
    checkStateOn();
}

function onStyleChanged(id) {
    var val = $("#" + id).val();
    resetControlByStyle(val);
    previewBladeStyle();
}

function previewBladeStyle() {
     var code = "";
    FIND("VARIANT").value = 0;
    code = getBladeStyle();

    var txt = document.createElement('textarea');
    txt.innerHTML = code;
    document.getElementById('style').value = txt.value;
    Run();
    STATE_LOCKUP = 0;
    UpdateLockupButtons();
}


function getBladeStyle() {
    var styleptr = "";
    var base = DuplexBuilder();
    var ignite = createIgnitionEffect();
    var retract = createRetractionEffect();
    var rain = createRainEffect();
     
    var off = "Black";  
    styleptr = "Layers&lt;" + base + rain + ",InOutTrL&lt;" + ignite + "," + retract + "," + off + "&gt;&gt;";
    return styleptr;
}

function DuplexBuilder() {
  
    return  getBaseStyleCode('duplexStyle1');
   
}

function resetControlByStyle(val) {
    $(".OptionItem").hide();
    $("#bladeRain").val("0");
    switch (val) {
        case "Stable":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");            
            break;
        case "Unstable":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");

            $("#div_bladeParam").show();
            $("#li_bladeParam2").show();
            showRangeControl("bladeParam1",30,400,100);
            showRangeControl("bladeParam2", 0, 1000, 500);           
            break;
        case "Unstable-2":
            $("#div_bladeColor").show();           
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");

            $("#div_bladeParam").show();
            $("#li_bladeParam2").show();
            showRangeControl("bladeParam1", 30, 400, 100);
            showRangeControl("bladeParam2", 0, 1000, 500);
            break;
        case "Pulse":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");    
            
            $("#div_bladeParam").show();
            showRangeControl("bladeParam1", 30, 400, 300);            
            break;
        case "Pulse-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");

            $("#div_bladeParam").show();
            showRangeControl("bladeParam1", 30, 400, 300);
            break;
        case "Rainbow":
            break;
        case "Rainbow-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");
            $("#li_color3").show();
            $("#bladeColor3").val("Rgb<0,0,255>");
            $("#li_color4").show();
            $("#bladeColor4").val("Rgb<255,255,0>");

            $("#div_bladeParam").show();
            $("#li_bladeParam2").show();
            showRangeControl("bladeParam1", 300, 30000, 2000);
            showRangeControl("bladeParam2", -2000, 2000, -400);
            break;
        case "Gradient(2)":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");           
            break;
        case "Gradient(3)":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");
            $("#li_color3").show();
            $("#bladeColor3").val("Rgb<0,0,255>");          
            break;
        case "Gradient(4)":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");
            $("#li_color3").show();
            $("#bladeColor3").val("Rgb<0,0,255>");
            $("#li_color4").show();
            $("#bladeColor4").val("Rgb<255,255,0>");
            break;
        case "Fire":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<0,0,255>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,255>");      

            $("#div_bladeSpeed").show();
            showRangeControl("bladeSpeed", 1, 5, 2);
            break;
        case "Gradient Fire":          
        case "Stripe Fire":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<0,0,255>");

            $("#div_bladeSpeed").show();
            showRangeControl("bladeSpeed", 1, 5, 2);
            break;
        case "HumpFlicker":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");           
            break;
        case "HumpFlicker-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");

            $("#div_bladeParam").show();
            showRangeControl("bladeParam1", 5, 200, 50);
            break;
        case "RandomFlicker":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");           
            break;
        case "RandomFlicker-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");
            break;
        case "AudioFlicker":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            break;
        case "AudioFlicker-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");
            break;       
        case "Static Fire":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");

            $("#div_bladeSpeed").show();
            showRangeControl("bladeSpeed", 2, 5, 2);
            break;
        case "Stripe":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");

            $("#div_bladeSpeed").show();
            showRangeControl("bladeSpeed", -3000, 3000, -600);

            $("#div_bladeWidth").show();
            showRangeControl("bladeWidth", 300, 5000, 3000);
            break;
        case "BrownNoiseFlicker":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            break;
        case "BrownNoiseFlicker-2":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            $("#li_color2").show();
            $("#bladeColor2").val("Rgb<0,255,0>");

            $("#div_bladeFreq").show();
            showRangeControl("bladeFreq", 2, 5, 2);
            break;   
        case "Strobe Fire":
            $("#div_bladeColor").show();
            $("#bladeColor1").val("Rgb<255,0,0>");
            break;
    }
}

function getBaseStyleCode(baseopt) {
    var stylename = document.getElementById(baseopt).value;
    if (stylename != 0) {
        var code = "";
        switch (stylename) {
            case 'Stable':              
                code = $("#bladeColor1").val();
                break;
            case "Unstable":
                code = "Blinking&lt;" + $("#bladeColor1").val() + ",Black," + $("#bladeParam1").val() + "," + $("#bladeParam2").val() +  "&gt;";
                break;
            case "Unstable-2":
                code = "Blinking&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeParam1").val() + "," + $("#bladeParam2").val() + "&gt;";
                break;
            case "Pulse":
                code = "Pulsing&lt;" + $("#bladeColor1").val() + ",Black," + $("#bladeParam1").val()  + "&gt;";
                break;
            case "Pulse-2":
                code = "Pulsing&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeParam1").val() + "&gt;";
                break;
            case "Rainbow":
                code = "Rainbow";
                break;
            case "Rainbow-2":
                code = " StripesX&lt;Int&lt;" + $("#bladeParam1").val() + " &gt;,Int&lt;" + $("#bladeParam2").val() + "&gt;," + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeColor3").val() + "," + $("#bladeColor4").val() + "&gt;";
                break;
            case "Gradient(2)":
                code = "Gradient&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val()  + "&gt;";
                break;
            case "Gradient(3)":
                code = "Gradient&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeColor3").val() + "&gt;";
                break;
            case "Gradient(4)":
                code = "Gradient&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + ","  + $("#bladeColor3").val() + "," + $("#bladeColor4").val() + "&gt;";
                break;
            case "Fire":
                code = "StyleFire&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + ",0," + $("#bladeSpeed").val() + "&gt;";
                break;
            case "Gradient Fire":
                var color =  $("#bladeColor1").val();
                code = "StyleFire&lt;Gradient&lt;" + color + ",RotateColorsX&lt;Int&lt;5400&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;10900&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;16300&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;21800&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;27300&gt;," + color + "&gt;&gt;,Mix&lt;Int&lt;16385&gt;,Black," + color + "&gt;,0," + $("#bladeSpeed").val() +  "&gt;";
                break;
            case "Stripe Fire":
                var color = $("#bladeColor1").val();
                code = "StyleFire&lt;Stripes&lt;30000,-50," + color + ",RotateColorsX&lt;Int&lt;5450&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;10900&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;16384&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;21850&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;27300&gt;," + color + "&gt;&gt;,Mix&lt;Int&lt;16384&gt;,Black,Stripes&lt;30000,-50," + color + ",RotateColorsX&lt;Int&lt;5461&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;10922&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;16384&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;21845&gt;," + color + "&gt;,RotateColorsX&lt;Int&lt;27306&gt;," + color + "&gt;&gt;&gt;,0," + $("#bladeSpeed").val() + "&gt;";
                break;
            case "HumpFlicker":
                code = "HumpFlicker&lt;" + $("#bladeColor1").val() + ",Black,50&gt;";
                break;
            case "HumpFlicker-2":
                code = "HumpFlicker&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeParam1").val() + "&gt;";
                break;
            case "RandomFlicker":
                code = "RandomFlicker&lt;" + $("#bladeColor1").val() + ",Black&gt;";
                break;
            case "RandomFlicker-2":
                code = "RandomFlicker&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val()  + "&gt;";
                break;
            case "AudioFlicker":
                code = "AudioFlicker&lt;" + $("#bladeColor1").val() + ",Black&gt;";
                break;
            case "AudioFlicker-2":
                code = "AudioFlicker&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "&gt;";
                break;
            case "Static Fire":
                var color = $("#bladeColor1").val();
                code = "StaticFire&lt;" + color + ",Mix&lt;Int&lt;10000&gt;,Black," + color + "&gt;,0," + $("#bladeSpeed").val()  + ",0,4000&gt;";
                break;
            case "Stripe":
                var color = $("#bladeColor1").val();
                code = "Remap&lt;SmoothStep&lt;Int&lt;" + $("#bladeWidth").val() + "&gt;,Int&lt;42000&gt;&gt;,Stripes&lt;300," + $("#bladeSpeed").val() + "," + color + ",Mix&lt;Int&lt;4000&gt;,Black," + color + "&gt;," + color + ",Mix&lt;Int&lt;12000&gt;,Black," + color + "&gt;&gt;&gt;";
                break;
            case "BrownNoiseFlicker":
                code = "BrownNoiseFlicker&lt;" + $("#bladeColor1").val() + ",Black,30&gt;";
                break;
            case "BrownNoiseFlicker-2":
                code = "BrownNoiseFlicker&lt;" + $("#bladeColor1").val() + "," + $("#bladeColor2").val() + "," + $("#bladeFreq").val() + "&gt;";
                break;
            case "Strobe Fire":
                var color = $("#bladeColor1").val();
                code = "StaticFire&lt;Strobe&lt;" + color + ",Strobe&lt;Rgb&lt;100,100,150&gt;,RandomPerLEDFlicker&lt;" + color + ",Black&gt;,50,1&gt;,100,1&gt;,Mix&lt;Int&lt;6425&gt;,Black," + color + "&gt;,0,5,2,1000&gt;";
                break;
            default:
                alert('Missing Base Style Code');
                break;
        }
        return code;
    }
}



function createRainEffect() {
    var style = $("#bladeRain").val();
    var code = "";
    if (style == "0") {
        return code;
    }
    code = code = ",SparkleL&lt;" + style +  "&gt;";
   
    return code;
}

function createIgnitionEffect() {  
    return "TrWipeX&lt;IgnitionTime&lt;300&gt;&gt;";
}

function createRetractionEffect() {
   
    return "TrWipeInX&lt;RetractionTime&lt;0&gt;&gt;";
}

function showRangeControl(id, minv, maxv, val) {
    id = "#" + id;
    var obj = $(id);
   obj.prop("min", minv);
    obj.prop("max", maxv);
    obj.val(val);

    var did = id + "Display";
    obj = $(did);
    obj.prop("min", minv);
    obj.prop("max", maxv);
    obj.val(val);
}

function updateRangeDisplay(name) {
    var display = name + "Display";
    document.getElementById(display).value = document.getElementById(name).value;
    previewBladeStyle();
}
function updateRange(name) {
    var range = name.replace("Display", "");
    document.getElementById(range).value = document.getElementById(name).value;
    previewBladeStyle();
}



