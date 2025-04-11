
// FUNCTIONS

var BATTERY_LEVEL = 24000

class BatteryLevelClass extends FUNCTION {
    constructor() {
        super("Returns 0-32768 based on battery leve.", []);
    }
    run(blade) { }
    getInteger(led) { return 32768 - ((millis() * 3) & 0x7fff); }
};

function BatteryLevel() {
    return new BatteryLevelClass();
}

class BumpClass extends FUNCTION {
    constructor() {
        super("Function returning a bump shape", arguments);
        this.add_arg("BUMP_POSITION", "FUNCTION", "0=bump at hilt, 32768=bump at tip");
        this.add_arg("BUMP_WIDTH_FRACTION", "FUNCTION", "bump width", Int(16384));
    }
    run(blade) {
        this.BUMP_POSITION.run(blade);
        this.BUMP_WIDTH_FRACTION.run(blade);
        var fraction = this.BUMP_WIDTH_FRACTION.getInteger(0);
        if (fraction == 0) {
            this.mult = 1;
            this.location = -10000;
            return;
        }
        this.mult = 32 * 2.0 * 128 * 32768 / fraction / blade.num_leds();
        this.location = (this.BUMP_POSITION.getInteger(0) * blade.num_leds() * this.mult) / 32768;
    }
    getInteger(led) {
        var dist = Math.abs(led * this.mult - this.location);
        var p = dist >> 7;
        if (p >= 32) return 0;
        var m = dist & 0x3f;
        return blast_hump[p] * (128 - m) + blast_hump[p + 1] * m;
    }
};

function Bump(P, F) {
    return new BumpClass(P, F);
}


class IntClass extends FUNCTION {
    constructor(N) {
        super("Constant integer function", arguments);
        this.add_arg("N", "INT", "number to return.");
    }
    getInteger(led) { return this.N; }
    pp() {
        if (pp_is_url) {
            if (this.super_short_desc) return "$";
            return "Int<" + this.N + ">";
        }
        return this.PPshort("Int<" + this.N + ">", "VALUE");
    }
    argify(state) {
        if (state.int_argument) {
            ret = IntArg_(ArgumentName(state.int_argument), this.N);
            state.int_argument = false;
            return ret;
        } else {
            return this;
        }
    }
};


class IntArgClass extends FUNCTION {
    constructor(ARG, N) {
        super("Dynamic Integer argument", arguments);
        this.add_arg("ARG", "ArgumentName", "argument number.");
        this.add_arg("DEFAULT", "INT", "default.");
    }
    //run(blade) {
    //    super.run(blade);
    //    this.value = parseInt(getARG(this.ARG, "" + this.DEFAULT));
    //}
    getInteger(led) { return this.DEFAULT; }
    //getInteger(led) { return this.value; }
    argify(state) {
        if (state.int_argument == this.ARG) {
            state.int_argument = false;
        }
        return this;
    }
};

function IntArg_(ARG, N) {
    return new IntArgClass(ARG, N);
}



class ChangeSlowlyClass extends FUNCTION {
    constructor(F, SPEED) {
        super("Changes F by no more than SPEED values per second.", arguments);
        this.add_arg("F", "FUNCTION", "Function to moderate");
        this.add_arg("SPEED", "FUNCTION", "maximum change speed");
        this.last_micros = micros();
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var delta = now - this.last_micros;
        if (delta > 1000000) delta = 1;
        this.last_micros = now;
        delta *= this.SPEED.getInteger(0);
        delta /= 1000000;
        var target = this.F.getInteger(0);
        if (delta > Math.abs(this.value - target)) {
            this.value = target;
        } else if (this.value < target) {
            this.value += delta;
        } else {
            this.value -= delta;
        }
    }
    getInteger(led) { return this.value; }
}

function ChangeSlowly(F, SPEED) {
    return new ChangeSlowlyClass(F, SPEED);
}

class IfonClass extends FUNCTION {
    constructor(A, B) {
        super("A if on, B if off.", arguments);
        this.add_arg("A", "FUNCTION", "A");
        this.add_arg("B", "FUNCTION", "B");
    }
    run(blade) {
        this.A.run(blade);
        this.B.run(blade);
        this.on = blade.is_on();
    }
    getInteger(led) {
        if (this.on) return this.A.getInteger(led);
        return this.B.getInteger(led);
    }
};

function Ifon(A, B) { return new IfonClass(A, B); }

class InOutFuncXClass extends FUNCTION {
    constructor(OUT_MILLIS, IN_MILLIS) {
        super("0 when off, 32768 when on, OUT_MILLIS/IN_MILLIS determines speed in between.", arguments);
        this.add_arg("OUT_MILLIS", "FUNCTION", "millis to ramp up");
        this.add_arg("IN_MILLIS", "FUNCTION", "millis to ramp down");
        this.last_micros = 0;
        this.extension = 0.0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var delta = now - this.last_micros;
        this.last_micros = now;
        if (blade.is_on()) {
            if (this.extension == 0.0) {
                this.extension = 0.00001;
            } else {
                this.extension += delta / (this.OUT_MILLIS.getInteger(0) * 1000.0);
                this.extension = Math.min(this.extension, 1.0);
            }
        } else {
            this.extension -= delta / (this.IN_MILLIS.getInteger(0) * 1000.0);
            this.extension = Math.max(this.extension, 0.0);
        }
        this.ret = this.extension * 32768;
    }
    getInteger(led) { return this.ret; }
    argify(status) {
        state.int_argument = IGNITION_TIME_ARG;
        this.OUT_MILLIS = this.OUT_MILLIS.argify(status);

        state.int_argument = RETRACTION_TIME_ARG;
        this.IN_MILLIS = this.IN_MILLIS.argify(status);

        return this;
    }
};

function InOutFuncX(O, I) {
    return new InOutFuncXClass(O, I);
}
function InOutFunc(O, I) {
    return InOutFuncX(Int(O), Int(I));
}

// TODO: InOutFuncTD



class ScaleClass extends FUNCTION {
    constructor(F, A, B) {
        super("Changes values in range 0-32768 to A-B.", arguments);
        this.add_arg("F", "FUNCTION", "input");
        this.add_arg("A", "FUNCTION", "lower output limit");
        this.add_arg("B", "FUNCTION", "upper output limit");
    }
    run(blade) {
        super.run(blade);
        var a = this.A.getInteger(0);
        var b = this.B.getInteger(0);
        this.mul = (b - a);
        this.add = a;
    }
    getInteger(led) {
        return (this.F.getInteger(led) * this.mul >> 15) + this.add;
    }
};

function Scale(F, A, B) { return new ScaleClass(F, A, B); }

class InvertFClass extends MACRO {
    constructor(F) {
        super("Invert input function", arguments);
        this.add_arg("F", "FUNCTION", "Function to invert.");
        this.SetExpansion(Scale(this.F, Int(32768), Int(0)));
    }
};

function InvertF(F) { return new InvertFClass(F); }


class SinClass extends FUNCTION {
    constructor(RPM, LOW, HIGH) {
        super("Pulses between LOW and HIGH RPM times per minute.", arguments);
        this.add_arg("RPM", "FUNCTION", "Revolutions per minute");
        this.add_arg("HIGH", "FUNCTION", "upper output limit", Int(32768));
        this.add_arg("LOW", "FUNCTION", "lower output limit", Int(0));
        this.pos = 0.0;
        this.last_micros = 0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var delta = now - this.last_micros;
        this.last_micros = now;
        this.pos = fract(this.pos + delta / 60000000.0 * this.RPM.getInteger(0));
        var high = this.HIGH.getInteger(0);
        var low = this.LOW.getInteger(0);
        var tmp = Math.sin(this.pos * Math.PI * 2.0) / 2.0;
        this.value = Math.floor((tmp + 0.5) * (high - low) + low);
    }
    getInteger(led) { return this.value; }
};

function Sin(RPM, LOW, HIGH) { return new SinClass(RPM, LOW, HIGH); }

class SawClass extends FUNCTION {
    constructor(RPM, LOW, HIGH) {
        super("Pulses between LOW and HIGH RPM times per minute.", arguments);
        this.add_arg("RPM", "FUNCTION", "Revolutions per minute");
        this.add_arg("HIGH", "FUNCTION", "upper output limit", Int(32768));
        this.add_arg("LOW", "FUNCTION", "lower output limit", Int(0));
        this.pos = 0.0;
        this.last_micros = 0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var delta = now - this.last_micros;
        this.last_micros = now;
        this.pos = fract(this.pos + delta / 60000000.0 * this.RPM.getInteger(0));
        var high = this.HIGH.getInteger(0);
        var low = this.LOW.getInteger(0);
        this.value = low + this.pos * (high - low);
    }
    getInteger(led) { return this.value; }
};

function Saw(RPM, LOW, HIGH) { return new SawClass(RPM, LOW, HIGH); }

const TRIGGER_ATTACK = 0;
const TRIGGER_SUSTAIN = 1;
const TRIGGER_RELEASE = 2;
const TRIGGER_OFF = 3;

class TriggerClass extends FUNCTION {
    constructor(EFFECT, FADE_IN_MILLIS, SUSTAIN_MILLIS, FADE_OUT_MILLIS) {
        super("When EFFECT occors, ramps up to 32768, stays there for SUSTAIN_MILLIS, then ramps down again.", arguments);
        this.add_arg("EFFECT", "EFFECT", "Trigger event");
        this.add_arg("FADE_IN_MILLIS", "FUNCTION", "How long it takes to ramp to 32768");
        this.add_arg("SUSTAIN_MILLIS", "FUNCTION", "Stay at 32768 for this long.");
        this.add_arg("FADE_OUT_MILLIS", "FUNCTION", "How long it takes to ramp back down to zero.");
        this.trigger_state = TRIGGER_OFF;
        console.log("EFFECT INIT");
        this.effect = new OneshotEffectDetector(this.EFFECT);
        this.start_time = 0;
    }
    run(blade) {
        super.run(blade);
        if (this.effect.Detect(blade)) {
            this.start_time = micros();
            this.trigger_state = TRIGGER_ATTACK;
        }
        if (this.trigger_state == this.TRIGGER_OFF) {
            this.value = 0;
            return;
        }
        var t = micros() - this.start_time;
        while (true) {
            var micros_for_state = this.get_millis_for_state() * 1000;
            if (t < micros_for_state) {
                switch (this.trigger_state) {
                    case TRIGGER_ATTACK:
                        this.value = t * 32768.0 / micros_for_state;
                        return;
                    case TRIGGER_SUSTAIN:
                        this.value = 32768;
                        return;
                    case TRIGGER_RELEASE:
                        this.value = 32768 - t * 32768 / micros_for_state;
                        return;
                    case TRIGGER_OFF:
                        this.value = 0;
                        return;
                }
            }
            if (this.TRIGGER_STATE >= 3) throw "Weird state?";
            this.trigger_state++;
            t -= micros_for_state;
            this.start_time += micros_for_state;
        }
    }
    get_millis_for_state() {
        switch (this.trigger_state) {
            case TRIGGER_ATTACK: return this.FADE_IN_MILLIS.getInteger(0);
            case TRIGGER_SUSTAIN: return this.SUSTAIN_MILLIS.getInteger(0);
            case TRIGGER_RELEASE: return this.FADE_OUT_MILLIS.getInteger(0);
            case TRIGGER_OFF:
        }
        return 10000000;
    }
    getInteger(led) { return this.value; }
    IS_RUNNING() {
        return this.trigger_state != TRIGGER_OFF;
    }
};

function Trigger(EFFECT, FADE_IN_MILLIS, SUSTAIN_MILLIS, FADE_OUT_MILLIS) {
    return new TriggerClass(EFFECT, FADE_IN_MILLIS, SUSTAIN_MILLIS, FADE_OUT_MILLIS);
}

class SmoothStepClass extends FUNCTION {
    constructor(POS, WIDTH) {
        super("SmoothStep function", arguments);
        this.add_arg("POS", "FUNCTION", "Position 0=hilt, 32768=tip");
        this.add_arg("WIDTH", "FUNCTION", "Step width 32768=length of blade");
    }
    run(blade) {
        super.run(blade);
        var width = this.WIDTH.getInteger(0);
        if (width == 0) {
            this.mult = 32768;
        } else {
            this.mult = 32768 * 32768 / width / blade.num_leds();
        }
        this.location = blade.num_leds() * this.mult * (this.POS.getInteger(0) - width / 2) / 32768;
    }
    getInteger(led) {
        var x = led * this.mult - this.location;
        if (x < 0) return 0;
        if (x > 32768) return 32768;
        return (((x * x) >> 14) * ((3 << 14) - x)) >> 15;
    }
};

function SmoothStep(POS, WIDTH) { return new SmoothStepClass(POS, WIDTH); }

class RampFClass extends FUNCTION {
    constructor() {
        super("0 at base, 32768 at tip", arguments);
    }
    run(blade) {
        this.num_leds = blade.num_leds();
    }
    getInteger(led) {
        return led * 32768 / this.num_leds;
    }
}

function RampF() {
    return new RampFClass();
}

class MultClass extends FUNCTION {
    constructor(ARGS) {
        super("Multiply values", ARGS);
        this.FUNCTIONS = Array.from(ARGS);
        for (var i = 1; i < this.FUNCTIONS.length + 1; i++)
            this.add_arg("FUNCTION" + i, "FUNCTION", "COLOR " + i);
    }
    getInteger(led) {
        var ret = this.FUNCTIONS[0].getInteger(led);
        for (var i = 1; i < this.FUNCTIONS.length; i++) {
            ret = (ret * this.FUNCTIONS[i].getInteger(led)) >> 15;
        }
        return ret;
    }
}

function Mult(ARGS) {
    return new MultClass(Array.from(arguments));
}


class NoisySoundLevelClass extends FUNCTION {
    constructor() {
        super("Noisy sound level.", arguments);
    }
    run(blade) {
        this.var_ = (Math.random() * Math.random()) * 32768;
    }
    getInteger(led) { return this.var_; }
};

function NoisySoundLevel() { return new NoisySoundLevelClass(); }

class NoisySoundLevelCompatClass extends FUNCTION {
    constructor() {
        super("Noisy sound level.", arguments);
    }
    run(blade) {
        this.var_ = clamp((Math.random() * Math.random()) * 32768 * 2, 0, 32768);
    }
    getInteger(led) { return this.var_; }
};

function NoisySoundLevelCompat() { return new NoisySoundLevelCompatClass(); }

class SmoothSoundLevelClass extends FUNCTION {
    constructor() {
        super("Noisy sound level.", arguments);
        this.var_ = 0.0;
    }
    run(blade) {
        var v = Math.random() * 20000.0;
        v *= v;
        this.var_ = (this.var_ + v) / 100.0;
    }
    getInteger(led) { return this.var_; }
};

function SmoothSoundLevel() { return new SmoothSoundLevelClass(); }

class WavLenClass extends FUNCTION {
    constructor() {
        super("Length of associated wav file in MS", arguments);
        this.add_arg("EFFECT", "EFFECT", "Which effect to get the length of.", EFFECT(EFFECT_NONE));
    }
    getInteger(led) { return 500; }
};

function WavLen(EFFECT) { return new WavLenClass(EFFECT); }

class SwingSpeedXClass extends FUNCTION {
    constructor() {
        super("Swing Speed", arguments);
        this.add_arg("MAX", "FUNCTION", "What swing speed returns 32768.");
        this.var_ = 0.0;
    }
    run(blade) {
        super.run(blade);
        //var speed = get_swing_speed();
        //var v = speed / this.MAX.getInteger(0);
        var iv = parseInt(document.getElementById('swing_speed_input').value);
        var v = iv / this.MAX.getInteger(0);
        this.var_ = clamp(v * 32768, 0, 32768);
    }
    getInteger(led) { return this.var_; }
};

function SwingSpeedX(MAX) { return new SwingSpeedXClass(MAX); }


class ClashImpactFXClass extends FUNCTION {
    constructor(MIN, MAX) {
        super("Returns clash strength.", arguments);
        this.add_arg("MIN", "FUNCTION", "Minimum, translates to zero", Int(200));
        this.add_arg("MAX", "FUNCTION", "Maximum, translates to 32768", Int(1600));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        current_clash_strength = max(current_clash_strength, random(current_clash_value));
        current_clash_value -= random(random(current_clash_value));
        this.value = clamp((current_clash_strength - this.MIN.getInteger(0)) * 32768 / this.MAX.getInteger(0), 0, 32768);
    }
    getInteger(led) {
        return this.value;
    }
};

function ClashImpactFX(MIN, MAX) {
    return new ClashImpactFXClass(MIN, MAX);
}

class ClashImpactFClass extends MACRO {
    constructor(MIN, MAX) {
        super("Returns clash strength.", arguments);
        this.add_arg("MIN", "INT", "Minimum, translates to zero", 200);
        this.add_arg("MAX", "INT", "Maximum, translates to 32768", 1600);
        this.SetExpansion(ClashImpactFX(Int(this.MIN), Int(this.MAX)));
    }
}

function ClashImpactF(MIN, MAX) {
    return new ClashImpactFClass(MIN, MAX);
}

class SwingAccelerationXClass extends FUNCTION {
    constructor() {
        super("Swing Acceleration", arguments);
        this.add_arg("MAX", "FUNCTION", "What swing speed returns 32768.", Int(130));
        this.var_ = 0.0;
    }
    run(blade) {
        super.run(blade);
        var accel = get_swing_accel();
        var v = accel / this.MAX.getInteger(0);
        this.var_ = clamp(v * 32768, 0, 32768);
    }
    getInteger(led) { return this.var_; }
};

function SwingAccelerationX(MAX) { return new SwingAccelerationXClass(MAX); }

class SwingAccelerationClass extends MACRO {
    constructor() {
        super("Swing Speed", arguments);
        this.add_arg("MAX", "INT", "What swing speed returns 32768.", 130);
        this.SetExpansion(SwingAccelerationX(Int(this.MAX)));
    }
};

function SwingAcceleration(MAX) { return new SwingAccelerationClass(MAX); }


class LayerFunctionsClass extends FUNCTION {
    constructor(ARGS) {
        super("Mix functions", ARGS);
        this.LAYERS = Array.from(ARGS);
        for (var i = 1; i < this.LAYERS.length + 1; i++)
            this.add_arg("FUNCTION" + i, "FUNCTION", "COLOR " + i);
    }
    getInteger(led) {
        var ret = 0;
        for (var i = 0; i < this.LAYERS.length; i++) {
            ret = 32768 - ((((32768 - ret) * (32768 - this.LAYERS[i].getInteger(led)))) >> 15);
        }
        return ret;
    }
};

function LayerFunctions(Layer1, Layer2) {
    return new LayerFunctionsClass(Array.from(arguments));
}

class SlowNoiseClass extends FUNCTION {
    constructor(SPEED) {
        super("Returns a value between 0 and 32768, which slowly changes up and down randomly.", Array.from(arguments));
        this.add_arg("SPEED", "FUNCTION", "Change speed");
        this.value = random(32768);
    }
    run(blade) {
        super.run(blade);
        var now = millis();
        var delta = now - this.last_millis;
        this.last_millis = now;
        if (delta > 100) delta = 1;
        var speed = this.SPEED.getInteger(0);
        //    console.log("DELTA = " + delta + " SPEED = " + speed + " VALUE="+this.value);
        while (delta > 0) {
            this.value = clamp(this.value + random(speed * 2 + 1) - speed, 0, 32768);
            delta--;
        }
    }
    getInteger(led) { return this.value; }
};

function SlowNoise(SPEED) {
    return new SlowNoiseClass(SPEED);
}

class IsLessThanClass extends FUNCTION {
    constructor(F, V) {
        super("Returns 32768 if F < V, 0 otherwise.", arguments);
        this.add_arg("F", "FUNCTION", "F");
        this.add_arg("V", "FUNCTION", "V");
    }
    getInteger(led) {
        return this.F.getInteger(led) < this.V.getInteger(led) ? 32768 : 0;
    }
};

function IsLessThan(F, V) {
    return new IsLessThanClass(F, V);
}

class IsGreaterThanClass extends MACRO {
    constructor(F, V) {
        super("Returns 32768 if F > V, 0 otherwise.", arguments);
        this.add_arg("F", "FUNCTION", "F");
        this.add_arg("V", "FUNCTION", "V");
        this.SetExpansion(IsLessThan(V, F));
    }
};

function IsGreaterThan(F, V) {
    return new IsGreaterThanClass(F, V);
}

class VariationClass extends FUNCTION {
    constructor() {
        super("Returns the current variation", arguments);
    }
    getInteger(led) {
        return Variant() & 0x7fff;//提取网页界面的Variant值
    }
};

function Variation() {
    return new VariationClass();
}

class EffectPulseFClass extends FUNCTION {
    constructor() {
        super("Generate a pulse every time an effect occurs", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to trigger new random.");
        this.effect = new OneshotEffectDetector(this.EFFECT);
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        if (this.effect.Detect(blade)) {
            this.value = 32768;
        } else {
            this.value = 0;
        }
    }
    getInteger(led) { return this.value; }
};

function EffectPulseF(EFFECT) {
    return new EffectPulseFClass(EFFECT);
}

class IncrementWithResetClass extends FUNCTION {
    constructor(PULSE, RESET_PULSE, MAX, I) {
        super("Increment by I each time PULSE occurs.", arguments);
        this.add_arg("PULSE", "FUNCTION", "Pulse.");
        this.add_arg("RESET_PULSE", "FUNCTION", "Reset pulse.", Int(0));
        this.add_arg("MAX", "FUNCTION", "Max value", Int(32768));
        this.add_arg("I", "FUNCTION", "Increment", Int(1));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        if (this.RESET_PULSE.getInteger(0)) {
            this.value = 0;
        }
        if (this.PULSE.getInteger(0)) {
            this.value = min(this.value + this.I.getInteger(0), this.MAX.getInteger(0));;
        }
    }
    getInteger(led) { return this.value; }
}

function IncrementWithReset(PULSE, RESET_PULSE, MAX, I) {
    return new IncrementWithResetClass(PULSE, RESET_PULSE, MAX, I);
}

class IncrementModuloFClass extends FUNCTION {
    constructor(PULSE, MAX, I) {
        super("Increment by I each time PULSE occurs.", arguments);
        this.add_arg("PULSE", "FUNCTION", "Pulse.");
        this.add_arg("MAX", "FUNCTION", "Max value", Int(32768));
        this.add_arg("I", "FUNCTION", "Increment", Int(1));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        if (this.PULSE.getInteger(0)) {
            this.value = (this.value + this.I.getInteger(0)) % this.MAX.getInteger(0);
        }
    }
    getInteger(led) { return this.value; }
}

function IncrementModuloF(PULSE, MAX, I) {
    return new IncrementModuloFClass(PULSE, MAX, I);
}

class ThresholdPulseFClass extends FUNCTION {
    constructor(F, THRESHOLD, HYST_PERCENT) {
        super("Generate a Pulse when F > THRESHOLD.", arguments);
        this.add_arg("F", "FUNCTION", "Input");
        this.add_arg("THRESHOLD", "FUNCTION", "Threshold", Int(32768));
        this.add_arg("HYST_PERCENT", "FUNCTION", "Hysteresis percent", Int(66));
        this.value = 0;
        this.triggered = 0;
    }
    run(blade) {
        super.run(blade);
        var f = this.F.getInteger(0);
        var threshold = this.THRESHOLD.getInteger(0);
        this.value = 0;
        if (this.triggered) {
            if (f < threshold * this.HYST_PERCENT.getInteger(0) / 100) {
                this.triggered = false;
            }
        } else {
            if (f >= threshold) {
                this.triggered = true;
                this.value = 32768;
            }
        }
    }
    getInteger(led) { return this.value; }
}

function ThresholdPulseF(F, THRESHOLD, HYST_PERCENT) {
    return new ThresholdPulseFClass(F, THRESHOLD, HYST_PERCENT);
}

class IncrementFClass extends MACRO {
    constructor(F, V, MAX, I, HYST_PERCENT) {
        super("Increase by I every time F > V.", arguments);
        this.add_arg("F", "FUNCTION", "Input");
        this.add_arg("V", "FUNCTION", "Compare value.", Int(32768));
        this.add_arg("MAX", "FUNCTION", "Max value.", Int(32768));
        this.add_arg("I", "FUNCTION", "Increment", Int(1));
        this.add_arg("HYST_PERCENT", "FUNCTION", "Hysteresis percent", Int(66));
        this.SetExpansion(IncrementModuloF(ThresholdPulseF(this.F, this.V, this.HYST_PERCENT), this.MAX, this.I));
    }
};

function IncrementF(F, V, MAX, I, HYST_PERCENT) {
    return new IncrementFClass(F, V, MAX, I, HYST_PERCENT);
}

class EffectIncrementFClass extends MACRO {
    constructor(EFFECT, MAX, I) {
        super("Increase by I every time F > V.", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to trigger increment.");
        this.add_arg("MAX", "FUNCTION", "Max value.", Int(32768));
        this.add_arg("I", "FUNCTION", "Increment", Int(1));
        this.SetExpansion(IncrementModuloF(EffectPulseF(this.EFFECT), this.MAX, this.I));
    }
};

function EffectIncrementF(EFFECT, MAX, I) {
    return new EffectIncrementFClass(EFFECT, MAX, I);
}

class EffectRandomFClass extends FUNCTION {
    constructor() {
        super("Select a new random value every time an effect occurs", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to trigger new random.");
        this.effect = new OneshotEffectDetector(this.EFFECT);
        this.value = random(32768);
    }
    run(blade) {
        super.run(blade);
        if (this.effect.Detect(blade)) {
            this.value = random(32768);
        }
    }

    getInteger(led) { return this.value; }
};

function EffectRandomF(EFFECT) {
    return new EffectRandomFClass(EFFECT);
}

class EffectPositionClass extends FUNCTION {
    constructor() {
        super("Select a new random value every time an effect occurs", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to trigger new random.", EFFECT(EFFECT_NONE));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        var effect;
        if (this.EFFECT + 0 == 0) {
            effect = last_detected_blade_effect;
        } else {
            var e = new OneshotEffectDetector(this.EFFECT);
            effect = e.Detect(blade);
        }
        if (effect) {
            this.value = effect.location * 32768;
        } else {
            this.value = 0;
        }
    }
    getInteger(led) {
        return this.value;
    }
};

function EffectPosition(EFFECT) {
    return new EffectPositionClass(EFFECT);
}

class TimeSinceEffectClass extends FUNCTION {
    constructor() {
        super("Returns milliseconds since effect occured", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to get time since.", EFFECT(EFFECT_NONE));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        var effect;
        if (this.EFFECT == 0) {
            effect = last_detected_blade_effect;
        } else {
            var e = new OneshotEffectDetector(this.EFFECT);
            effect = e.Detect(blade);
        }
        if (effect) {
            this.value = (micros() - effect.start_micros) / 1000;
        }
    }
    getInteger(led) {
        return this.value;
    }
};

function TimeSinceEffect(EFFECT) {
    return new TimeSinceEffectClass(EFFECT);
}

class WavNumClass extends FUNCTION {
    constructor() {
        super("Returns milliseconds since effect occured", arguments);
        this.add_arg("EFFECT", "EFFECT", "Effect to get time since.", EFFECT(EFFECT_NONE));
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        var effect;
        if (this.EFFECT == 0) {
            effect = last_detected_blade_effect;
        } else {
            var e = new OneshotEffectDetector(this.EFFECT);
            effect = e.Detect(blade);
        }
        if (effect) {
            this.value = effect.wavnum;
        }
    }
    getInteger(led) {
        return this.value;
    }
};

function WavNum(EFFECT) {
    return new WavNumClass(EFFECT);
}

class CenterDistFClass extends FUNCTION {
    constructor(CENTER) {
        super("Distance from center.", arguments);
        this.add_arg("CENTER", "FUNCTION", "Center point", Int(16384));
    }
    run(blade) {
        super.run(blade);
        this.num_leds = blade.num_leds();
    }
    getInteger(led) {
        return Math.abs(led * 32768 / this.num_leds - this.CENTER.getInteger(led));
    }
};

function CenterDistF(CENTER) {
    return new CenterDistFClass(CENTER);
}

class BladeAngleXClass extends FUNCTION {
    constructor() {
        super("Blade Angle", arguments);
        this.add_arg("MIN", "FUNCTION", "What angle returns 0.", Int(0));
        this.add_arg("MAX", "FUNCTION", "What angle returns 0.", Int(32768));
    }
    run(blade) {
        super.run(blade);
        if (IN_FRAME) {
            var min = this.MIN.getInteger(0);
            var max = this.MAX.getInteger(0);
            var v = fract((BLADE_ANGLE + Math.PI / 2) / Math.PI);
            if (v > 1) v = 2 - v;
            v *= 32768.0;
            this.var_ = clamp((v - min) * 32768 / (max - min), 0, 32768);
        } else {
            var v = Math.sin(millis() * Math.PI / 10000.0) / 2.0 + 0.5;
            this.var_ = clamp(v * 32768, 0, 32768);
        }
    }
    getInteger(led) { return this.var_; }
};

function BladeAngleX(MIN, MAX) {
    return new BladeAngleXClass(MIN, MAX);
}

class TwistAngleClass extends FUNCTION {
    constructor() {
        super("Twist Angle", arguments);
        this.add_arg("N", "INT", "Number of up/downs per rotation.", 2);
        this.add_arg("OFFSET", "INT", "Angular offset", 0);
    }
    run(blade) {
        super.run(blade);
        var v = Math.sin(millis() * Math.PI / 3000.0) / 2.0 + 0.5;
        this.var_ = clamp(v * 32768, 0, 32768);
    }
    getInteger(led) { return this.var_; }
};

function TwistAngle(N, OFFSET) {
    return new TwistAngleClass(N, OFFSET);
}


class IntSelectClass extends FUNCTION {
    constructor(ARGS) {
        super("Select number based on function", ARGS);
        this.INTS = Array.from(ARGS).slice(1);
        this.add_arg("F", "FUNCTION", "Selector function");
        for (var i = 1; i <= this.INTS.length; i++)
            this.add_arg("INT" + i, "INT", "Integer " + i);
    }
    run(blade) {
        this.F.run(blade);
        var f = this.F.getInteger(0);
        while (f < 0) f += this.COLORS.length * 256;
        f = f % this.INTS.length;
        this.value = this.INTS[f];
    }
    getInteger(led) {
        return this.value;
    }
};


function IntSelect(ARGS) {
    return new IntSelectClass(Array.from(arguments));
}


class OnSparkFClass extends FUNCTION {
    constructor(T, SPARK_COLOR, MILLIS) {
        super("Returns 32768 on startup and then fades out for 'MILLIS' milliseconds on startup.", arguments);
        this.add_arg("MILLIS", "FUNCTION", "Millis", 200);
        this.on_ = false;
        this.on_millis_ = 0;
    }
    run(blade) {
        super.run(blade);
        var ms = this.MILLIS.getInteger(0);

        var m = millis();
        if (blade.is_on() != this.on_) {
            this.on_ = blade.is_on();
            if (this.on_) this.on_millis_ = m;
        }
        var t = m - this.on_millis_;
        if (t < ms) {
            this.mix_ = 1.0 - t / ms;
        } else {
            this.mix_ = 0.0;
        }
    }
    getInteger(led) {
        return this.mix_ * 32768;
    }
};

function OnSparkF(MILLIS) {
    return new OnSparkFClass(MILLIS);
}



class PulsingFClass extends FUNCTION {
    constructor(PULSE_MILLIS) {
        super("Pulses between 0 and 32768 every M milliseconds", Array.from(arguments));
        this.add_arg("PULSE_MILLIS", "FUNCTION", "M");
    }
    run(blade) {
        super.run(blade)
        this.var_ = 0.5 + 0.5 * Math.sin(millis() * 3.1415 * 2.0 / this.PULSE_MILLIS.getInteger(0));
    }
    getInteger(led) {
        return this.var_ * 32768;
    }
}

function PulsingF(PULSE_MILLIS) {
    return new PulsingFClass(PULSE_MILLIS);
}


class SparkleFClass extends FUNCTION {
    constructor(SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
        super("Sparkles!!", Array.from(arguments));
        this.add_arg("SPARK_CHANCE_PROMILLE", "INT", "Chance of new sparks.", 300);
        this.add_arg("SPARK_INTENSITY", "INT", "Initial spark intensity", 1024);
        this.sparks = new Uint16Array(STATE_NUM_LEDS + 4);
        this.last_update = 0;
    }
    run(blade) {
        super.run(blade);
        var m = millis();
        if (m - this.last_update >= 10) {
            this.last_update = m;
            var fifo = 0
            var N = blade.num_leds();
            for (var i = 2; i <= N + 2; i++) {
                var x = ((this.sparks[i - 1] + this.sparks[i + 1]) * 200 + this.sparks[i] * 570) / 1024;
                this.sparks[i - 1] = fifo;
                fifo = x;
            }
            this.sparks[N] = fifo;
            if (random(1000) < this.SPARK_CHANCE_PROMILLE) {
                this.sparks[random(blade.num_leds()) + 2] += this.SPARK_INTENSITY;
            }
        }
    }
    getInteger(led) {
        return clamp(this.sparks[led + 2], 0, 255) << 7;
    }
}

function SparkleF(SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
    return new SparkleFClass(SPARK_CHANCE_PROMILLE, SPARK_INTENSITY);
}



class StrobeFClass extends FUNCTION {
    constructor(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
        super("Stroboscope effect", arguments);
        this.add_arg("STROBE_FREQUENCY", "FUNCTION", "Strobe frequency.");
        this.add_arg("STROBE_MILLIS", "FUNCTION", "Pulse length in milliseconds.");
        this.strobe_ = false;
        this.strobe_start_ = 0;
    }
    run(blade) {
        super.run(blade);
        var m = millis();
        var strobe_millis = this.STROBE_MILLIS.getInteger(0);
        var strobe_frequency = this.STROBE_FREQUENCY.getInteger(0);
        var timeout = this.strobe_ ? strobe_millis : (1000 / strobe_frequency);
        if (m - this.strobe_start_ > timeout) {
            this.strobe_start_ += timeout;
            if (m - this.strobe_start_ > strobe_millis + (1000 / strobe_frequency))
                this.strobe_start_ = m;
            this.strobe_ = !this.strobe_;
        }
    }
    getInteger(led) {
        return this.strobe_ ? 32768 : 0;
    }
};

function StrobeF(STROBE_FREQUENCY, STROBE_MILLIS) {
    return new StrobeFClass(STROBE_FREQUENCY, STROBE_MILLIS);
}


class RandomBlinkFClass extends FUNCTION {
    constructor(MILLIHZ) {
        super("Blink each LED randomly MILLIHZ times per second.", arguments);
        this.add_arg("MILLIHZ", "FUNCTION", "how often to blink");
        this.last_update = 0;
        this.state = [];
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        if (now - this.last_update > 1000000000 / this.MILLIHZ.getInteger(0)) {
            this.last_update = now;
            for (var i = 0; i < blade.num_leds(); i++) {
                this.state[i] = random(2);
            }
        }
    }

    getInteger(led) {
        return this.state[led] ? 32768 : 0;
    }
};

function RandomBlinkF(millihz) {
    return new RandomBlinkFClass(millihz);
}


class SequenceFClass extends FUNCTION {
    constructor(ARGS) {
        super("Pre-defined sequence of 0 and 32768", ARGS);
        this.add_arg("MILLIS_PER_BIT", "INT", "Milliseconds per bit.");
        this.add_arg("BITS", "INT", "total bits");
        for (var i = 0; i < this.BITS; i += 16) {
            this.add_arg("BITS" + i, "INT", "Bit sequence " + ((i / 16) + 1));
        }
        this.SEQUENCE = Array.from(ARGS).slice(2);
    }
    run(blade) {
        super.run(blade);
        var now = millis();
        var bit = (now / this.MILLIS_PER_BIT) % min(this.BITS, this.SEQUENCE.length * 16);
        this.on = !!(this.SEQUENCE[bit >> 4] >> ((~bit) & 0xf) & 1)
    }
    getInteger(led) {
        return this.on ? 32768 : 0;
    }
};

function SequenceF(MILLIHZ_PER_BIT, BITS, SEQUENCE) {
    return new SequenceFClass(Array.from(arguments));
}


class RandomFClass extends FUNCTION {
    constructor(A, B) {
        super("Random number 0 - 32768.", arguments);
    }
    run(blade) {
        this.var_ = Math.random() * 32768;;
    }
    getInteger(led) {
        return this.var_;
    }
};

function RandomF() {
    return new RandomFClass();
}


class RandomPerLEDFClass extends FUNCTION {
    constructor() {
        super("Returns random 0-32768.", arguments);
    }
    getInteger(led) {
        return random(32768);
    }
};

function RandomPerLEDF() {
    return new RandomPerLEDFClass();
}


class BrownNoiseFClass extends FUNCTION {
    constructor(grade) {
        super("Randomly return values between 0 and 32768, but keeps nearby values similar", Array.from(arguments));
        this.add_arg("GRADE", "FUNCTION", "grade");
    }
    run(blade) {
        super.run(blade);
        this.mix = Math.floor(Math.random() * 32768);
    }
    getInteger(led) {
        var grade = this.GRADE.getInteger(led);
        this.mix += Math.floor(Math.random() * (grade * 2 + 1)) - grade;
        this.mix = clamp(this.mix, 0, 32768);
        return this.mix;
    }
};

function BrownNoiseF(grade) {
    return new BrownNoiseFClass(grade);
}


class HumpFlickerFClass extends FUNCTION {
    constructor(hump_width) {
        super("Picks a random spot for a bump each frame.", Array.from(arguments));
        this.add_arg("hump_width", "INT", "Hump width");
    }
    run(blade) {
        super.run(blade);
        this.pos = Math.floor(Math.random() * blade.num_leds());
    }
    getInteger(led) {
        return clamp(Math.abs(led - this.pos) * 32768 / this.hump_width, 0, 32768);
    }
};

function HumpFlickerF(hump_width) {
    return new HumpFlickerFClass(hump_width);
}


class BlastFClass extends FUNCTION {
    constructor(FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT_ARG) {
        super("Blast effect function", Array.from(arguments));
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("WAVE_SIZE", "INT", "wave size", 100);
        this.add_arg("WAVE_MS", "INT", "wave speed", 400);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
    }
    run(blade) {
        this.T = micros();
        this.num_leds_ = 1.0 * blade.num_leds();
        this.effects_ = blade.GetEffects();
    }
    getInteger(led) {
        var b = 0.0;
        for (var i = 0; i < this.effects_.length; i++) {
            if (this.effects_[i].type != this.EFFECT) continue;
            var T = (this.T - this.effects_[i].start_micros);
            var M = 1000 - T / this.FADEOUT_MS;
            if (M > 0) {
                var dist = Math.abs(this.effects_[i].location - led / this.num_leds_);
                var N = Math.floor(Math.abs(dist - T / (this.WAVE_MS * 1000.0)) * this.WAVE_SIZE);
                if (N < 32) {
                    b += blast_hump[N] * M / 1000.0 / 255.0;
                }
            }
        }
        return clamp(b * 32768, 0, 32768);
    }
};

function BlastF(FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT) {
    return new BlastFClass(FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT);
}


class BlastFadeoutFClass extends FUNCTION {
    constructor(FADEOUT_MS, EFFECT_ARG) {
        super("Fadeout on blast function", Array.from(arguments));
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
    }
    run(blade) {
        super.run(blade);
        this.T = micros();
        this.effects_ = blade.GetEffects();
    }
    getInteger(led) {
        var b = 0.0;
        for (var i = 0; i < this.effects_.length; i++) {
            if (this.effects_[i].type != this.EFFECT) continue;
            var T = (this.T - this.effects_[i].start_micros);
            var M = 1000 - T / this.FADEOUT_MS;
            if (M > 0) {
                b += M / 1000.0;
            }
        }
        return clamp(b * 32768.0, 0, 32768.0);
    }
};

function BlastFadeoutF(FADEOUT_MS, EFFECT) {
    return new BlastFadeoutFClass(FADEOUT_MS, EFFECT);
}


class OriginalBlastFClass extends FUNCTION {
    constructor(BASE, BLAST, EFFECT_ARG) {
        super("Original blast effect", Array.from(arguments));
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
    }
    run(blade) {
        super.run(blade);
        this.T = micros();
        this.num_leds_ = 1.0 * blade.num_leds();
        this.effects_ = blade.GetEffects();
    }
    getInteger(led) {
        var b = 0.0;
        for (var i = 0; i < this.effects_.length; i++) {
            if (this.effects_[i].type != this.EFFECT) continue;
            var x = (this.effects_[i].location - led / this.num_leds_) * 30.0;
            var T = (this.T - this.effects_[i].start_micros);
            var t = 0.5 + T / 200000.0;
            if (x == 0.0) {
                b += 1.0 / (t * t);
            } else {
                b += sin(x / (t * t)) / x;
            }
        }
        return min(b, 1.0) * 32768;
    }
};

function OriginalBlastF(EFFECT) {
    return new OriginalBlastFClass(EFFECT);
}


class BlinkingFClass extends FUNCTION {
    constructor(BLINK_MILLIS, BLINK_PROMILLE) {
        super("Blinks between 0 and 32768", Array.from(arguments));
        this.add_arg("BLINK_MILLIS", "FUNCTION", "milliseconds between blinks");
        this.add_arg("BLINK_PROMILLE", "FUNCTION", "0 = off, 1000 = on");
        this.on_ = false;
        this.pulse_start_micros_ = 0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var pulse_millis = this.BLINK_MILLIS.getInteger(0);
        if (pulse_millis <= 0) return;
        var pulse_progress_micros = now - this.pulse_start_micros_;
        if (pulse_progress_micros > pulse_millis * 1000) {
            // Time to start a new pulse
            if (pulse_progress_micros < pulse_millis * 2000) {
                this.pulse_start_micros_ += pulse_millis * 1000;
            } else {
                this.pulse_start_micros_ = now;
            }
            pulse_progress_micros = now - this.pulse_start_micros_;
        }
        var pulse_progress_promille = pulse_progress_micros / pulse_millis;
        this.value_ = pulse_progress_promille <= this.BLINK_PROMILLE.getInteger(0) ? 32768 : 0;
    }
    getInteger(led) {
        return this.value_;
    }
};

function BlinkingF(BM, BP) {
    return new BlinkingFClass(BM, BP);
}


class InOutHelperFClass extends FUNCTION {
    constructor(T, EXTENSION, OFF_COLOR, ALLOW_DISABLE) {
        super("0=retracted, 32768=extended", arguments);
        this.add_arg("EXTENSION", "FUNCTION", "extension amount");
        this.add_arg("ALLOW_DISABLE", "INT", "allow disable?", 1);
    }
    run(blade) {
        super.run(blade);
        this.thres = (this.EXTENSION.getInteger(0) * blade.num_leds());
    }
    getInteger(led) {
        return 32768 - clamp(this.thres - led * 32768, 0, 32768);
    }
}

function InOutHelperF(EX, AD) {
    return new InOutHelperFClass(EX, AD);
}



class SumClass extends FUNCTION {
    constructor(ARGS) {
        super("Add functions together", ARGS);
        this.F = Array.from(ARGS);
        for (var i = 1; i <= this.F.length; i++) {
            this.add_arg("FUN" + i, "FUNCTION", "Function " + i);
        }
    }
    getInteger(led) {
        var ret = 0;
        for (var i = 0; i < this.F.length; i++) {
            ret += this.F[i].getInteger(led);
        }
        return ret;
    }
}

function Sum(ARGS) {
    return new SumClass(Array.from(arguments));
}

///////

class HoldPeakFClass extends FUNCTION {
    constructor(F, HOLD_MILLIS, SPEED) {
        super("Holds peak values for the given number of millis, then falls at given speed.", arguments);
        this.add_arg("F", "FUNCTION", "Function to process");
        this.add_arg("HOLD_MILLIS", "FUNCTION", "Millis to hold.");
        this.add_arg("SPEED", "FUNCTION", "Decay speed (per second)");
        this.last_micros = micros();
        this.last_peak = 0;
        this.value = 0;
    }
    run(blade) {
        super.run(blade);
        var current = this.F.getInteger(0);
        var hold_millis = this.HOLD_MILLIS.getInteger(0);
        var now = micros();
        var delta = now - this.last_micros;
        this.last_micros = now;
        if (millis() - this.last_peak > hold_millis) {
            if (delta > 1000000) delta = 1;
            delta *= this.SPEED.getInteger(0);
            delta /= 1000000;
            this.value -= delta;
        }
        if (current > this.value) {
            this.value = current;
            this.last_peak = millis();
        }
    }

    getInteger(led) {
        return this.value;
    }
}

function HoldPeakF(F, HOLD_MILLIS, SPEED) {
    return new HoldPeakFClass(F, HOLD_MILLIS, SPEED);
}

///////

class CircularSectionFClass extends FUNCTION {
    constructor(POSITION, FRACTION) {
        super("Circular section", arguments);
        this.add_arg("POSITION", "FUNCTION", "Position of circular secion.");
        this.add_arg("FRACTION", "FUNCTION", "Fraction of circle lit up.");
    }
    run(blade) {
        super.run(blade);
        this.num_leds = blade.num_leds();
        var fraction = this.FRACTION.getInteger(0);
        if (fraction == 32768) {
            this.start = 0;
            this.end = num_leds * 32768;
        } else if (fraction == 0) {
            this.start = 0;
            this.end = 0;
        } else {
            var pos = this.POSITION.getInteger(0);
            this.start = ((pos + 32768 - fraction / 2) & 32767) * this.num_leds;
            this.end = ((pos + fraction / 2) & 32767) * this.num_leds;
        }
        this.num_leds *= 32768;
        //    console.log("START="+this.start+" END="+this.end +" num_leds="+this.num_leds);
    }
    getInteger(led) {
        var led_range = new Range(led * 32768, led * 32768 + 32768);
        var black_mix = 0;
        if (this.start <= this.end) {
            black_mix = (new Range(this.start, this.end).Intersect(led_range)).Size();
        } else {
            black_mix = (new Range(0, this.end).Intersect(led_range)).Size() +
                (new Range(this.start, this.num_leds).Intersect(led_range)).Size();
        }
        //    console.log("BLACK MIX = " + black_mix);
        return black_mix;
    }
}

function CircularSectionF(POSITION, FRACTION) {
    return new CircularSectionFClass(POSITION, FRACTION);
}

///////

class MarbleFClass extends FUNCTION {
    constructor(OFFSET, FRICTION, ACCELERATION, GRAVITY) {
        super("Circular marble simulator.", arguments);
        this.add_arg("OFFSET", "FUNCTION", "Offset");
        this.add_arg("FRICTION", "FUNCTION", "Friction");
        this.add_arg("ACCELERATION", "FUNCTION", "Acceleration");
        this.add_arg("GRAVITY", "FUNCTION", "Gravity");
        this.last_micros = 0;
        this.pos = 0;
        this.value = 0;
        this.pos = 0.0;
        this.speed = 0.0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var delta = now - this.last_micros;
        this.last_micros = now;
        if (delta > 1000000) delta = 1;
        var fraction = delta / 1000000.0;
        var rad = (this.pos + this.OFFSET.getInteger(0) / 32768.0) * Math.PI * 2.0;
        var down = { x: 0.0, y: 1.0, z: 0.0 };
        var gravity = this.GRAVITY.getInteger(0) / 32768.0;
        var accel = (down.y * Math.sin(rad) + down.z * Math.cos(rad)) * gravity;
        accel += this.ACCELERATION.getInteger(0) / 32768.0;
        accel -= this.speed * this.FRICTION.getInteger(0) / 32768.0;
        this.speed += accel * fraction;
        this.pos = fract(this.pos + this.speed * fraction);
        this.value = this.pos * 32768.0;
    }
    getInteger(led) { return this.value; }
};

function MarbleF(OFFSET, FRICTION, ACCELERATION, GRAVITY) {
    return new MarbleFClass(OFFSET, FRICTION, ACCELERATION, GRAVITY);
}

///////

class LinearSectionFClass extends FUNCTION {
    constructor(POSITION, FRACTION) {
        super("Linear section", arguments);
        this.add_arg("POSITION", "FUNCTION", "Position of linear secion.");
        this.add_arg("FRACTION", "FUNCTION", "Fraction lit up.");
    }
    run(blade) {
        super.run(blade);
        var num_leds = blade.num_leds();
        var fraction = this.FRACTION.getInteger(0);
        var pos = this.POSITION.getInteger(0);
        this.range = new Range(clamp((pos - fraction / 2) * num_leds, 0, 32768 * num_leds), clamp((pos + fraction / 2) * num_leds, 0, 32768 * num_leds));
    }
    getInteger(led) {
        var led_range = new Range(led * 32768, led * 32768 + 32768);
        return this.range.Intersect(led_range).Size();
    }
}

function LinearSectionF(POSITION, FRACTION) {
    return new LinearSectionFClass(POSITION, FRACTION);
}