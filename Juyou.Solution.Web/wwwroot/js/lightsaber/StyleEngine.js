
var gl = null;
var shaderProgram = null;
var t = 0.0;

var width;
var height;


// Create n textures of about 1MB each.
function initGL(w,h,code) {   
    var canvas = FIND("canvas_id");
     if (window.devicePixelRatio !== undefined) {
        dpr = window.devicePixelRatio;
    } else {
        dpr = 1;
    }
    if (w) {
        width = w;
    }
    else {
        width = document.body.clientWidth - 10;
    }    
    if (h) {
        height = h;
    }
    else {
        height = document.body.clientHeight - 10;
    }    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';


    gl = canvas.getContext("experimental-webgl", { colorSpace: "srgb", antialias: false });

    if (!gl) {
        throw "Unable to fetch WebGL rendering context for Canvas";
    }
   
    var str = new URL(window.location.href).searchParams.get("S");
    if (!str) {
        var styleV = FIND("style").value;
        if (styleV == null || styleV.length <= 0) {
            if (!code) {
                str = "InOutHelper<SimpleClash<Lockup<Blast<Blue,White>,AudioFlicker<Blue,White>>,White>, 300, 800>";
                FIND("style").value = str;
            }
            else {
                FIND("style").value = code;
            }
        }
    }
    else {
        FIND("style").value = str;
    }

    Run();

    // Bind a vertex buffer with a single triangle
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    var bufferData = new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(shaderProgram.a_position);
    gl.vertexAttribPointer(shaderProgram.a_position, 2, gl.FLOAT, false, 0, 0);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Start the event loop.
    tick();
}

function default_move_matrix() {
    return Matrix.mktranslate(0.00, 0.0, -0.08);
}

var MOVE_MATRIX = default_move_matrix();
var OLD_MOVE_MATRIX = default_move_matrix();
var MOUSE_POSITIONS = [];
var IN_FRAME = false;
var BLADE_ANGLE = 0.0;

function mouse_speed(t1, t2) {
    var dx = MOUSE_POSITIONS[t1 + 0] - MOUSE_POSITIONS[t2 + 0];
    var dy = MOUSE_POSITIONS[t1 + 1] - MOUSE_POSITIONS[t2 + 1];
    var dt = MOUSE_POSITIONS[t1 + 2] - MOUSE_POSITIONS[t2 + 2];
    if (dt == 0) return 0.0;
    return Math.sqrt(dx * dx + dy * dy) / Math.abs(dt);
}

function mouse_move(e) {
    IN_FRAME = true;
    var canvas = FIND("canvas_id");
    var rect = canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    var d = min(h, w);
    var x = (e.clientX - (rect.left + rect.right) / 2.0) / d;
    var y = (e.clientY - (rect.top + rect.bottom) / 2.0) / d;
    var now = actual_millis();
    MOUSE_POSITIONS = MOUSE_POSITIONS.concat([x * 10000, y * 10000, now])
    while (MOUSE_POSITIONS.length > 0 && now - MOUSE_POSITIONS[2] > 100) {
        MOUSE_POSITIONS = MOUSE_POSITIONS.slice(3);
    }

    //  console.log("x = "+x+" y = "+y);
    if (e.shiftKey) {
        MOVE_MATRIX = default_move_matrix();
    } else {
        BLADE_ANGLE = -y;
        MOVE_MATRIX = Matrix.mkzrot(Math.PI / 2.0).mult(Matrix.mkxrot(-y)).mult(Matrix.mkzrot(y));

        MOVE_MATRIX = Matrix.mkyrot(Math.PI / 2.0)
        MOVE_MATRIX = MOVE_MATRIX.mult(Matrix.mktranslate(1.0, 0.04, 0.0));
        MOVE_MATRIX = MOVE_MATRIX.mult(Matrix.mkyrot(-x / 3));
        MOVE_MATRIX = MOVE_MATRIX.mult(Matrix.mktranslate(-1.0, 0.0, 0.0));
        MOVE_MATRIX = MOVE_MATRIX.mult(Matrix.mkzrot(-y));
        MOVE_MATRIX = MOVE_MATRIX.mult(Matrix.mktranslate(-0.17, 0.0, 0.0));
    }
    //  console.log(MOVE_MATRIX.values);
}

function get_swing_speed() {
    var now = actual_millis();
    while (MOUSE_POSITIONS.length > 0 && now - MOUSE_POSITIONS[2] > 100) {
        MOUSE_POSITIONS = MOUSE_POSITIONS.slice(3);
    }
    var len = MOUSE_POSITIONS.length;
    if (len >= 6) {
        return mouse_speed(0, len - 6);
    }
    if (IN_FRAME) return 0.0;
    return Math.sin(millis() * Math.PI / 1000.0) * 250 + 250
}

function get_swing_accel() {
    var now = actual_millis();
    while (MOUSE_POSITIONS.length > 0 && now - MOUSE_POSITIONS[2] > 100) {
        MOUSE_POSITIONS = MOUSE_POSITIONS.slice(3);
    }
    var len = MOUSE_POSITIONS.length;
    if (len >= 6) {
        var speed = mouse_speed(0, len - 6);
        if (MOUSE_POSITIONS.length >= 9) {
            return (speed - mouse_speed(0, Math.floor(len / 6) * 3)) * 2.0;
        }
    }
    if (IN_FRAME) return 0.0;
    return Math.cos(millis() * Math.PI / 500.0) * 100 + 100
}

function mouse_leave(e) {
    console.log("Mouse leave!");
    MOVE_MATRIX = default_move_matrix();
    MOUSE_POSITIONS = [];
    IN_FRAME = false;
}


function compile() {
    // Create a shader that samples a 2D image.
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader,
        FIND("vertex-shader").textContent);
    gl.compileShader(vertexShader);

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    var shader_code = FIND("fragment-shader").textContent;

    variables = [];
    //  shader_code = shader_code.replace("$FUNCTION$", current_style.gencode());
    shader_code = shader_code.replace("$VARIABLES$", variables.join("\n"));
    // console.log(shader_code);

    gl.shaderSource(fragmentShader, shader_code);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {

        var v = shader_code.split("\n");
        for (var i = 0; i < v.length; i++) {
            console.log((i + 1) + ": " + v[i]);
        }
        throw "Could not compile shader:\n\n" + gl.getShaderInfoLog(fragmentShader);
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw "Could not link the shader program!\n\n" + gl.getProgramInfoLog(shaderProgram);
    }
    gl.useProgram(shaderProgram);


}

var varnum = 0;
var variables = [];
var vartypes = {};

function genvar(t) {
    varnum++;
    var variable = "u_" + varnum;
    variables.push("uniform " + t + " " + variable + ";");
    vartypes[variable] = t;
    return variable;
}

function setvar(variable, val) {
    // console.log(variable + " = " + val);
    if (vartypes[variable] == "float") {
        gl.uniform1f(gl.getUniformLocation(shaderProgram, variable), val);
        return;
    }
    if (vartypes[variable] == "int") {
        gl.uniform1i(gl.getUniformLocation(shaderProgram, variable), val);
        return;
    }
    console.log("SETVAR ERROR " + variable);
}

var pp_is_url = 0;
var pp_is_verbose = 0;







EFFECT_ENUM_BUILDER = new EnumBuilder("EFFECT");
EFFECT_ENUM_BUILDER.addValue("EFFECT_NONE", 0);
EFFECT_ENUM_BUILDER.addValue("EFFECT_CLASH");
EFFECT_ENUM_BUILDER.addValue("EFFECT_BLAST");
EFFECT_ENUM_BUILDER.addValue("EFFECT_FORCE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_STAB");
EFFECT_ENUM_BUILDER.addValue("EFFECT_BOOT");
EFFECT_ENUM_BUILDER.addValue("EFFECT_LOCKUP_BEGIN");
EFFECT_ENUM_BUILDER.addValue("EFFECT_LOCKUP_END");
EFFECT_ENUM_BUILDER.addValue("EFFECT_DRAG_BEGIN");
EFFECT_ENUM_BUILDER.addValue("EFFECT_DRAG_END");
EFFECT_ENUM_BUILDER.addValue("EFFECT_PREON");
EFFECT_ENUM_BUILDER.addValue("EFFECT_POSTOFF");
EFFECT_ENUM_BUILDER.addValue("EFFECT_IGNITION");
EFFECT_ENUM_BUILDER.addValue("EFFECT_RETRACTION");
EFFECT_ENUM_BUILDER.addValue("EFFECT_CHANGE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_NEWFONT");
EFFECT_ENUM_BUILDER.addValue("EFFECT_LOW_BATTERY");
EFFECT_ENUM_BUILDER.addValue("EFFECT_POWERSAVE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_BATTERY_LEVEL");
EFFECT_ENUM_BUILDER.addValue("EFFECT_FAST_ON");
EFFECT_ENUM_BUILDER.addValue("EFFECT_STUN");
EFFECT_ENUM_BUILDER.addValue("EFFECT_FIRE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_CLIP_IN");
EFFECT_ENUM_BUILDER.addValue("EFFECT_CLIP_OUT");
EFFECT_ENUM_BUILDER.addValue("EFFECT_RELOAD");
EFFECT_ENUM_BUILDER.addValue("EFFECT_MODE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_RANGE");
EFFECT_ENUM_BUILDER.addValue("EFFECT_EMPTY");
EFFECT_ENUM_BUILDER.addValue("EFFECT_FULL");
EFFECT_ENUM_BUILDER.addValue("EFFECT_JAM");
EFFECT_ENUM_BUILDER.addValue("EFFECT_UNJAM");
EFFECT_ENUM_BUILDER.addValue("EFFECT_PLI_ON");
EFFECT_ENUM_BUILDER.addValue("EFFECT_PLI_OFF");
EFFECT_ENUM_BUILDER.addValue("EFFECT_USER1");
EFFECT_ENUM_BUILDER.addValue("EFFECT_USER2");
EFFECT_ENUM_BUILDER.addValue("EFFECT_USER3");
EFFECT_ENUM_BUILDER.addValue("EFFECT_USER4");
EFFECT_ENUM_BUILDER.addValue("EFFECT_USER5");
EFFECT_ENUM_BUILDER.build();

LOCKUP_ENUM_BUILDER = new EnumBuilder("LOCKUP_TYPE", "SaberBase::");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_NONE", 0);
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_NORMAL");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_DRAG");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_ARMED");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_AUTOFIRE");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_MELT");
LOCKUP_ENUM_BUILDER.addValue("LOCKUP_LIGHTNING_BLOCK");
LOCKUP_ENUM_BUILDER.build();

ArgumentName_ENUM_BUILDER = new EnumBuilder("ArgumentName");
ArgumentName_ENUM_BUILDER.addValue("BASE_COLOR_ARG", 1);
ArgumentName_ENUM_BUILDER.addValue("ALT_COLOR_ARG", 2);
ArgumentName_ENUM_BUILDER.addValue("STYLE_OPTION_ARG", 3);
ArgumentName_ENUM_BUILDER.addValue("IGNITION_OPTION_ARG", 4);
ArgumentName_ENUM_BUILDER.addValue("IGNITION_TIME_ARG", 5);
ArgumentName_ENUM_BUILDER.addValue("IGNITION_DELAY_ARG", 6);
ArgumentName_ENUM_BUILDER.addValue("IGNITION_COLOR_ARG", 7);
ArgumentName_ENUM_BUILDER.addValue("IGNITION_POWER_UP_ARG", 8);
ArgumentName_ENUM_BUILDER.addValue("BLAST_COLOR_ARG", 9);
ArgumentName_ENUM_BUILDER.addValue("CLASH_COLOR_ARG", 10);
ArgumentName_ENUM_BUILDER.addValue("LOCKUP_COLOR_ARG", 11);
ArgumentName_ENUM_BUILDER.addValue("LOCKUP_POSITION_ARG", 12);
ArgumentName_ENUM_BUILDER.addValue("DRAG_COLOR_ARG", 13);
ArgumentName_ENUM_BUILDER.addValue("DRAG_SIZE_ARG", 14);
ArgumentName_ENUM_BUILDER.addValue("LB_COLOR_ARG", 15);
ArgumentName_ENUM_BUILDER.addValue("STAB_COLOR_ARG", 16);
ArgumentName_ENUM_BUILDER.addValue("MELT_SIZE_ARG", 17);
ArgumentName_ENUM_BUILDER.addValue("SWING_COLOR_ARG", 18);
ArgumentName_ENUM_BUILDER.addValue("SWING_OPTION_ARG", 19);
ArgumentName_ENUM_BUILDER.addValue("EMITTER_COLOR_ARG", 20);
ArgumentName_ENUM_BUILDER.addValue("EMITTER_SIZE_ARG", 21);
ArgumentName_ENUM_BUILDER.addValue("PREON_COLOR_ARG", 22);
ArgumentName_ENUM_BUILDER.addValue("PREON_OPTION_ARG", 23);
ArgumentName_ENUM_BUILDER.addValue("PREON_SIZE_ARG", 24);
ArgumentName_ENUM_BUILDER.addValue("RETRACTION_OPTION_ARG", 25);
ArgumentName_ENUM_BUILDER.addValue("RETRACTION_TIME_ARG", 26);
ArgumentName_ENUM_BUILDER.addValue("RETRACTION_DELAY_ARG", 27);
ArgumentName_ENUM_BUILDER.addValue("RETRACTION_COLOR_ARG", 28);
ArgumentName_ENUM_BUILDER.addValue("RETRACTION_COOL_DOWN_ARG", 29);
ArgumentName_ENUM_BUILDER.addValue("POSTOFF_COLOR_ARG", 30);
ArgumentName_ENUM_BUILDER.addValue("OFF_COLOR_ARG", 31);
ArgumentName_ENUM_BUILDER.addValue("OFF_OPTION_ARG", 32);
ArgumentName_ENUM_BUILDER.build();

function effect_to_argument(effect) {
    switch (effect + 0) {
        case EFFECT_CLASH: return CLASH_COLOR_ARG;
        case EFFECT_BLAST: return BLAST_COLOR_ARG;
        case EFFECT_STAB: return STAB_COLOR_ARG;
        case EFFECT_PREON: return PREON_COLOR_ARG;
        case EFFECT_POSTOFF: return POSTOFF_COLOR_ARG;
    }
    return undefined;
}

function lockup_to_argument(effect) {
    switch (effect + 0) {
        case LOCKUP_NORMAL: return LOCKUP_COLOR_ARG;
        case LOCKUP_DRAG: return DRAG_COLOR_ARG;
        case LOCKUP_LIGHTNING_BLOCK: return LB_COLOR_ARG;
    }
    return undefined;
}





function enc(s) {
    return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function encstr(s) {
    return s.replace("\n", "\\n");
}



function AddColor(name, r, g, b) {
    colorNames[r + "," + g + "," + b] = name;
    qlinks.push(mkcolorbutton(name, r, g, b));
    all_colors[name] = new RgbClass(r, g, b);
}







var handled_lockups = {};

function IsHandledLockup(lockup_type) {
    return current_style.__handled_lockups[lockup_type];
}

function HandleLockup(lockup_type) {
    if (lockup_type.getInteger) {
        lockup_type = lockup_type.getInteger(0);
    }
    handled_lockups[lockup_type] = 1;
}


function FIND(id) {
    ret = document.getElementById(id);
    if (!ret) {
        // console.log("Failed to find " + id);
    }
    return ret;
}



var start = new Date().getTime();

var current_focus;
var current_focus_url;
var style_tree;



var classes = {
    AlphaL: AlphaL,
    AlphaMixL: AlphaMixL,
    AudioFlicker: AudioFlicker,
    AudioFlickerL: AudioFlickerL,
    Blast: Blast,
    BlastL: BlastL,
    BlastF: BlastF,
    BlastFadeout: BlastFadeout,
    BlastFadeoutL: BlastFadeoutL,
    BlastFadeoutF: BlastFadeoutF,
    Blinking: Blinking,
    BlinkingL: BlinkingL,
    BlinkingX: BlinkingX,
    BlinkingF: BlinkingF,
    BrownNoiseFlicker: BrownNoiseFlicker,
    BrownNoiseFlickerL: BrownNoiseFlickerL,
    BrownNoiseF: BrownNoiseF,
    ColorCycle: ColorCycle,
    ColorChange: ColorChange,
    ColorSelect: ColorSelect,
    IntSelect: IntSelect,
    ColorSequence: ColorSequence,
    EffectSequence: EffectSequence,
    Cylon: Cylon,
    EasyBlade: EasyBlade,
    FOCUS: Focus,
    FireConfig: FireConfig,
    Gradient: Gradient,
    HumpFlicker: HumpFlicker,
    HumpFlickerL: HumpFlickerL,
    HumpFlickerF: HumpFlickerF,
    IgnitionDelay: IgnitionDelay,
    IgnitionDelayX: IgnitionDelayX,
    RetractionDelay: RetractionDelay,
    RetractionDelayX: RetractionDelayX,
    InOutHelper: InOutHelper,
    InOutHelperX: InOutHelperX,
    InOutHelperL: InOutHelperL,
    InOutHelperF: InOutHelperF,
    InOutSparkTip: InOutSparkTip,
    Layers: Layers,
    LocalizedClash: LocalizedClash,
    LocalizedClashL: LocalizedClashL,
    Lockup: Lockup,
    LockupL: LockupL,
    LockupTr: LockupTr,
    LockupTrL: LockupTrL,
    Mix: Mix,
    OnSpark: OnSpark,
    OnSparkX: OnSparkX,
    OnSparkL: OnSparkL,
    OnSparkF: OnSparkF,
    OriginalBlast: OriginalBlast,
    OriginalBlastL: OriginalBlastL,
    OriginalBlastF: OriginalBlastF,
    Pulsing: Pulsing,
    PulsingX: PulsingX,
    PulsingL: PulsingL,
    PulsingF: PulsingF,
    RandomFlicker: RandomFlicker,
    RandomL: RandomL,
    RandomF: RandomF,
    RandomPerLEDFlicker: RandomPerLEDFlicker,
    RandomPerLEDFlickerL: RandomPerLEDFlickerL,
    RandomPerLEDF: RandomPerLEDF,
    RandomBlink: RandomBlink,
    RandomBlinkX: RandomBlinkX,
    RandomBlinkL: RandomBlinkL,
    RandomBlinkF: RandomBlinkF,
    Remap: Remap,
    Sequence: Sequence,
    SequenceL: SequenceL,
    SequenceF: SequenceF,
    Rgb: Rgb,
    Rgb16: Rgb16,
    SimpleClash: SimpleClash,
    SimpleClashL: SimpleClashL,
    Sparkle: Sparkle,
    SparkleL: SparkleL,
    SparkleF: SparkleF,
    Strobe: Strobe,
    StrobeX: StrobeX,
    StrobeL: StrobeL,
    StrobeF: StrobeF,
    Stripes: Stripes,
    StripesX: StripesX,
    StyleFire: StyleFire,
    StylePtr: StylePtr,
    StyleFirePtr: StyleFirePtr,
    StyleNormalPtr: StyleNormalPtr,
    StyleRainbowPtr: StyleRainbowPtr,
    StyleStrobePtr: StyleStrobePtr,
    StaticFire: StaticFire,
    TransitionLoop: TransitionLoop,
    TransitionLoopL: TransitionLoopL,
    TransitionEffect: TransitionEffect,
    TransitionEffectL: TransitionEffectL,
    MultiTransitionEffect: MultiTransitionEffect,
    MultiTransitionEffectL: MultiTransitionEffectL,
    InOutTr: InOutTr,
    InOutTrL: InOutTrL,

    RotateColorsX: RotateColorsX,
    RotateColors: RotateColors,
    HueX: HueX,
    Hue: Hue,

    TrInstant: TrInstant,
    TrFade: TrFade,
    TrFadeX: TrFadeX,
    TrSmoothFade: TrSmoothFade,
    TrSmoothFadeX: TrSmoothFadeX,
    TrDelay: TrDelay,
    TrDelayX: TrDelayX,
    TrBoing: TrBoing,
    TrBoingX: TrBoingX,
    TrWipe: TrWipe,
    TrWipeX: TrWipeX,
    TrWipeIn: TrWipeIn,
    TrWipeInX: TrWipeInX,
    TrCenterWipe: TrCenterWipe,
    TrCenterWipeX: TrCenterWipeX,
    TrCenterWipeSpark: TrCenterWipeSpark,
    TrCenterWipeSparkX: TrCenterWipeSparkX,
    TrCenterWipeIn: TrCenterWipeIn,
    TrCenterWipeInX: TrCenterWipeInX,
    TrCenterWipeInSpark: TrCenterWipeInSpark,
    TrCenterWipeInSparkX: TrCenterWipeInSparkX,
    TrColorCycle: TrColorCycle,
    TrColorCycleX: TrColorCycleX,
    TrConcat: TrConcat,
    TrJoin: TrJoin,
    TrJoinR: TrJoinR,
    TrRandom: TrRandom,
    TrSelect: TrSelect,
    TrWaveX: TrWaveX,
    TrSparkX: TrSparkX,
    TrWipeSparkTip: TrWipeSparkTip,
    TrWipeSparkTipX: TrWipeSparkTipX,
    TrWipeInSparkTip: TrWipeInSparkTip,
    TrWipeInSparkTipX: TrWipeInSparkTipX,
    TrExtendX: TrExtendX,
    TrExtend: TrExtend,

    BatteryLevel: BatteryLevel,
    Bump: Bump,
    Ifon: Ifon,
    ChangeSlowly: ChangeSlowly,
    InOutFunc: InOutFunc,
    InOutFuncX: InOutFuncX,
    Int: Int,
    IntArg: IntArg_,
    RgbArg: RgbArg_,
    Scale: Scale,
    InvertF: InvertF,
    Sin: Sin,
    Saw: Saw,
    Trigger: Trigger,
    SmoothStep: SmoothStep,
    RampF: RampF,
    Mult: Mult,
    Percentage: Percentage,
    NoisySoundLevel: NoisySoundLevel,
    NoisySoundLevelCompat: NoisySoundLevelCompat,
    SmoothSoundLevel: SmoothSoundLevel,
    SwingSpeedX: SwingSpeedX,
    SwingSpeed: SwingSpeed,
    SwingAccelerationX: SwingAccelerationX,
    SwingAcceleration: SwingAcceleration,
    ClashImpactFX: ClashImpactFX,
    ClashImpactF: ClashImpactF,
    LayerFunctions: LayerFunctions,
    SlowNoise: SlowNoise,
    IsLessThan: IsLessThan,
    IsGreaterThan: IsGreaterThan,
    Variation: Variation,
    BladeAngleX: BladeAngleX,
    BladeAngle: BladeAngle,
    TwistAngle: TwistAngle,
    Sum: Sum,
    HoldPeakF: HoldPeakF,
    ThresholdPulseF: ThresholdPulseF,
    EffectRandomF: EffectRandomF,
    EffectPulseF: EffectPulseF,
    EffectPosition: EffectPosition,
    TimeSinceEffect: TimeSinceEffect,
    WavNum: WavNum,
    CenterDistF: CenterDistF,
    CircularSectionF: CircularSectionF,
    LinearSectionF: LinearSectionF,
    IncrementWithReset: IncrementWithReset,
    IncrementModuloF: IncrementModuloF,
    IncrementF: IncrementF,
    EffectIncrementF: EffectIncrementF,
    MarbleF: MarbleF,

    ResponsiveLockupL: ResponsiveLockupL,
    ResponsiveDragL: ResponsiveDragL,
    ResponsiveMeltL: ResponsiveMeltL,
    ResponsiveLightningBlockL: ResponsiveLightningBlockL,
    ResponsiveClashL: ResponsiveClashL,
    ResponsiveBlastL: ResponsiveBlastL,
    ResponsiveBlastWaveL: ResponsiveBlastWaveL,
    ResponsiveBlastFadeL: ResponsiveBlastFadeL,
    ResponsiveStabL: ResponsiveStabL,

    IgnitionTime: IgnitionTime,
    RetractionTime: RetractionTime,
    WavLen: WavLen,
};


AddIdentifier("RgbCycle", RgbCycle);
AddIdentifier("Rainbow", Rainbow);
AddIdentifier("WHITE", Rgb.bind(null, 255, 255, 255));
AddIdentifier("BLACK", Rgb.bind(null, 0, 0, 0));

AddIdentifier("RED", Rgb.bind(null, 255, 0, 0));
AddIdentifier("GREEN", Rgb.bind(null, 0, 255, 0));
AddIdentifier("BLUE", Rgb.bind(null, 0, 0, 255));
AddIdentifier("YELLOW", Rgb.bind(null, 255, 255, 0));
AddIdentifier("CYAN", Rgb.bind(null, 0, 255, 255));
AddIdentifier("MAGENTA", Rgb.bind(null, 255, 0, 255));
AddIdentifier("WHITE", Rgb.bind(null, 255, 255, 255));
AddIdentifier("BLACK", Rgb.bind(null, 0, 0, 0));

AddIdentifier("AliceBlue", Rgb.bind(null, 223, 239, 255));
AddIdentifier("Aqua", Rgb.bind(null, 0, 255, 255));
AddIdentifier("Aquamarine", Rgb.bind(null, 55, 255, 169));
AddIdentifier("Azure", Rgb.bind(null, 223, 255, 255));
AddIdentifier("Bisque", Rgb.bind(null, 255, 199, 142));
AddIdentifier("Black", Rgb.bind(null, 0, 0, 0));
AddIdentifier("BlanchedAlmond", Rgb.bind(null, 255, 213, 157));
AddIdentifier("Blue", Rgb.bind(null, 0, 0, 255));
AddIdentifier("Chartreuse", Rgb.bind(null, 55, 255, 0));
AddIdentifier("Coral", Rgb.bind(null, 255, 55, 19));
AddIdentifier("Cornsilk", Rgb.bind(null, 255, 239, 184));
AddIdentifier("Cyan", Rgb.bind(null, 0, 255, 255));
AddIdentifier("DarkOrange", Rgb.bind(null, 255, 68, 0));
AddIdentifier("DeepPink", Rgb.bind(null, 255, 0, 75));
AddIdentifier("DeepSkyBlue", Rgb.bind(null, 0, 135, 255));
AddIdentifier("DodgerBlue", Rgb.bind(null, 2, 72, 255));
AddIdentifier("FloralWhite", Rgb.bind(null, 255, 244, 223));
AddIdentifier("Fuchsia", Rgb.bind(null, 255, 0, 255));
AddIdentifier("GhostWhite", Rgb.bind(null, 239, 239, 255));
AddIdentifier("Green", Rgb.bind(null, 0, 255, 0));
AddIdentifier("GreenYellow", Rgb.bind(null, 108, 255, 6));
AddIdentifier("HoneyDew", Rgb.bind(null, 223, 255, 223));
AddIdentifier("HotPink", Rgb.bind(null, 255, 36, 118));
AddIdentifier("Ivory", Rgb.bind(null, 255, 255, 223));
AddIdentifier("LavenderBlush", Rgb.bind(null, 255, 223, 233));
AddIdentifier("LemonChiffon", Rgb.bind(null, 255, 244, 157));
AddIdentifier("LightCyan", Rgb.bind(null, 191, 255, 255));
AddIdentifier("LightPink", Rgb.bind(null, 255, 121, 138));
AddIdentifier("LightSalmon", Rgb.bind(null, 255, 91, 50));
AddIdentifier("LightYellow", Rgb.bind(null, 255, 255, 191));
AddIdentifier("Lime", Rgb.bind(null, 0, 255, 0));
AddIdentifier("Magenta", Rgb.bind(null, 255, 0, 255));
AddIdentifier("MintCream", Rgb.bind(null, 233, 255, 244));
AddIdentifier("MistyRose", Rgb.bind(null, 255, 199, 193));
AddIdentifier("Moccasin", Rgb.bind(null, 255, 199, 119));
AddIdentifier("NavajoWhite", Rgb.bind(null, 255, 187, 108));
AddIdentifier("Orange", Rgb.bind(null, 255, 97, 0));
AddIdentifier("OrangeRed", Rgb.bind(null, 255, 14, 0));
AddIdentifier("PapayaWhip", Rgb.bind(null, 255, 221, 171));
AddIdentifier("PeachPuff", Rgb.bind(null, 255, 180, 125));
AddIdentifier("Pink", Rgb.bind(null, 255, 136, 154));
AddIdentifier("Red", Rgb.bind(null, 255, 0, 0));
AddIdentifier("SeaShell", Rgb.bind(null, 255, 233, 219));
AddIdentifier("Snow", Rgb.bind(null, 255, 244, 244));
AddIdentifier("SpringGreen", Rgb.bind(null, 0, 255, 55));
AddIdentifier("SteelBlue", Rgb.bind(null, 14, 57, 118));
AddIdentifier("Tomato", Rgb.bind(null, 255, 31, 15));
AddIdentifier("White", Rgb.bind(null, 255, 255, 255));
AddIdentifier("Yellow", Rgb.bind(null, 255, 255, 0));



var current_style = InOutHelper(SimpleClash(Lockup(new BlastClass(BLUE, WHITE), new AudioFlickerClass(BLUE, WHITE)), WHITE, 40), 300, 800);
//var current_style = InOutHelper(SimpleClash(Lockup(new BlastClass(new RainbowClass(), WHITE), new AudioFlickerClass(BLUE, WHITE)), WHITE, 40), 300, 800);

var rotate_start;
var last_micros;

var last_style;
var show_style;

var numTick = 0;
var framesPerUpdate = 0;

function drawScene() {//---画LED
    last_micros = current_micros;
    current_micros = actual_millis() * 1000;
    num_leds = blade.num_leds()
    var pixels = new Uint8Array(num_leds * 4 * 2);//显示最基本LCD像素区域
    var S = current_style;
    if (S != last_style) {
        last_style = S;
        if (S.getType) {
            S.set_right_side(current_focus || style_tree)
            if (S.getType() == "TRANSITION") {
                S = TransitionLoop(Rgb(0, 0, 0), TrConcat(TrDelay(500), Rgb(255, 0, 0), S, Rgb(0, 0, 255), TrInstant()));
            }
            if (S.getType() == "FUNCTION") {
                S = Mix(S, Rgb(0, 0, 0), Rgb(255, 255, 255));
            }
        }
        show_style = S;
    } else {
        S = show_style;
    }
    if (S.getColor && S.getType && S.getType() == "COLOR") {
        S.run(blade);
        for (var i = 0; i < num_leds; i++) {//刷新LED的RGB值
            c = S.getColor(i);
            pixels[i * 4 + 0] = Math.round(c.r * 255);//
            pixels[i * 4 + 1] = Math.round(c.g * 255);
            pixels[i * 4 + 2] = Math.round(c.b * 255);
            pixels[i * 4 + 3] = 255;//RGBA 透明度
        }
        if (last_micros != 0) {
            current_micros += (current_micros - last_micros) / 2;
        }
        // console.log(pixels);
        if (framesPerUpdate == 0) {
            S.run(blade);
        }
        for (var i = 0; i < num_leds; i++) {//可能是刷外部光晕
            c = S.getColor(i);
            pixels[i * 4 + 0 + num_leds * 4] = Math.round(c.r * 255);
            pixels[i * 4 + 1 + num_leds * 4] = Math.round(c.g * 255);
            pixels[i * 4 + 2 + num_leds * 4] = Math.round(c.b * 255);
            pixels[i * 4 + 3 + num_leds * 4] = 255;
        }
        S.update_displays();//刷新每个指令的解析页面（位于网页右边）
    }
    // TODO: Generate mipmaps, then adjust level based on distance from blade
    gl.texImage2D(//将BUFF的数据显示在LCD上面
        gl.TEXTURE_2D,
        0,	// level
        gl.RGBA,  // internalFormat
        num_leds, 2,   // width, height
        0,        // border
        gl.RGBA,   // source format
        gl.UNSIGNED_BYTE, // source type
        pixels);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Draw these textures to the screen, offset by 1 pixel increments
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width * dpr, height * dpr);
    gl.clearColor(0.0, 1.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.viewport(0, 0, width * dpr, height * dpr);
    if (STATE_ROTATE) {
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_value"),
            (new Date().getTime() - rotate_start) / 3000.0);
    } else {
        rotate_start = new Date().getTime();
        gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_value"), 0.0);
    }
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_time"),
        (new Date().getTime() - start) / 1000.0);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "l_value"), -4);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "pix_value"), STATE_NUM_LEDS);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_width"), width);
    gl.uniform1f(gl.getUniformLocation(shaderProgram, "u_height"), height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    t += 1;
}


function stopTick() {
    _runtick = false;

}
var _runtick = true;
function startTick() {
    _runtick = true;
    Run();
    tick();
}
var _recordImage = false;
var _image = null;
function recordImage() {
    _recordImage = true;
}
function tick() {//每16毫秒刷新LCD显示屏
    if (_runtick) {
        requestAnimationFrame(tick);
    }
    else {
        return;
    }
    numTick++;
    if (numTick > framesPerUpdate) {
        numTick = 0;
        drawScene();
        if (_recordImage) {
            _image = gl.canvas.toDataURL("image/jpg", 0.9);
            _recordImage = false;
        }
    }
}
var overall_string;



function Run() {
    var sty = FIND("style");
    var err = FIND("error_message");
    var str = sty.value;
    var parser = new Parser(str,
        classes,
        identifiers);
   
    err.innerHTML = "";
    try {
        current_style = parser.parse();
    }
    catch (e) {
        console.log(e);
        console.log(e.stack);
        console.log(typeof (e));
        if (typeof (e) == "string") {

            err.innerHTML = e;
            sty.focus();
            if (sty.type != "hidden") {
                sty.setSelectionRange(parser.pos, parser.pos);
            }
            parser = new Parser("BLACK",
                classes,
                identifiers);
            current_style = parser.parse();
            compile();
            return;
        } else if (typeof (e) == "object" && e.constructor == MyError) {
            err.innerHTML = e.desc;
            sty.focus();
            if (sty.type != "hidden") {
                if (e.begin_pos > -1) {
                    sty.setSelectionRange(e.begin_pos, e.end_pos);
                } else {
                    sty.setSelectionRange(parser.pos, parser.pos);
                }
            }
            parser = new Parser("BLACK",
                classes,
                identifiers);
            current_style = parser.parse();
            compile();
            return;
        } else {
            throw e;
        }
    }
    if (typeof (ReplaceCurrentFocus) != 'undefined' && ReplaceCurrentFocus) {
        ReplaceCurrentFocus(str);
    }
    compile();
}

var ARGUMENTS = ["builtin", "0", "1"];
var default_arguments = [];


function getARG(ARG, DEFAULT) {
    ARG = ARG + 2;
    if (!default_arguments[ARG]) {
       
        updateArgTag(ARG - 2, DEFAULT);
    }
    default_arguments[ARG] = DEFAULT;
    return ARGUMENTS[ARG] || DEFAULT;
}


function updateArgTag(ARG, VALUE) {
    var N = ArgumentName_ENUM_BUILDER.value_to_name[ARG];
    var tag = FIND("ARGSTR_" + N);
    if (!tag) {
        return;
    }
    if (VALUE.search(",") >= 0) {
        console.log("FIXING COLOR VALUE: " + VALUE);
        values = VALUE.split(",")
        VALUE = '#' + UnFixColor(values[0]) + UnFixColor(values[1]) + UnFixColor(values[2]);
    }
    console.log("Setting tag from: " + tag.value + " to " + VALUE);
    tag.value = VALUE;
}


function PopState(event) {
    if (event.state) {
        FIND("style").value = event.state;
        Run();
    }
}



var lockups_to_event = {};
lockups_to_event[LOCKUP_NORMAL] = [EFFECT_LOCKUP_BEGIN, EFFECT_LOCKUP_END];
lockups_to_event[LOCKUP_DRAG] = [EFFECT_DRAG_BEGIN, EFFECT_DRAG_END];


function Variant() {
    return parseInt(FIND("VARIANT").value);
}




function ShouldJoin(layer1, layer2) {
    if (layer1.LAYERS.length == 0) return true;
    if (layer2.LAYERS.length == 0) return true;
    return layer1.LAYERS[0].isEffect() == layer2.LAYERS[0].isEffect();
}

function RecursiveLayerize(node) {
    while (node.isMacro) {
        node = node.expansion;
    }
    if (node.constructor == LayersClass) {
        node.BASE = RecursiveLayerize(node.BASE);
        while (node.BASE.constructor == LayersClass && ShouldJoin(node, node.BASE)) {
            node = new LayersClass([node.BASE.BASE].concat(node.BASE.LAYERS, node.LAYERS));
        }
    }
    return node;
}

function CanLayerize(node) {
    if (!node) return false;
    if (node.constructor == LayersClass) return false;
    while (node.isMacro) {
        node = node.expansion;
    }
    return node.constructor == LayersClass;
}


function ClickPower() {
    STATE_ON = !STATE_ON;
    STATE_LOCKUP = 0;
    var power_button = FIND("POWER_BUTTON");
    if (power_button) {
        power_button.style.backgroundColor = STATE_ON ? "green" : "";
        power_button.style.color = STATE_ON ? "white" : "black";
    }
    console.log("POWER");
    blade.addEffect(STATE_ON ? EFFECT_IGNITION : EFFECT_RETRACTION, Math.random() * 0.7 + 0.2);
}


function checkStateOn() {
    if (!STATE_ON)
        ClickPower();
}

function getImageDataFromGL() {
    if (_image != null) {
        return _image;
    }
    else {
        return gl.canvas.toDataURL("image/jpg", 0.9);
    }
}

function getThumImg() {

    var img = getImageDataFromGL();
    
    var base64 = img.split(',')[1];
    const binaryString = atob(base64); // decoding the base64 string
    const binaryLen = binaryString.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function downloadImage() {
    var image = getImageDataFromGL();

    // 创建一个 a 标签Tag
    aTag = document.createElement('a')
    // 设置文件的下载地址
    aTag.href = image;
    aTag.target = "_blank";
    // 设置保存后的文件名称
    aTag.download = "test.jpg";
    // 给 a 标签添加点击事件
    aTag.click()
}


