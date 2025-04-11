var requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
var next_id = 1000;
// 1 = lockup
// 2 = drag
// 3 = lb
// 4 = melt
var STATE_ROTATE = 0;
var STATE_NUM_LEDS = 129;

var focus_catcher;
var focus_trace = [undefined];
var STATE_LOCKUP = 0;
var STATE_ON = 0;

var blast_hump = [255, 255, 252, 247, 240, 232, 222, 211,
    199, 186, 173, 159, 145, 132, 119, 106,
    94, 82, 72, 62, 53, 45, 38, 32,
    26, 22, 18, 14, 11, 9, 7, 5, 0];


const FIRE_STATE_OFF = 0
const FIRE_STATE_ACTIVATING = 1;
const FIRE_STATE_ON = 2;

var identifiers = {};
var style_ids = {};


function newCall(Cls) {
    return new (Function.prototype.bind.apply(Cls, arguments));
}


const start_millis = new Date().getTime();
function actual_millis() {
    return new Date().getTime() - start_millis;
}
var current_micros = 0;
function micros() {
    return current_micros;
}

function millis() {
    return current_micros / 1000;
}

function fract(v) {
    return v - Math.floor(v);
}

var max = Math.max;
var min = Math.min;
var sin = Math.sin;
function random(i) {
    return Math.floor(Math.random() * i);
}
function clamp(a, b, c) {
    if (a < b) return b;
    if (a > c) return c;
    return a;
}


var last_detected_blade_effect;

var handled_types = {};
function PushHandledTypes() {
    ret = [handled_types, handled_lockups];
    handled_types = {};
    handled_lockups = {};
    return ret;
}
function PopHandledTypes(old) {
    handled_types = old[0];
    handled_lockups = old[1];
}
function HandleEffectType(t) {
    if (t.getInteger) t = t.getInteger(0);
    handled_types[t] = 1;
}
function IsHandledEffectType(t) {
    return current_style.__handled_types[EFFECT_STAB];
}


class Range {
    constructor(start, end) {
        this.start = start;
        this.end = end;
    }
    Size() { return max(0, this.end - this.start); }
    Intersect(other) {
        return new Range(max(this.start, other.start), min(this.end, other.end));
    }
};


class MODEL {
    constructor(comment, args) {
        this.comment = comment;
        // if (args) console.log(args);
        this.args = args;
        this.argnum = 0;
        this.argdefs = [];
        this.super_short_desc = false;
        this.ID = next_id;
        next_id++;
    }

    add_arg(name, expected_type, comment, default_value) {
        if (focus_trace[0] == this.args[this.argnum]) {
            focus_trace = [this, name, expected_type, focus_trace];
        }
        //     console.log("add_arg");
        //     console.log(name);
        //     console.log(this.args);
        //     console.log(default_value);
        try {
            this[name] = Arg(expected_type, this.args[this.argnum], default_value);
            //       console.log(this[name]);
        } catch (e) {
            console.log(e);
            if (typeof (e) == "string") {
                e = new MyError(e + " for argument " + (this.argnum + 1) + " (" + name + ")");
                e.setArg(this.args[this.argnum]);
            }
            throw e;
        }
        this.argnum++;
        this.argdefs.push(new ARG(name, expected_type, comment, default_value));
    }

    get_id() {
        style_ids[this.ID] = this;
        return this.ID;
    }

    DOCOPY() {
        pp_is_url++;
        var url = this.pp();
        pp_is_url--;
        var parser = new Parser(url, classes, identifiers);
        return parser.parse();
    }

    DescribeValue(arg) {
        if (typeof (arg) == "undefined") return "undefined";
        if (typeof (arg) == "number") {
            return "" + arg;
        } else {
            return arg.pp();
        }
    }

    Indent(text) {
        return text;
    }

    PPURL(name, note) {
        if (this.super_short_desc) return "$";
        pp_is_url++;
        var ret = name;
        var comma = false;
        if (arguments.length > 2 || this.argdefs.length > 0) {
            ret += "<";
            for (var i = 2; i < arguments.length; i += 2) {
                if (comma) ret += ",";
                comma = true;
                ret += this.Indent(this.DescribeValue(arguments[i]));
            }
            ret += ">";
        }
        pp_is_url--;

        return ret;
    }

    extraButtons(arg) {
        return "";
    }

    PP(name, note) {
        if (pp_is_url) {
            return this.PPURL.apply(this, arguments);
        }
        var id = this.get_id();
        var ret = "";
        ret += "<div id=X" + id + " style='border-style:solid;border-width:1px;border-color:gray;' onclick='FocusOn(" + id + ",event)'>\n";
        ret += "<span title='" + note + "'>" + name + "</span>&lt;\n";
        ret += "<div style='margin-left:1em'>\n";
        var comma = false;
        for (var i = 2; i < arguments.length; i += 2) {
            if (comma) ret += ",<br>";
            comma = true;
            var arg = arguments[i];
            var note = arguments[i + 1];
            if (typeof (arg) == "number") {
                arg = "" + arg;
            } else {
                arg = arg.pp();
            }
            if (arg.indexOf("<br>") == -1 && arg.indexOf("<div") == -1) {
                ret += arg + " /* " + note + " */\n";
            } else {
                ret += "/* " + note + " */" + this.extraButtons(i / 2) + "<br>\n" + arg;
            }
        }
        ret += "</div>&gt;</div>\n";

        return ret;
    }

    PPshort(name, note) {
        var url = this.PPURL.apply(this, arguments);
        if (pp_is_url) return url;
        var id = this.get_id();
        var ret = "";
        ret += "<div id=X" + id + " style='border-style:solid;border-width:1px;border-color:gray;' onclick='FocusOn(" + id + ",event)'>\n";
        ret += "<span title='" + note + "'>" + name + "</span>\n";

        if (arguments.length > 2) {
            ret += "&lt;";
            var comma = false;
            for (var i = 2; i < arguments.length; i += 2) {
                if (comma) ret += ",";
                comma = true;
                var arg = arguments[i];
                var note = arguments[i + 1];
                if (typeof (arg) == "number") {
                    ret += "<span title='" + note + "'>" + arg + "</span>";
                } else {
                    ret += "<span>/* " + note + " */</span><br>\n";
                    ret += arg.pp();
                }
            }
            ret += "&gt;";
        }
        ret += "</div>\n";

        return ret;
    }

    SameValue(a, b) {
        // console.log("SAMEVALUE");
        // console.log(a);
        // console.log(b);
        // console.log(this.DescribeValue(a));
        // console.log(this.DescribeValue(b));
        return a == b || this.DescribeValue(a) == this.DescribeValue(b);
    }

    pp() {
        var tmp = [this.constructor.name.replace("Class", ""), this.comment];
        var l = this.argdefs.length;
        if (pp_is_url && !pp_is_verbose) {
            // Drop default arguments
            while (l > 0 && this.argdefs[l - 1].default_value != undefined &&
                this.SameValue(this[this.argdefs[l - 1].name], this.argdefs[l - 1].default_value)) l--;
        }
        for (var i = 0; i < l; i++) {
            tmp.push(this[this.argdefs[i].name]);
            tmp.push(this.argdefs[i].comment);
        }
        return this.PP.apply(this, tmp);
    }
    getType() { return "COLOR"; }

    run(blade) {
        for (var i = 0; i < this.argdefs.length; i++) {
            var arg = this[this.argdefs[i].name];
            if (typeof (arg) == "object") arg.run(blade);
        }
    }

    isEffect() {
        for (var i = 0; i < this.argdefs.length; i++) {
            if (this.argdefs[i].type == "EFFECT") return true;
            if (this.argdefs[i].type == "LOCKUP_TYPE") return true;
        }
        return false;
    }

    // Doesn't work??
    toString() { return this.constructor.name + "[id = " + this.ID + "]"; }

    set_right_side(right) {
        if (!right) {
            return;
        }
        if (this.argdefs.length != right.argdefs.length) {
            console.log("SET RIGHT SIDE NON-MATCH");
            return;
        }
        this.right_side = right;
        for (var i = 0; i < this.argdefs.length; i++) {
            if (this.argdefs[i].name != right.argdefs[i].name) {
                console.log("SET RIGHT SIDE NON-MATCH");
                return;
            }

            var l_arg = this[this.argdefs[i].name];
            var r_arg = right[this.argdefs[i].name];
            if (typeof (l_arg) == "object" && typeof (r_arg) == "object") {
                l_arg.set_right_side(r_arg);
            }
        }
    }

    get_container() {
        var id = this.ID;
        if (this.right_side) id = this.right_side.ID;
        return FIND("X" + id);
    }

    update_displays() {
        for (var i = 0; i < this.argdefs.length; i++) {
            var arg = this[this.argdefs[i].name];
            if (typeof (arg) == "object") arg.update_displays();
        }

        if (this.IS_RUNNING) {
            var container = this.get_container();
            if (container) {
                if (this.IS_RUNNING()) {
                    container.style["border-color"] = 'yellow';
                } else {
                    container.style["border-color"] = 'gray';
                }
            }
        }
    }

    argify(state) {
        for (var i = 0; i < this.argdefs.length; i++) {
            var arg = this[this.argdefs[i].name];
            if (typeof (arg) == "object") {
                this[this.argdefs[i].name] = arg.argify(state);
            }
        }
        return this;
    }
}


class MACRO extends MODEL {
    SetExpansion(expansion) {
        this.expansion = expansion;
    }
    run(blade) { this.expansion.run(blade); }
    getInteger(led) { return this.expansion.getInteger(led); }
    getColor(A, B, C) { return this.expansion.getColor(A, B, C); }
    getType() { return this.expansion.getType(); }
    isMacro() { return true; }
    isEffect() { return this.expansion.isEffect(); }
    begin() { this.expansion.begin(); }
    done() { return this.expansion.done(); }
    IS_RUNNING() {
        if (this.expansion.IS_RUNNING)
            return this.expansion.IS_RUNNING();
        return false;
    }
};

class INTEGER extends MODEL {
    constructor(v) {
        super();
        this.value = v;
    }
    run(blade) { }
    getInteger(led) { return this.value; }
    valueOf() { return this.value; }
    pp() {
        if (pp_is_url) {
            if (this.super_short_desc) return "$";
            return "" + this.value;
        }
        return this.PPshort(this.value, "VALUE");
    }
    getType() { return "INT"; }
};

function INT(x) {
    return new INTEGER(x);
}

class BINARY extends MODEL {
    constructor(v) {
        super();
        this.value = v;
    }
    run(blade) { }
    getInteger(led) { return this.value; }
    valueOf() { return this.value; }
    pp() {
        if (pp_is_url) {
            if (this.super_short_desc) return "$";
            return "0b" + this.value.toString(2);
        }
        return this.PPshort("0b" + this.value.toString(2), "VALUE");
    }
    getType() { return "INT"; }
};


function AddEnum(enum_type, name, value) {
    if (value == undefined) {
        value = enum_type.last_value + 1;
    }
    enum_type.last_value = value;
    enum_type.value_to_name[value] = name;
    window[name] = value;
    AddIdentifier(name, function () { return new enum_type(value); });
    console.log(" ENUM " + name + " = " + value);
}

class EnumBuilder {
    constructor(name, prefix) {
        this.name = name;
        this.prefix = prefix ? prefix : "";
        this.last_value = -1
        this.value_to_name = {};
    }
    addValue(name, value) {
        if (value == undefined) {
            value = this.last_value + 1;
        }
        this.last_value = value;
        this.value_to_name[value] = name;
        window[name] = value;
        console.log(" ENUM " + name + " = " + value);
    }
    addToTab(tab, common_prefix) {
        if (!common_prefix) {
            common_prefix = "florb";
        }
        var v = Object.keys(this.value_to_name);
        for (var i = 0; i < v.length; i++) {
            var V = parseInt(v[i]);
            var N = this.value_to_name[V];
            var label = N.replace(common_prefix, "");
            AddTabContent(tab, mkbutton2(label, this.prefix + N));
        }
    }
    build() {
        class ENUMClass extends INTEGER {
            pp() {
                if (pp_is_url) {
                    if (this.super_short_desc) return "$";
                } else if (0) {
                    var ret = "<select>";
                    var v = Object.keys(this.constructor.value_to_name);
                    for (var i = 0; i < v.length; i++) {
                        var V = parseInt(v[i]);
                        var N = this.constructor.value_to_name[V];
                        ret += "<option value=" + V;
                        if (this.value == V) ret += " selected";
                        ret += ">" + N + "</option>";
                    }
                    ret += "</select>";
                    return ret;
                }


                var ret = "" + this.value;
                if (this.constructor.value_to_name[this.value]) {
                    ret = this.constructor.prefix + this.constructor.value_to_name[this.value];
                }
                return this.PPshort(ret, this.getType());
            }
            getType() { return this.constructor.NAME; }
        };
        ENUMClass.value_to_name = this.value_to_name;
        ENUMClass.NAME = this.name;
        ENUMClass.prefix = this.prefix

        function ENUM(value) { return new ENUMClass(value); }
        window[this.name] = ENUM;

        var v = Object.keys(this.value_to_name);
        for (var i = 0; i < v.length; i++) {
            var V = parseInt(v[i]);
            var N = this.value_to_name[V];
            AddIdentifier(this.prefix + N, ENUM.bind(null, V));
        }
    }
}

class Matrix {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.values = new Float32Array(w * h);
        if (w == h) {
            for (var z = 0; z < w; z++) {
                this.set(z, z, 1.0);
            }
        }
    }
    get(x, y) { return this.values[y * this.w + x]; }
    set(x, y, v) { this.values[y * this.w + x] = v; }
    mult(o) {
        var ret = new Matrix(o.w, this.h);
        for (var x = 0; x < o.w; x++) {
            for (var y = 0; y < this.h; y++) {
                var sum = 0.0;
                for (var z = 0; z < this.w; z++) {
                    sum += this.get(z, y) * o.get(x, z);
                }
                ret.set(x, y, sum);
            }
        }
        return ret;
    }
    static mkzrot(a) {
        var ret = new Matrix(4, 4);
        var s = Math.sin(a);
        var c = Math.cos(a);
        ret.set(0, 0, c);
        ret.set(1, 1, c);
        ret.set(0, 1, s);
        ret.set(1, 0, -s);
        return ret;
    }
    static mkxrot(a) {
        var ret = new Matrix(4, 4);
        var s = Math.sin(a);
        var c = Math.cos(a);
        ret.set(1, 1, c);
        ret.set(2, 2, c);
        ret.set(1, 2, s);
        ret.set(2, 1, -s);
        return ret;
    }
    static mkyrot(a) {
        var ret = new Matrix(4, 4);
        var s = Math.sin(a);
        var c = Math.cos(a);
        ret.set(0, 0, c);
        ret.set(2, 2, c);
        ret.set(0, 2, s);
        ret.set(2, 0, -s);
        return ret;
    }
    static mktranslate(x, y, z) {
        var ret = new Matrix(4, 4);
        ret.set(0, 3, x);
        ret.set(1, 3, y);
        ret.set(2, 3, z);
        return ret;
    }

    tostr() {
        var ret = "{";
        for (var x = 0; x < this.w; x++) {
            for (var y = 0; y < this.h; y++) {
                ret += this.get(x, y);
                ret += ", ";
            }
            ret += ";";
        }
        ret += "}";
        return ret;
    }
};

class MyError {
    constructor(desc) {
        this.desc = desc;
        this.begin_pos = -1;
        this.end_pos = -1;
    }
    setBegin(pos) { this.begin_pos = pos; return this; }
    setEnd(pos) { this.end_pos = pos; return this; }
    setArg(arg) {
        if (arg && arg.__end_pos) {
            this.begin_pos = arg.__begin_pos;
            this.end_pos = arg.__end_pos;
        }
        return this;
    }
    setThis(arg) {
        if (arg && arg.__end_pos && this.begin_pos == -1) {
            this.begin_pos = arg.__begin_pos;
            this.end_pos = arg.__end_pos;
        }
        return this;
    }
    valueOf() { return this.desc; }
};


class ARG {
    constructor(name, type, comment, default_value) {
        this.name = name;
        this.type = type;
        this.comment = comment;
        this.default_value = default_value;
    }
};


class FUNCTION extends MODEL {
    getType() { return "FUNCTION"; }
};

class TRANSITION extends MODEL {
    getType() { return "TRANSITION"; }

    IS_RUNNING() { return !this.done(); }
};

class CONFIG extends MODEL {
    PP(name, note) {
        if (pp_is_url) {
            return this.PPURL.apply(this, arguments);
        }
        var id = this.get_id();
        var ret = "";
        ret += "<span title='" + note + "'>" + name + "</span>&lt;\n";
        ret += "<div style='margin-left:1em'>\n";
        var comma = false;
        for (var i = 2; i < arguments.length; i += 2) {
            if (comma) ret += ",<br>";
            comma = true;
            var arg = arguments[i];
            var note = arguments[i + 1];
            if (typeof (arg) == "number") {
                arg = "" + arg;
            } else {
                arg = arg.pp();
            }
            if (arg.indexOf("<br>") == -1 && arg.indexOf("<div") == -1) {
                ret += arg + " /* " + note + " */\n";
            } else {
                ret += "/* " + note + " */<br>\n" + arg;
            }
        }
        ret += "</div>&gt;\n";

        return ret;
    }
    getType() { return "CONFIG"; }
};


class Blade {
    constructor() {
        this.effects_ = [];
    }
    is_on() {
        return STATE_ON;
    }
    num_leds() {
        return STATE_NUM_LEDS;
    }
    addEffect(type, location) {
        console.log("Add effect " + type + " @ " + location);
        this.effects_.push(new BladeEffect(type, micros(), location));
    }
    GetEffects() {
        while (this.effects_.length > 0 && micros() - this.effects_[0].start_micros >= 5000000) {
            this.effects_.shift();
        }
        return this.effects_;
    }
};



function Int(n) { return new IntClass(n); }


function Arg(expected_type, arg, default_arg) {
    //console.log("ARGUMENT: " + expected_type);
   // console.log(arg);
    //if (typeof(arg) == "object") console.log(arg.ID);
    //console.log(default_arg);
    if (arg == undefined) {
        if (typeof (default_arg) == "number") {
            // console.log("DEFAULT ARG" + default_arg);
            return new INTEGER(default_arg);
        }
        if (default_arg != undefined) {
            // This must copy the argument!
            return default_arg;
        }
        throw "Too few arguments";
    }
    if (typeof (arg) != "number" && !arg.getType) {
        throw "What is this?? " + arg;
    }
    if (typeof (arg) != "number" && arg.getType() != expected_type) {
        throw "Expected " + expected_type + " but got " + arg;
    }
    if (expected_type == "INT" || expected_type == "EFFECT" || expected_type == "LOCKUP_TYPE" || expected_type == "ArgumentName") {
        return arg;
    }
    if (expected_type == "COLOR" ||
        expected_type == "FireConfig" ||
        expected_type == "TRANSITION" ||
        expected_type == "FUNCTION") {
        if (typeof (arg) != "object") {
            throw "Expected a " + expected_type;
        }
        return arg;
    }

    throw "Not INT, COLOR, EFFECT, LOCKUP_TYPE, FUNCTION or TRANSITION";
}

function IntArg(arg, def_arg) { return Arg("INT", arg, def_arg); }



class PercentageClass extends MACRO {
    constructor(F, P) {
        super("Returns P % of F.", arguments);
        this.add_arg("F", "FUNCTION", "F");
        this.add_arg("P", "INT", "Percent")
        this.SetExpansion(Mult(this.F.DOCOPY(), Int(this.P * 32768 / 100)));
    }
}


class BladeEffect {
    constructor(type, start_micros, location) {
        this.type = type;
        this.start_micros = start_micros;
        this.location = location;
        this.wavnum = random(10);
    }
};


class OneshotEffectDetector {
    constructor(type) {
        this.last_detected_ = 0;
        if (type.getInteger) {
            type = type.getInteger(0);
        }
        this.type_ = type;
        HandleEffectType(type);
    }
    Detect(blade) {
        var mask = {};
        mask[this.type_] = 1;
        if (this.type_ == EFFECT_CLASH && !(current_style.__handled_types[EFFECT_STAB])) {
            mask[EFFECT_STAB] = 1;
        }

        var effects = blade.GetEffects();
        for (var i = effects.length - 1; i >= 0; i--) {
            if (mask[effects[i].type]) {
                if (effects[i].start_micros == this.last_detected_)
                    return 0;
                this.last_detected_ = effects[i].start_micros;
                last_detected_blade_effect = effects[i];
                return effects[i];
            }
        }
        return 0;
    }
    getDetected(blade) {
        var mask = {};
        mask[this.type_] = 1;
        var effects = blade.GetEffects();
        for (var i = effects.length - 1; i >= 0; i--)
            if (mask[effects[i].type])
                if (effects[i].start_micros == this.last_detected_)
                    return effects[i];
        return 0;
    }
};


function Focus(T) {
    console.log("FOCUS=" + T);
    console.log(T);
    focus_catcher = T;
    focus_trace = [T];
    return T;
}

function StylePtr(T) {
    return T;
}

function Percentage(F, P) {
    return new PercentageClass(F, P);
}

class Parser {/*<大致相当于把光效代码编译的功能>*/
    constructor(str, classes, identifiers) {
        console.log("PARSING: " + str);
        this.str = str;
        this.pos = 0;
        this.classes = classes;
        this.identifiers = identifiers;
    }
    peek() {
        if (this.pos >= this.str.length) return ""
        return this.str[this.pos]
    }
    peek2() {
        if (this.pos + 1 >= this.str.length) return ""
        return this.str[this.pos + 1]
    }
    skipspace() {
        while (true) {
            if (this.peek() == ' ' || this.peek() == '\t' || this.peek() == '\n' || this.peek() == '\r') { this.pos++; continue; }
            if (this.peek() == '/') {
                if (this.peek2() == '*') {
                    this.pos += 2;
                    while (this.pos < this.str.length && !(this.peek() == '*' && this.peek2() == '/')) this.pos++;
                    this.pos += 2;
                    continue;
                }
                if (this.peek2() == '/') {
                    this.pos += 2;
                    while (this.pos < this.str.length && this.peek() != '\n') this.pos++;
                    this.pos++;
                    continue;
                }
            }
            return;
        }
    }

    identifier() {
        var ret = "";
        while (true) {
            var c = this.peek();
            if ((c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (c >= '0' && c <= '9') || c == '_' || c == ':') {
                ret += c;
                this.pos++;
            } else {
                return ret;
            }
        }
    }

    // recursive descent parser
    parse_atom() {
        this.skipspace();
        var start_of_atom = this.pos;
        var id = this.identifier();
        if (id == "") {
            throw "Expected identifier or number";
        }
        if ((id[0] >= '0' && id[0] <= '9')) {
            if (id.slice(0, 2) == "0b") {
                return new BINARY(parseInt(id.slice(2), 2));
            }
            return new INTEGER(parseInt(id));
        }
        this.skipspace();
        var args = 0;
        if (this.peek() == "<") {
            this.pos++;
            this.skipspace();
            args = [null];
            if (this.peek() != '>') {
                while (true) {
                    args.push(this.parse_internal());
                    this.skipspace();
                    if (this.peek() != ',') break;
                    this.pos++;
                }
            }
            if (this.peek() != '>') {
                throw "Missing > or ,";
            }
            this.pos++;
            if (this.peek() == '(' && this.peek2() == ')') {
                this.pos += 2;
            }
        }
        if (this.identifiers[id]) {
            if (args != 0) {
                throw "Unexpected arguments";
            }
            return this.identifiers[id]();
        }
        if (this.classes[id]) {
            //console.log(id);
            //console.log(this.classes[id]);
            //console.log(args);
            if (args == 0) args = [null];
            // var ret = new (Function.prototype.bind.apply(this.classes[id], args));
            var ret;
            try {
                ret = classes[id].apply(args[0], args.slice(1));
            } catch (e) {
                if (typeof (e) == "string")
                    e = new MyError(id + ":" + e);
                if (typeof (e) == "object" && e.constructor == MyError)
                    e.desc = id + ":" + e.desc;
                if (typeof (e) == "object" && e.constructor == MyError && e.end_pos == -1) {
                    e.setBegin(start_of_atom);
                    e.setEnd(this.pos);
                }
                throw e;
            }
            // console.log(ret);
            return ret;
        }
        throw "Unknown identifier:" + id;
    }

    parse_unary() {
        this.skipspace();
        if (this.peek() == '-') {
            this.pos++;
            var ret = this.parse_atom();
            if (ret.getType() != "INT")
                throw "Expected integer, got " + ret.getType();
            ret.value = - ret.value;
            return ret;
        }
        return this.parse_atom();
    }

    parse_internal() {
        var ret = this.parse_unary();
        this.skipspace();
        while (this.peek() == '|') {
            this.pos++;
            ret.value |= this.parse_unary();
            this.skipspace();
        }
        //console.log("PARSE, returns ID " + ret.get_id());
        // console.log(ret);
        //    console.trace();

        return ret;
    }

    parse() {
        var OLD = PushHandledTypes();
        var begin_pos = this.pos;
        var ret = this.parse_internal();

        // secret handshake
        ret.__begin_pos = begin_pos;
        ret.__end_pos = this.pos;
        ret.__handled_types = handled_types;
        ret.__handled_lockups = handled_lockups;
        PopHandledTypes(OLD);

        return ret;
    }
};


var current_clash_value = 0;
var current_clash_strength = 0;

var blade = new Blade();


function AddClash() {
    current_clash_value = 200 + random(1600);
    current_clash_strength = 100 + random(current_clash_value);
    blade.addEffect(EFFECT_CLASH, Math.random() * 0.7 + 0.2);
}



function AddBlast() {
    blade.addEffect(EFFECT_BLAST, Math.random() * 0.7 + 0.2);
}
function AddForce() {
    blade.addEffect(EFFECT_FORCE, Math.random() * 0.7 + 0.2);
}

function AddStab() {
    blade.addEffect(EFFECT_STAB, 1.0);
}
function AddNewfont() {
    blade.addEffect(EFFECT_NEWFONT, Math.random() * 0.7 + 0.2);
}
function AddBoot() {
    blade.addEffect(EFFECT_BOOT, Math.random() * 0.7 + 0.2);
}
function AddPreon() {
    blade.addEffect(EFFECT_PREON, 0.0);
}

function AddIdentifier(name, value) {
    identifiers[name] = value;
}


function StartLockup() {
    STATE_LOCKUP = LOCKUP_NORMAL;
    blade.addEffect(EFFECT_LOCKUP_BEGIN , Math.random() * 0.7 + 0.2);
}

function StopLockup() {
    STATE_LOCKUP =0;
    blade.addEffect( EFFECT_LOCKUP_END, Math.random() * 0.7 + 0.2);
}

function StartDrag() {
    STATE_LOCKUP = LOCKUP_DRAG;
    blade.addEffect( EFFECT_DRAG_BEGIN , 1.0);
}


function StopDrag() {
    STATE_LOCKUP = 0;
    blade.addEffect(EFFECT_DRAG_END, 1.0);
}

function StartLB() {
    STATE_LOCKUP = LOCKUP_LIGHTNING_BLOCK;

}

function StartMelt() {
    STATE_LOCKUP = LOCKUP_MELT;

}


function StopAllLockup() {
    STATE_LOCKUP = 0 ;

}


function DoSwing() {
    document.getElementById('swing_speed_input').value = 600;
}

function StopSwing() {
    setTimeout(function () {
        document.getElementById('swing_speed_input').value = 0;
    },300);
   
}


function OnLockupChange() {
    var select = FIND("LOCKUP");
    if (select) {
        var old = STATE_LOCKUP;
        STATE_LOCKUP = window[select.value];
        if (STATE_LOCKUP && lockups_to_event[STATE_LOCKUP]) {
            blade.addEffect(lockups_to_event[STATE_LOCKUP][0], Math.random() * 0.7 + 0.2);
        } else if (old && lockups_to_event[old]) {
            blade.addEffect(lockups_to_event[old][1], Math.random() * 0.7 + 0.2);
        }
    }
}

