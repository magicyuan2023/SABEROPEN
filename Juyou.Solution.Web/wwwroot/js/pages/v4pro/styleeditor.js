
function UpdateLockupButtons() {
    var button = FIND("LOCKUP_BUTTON");
    if (button) {
        button.style.backgroundColor = STATE_LOCKUP == LOCKUP_NORMAL ? "green" : "";
        button.style.color = STATE_LOCKUP == LOCKUP_NORMAL ? "white" : "black";
    }
    var button = FIND("DRAG_BUTTON");
    if (button) {
        button.style.backgroundColor = STATE_LOCKUP == LOCKUP_DRAG ? "green" : "";
        button.style.color = STATE_LOCKUP == LOCKUP_DRAG ? "white" : "black";
    }
    var button = FIND("MELT_BUTTON");
    if (button) {
        button.style.backgroundColor = STATE_LOCKUP == LOCKUP_MELT ? "green" : "";
        button.style.color = STATE_LOCKUP == LOCKUP_MELT ? "white" : "black";
    }
    var button = FIND("LB_BUTTON");
    if (button) {
        button.style.backgroundColor = STATE_LOCKUP == LOCKUP_LIGHTNING_BLOCK ? "green" : "";
        button.style.color = STATE_LOCKUP == LOCKUP_LIGHTNING_BLOCK ? "white" : "black";
    }
}


function OnLockupChange() {
    var select = FIND("LOCKUP");
    var old = STATE_LOCKUP;
    STATE_LOCKUP = window[select.value];
    if (STATE_LOCKUP && lockups_to_event[STATE_LOCKUP]) {
        blade.addEffect(lockups_to_event[STATE_LOCKUP][0], Math.random() * 0.7 + 0.2);
    } else if (old && lockups_to_event[old]) {
        blade.addEffect(lockups_to_event[old][1], Math.random() * 0.7 + 0.2);
    }
}

function ClickLockup() {
    STATE_LOCKUP = STATE_LOCKUP == LOCKUP_NORMAL ? 0 : LOCKUP_NORMAL;
    UpdateLockupButtons();
    blade.addEffect(STATE_LOCKUP ? EFFECT_LOCKUP_BEGIN : EFFECT_LOCKUP_END, Math.random() * 0.7 + 0.2);
}

function ClickDrag() {
    STATE_LOCKUP = STATE_LOCKUP == LOCKUP_DRAG ? 0 : LOCKUP_DRAG;
    UpdateLockupButtons();
    blade.addEffect(STATE_LOCKUP ? EFFECT_DRAG_BEGIN : EFFECT_DRAG_END, 1.0);
}

function ClickLB() {
    STATE_LOCKUP = STATE_LOCKUP == LOCKUP_LIGHTNING_BLOCK ? 0 : LOCKUP_LIGHTNING_BLOCK;
    UpdateLockupButtons();
}

function ClickMelt() {
    STATE_LOCKUP = STATE_LOCKUP == LOCKUP_MELT ? 0 : LOCKUP_MELT;
    UpdateLockupButtons();
}

function ClickInhilt() {
    STATE_NUM_LEDS = 145 - STATE_NUM_LEDS;
    var button = FIND("INHILT_BUTTON");
    button.style.backgroundColor = STATE_NUM_LEDS == 1 ? "green" : "";
    button.style.color = STATE_NUM_LEDS == 1 ? "white" : "black";
}

function ClickSlow() {
    framesPerUpdate = 60 - framesPerUpdate;
    var button = FIND("SLOW_BUTTON");
    button.style.backgroundColor = framesPerUpdate == 60 ? "green" : "";
    button.style.color = framesPerUpdate == 60 ? "white" : "black";
}


function Copy() {
    var copyText = FIND("style");
    if (copyText.value.includes("StylePtr") ||
        copyText.value.includes("StyleNormalPtr") ||
        copyText.value.includes("StyleFirePtr") ||
        copyText.value.includes("StyleRainbowPtr")) {
        if (!copyText.value.endsWith("()"))
            copyText.value = copyText.value + "()";
    }
    else {
        copyText.value = "StylePtr<" + copyText.value + ">" + "()";
    }
    copyText.select();
    document.execCommand("copy");
    // alert("Copy to Clipboard" + copyText.value);
    // myAlertTop("Copy to Clipboard");
}


function IncreaseVariant(n) {
    FIND("VARIANT").value = Variant() + n;
}


function DoExpand() {
    if (current_style && current_style.expansion) {
        pp_is_url++;
        var url = current_style.expansion.pp();
        pp_is_url--;
        SetTo(url);
    }
}


function DoLayerize() {
    var tmp = RecursiveLayerize(current_style);
    pp_is_url++;
    tmp = tmp.pp();
    pp_is_url--;
    SetTo(tmp);
}

function DoArgify() {
    state = {}
    // Only do this if at top level...
    state.color_argument = BASE_COLOR_ARG;
    var tmp = current_style.argify(state);
    pp_is_url++;
    tmp = tmp.pp();
    pp_is_url--;
    SetTo(tmp);
}




function SetToAndFormat(str) {
    var parser = new Parser(str, classes, identifiers);
    var style = parser.parse();
    pp_is_url++;
    var url = style.pp();
    pp_is_url--;
    SetTo(url);
}

function FocusOnLow(id) {
    console.log("FOCUSON: " + id);
    var style = style_ids[id];
    console.log(id);
    console.log(style);
    current_focus = style;
    var container = FIND("X" + id);
    console.log(container);
    container.style.backgroundColor = 'lightblue';
    pp_is_url++;
    var url = style.pp();
    pp_is_url--;
    console.log(url);
    current_focus_url = url;
    SetTo(url);
    return true;
}

function FocusOn(id, event) {
    event.stopPropagation();
    FocusOnLow(id);
}

function ClickRotate() {
    STATE_ROTATE = !STATE_ROTATE;
    var rotate_button = FIND("ROTATE_BUTTON");
    rotate_button.style.backgroundColor = STATE_ROTATE ? "green" : "";
    rotate_button.style.color = STATE_ROTATE ? "white" : "black";
    console.log("ROTATE");
}


function mkbutton2(name, val) {
    return "<input type=button class=btn onclick='SetToAndFormat(\"" + val + "\")' value='" + enc(name) + "'>\n";
    //  return "<span class=btn onclick='SetTo(\""+name+"\")'>"+enc(name)+"</span>\n";
}
function mkbutton(name) {
    return mkbutton2(name, name);
    //  return "<input type=button class=btn onclick='SetTo(\""+name+"\")' value='"+enc(name)+"'>\n";
    //  return "<span class=btn onclick='SetTo(\""+name+"\")'>"+enc(name)+"</span>\n";
}


function mkcolorbutton(name, r, g, b) {
    r = mapcolor(r);
    g = mapcolor(g);
    b = mapcolor(b);
    var color = "rgb(" + r + "," + g + "," + b + ")";
    if (r == 0 && g == 0 && b == 0) color = "white";
    return "<input type=button style='background:" + color + "' class=btn onclick='SetTo(\"" + name + "\")' value='" + enc(name) + "'>\n";
}


function ClickColor() {
    var color_button = FIND("COLOR");
    color_button.addEventListener("input", ClickColor, false);
    var R = FixColor(color_button.value.substr(1, 2));
    var G = FixColor(color_button.value.substr(3, 2));
    var B = FixColor(color_button.value.substr(5, 2));
    SetTo("Rgb16<" + R + "," + G + "," + B + ">");
}


function SetTo(str) {
    console.log(str);
    var old = FIND("style").value;
    var url = new URL(window.location.href);
    url.searchParams.set("S", str);

    // FIXME: Use pushState and fix back arrow
    window.history.replaceState(old, "Style Editor", window.location.href);
    window.history.pushState(str, "Style Editor", url);
    window.onpopstate = PopState;

    FIND("style").value = str;
    Run();
}


function ArgStringChanged() {
    var tag = FIND("ARGSTR");
    ARGUMENTS = tag.value.split(" ");
    for (var i = 3; i < ARGUMENTS.length; i++) {
        if (ARGUMENTS[i] == "~") continue;
        if (!ARGUMENTS[i]) continue;
        var ARG = i - 2;
        updateArgTag(ARG, ARGUMENTS[i]);
    }
}

function setARG(ARG, TO) {
    ARG += 2;
    ARGUMENTS[ARG] = TO;
    for (var i = 0; i < ARGUMENTS.length; i++) {
        if (!ARGUMENTS[i]) {
            ARGUMENTS[i] = '~';
        }
    }
    FIND("ARGSTR").value = ARGUMENTS.join(" ");
}

function ArgChanged(ARG) {
    var N = ArgumentName_ENUM_BUILDER.value_to_name[ARG];
    var tag = FIND("ARGSTR_" + N);
    setARG(ARG, tag.value);
}

function IncreaseArg(ARG, I) {
    var N = ArgumentName_ENUM_BUILDER.value_to_name[ARG];
    var tag = FIND("ARGSTR_" + N);
    tag.value = parseInt(tag.value) + I;
    setARG(ARG, tag.value);
}

function ClickArgColor(ARG) {
    var N = ArgumentName_ENUM_BUILDER.value_to_name[ARG];
    var tag = FIND("ARGSTR_" + N);
    var R = FixColor(tag.value.substr(1, 2));
    var G = FixColor(tag.value.substr(3, 2));
    var B = FixColor(tag.value.substr(5, 2));
    setARG(ARG, R + "," + G + "," + B);
}





var qlinks = [];
var effect_links = [];
var layer_links = [];
var effect_type_links = []
var template_links = [];
var function_links = []
var transition_links = [];



function AddTemplate(name) {
    var val = name;
    if (name.length > 40) {
        name = name.slice(0, 40) + '...';
    }
    template_links.push(mkbutton2(name, val));
}
function AddEffect(val) {
    var name = val.split("<")[0];
    effect_links.push(mkbutton2(name, val));
}
function AddLayer(val) {
    var name = val.split("<")[0];
    layer_links.push(mkbutton2(name, val));
}
function AddFunction(val) {
    var name = val.split("<")[0];
    function_links.push(mkbutton2(name, val));
}
function AddTransition(val) {
    var name = val.split("<")[0];
    transition_links.push(mkbutton2(name, val));
}
function AddEffectWL(val) {
    AddEffect(val);
    val = val.slice(0, val.length - 1);
    var tmp1 = val.split("<");
    var tmp2 = val.split(",");
    AddLayer(tmp1[0] + "L<" + tmp2.slice(1).join(",") + ">")
}
function AddEffectWLF(val) {
    AddEffect(val);
    val = val.slice(0, val.length - 1);
    var tmp1 = val.split("<");
    var tmp2 = val.split(",");
    AddLayer(tmp1[0] + "L<" + tmp2.slice(1).join(",") + ">")
    AddFunction(tmp1[0] + "F<" + tmp2.slice(2).join(",") + ">")
}

var history_html = "";
function AddHistory(name, type) {
    var label = name;
    if (label.length > 80) label = label.slice(0, 78) + "...";
    name = name.split("\n").join(" ").split("   ").join(" ").split("  ").join(" ").split("< ").join("<");
    var btn = "<input type=button class=btn onclick='SetToAndFormat(\"" + name + "\")' value='" + enc(label) + "'>\n";
    var tag = "<span class=MAGIC_CLASS_" + type + ">" + btn + "</span>\n";
    history_html = tag + history_html.replace(tag, "");
    FIND("history_tabcontent").innerHTML = history_html;
}


function AddTab(tab, name, contents) {
    FIND("TABLINKS").innerHTML += "<button id=" + tab + "_tab class=tablinks onclick=\"ActivateTab('" + tab + "')\">" + name + "</button>";
    FIND("TABBODIES").innerHTML += "<div id=" + tab + "_tabcontent class=tabcontent></div>";
    if (contents) {
        AddTabContent(tab, contents);
    }
}


function ReplaceCurrentFocus(str) {
    current_focus_url = str;

    if (current_focus) {
        current_focus.super_short_desc = true;
        pp_is_url++;
        pp_is_verbose++;
        var url = style_tree.pp();
        console.log("FOCUS URL: " + url);
        pp_is_url--;
        pp_is_verbose--;
        current_focus.super_short_desc = false;
        str = url.replace("$", "FOCUS<" + str + ">");
    }

    current_focus = 0;
    focus_catcher = 0;
    console.log(str);
    var parser = new Parser(str, classes, identifiers);
    style_tree = parser.parse();
    var pp = FIND("pp");
    if (pp) {
        pp.innerHTML = style_tree.pp();
    }
    if (focus_catcher) {
        current_focus = focus_catcher;
        var id = current_focus.get_id();
        var container = FIND("X" + id);
        if (!container) {
            console.log("Lost focus when parsing " + str);
            console.log(focus_trace);
        } else {
            container.style.backgroundColor = 'lightblue';
        }
    } else {
        console.log("No focus catcher found!!");
    }
    var type = "COLOR";
    var classname = "Style";
    //  if (current_focus && current_style && current_focus != current_style) {
    //    type = current_style.getType();
    //    classname = current_focus.constructor.name;
    //  }

    if (current_style) {
        type = current_style.getType();
        classname = current_style.constructor.name;
    }
    var hi = FIND("history_tabcontent");
    if (hi) {
        AddHistory(current_focus_url, current_style.getType());
    }
    console.log("TYPE = " + type);

    var expand = FIND("expand_button");
    if (expand) {
        expand.className = current_style && current_style.isMacro ? "button_on" : "button_off";
        FIND("layerize_button").className = CanLayerize(current_style) ? "button_on" : "button_off";
    }
    if (type == "COLOR" && classname.endsWith("LClass")) {
        ActivateTab("layer");
    } else if (type == "COLOR" && (classname == "Rgb16Class" || classname == "RgbClass")) {
        ActivateTab("rgb");
    } else {
        ActivateTab(type.toLowerCase());
    }

    for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        for (var r = 0; r < sheet.cssRules.length; r++) {
            var rule = sheet.cssRules[r];
            if (rule.cssText.toLowerCase().includes("magic_class_")) {
                if (rule.cssText.toLowerCase().includes("magic_class_" + type.toLowerCase())) {
                    rule.style.background = 'lightblue';
                    rule.style.color = "black";
                } else {
                    rule.style.background = "lightgray";
                    rule.style.color = "darkgray";
                }
            }
            if (rule.cssText.toLowerCase().includes("magic_invisible_class_")) {
                if (rule.cssText.toLowerCase().includes("magic_invisible_class_" + type.toLowerCase())) {
                    rule.style.display = 'inline';
                } else {
                    rule.style.display = 'none';
                }
            }
        }
    }
}


function ActivateTab(tab) {
    if (!FIND(tab + "_tab")) {
        console.log("No such tab");
        return;
    }
    // Get all elements with class="tabcontent" and hide them
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    FIND(tab + "_tabcontent").style.display = "block";
    FIND(tab + "_tab").className += " active";
}