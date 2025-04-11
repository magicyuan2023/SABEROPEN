
var all_colors = {};
var colorNames = {};




function FixColor(c) {
    return min(65535, Math.floor(Math.pow(parseInt(c, 16) / 255.0, 2.2) * 65536));
}

function hex2(N) {
    var ret = N.toString(16);
    if (ret.length < 2) ret = "0" + ret;
    return ret;
}


function f(n, C, MAX) {
    var k = n % 6;
    var x = MAX - C * clamp(min(k, 4 - k), 0, 1);
    return x * 255.0;
}


function UnFixColor(c) {
    return hex2(min(255, Math.floor(Math.pow(parseInt(c) / 65535.0, 1.0 / 2.2) * 255)));
}


function mapcolor(x) {
    x /= 255.0;
    x = Math.pow(x, 1.0 / 2.2);
    return Math.round(x * 255);
}

class RgbClass extends MODEL {
    constructor(r, g, b, a) {//构造函数
        super();
        this.r = IntArg(r) / 255.0;
        this.g = IntArg(g) / 255.0;
        this.b = IntArg(b) / 255.0;
        if (a == undefined) {
            this.a = 1.0;
            this.name = colorNames[r + "," + g + "," + b]
        } else {
            this.a = a;
        }
    }
    run(blade) { }
    getColor(led) {
        return this;
    }
    pp() {
        if (this.name) return this.PPshort(this.name, "Color");
        return this.PPshort("Rgb", "RGB Color",
            Math.round(this.r * 255), "Red component",
            Math.round(this.g * 255), "Green component",
            Math.round(this.b * 255), "Blue component");
    }
    mix(other, blend) {
        var ret = new RgbClass(0, 0, 0);
        ret.r = other.r * blend + this.r * (1.0 - blend);
        ret.g = other.g * blend + this.g * (1.0 - blend);
        ret.b = other.b * blend + this.b * (1.0 - blend);
        ret.a = other.a * blend + this.a * (1.0 - blend);
        return ret;
    }
    multiply(v) {
        var ret = new RgbClass(0, 0, 0);
        ret.r = this.r * v;
        ret.g = this.g * v;
        ret.b = this.b * v;
        ret.a = this.a * v;
        return ret;
    }
    paintOver(other) {
        var ret = new RgbClass(0, 0, 0);
        ret.r = this.r * (1.0 - other.a) + other.r;
        ret.g = this.g * (1.0 - other.a) + other.g;
        ret.b = this.b * (1.0 - other.a) + other.b;
        ret.a = this.a * (1.0 - other.a) + other.a;
        return ret;
    }

    // angle = 0 - 98304 (32768 * 3) (non-inclusive)
    rotate(angle) {//可能和旋转角度有关系--旋转角度用于变色
        var H;//具体为何种变量呢？
        if (angle == 0) return this;
        var MAX = max(this.r, this.g, this.b);
        var MIN = min(this.r, this.g, this.b);
        var C = MAX - MIN;
        if (C == 0) return this;  // Can't rotate something without color.
        // Note 16384 = 60 degrees.
        if (this.r == MAX) {
            // r is biggest
            H = (this.g - this.b) / C;
        } else if (this.g == MAX) {
            // g is biggest
            H = (this.b - this.r) / C + 2;
        } else {
            // b is biggest
            H = (this.r - this.g) / C + 4;
        }
        H += angle / 16384.0;
        return new RgbClass(f(5 + H, C, MAX), f(3 + H, C, MAX), f(1 + H, C, MAX));
    }

    argify(state) {
        if (state.color_argument) {
            ret = RgbArg_(ArgumentName(state.color_argument), this);
            state.color_argument = false;
            return ret;
        } else {
            return this;
        }
    }
};


function Rgb(r, g, b) {
    return new RgbClass(r, g, b);
}

function RgbI(r, g, b) {
    return new RgbClass(r * 255, g * 255, b * 255);
}

function Transparent(r, g, b) {
    var ret = Rgb(0, 0, 0)
    ret.a = 0.0;
    return ret;
}

class Rgb16Class extends RgbClass {
    constructor(r, g, b) {
        super(r * 255.0 / 65535.0, g * 255.0 / 65535.0, b * 255.0 / 65535.0);
        //    this.name = colorNames[r+","+g+","+b]
        //    this.name
    }
    run(blade) { }
    getColor(led) {
        return this;
    }

    rotate(angle) {//可能和旋转角度有关系--旋转角度用于变色
        var H;//具体为何种变量呢？
        if (angle == 0) return this;
        var R = this.r * 65535;
        var G = this.g * 65535;
        var B = this.b * 65535;
        var MAX = max(R, G, B);
        var MIN = min(R, G, B);
        var C = MAX - MIN;
        if (C == 0) return this;  // Can't rotate something without color.
        // Note 16384 = 60 degrees.
        if (R == MAX) {
            // r is biggest
            H = (G - B) / C;
        } else if (this.g == MAX) {
            // g is biggest
            H = (B - R) / C + 2;
        } else {
            // b is biggest
            H = (R - G) / C + 4;
        }
        H += angle / 16384.0;
        return new Rgb16Class(f(5 + H, C, MAX), f(3 + H, C, MAX), f(1 + H, C, MAX));
    }

    pp() {
        if (this.name) return this.PPshort(this.name, "Color");
        return this.PPshort("Rgb16", "RGB Color",
            Math.round(this.r * 65535), "Red component",
            Math.round(this.g * 65535), "Green component",
            Math.round(this.b * 65535), "Blue component");
    }
};

function RgbF(r, g, b) {
    return new Rgb16Class(r * 65535, g * 65535, b * 65535);
}


function Rgb16(r, g, b) {
    return new Rgb16Class(r, g, b);
}

class AlphaLClass extends MODEL {
    isEffect() { return this.ALPHA.isEffect(); }
    constructor(COLOR, ALPHA) {
        super("Makes transparent color", Array.from(arguments));
        this.add_arg("COLOR", "COLOR", "COLOR");
        this.add_arg("ALPHA", "FUNCTION", "Alpha function");
    }
    getColor(led) {
        var ret = this.COLOR.getColor(led);
        if (ret == 0) return Transparent(0, 0, 0);
        return ret.multiply(this.ALPHA.getInteger(led) / 32768.0)
    }
    IS_RUNNING() {
        if (this.ALPHA.IS_RUNNING)
            return this.ALPHA.IS_RUNNING();
        if (this.COLOR.IS_RUNNING)
            return this.COLOR.IS_RUNNING();
        return false;
    }
};

function AlphaL(COLOR, ALPHA) {
    return new AlphaLClass(COLOR, ALPHA);
}

class AlphaMixLClass extends MACRO {
    constructor(ARGS) {
        super("Mix and alpha", ARGS);
        this.COLORS = Array.from(ARGS).slice(1);
        this.add_arg("F", "FUNCTION", "0=first color, 32768=last color");
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.SetExpansion(AlphaL(new MixClass(ARGS), this.F.DOCOPY()));
    }
}

function AlphaMixL(F, C1, C2) {
    return new AlphaMixLClass(Array.from(arguments));
};



function ColorArg(arg, def_arg) { return Arg("COLOR", arg, def_arg); }

class RgbArgClass extends MODEL {
    constructor(ARG, N) {
        super("Dynamic Color argument", arguments);
        this.add_arg("ARG", "ArgumentName", "number to return.");
        this.add_arg("DEFAULT", "COLOR", "default.");
    }
    //run(blade) {
    //    super.run(blade);
    //    var d = Math.round(this.DEFAULT.r * 65535) + "," + Math.round(this.DEFAULT.g * 65535) + "," + Math.round(this.DEFAULT.b * 65535);
    //    var v = getARG(this.ARG, d).split(",");
    //    this.value = Rgb16(parseInt(v[0]), parseInt(v[1]), parseInt(v[2]));
    //}
   // getColor(led) { return this.value; }
    getColor(led) { return this.DEFAULT; }
    argify(state) {
        if (state.color_argument == this.ARG) {
            state.color_argument = false;
        }
        return this;
    }
};

function RgbArg_(ARG, COLOR) {
    return new RgbArgClass(ARG, COLOR);
}

var WHITE = Rgb(255, 255, 255);
var RED = Rgb(255, 0, 0);
var GREEN = Rgb(0, 255, 0);
var BLUE = Rgb(0, 0, 255);
var YELLOW = Rgb(255, 255, 0);
var CYAN = Rgb(0, 255, 255);
var MAGENTA = Rgb(255, 0, 255);
var WHITE = Rgb(255, 255, 255);
var BLACK = Rgb(0, 0, 0);
var OrangeRed = Rgb(255, 14, 0);