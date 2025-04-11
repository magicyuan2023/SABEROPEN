

/*彩虹光效生成的最底层源代码 */
class RainbowClass extends MODEL {
    constructor() {
        super("Scrolling color rainbow", arguments);
    }
    run(blade) {
        this.m = millis();//代码执行的X轴为时间，单位为毫秒
    }
    getColor(led) {
        var rgb = RgbI(max(0.0, sin((this.m * 3.0 + led * 50.0) % 1024.0 * Math.PI * 2.0 / 1000.0)),
            max(0.0, sin((this.m * 3.0 + led * 50.0 + 1024.0 / 3.0) % 1024.0 * Math.PI * 2.0 / 1000.0)),
            max(0.0, sin((this.m * 3.0 + led * 50.0 + 1024.0 * 2.0 / 3.0) % 1024.0 * Math.PI * 2.0 / 1000.0)));
        return rgb.rotate((Variation().getInteger(led) & 0x7fff) * 3);
       
    }

    pp() { return this.PPshort("Rainbow", "Scrolling color rainbow"); }
};

function Rainbow() {
    return new RainbowClass();
}


class ColorCycleClass extends MODEL {
    constructor(COLOR, percentage, rpm,
        ON_COLOR, on_percentage, on_rpm,
        fade_time_millis) {
        super();
        this.COLOR = ColorArg(COLOR);
        this.percentage = IntArg(percentage);
        this.rpm = IntArg(rpm);
        this.ON_COLOR = ColorArg(ON_COLOR, COLOR.DOCOPY());
        this.on_percentage = IntArg(on_percentage, percentage);
        this.on_rpm = IntArg(on_rpm, rpm);
        this.fade_time_millis = IntArg(fade_time_millis, 1);
        this.last_micros_ = 0;
        this.fade_ = 0.0;
        this.pos_ = 0.0;
    }
    run(blade) {
        this.COLOR.run(blade);
        this.ON_COLOR.run(blade);
        var now = millis();
        var delta = now - this.last_micros_;
        this.last_micros_ = now;
        if (delta > 1000) delta = 1;
        var fade_delta = delta / this.fade_time_millis;
        if (!blade.is_on()) fade_delta = - fade_delta;
        this.fade_ = Math.max(0.0, Math.min(1.0, this.fade_ + fade_delta));
        var rpm = this.rpm * (1.0 - this.fade_) + this.on_rpm * this.fade_;
        var percentage = this.percentage * (1.0 - this.fade_) + this.on_percentage * this.fade_;
        this.fraction_ = percentage / 100.0;
        this.pos_ = ((this.pos_ + delta / 60000.0 * rpm) % 1.0);
    }
    getColor(led) {
        var led_range = new Range(led / STATE_NUM_LEDS, (led + 1) / STATE_NUM_LEDS);
        var black_mix = 0.0;
        if (this.pos_ + this.fraction_ < 1.0) {
            black_mix = new Range(this.pos_, this.pos_ + this.fraction_).Intersect(led_range).Size();
        } else {
            black_mix = new Range(this.pos_, 1.0).Intersect(led_range).Size() +
                new Range(0.0, (this.pos_ + this.fraction_) % 1.0).Intersect(led_range).Size();
        }
        black_mix *= STATE_NUM_LEDS;
        var c = this.COLOR.getColor(led);
        var on_c = this.ON_COLOR.getColor(led);
        c = c.mix(on_c, this.fade_);
        c = BLACK.mix(c, black_mix);
        return c;
    }
    pp() {
        return this.PP("ColorCycle", "Rotating beam",
            this.COLOR, "beam color",
            this.percentage, "percentage of blade lit",
            this.rpm, "rotation speed",
            this.ON_COLOR, "beam color when on",
            this.on_percentage, "percentage of blade lit when on",
            this.on_rpm, "rotation speed when on",
            this.fade_time_millis, "time to transition to/from on state");
    }
};

function ColorCycle(COLOR, percentage, rpm,
    ON_COLOR, on_percentage, on_rpm,
    fade_time_millis) {
    return new ColorCycleClass(COLOR, percentage, rpm,
        ON_COLOR, on_percentage, on_rpm,
        fade_time_millis);
}


class CylonClass extends MODEL {
    constructor(COLOR, percentage, rpm,
        ON_COLOR, on_percentage, on_rpm,
        fade_time_millis) {
        super();
        this.COLOR = ColorArg(COLOR);
        this.percentage = IntArg(percentage);
        this.rpm = IntArg(rpm);
        this.ON_COLOR = ColorArg(ON_COLOR, COLOR.DOCOPY());
        this.on_percentage = IntArg(on_percentage, percentage);
        this.on_rpm = IntArg(on_rpm, rpm);
        this.fade_time_millis = IntArg(fade_time_millis, 1);
        this.last_micros_ = 0;
        this.fade_ = 0.0;
        this.pos_ = 0.0;
    }
    run(blade) {
        this.COLOR.run(blade);
        this.ON_COLOR.run(blade);
        var now = millis();
        var delta = now - this.last_micros_;
        this.last_micros_ = now;
        if (delta > 1000) delta = 1;
        var fade_delta = delta / this.fade_time_millis;
        if (!blade.is_on()) fade_delta = - fade_delta;
        this.fade_ = Math.max(0.0, Math.min(1.0, this.fade_ + fade_delta));
        // setvar(this.MIX, this.fade_);
        var rpm = this.rpm * (1.0 - this.fade_) + this.on_rpm * this.fade_;
        var percentage = this.percentage * (1.0 - this.fade_) + this.on_percentage * this.fade_;
        this.fraction_ = percentage / 100.0;
        // TODO: FIXME THIS SHOULD BE SIN()
        this.pos_ = (this.pos_ + delta / 60000.0 * rpm) % 1.0;
        this.POS = (Math.sin(this.pos_ * Math.PI * 2.0) + 1.0) * (0.5 - percentage / 200.0);
    }
    getColor(led) {
        var led_range = new Range(led / STATE_NUM_LEDS, (led + 1) / STATE_NUM_LEDS);
        var black_mix = new Range(this.POS, this.POS + this.fraction_).Intersect(led_range).Size();
        black_mix *= STATE_NUM_LEDS;
        var c = this.COLOR.getColor(led);
        var on_c = this.ON_COLOR.getColor(led);
        c = c.mix(on_c, this.fade_);
        c = BLACK.mix(c, black_mix);
        return c;
    }
    pp() {
        return this.PP("Cylon", "Rotating beam",
            this.COLOR, "beam color",
            this.percentage, "percentage of blade lit",
            this.rpm, "rotation speed",
            this.ON_COLOR, "beam color when on",
            this.on_percentage, "percentage of blade lit when on",
            this.on_rpm, "rotation speed when on",
            this.fade_time_millis, "time to transition to/from on state");
    }
};

function Cylon(COLOR, percentage, rpm,
    ON_COLOR, on_percentage, on_rpm,
    fade_time_millis) {
    return new CylonClass(COLOR, percentage, rpm,
        ON_COLOR, on_percentage, on_rpm,
        fade_time_millis);
}


class OnSparkXClass extends MACRO {
    constructor(T, SPARK_COLOR, MILLIS) {
        super("Shows the spark color for 'MILLIS' milliseconds on startup.", arguments);
        this.add_arg("T", "COLOR", "Base color");
        this.add_arg("SPARK_COLOR", "COLOR", "Spark color", WHITE.DOCOPY());
        this.add_arg("MILLIS", "FUNCTION", "Millis", Int(200));
        this.SetExpansion(Layers(T, OnSparkL(this.SPARK_COLOR, this.MILLIS)));
    }
};

function OnSparkX(T, SPARK_COLOR, MILLIS) {
    return new OnSparkXClass(T, SPARK_COLOR, MILLIS);
}

class OnSparkClass extends MACRO {
    constructor(T, SPARK_COLOR, MILLIS) {
        super("Shows the spark color for 'MILLIS' milliseconds on startup.", arguments);
        this.add_arg("T", "COLOR", "Base color");
        this.add_arg("SPARK_COLOR", "COLOR", "Spark color", WHITE.DOCOPY());
        this.add_arg("MILLIS", "INT", "Millis", 200);
        this.SetExpansion(OnSparkX(T, this.SPARK_COLOR, Int(this.MILLIS)));
    }
};

function OnSpark(T, SPARK_COLOR, MILLIS) {
    return new OnSparkClass(T, SPARK_COLOR, MILLIS);
}



class PulsingXClass extends MACRO {
    constructor(COLOR1, COLOR2, PULSE_MILLIS) {
        super("Pulses between A and B every M milliseconds", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "A");
        this.add_arg("COLOR2", "COLOR", "B");
        this.add_arg("PULSE_MILLIS", "FUNCTION", "M");
        this.SetExpansion(Layers(COLOR1, PulsingL(COLOR2, PULSE_MILLIS)));
    }
}

function PulsingX(COLOR1, COLOR2, PULSE_MILLIS) {
    return new PulsingXClass(COLOR1, COLOR2, PULSE_MILLIS);
}

class PulsingClass extends MACRO {
    constructor(COLOR1, COLOR2, PULSE_MILLIS) {
        super("Pulses between A and B every M milliseconds", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "A");
        this.add_arg("COLOR2", "COLOR", "B");
        this.add_arg("PULSE_MILLIS", "INT", "M");
        this.SetExpansion(PulsingX(COLOR1, COLOR2, Int(PULSE_MILLIS)));
    }
}

function Pulsing(COLOR1, COLOR2, PULSE_MILLIS) {
    return new PulsingClass(COLOR1, COLOR2, PULSE_MILLIS);
}


class SparkleClass extends MACRO {
    constructor(BASE, SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
        super("Sparkles!!", Array.from(arguments));
        this.add_arg("BASE", "COLOR", "Normal blade color");
        this.add_arg("SPARKLE_COLOR", "COLOR", "Spark color", Rgb(255, 255, 255));
        this.add_arg("SPARK_CHANCE_PROMILLE", "INT", "Chance of new sparks.", 300);
        this.add_arg("SPARK_INTENSITY", "INT", "Initial spark intensity", 1024);
        this.SetExpansion(Layers(BASE, SparkleL(this.SPARKLE_COLOR, this.SPARK_CHANCE_PROMILLE, this.SPARK_INTENSITY)));
    }
}

function Sparkle(BASE, SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
    return new SparkleClass(BASE, SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY);
}

class StrobeXClass extends MACRO {
    constructor(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
        super("Stroboscope effect", arguments);
        this.add_arg("T", "COLOR", "Base color");
        this.add_arg("STROBE_COLOR", "COLOR", "Strobe color");
        this.add_arg("STROBE_FREQUENCY", "FUNCTION", "Strobe frequency.");
        this.add_arg("STROBE_MILLIS", "FUNCTION", "Pulse length in milliseconds.");
        this.SetExpansion(Layers(T, StrobeL(STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS)));
    }
};

function StrobeX(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
    return new StrobeXClass(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS);
}

class StrobeClass extends MACRO {
    constructor(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
        super("Stroboscope effect", arguments);
        this.add_arg("T", "COLOR", "Base color");
        this.add_arg("STROBE_COLOR", "COLOR", "Strobe color");
        this.add_arg("STROBE_FREQUENCY", "INT", "Strobe frequency.");
        this.add_arg("STROBE_MILLIS", "INT", "Pulse length in milliseconds.");
        this.SetExpansion(StrobeX(T, STROBE_COLOR, Int(STROBE_FREQUENCY), Int(STROBE_MILLIS)));
    }
};

function Strobe(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
    return new StrobeClass(T, STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS);
}

class GradientClass extends MODEL {
    constructor(COLORS) {
        super("COLOR2 at base, COLOR2 at tip, smooth gradient in between.", COLORS);
        this.COLORS = COLORS;
        for (var i = 0; i < this.COLORS.length; i++)
            this.add_arg("COLOR" + (i + 1), "COLOR", "COLOR " + (i + 1));
    }
    run(blade) {
        for (var i = 0; i < this.COLORS.length; i++)
            this.COLORS[i].run(blade);
        this.num_leds_ = 1.0 * blade.num_leds();
    }
    getColor(led) {
        var pos = led / this.num_leds_ * (this.COLORS.length - 1);
        var N = min(this.COLORS.length - 2, Math.floor(pos));
        return this.COLORS[N].getColor(led).mix(this.COLORS[N + 1].getColor(led), pos - N);
    }
};

function Gradient(A, B, C, D) {
    return new GradientClass(Array.from(arguments));
}


class MixClass extends MODEL {
    constructor(ARGS) {
        super("Mix between colors", ARGS);
        this.COLORS = Array.from(ARGS).slice(1);
        this.add_arg("F", "FUNCTION", "0=first color, 32768=last color");
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
    }
    run(blade) {
        this.F.run(blade);
        for (var i = 0; i < this.COLORS.length; i++)
            this.COLORS[i].run(blade);
    }
    getColor(led) {
        var v = this.F.getInteger(led);
        var pos = max(0, min(32768, v)) * (this.COLORS.length - 1) / 32768;
        var N = min(this.COLORS.length - 2, Math.floor(pos));
        return this.COLORS[N].getColor(led).mix(this.COLORS[N + 1].getColor(led), pos - N);
    }
};

function Mix(F, C1, C2) {
    return new MixClass(Array.from(arguments));
};

class IgnitionDelayXClass extends MODEL {
    constructor(DELAY_MILLIS, BASE) {
        super("Delays ignition by DELAY_MILLIS", Array.from(arguments));
        this.add_arg("DELAY_MILLIS", "FUNCTION", "Ignition delay, in milliseconds");
        this.add_arg("BASE", "COLOR", "Blade style");
    }
    is_on() {
        return this.is_on_;
    }
    num_leds() {
        return this.blade.num_leds()
    }
    GetEffects() { return this.blade.GetEffects(); }
    run(blade) {
        this.DELAY_MILLIS.run(blade);
        var delay_millis = this.DELAY_MILLIS.getInteger(0);
        this.blade = blade;
        if (blade.is_on()) {
            if (!this.waiting) {
                this.waiting = true;
                this.wait_start_time = millis();
            }
            var waited = millis() - this.wait_start_time;
            if (waited > delay_millis) {
                this.is_on_ = true;
                this.wait_start_time = millis() - delay_millis - 1;
            }
        } else {
            this.waiting = false;
            this.is_on_ = false;
        }
        this.BASE.run(this)
    }
    getColor(led) {
        return this.BASE.getColor(led);
    }
}

function IgnitionDelayX(millis, base) {
    return new IgnitionDelayXClass(millis, base);
}

class IgnitionDelayClass extends MACRO {
    constructor(DELAY_MILLIS, BASE) {
        super("Delays ignition by DELAY_MILLIS", Array.from(arguments));
        this.add_arg("DELAY_MILLIS", "INT", "Ignition delay, in milliseconds");
        this.add_arg("BASE", "COLOR", "Blade style");
        this.SetExpansion(IgnitionDelayX(Int(DELAY_MILLIS), BASE));
    }
}

function IgnitionDelay(millis, base) {
    return new IgnitionDelayClass(millis, base);
}

class RetractionDelayXClass extends MODEL {
    constructor(DELAY_MILLIS, BASE) {
        super("Delays retraction by DELAY_MILLIS", Array.from(arguments));
        this.add_arg("DELAY_MILLIS", "FUNCTION", "Ignition delay, in milliseconds");
        this.add_arg("BASE", "COLOR", "Blade style");
    }
    is_on() {
        return this.is_on_;
    }
    num_leds() {
        return this.blade.num_leds()
    }
    GetEffects() { return this.blade.GetEffects(); }
    run(blade) {
        this.DELAY_MILLIS.run(blade);
        var delay_millis = this.DELAY_MILLIS.getInteger(0);
        this.blade = blade;
        if (!blade.is_on()) {
            if (!this.waiting) {
                this.waiting = true;
                this.wait_start_time = millis();
            }
            var waited = millis() - this.wait_start_time;
            if (waited > delay_millis) {
                this.is_on_ = false;
                this.wait_start_time = millis() - delay_millis - 1;
            }
        } else {
            this.waiting = false;
            this.is_on_ = true;
        }
        this.BASE.run(this)
    }
    getColor(led) {
        return this.BASE.getColor(led);
    }
}

function RetractionDelayX(millis, base) {
    return new RetractionDelayXClass(millis, base);
}

class RetractionDelayClass extends MACRO {
    constructor(DELAY_MILLIS, BASE) {
        super("Delays retraction by DELAY_MILLIS", Array.from(arguments));
        this.add_arg("DELAY_MILLIS", "INT", "Ignition delay, in milliseconds");
        this.add_arg("BASE", "COLOR", "Blade style");
        this.SetExpansion(RetractionDelayX(Int(DELAY_MILLIS), BASE));
    }
}
function RetractionDelay(millis, base) {
    return new RetractionDelayClass(millis, base);
}


class RandomBlinkXClass extends MACRO {
    constructor(MILLIHZ, COLOR1, COLOR2) {
        super("Blink each LED randomly MILLIHZ times per second.", arguments);
        this.add_arg("MILLIHZ", "FUNCTION", "how often to blink");
        this.add_arg("COLOR1", "COLOR", "first color", WHITE.DOCOPY());
        this.add_arg("COLOR2", "COLOR", "second color", BLACK.DOCOPY());
        this.SetExpansion(Layers(this.COLOR1, RandomBlinkL(this.MILLIHZ, this.COLOR2)));
    }
};

function RandomBlinkX(millihz, c1, c2) {
    return new RandomBlinkXClass(millihz, c1, c2);
}

class RandomBlinkClass extends MACRO {
    constructor(MILLIHZ, COLOR1, COLOR2) {
        super("Blink each LED randomly MILLIHZ times per second.", arguments);
        this.add_arg("MILLIHZ", "INT", "how often to blink");
        this.add_arg("COLOR1", "COLOR", "first color", WHITE.DOCOPY());
        this.add_arg("COLOR2", "COLOR", "second color", BLACK.DOCOPY());
        this.SetExpansion(RandomBlinkX(Int(this.MILLIHZ), this.COLOR1, this.COLOR2));
    }
};

function RandomBlink(MILLIHZ, COLOR1, COLOR2) {
    return new RandomBlinkClass(MILLIHZ, COLOR1, COLOR2);
}


class SequenceClass extends MACRO {
    constructor(ARGS) {
        super("Pre-defined sequence", ARGS);
        this.add_arg("COLOR1", "COLOR", "Color if bit is 1");
        this.add_arg("COLOR2", "COLOR", "Color if bit is 0");
        this.add_arg("MILLIS_PER_BIT", "INT", "Milliseconds per bit.");
        this.add_arg("BITS", "INT", "total bits");
        for (var i = 0; i < this.BITS; i += 16) {
            this.add_arg("BITS" + i, "INT", "Bit sequence " + ((i / 16) + 1));
        }
        this.SetExpansion(Layers(this.COLOR2, new SequenceLClass([this.COLOR1].concat(ARGS.slice(2)))));
    }
};

function Sequence(COLOR1, COLOR2, MILLIHZ_PER_BIT, BITS, SEQUENCE) {
    return new SequenceClass(Array.from(arguments));
}

class ColorSequenceClass extends MODEL {
    constructor(ARGS) {
        super("Pre-defined sequence", ARGS);
        this.add_arg("MILLIS_PER_COLOR", "INT", "Milliseconds before moving to next color.");
        this.COLORS = Array.from(ARGS).slice(1);
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.last_micros = 0;
        this.n = 0;
    }
    run(blade) {
        super.run(blade);
        var now = micros();
        var millis_per_color = this.MILLIS_PER_COLOR.getInteger(0);
        if (now - this.last_micros > millis_per_color * 1000) {
            if (now - this.last_micros > millis_per_color * 10000) {
                this.n = 0;
                this.last_micros = now;
            } else {
                this.n = (this.n + 1) % this.COLORS.length;
                this.last_micros += millis_per_color * 1000;
            }
        }
    }
    getColor(led) { return this.COLORS[this.n].getColor(led); }
};

function ColorSequence(MPC, C) {
    return new ColorSequenceClass(Array.from(arguments));
};

class EffectSequenceClass extends MODEL {
    constructor(ARGS) {
        super("Sequence that changes on events.", ARGS);
        this.add_arg("EFFECT", "EFFECT", "effect that goes to next color");
        this.COLORS = Array.from(ARGS).slice(1);
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.last_micros = 0;
        this.n = this.COLORS.length - 1;
        this.effect_ = new OneshotEffectDetector(this.EFFECT);
    }
    run(blade) {
        super.run(blade);
        var now = micros();

        if (this.effect_.Detect(blade)) {
            this.n = (this.n + 1) % this.COLORS.length;
        }
    }
    getColor(led) { return this.COLORS[this.n].getColor(led); }
};

function EffectSequence(MPC, C) {
    return new EffectSequenceClass(Array.from(arguments));
};

class StripesXClass extends MODEL {
    constructor(ARGS) {
        super("Configurable rainbow", ARGS);
        this.add_arg("WIDTH", "FUNCTION", "Stripe width");
        this.add_arg("SPEED", "FUNCTION", "Scroll speed");
        this.COLORS = ARGS.slice(2);
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.last_micros = 0;
        this.m = 0;
    }
    run(blade) {
        super.run(blade);
        var now_micros = micros();
        var delta_micros = now_micros - this.last_micros;
        this.last_micros = now_micros;
        this.m = (this.m + delta_micros * this.SPEED.getInteger(0) / 333) % (this.COLORS.length * 341 * 1024);
        this.mult = (50000 * 1024 / this.WIDTH.getInteger(0));
    }
    GET_COLOR(N, led, p, ret) {
        if (N >= this.COLORS.length || p < 0) return;
        if (p > 0 && p < 512) {
            var tmp = this.COLORS[N].getColor(led);
            var mul = sin(p * Math.PI / 512.0);
            ret.r += tmp.r * mul;
            ret.g += tmp.g * mul;
            ret.b += tmp.b * mul;
        }
        this.GET_COLOR(N + 1, led, p - 341, ret);
    }
    getColor(led) {
        var p = ((this.m + led * this.mult) >> 10) % (this.COLORS.length * 341);
        var ret = Rgb(0, 0, 0);
        this.GET_COLOR(0, led, p, ret);
        this.GET_COLOR(0, led, p + 341 * this.COLORS.length, ret);
        return ret;
    }
}

function StripesX(W, S, C) {
    return new StripesXClass(Array.from(arguments));
}

class StripesClass extends MACRO {
    constructor(ARGS) {
        super("Configurable rainbow", ARGS);
        this.add_arg("WIDTH", "INT", "Stripe width");
        this.add_arg("SPEED", "INT", "Scroll speed");
        this.COLORS = ARGS.slice(2);
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);

        this.SetExpansion(new StripesXClass([Int(this.WIDTH), Int(this.SPEED)].concat(this.COLORS)));
    }
}

function Stripes(W, S, C) {
    return new StripesClass(Array.from(arguments));
}

class AudioFlickerClass extends MACRO {
    constructor(A, B) {
        super("Select between A and B based on audio. Higher volumes means more B.", arguments);
        this.add_arg("A", "COLOR", "A");
        this.add_arg("B", "COLOR", "B");
        this.SetExpansion(Layers(this.A, AudioFlickerL(this.B)));
    }
};

function AudioFlicker(A, B) {
    return new AudioFlickerClass(A, B);
}


class RandomFlickerClass extends MACRO {
    constructor(A, B) {
        super("Selects between A and B randomly.", arguments);
        this.add_arg("A", "COLOR", "A");
        this.add_arg("B", "COLOR", "B");
        this.SetExpansion(Layers(A, RandomL(B)));
    }
};

function RandomFlicker(A, B) {
    return new RandomFlickerClass(A, B);
}


class RandomPerLEDFlickerClass extends MACRO {
    constructor(A, B) {
        super("Selects between A and B randomly.", arguments);
        this.add_arg("A", "COLOR", "A");
        this.add_arg("B", "COLOR", "B");
        this.SetExpansion(Layers(A, RandomPerLEDFlickerL(B)));
    }
};

function RandomPerLEDFlicker(A, B) {
    return new RandomPerLEDFlickerClass(A, B);
}

class RemapClass extends MODEL {
    constructor(F, COLOR) {
        super("Remaps the pixels of COLOR based on F", arguments);
        this.add_arg("F", "FUNCTION", "remap function");
        this.add_arg("COLOR", "COLOR", "COLOR");
    }
    run(blade) {
        super.run(blade);
        this.num_leds = blade.num_leds();
    }
    getColor(led) {
        var pos = this.F.getInteger(led);
        var led = clamp(pos * this.num_leds, 0, this.num_leds * 32768 - 1);
        var fraction = led & 0x7fff;
        led = clamp(led >> 15, 0, this.num_leds);
        return this.COLOR.getColor(led).mix(
            this.COLOR.getColor(min(led + 1, this.num_leds - 1)),
            fraction / 32768);
    }
}

function Remap(F, COLOR) {
    return new RemapClass(F, COLOR);
}


class BrownNoiseFlickerClass extends MACRO {
    constructor(A, B, GRADE) {
        super("Randomly selects between A and B but keeps nearby pixels similar", Array.from(arguments));
        this.add_arg("A", "COLOR", "A");
        this.add_arg("B", "COLOR", "B");
        this.add_arg("GRADE", "INT", "grade");
        this.SetExpansion(Layers(A, BrownNoiseFlickerL(B, Int(this.GRADE * 128))))
    }
};

function BrownNoiseFlicker(A, B, grade) {
    return new BrownNoiseFlickerClass(A, B, grade);
}


class HumpFlickerClass extends MACRO {
    constructor(A, B, hump_width) {
        super("Picks a random spot for a bump each frame.", Array.from(arguments));
        this.add_arg("A", "COLOR", "A");
        this.add_arg("B", "COLOR", "B");
        this.add_arg("hump_width", "INT", "Hump width");
        this.SetExpansion(Layers(A, HumpFlickerL(B, hump_width)));
    }
};

function HumpFlicker(A, B, hump_width) {
    return new HumpFlickerClass(A, B, hump_width);
}

class FireConfigClass extends CONFIG {
    constructor(INTENSITY_BASE, INTENSITY_RAND, COOLING) {
        super("Fire configuration", Array.from(arguments));
        this.add_arg("intensity_base", "INT", "intensity base");
        this.add_arg("intensity_rand", "INT", "intensity random");
        this.add_arg("cooling", "INT", "cooling");
    }
    getType() { return "FireConfig"; }
}

function FireConfig(B, R, C) {
    return new FireConfigClass(B, R, C);
}

function FireConfigI(B, R, C) {
    return new FireConfigClass(new INTEGER(B), new INTEGER(R), new INTEGER(C));
}


class StyleFireClass extends MODEL {
    constructor(COLOR1, COLOR2, DELAY, SPEED, NORM, CLASH, LOCK, OFF) {
        super("Too complicated to describe briefly", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "Warm color");
        this.add_arg("COLOR2", "COLOR", "Hot color");
        this.add_arg("DELAY", "INT", "Delay", 0);
        this.add_arg("SPEED", "INT", "Speed", 2);
        this.add_arg("NORM", "FireConfig", "Config when on", FireConfigI(0, 2000, 5));
        this.add_arg("CLASH", "FireConfig", "Config during clash", FireConfigI(3000, 0, 0));
        this.add_arg("LOCK", "FireConfig", "Config during lockup", FireConfigI(0, 5000, 10));
        this.add_arg("OFF", "FireConfig", "Config when off", FireConfigI(0, 0, this.NORM.cooling.value));
        this.heat = new Uint16Array(STATE_NUM_LEDS + 13);
        this.state = FIRE_STATE_OFF;
        this.last_update = 0;
        this.clash_detector_ = new OneshotEffectDetector(EFFECT_CLASH);
    }
    On(blade) {
        if (!blade.is_on()) {
            this.state = FIRE_STATE_OFF;
            return false;
        }
        if (this.state == FIRE_STATE_OFF) {
            this.state = FIRE_STATE_ACTIVATING;
            this.on_time = millis();
        }
        if (this.state = FIRE_STATE_ACTIVATING) {
            if (millis() - this.on_time < this.DELAY) return false;
            this.state = FIRE_STATE_ON;
        }
        return true;
    }
    run(blade) {//产生LED每一个颗的颜色值
        super.run(blade);
        var m = millis();
        if (m - this.last_update < 10)
            return;
        if (m - this.last_update < 40) {
            this.last_update += 10;;
        } else {
            this.last_update = m;
        }
        var num_leds = blade.num_leds();
        this.num_leds = num_leds;
        var conf = this.OFF;
        if (this.clash_detector_.Detect(blade)) {
            conf = this.CLASH;
        } else if (this.On(blade)) {
            if (STATE_LOCKUP == 0) {
                conf = this.NORM;
            } else {
                conf = this.LOCK;
            }
        }

        for (var i = 0; i < this.SPEED; i++) {
            this.heat[num_leds + i] = conf.intensity_base +
                random(random(random(conf.intensity_rand)));
        }
        for (var i = 0; i < num_leds; i++) {
            var x = (this.heat[i + this.SPEED - 1] * 3 + this.heat[i + this.SPEED] * 10 + this.heat[i + this.SPEED + 1] * 3) >> 4;
            x -= random(conf.cooling);
            this.heat[i] = max(0, min(x, 65535));
        }
    }
    getColor(led) {//获得真正的颜色值
        var h = this.heat[this.num_leds - 1 - led];
        if (h < 256) {
            return BLACK.mix(this.COLOR1.getColor(led), h / 255.0);
        } else if (h < 512) {
            return this.COLOR1.getColor(led).mix(this.COLOR2.getColor(led), (h - 256) / 255.0);
        } else if (h < 768) {
            return this.COLOR2.getColor(led).mix(WHITE, (h - 512) / 255.0);
        } else {
            return WHITE;
        }
    }
};

function StyleFire(COLOR1, COLOR2, DELAY, SPEED, NORM, CLASH, LOCK, OFF) {
    return new StyleFireClass(COLOR1, COLOR2, DELAY, SPEED, NORM, CLASH, LOCK, OFF);
}

class StaticFireClass extends MACRO {
    constructor(COLOR1, COLOR2, DELAY, SPEED, BASE, RAND, COOLING) {
        super("Non-responsive fire style alias.", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "Warm color");
        this.add_arg("COLOR2", "COLOR", "Hot color");
        this.add_arg("DELAY", "INT", "Delay", 0);
        this.add_arg("SPEED", "INT", "Speed", 2);
        this.add_arg("BASE", "INT", "Base", 0);
        this.add_arg("RAND", "INT", "Random", 2000);
        this.add_arg("COOLING", "INT", "Cooling", 5);
        this.SetExpansion(StyleFire(COLOR1, COLOR2, this.DELAY, this.SPEED,
            FireConfig(this.BASE, this.RAND, this.COOLING),
            FireConfig(this.BASE, this.RAND, this.COOLING),
            FireConfig(this.BASE, this.RAND, this.COOLING),
            FireConfig(this.BASE, this.RAND, this.COOLING)));
    }
};

function StaticFire(COLOR1, COLOR2, DELAY, SPEED, BASE, RAND, COOLING) {
    return new StaticFireClass(COLOR1, COLOR2, DELAY, SPEED, BASE, RAND, COOLING);
}

class RgbCycleClass extends MODEL {
    constructor() {
        super();
        this.n = 0;
    }
    run(blade) {
        this.n++;
        if (this.n >= 3) this.n = 0;
        if (this.n == 0) this.RET = Rgb(255, 0, 0);
        if (this.n == 1) this.RET = Rgb(0, 255, 0);
        if (this.n == 2) this.RET = Rgb(0, 0, 250);
    }
    getColor(led) {
        return this.RET;
    }
    pp() {
        return this.PP("RgbCycle", "alternates betwen red, green and blue.");
    }
};

function RgbCycle() {
    return new RgbCycleClass();
}


class BlastClass extends MACRO {
    constructor(BASE, BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT_ARG) {
        super("Blast effect", Array.from(arguments));
        this.add_arg("BASE", "COLOR", "base color");
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("WAVE_SIZE", "INT", "wave size", 100);
        this.add_arg("WAVE_MS", "INT", "wave speed", 400);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(Layers(BASE, BlastL(BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT_ARG)));
    }
};

function Blast(BASE, BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT) {
    return new BlastClass(BASE, BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT);
}


class BlastFadeoutClass extends MACRO {
    constructor(BASE, BLAST, FADEOUT_MS, EFFECT_ARG) {
        super("BlastFadeout effect", Array.from(arguments));
        this.add_arg("BASE", "COLOR", "base color");
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(Layers(BASE, BlastFadeoutL(BLAST, FADEOUT_MS, EFFECT_ARG)));
    }
};

function BlastFadeout(BASE, BLAST, FADEOUT_MS, EFFECT) {
    return new BlastFadeoutClass(BASE, BLAST, FADEOUT_MS, EFFECT);
}


class OriginalBlastClass extends MACRO {
    constructor(BASE, BLAST, EFFECT_ARG) {
        super("Original blast effect", Array.from(arguments));
        this.add_arg("BASE", "COLOR", "base color");
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(Layers(BASE, OriginalBlastL(BLAST, this.EFFECT)));
    }
};

function OriginalBlast(BASE, BLAST, EFFECT) {
    return new OriginalBlastClass(BASE, BLAST, EFFECT);
}


class BlinkingXClass extends MACRO {
    constructor(COLOR1, COLOR2, BLINK_MILLIS, BLINK_PROMILLE) {
        super("Blinks between A and B", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "A");
        this.add_arg("COLOR2", "COLOR", "B");
        this.add_arg("BLINK_MILLIS", "FUNCTION", "milliseconds between blinks");
        this.add_arg("BLINK_PROMILLE", "FUNCTION", "0 = off, 1000 = on");
        this.SetExpansion(Layers(COLOR1, BlinkingL(COLOR2, BLINK_MILLIS, BLINK_PROMILLE)));
    }
};

function BlinkingX(A, B, BM, BP) {
    return new BlinkingXClass(A, B, BM, BP);
}

class BlinkingClass extends MACRO {
    constructor(COLOR1, COLOR2, BLINK_MILLIS, BLINK_PROMILLE) {
        super("Blinks between A and B", Array.from(arguments));
        this.add_arg("COLOR1", "COLOR", "A");
        this.add_arg("COLOR2", "COLOR", "B");
        this.add_arg("BLINK_MILLIS", "INT", "milliseconds between blinks");
        this.add_arg("BLINK_PROMILLE", "INT", "0 = off, 1000 = on");
        this.SetExpansion(BlinkingX(COLOR1, COLOR2, Int(BLINK_MILLIS), Int(BLINK_PROMILLE)));
    }
};

function Blinking(A, B, BM, BP) {
    return new BlinkingClass(A, B, BM, BP);
}

class SimpleClashClass extends MACRO {
    constructor(T, CLASH, CLASH_MILLIS, EFFECT_ARG, STAB_SHAPE) {
        super("Implements the clash effect", Array.from(arguments));
        this.add_arg("T", "COLOR", "base color");
        this.add_arg("CLASH", "COLOR", "Clash color");
        this.add_arg("CLASH_MILLIS", "INT", "How many MS to show the clash color for.", 40);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_CLASH));
        this.add_arg("STAB_SHAPE", "FUNCTION", "Stab shape", SmoothStep(Int(16384), Int(24000)));
        this.SetExpansion(Layers(T, SimpleClashL(CLASH, this.CLASH_MILLIS, this.EFFECT, this.STAB_SHAPE)));
    }
};

function SimpleClash(T, CLASH, MILLIS, EF, SS) {
    return new SimpleClashClass(T, CLASH, MILLIS, EF, SS);
}



class LocalizedClashClass extends MACRO {
    constructor(T, CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EFFECT_ARG) {
        super("Localized clash", arguments);
        this.add_arg("T", "COLOR", "base color");
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color", WHITE.DOCOPY());
        this.add_arg("CLASH_MILLIS", "INT", "Clash duration in milliseconds", 40);
        this.add_arg("CLASH_WIDTH_PERCENT", "INT", "Clash width in percent of entire blade", 50);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_CLASH));
        this.SetExpansion(Layers(T, LocalizedClashL(this.CLASH_COLOR, this.CLASH_MILLIS, this.CLASH_WIDTH_PERCENT, this.EFFECT)));
    }
}

function LocalizedClash(T, CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EF) {
    return new LocalizedClashClass(T, CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EF);
}


class LockupClass extends MACRO {
    constructor(BASE, LOCKUP, DRAG_COLOR, LOCKUP_SHAPE, DRAG_SHAPE) {
        super("Implements the lockup and drag effects.", arguments);
        this.add_arg("BASE", "COLOR", "base color");
        this.add_arg("LOCKUP", "COLOR", "lockup color");
        this.add_arg("DRAG_COLOR", "COLOR", "drag color", this.LOCKUP.DOCOPY());
        this.add_arg("LOCKUP_SHAPE", "FUNCTION", "Lockup shape", Int(32768));
        this.add_arg("DRAG_SHAPE", "FUNCTION", "Drag shape", SmoothStep(Int(28671), Int(4096)));
        this.SetExpansion(Layers(BASE, LockupL(LOCKUP, DRAG_COLOR, LOCKUP_SHAPE, DRAG_SHAPE)));
    }
};

function Lockup(BASE, LOCKUP, DRAG, LOCKUP_SHAPE, DRAG_SHAPE) {
    return new LockupClass(BASE, LOCKUP, DRAG, LOCKUP_SHAPE, DRAG_SHAPE);
}



class LockupTrClass extends MACRO {
    constructor(BASE, COLOR, BeginTr, EndTr, LOCKUP_TYPE) {
        super("Transition based lockup effect.", arguments);
        this.add_arg("BASE", "COLOR", "Base color.");
        this.add_arg("COLOR", "COLOR", "Effect color.");
        this.add_arg("BEGIN_TR", "TRANSITION", "Begin lockup transition.");
        this.add_arg("END_TR", "TRANSITION", "End lockup transition.");
        this.add_arg("LOCKUP_TYPE", "LOCKUP_TYPE", "Lockup type");
        this.SetExpansion(Layers(BASE, LockupTrL(COLOR, BeginTr, EndTr, LOCKUP_TYPE)));
    }
    argify(state) {
        state.color_argument = lockup_to_argument(this.LOCKUP_TYPE);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
}

function LockupTr(BASE, COLOR, BeginTr, EndTr, LOCKUP_TYPE) {
    return new LockupTrClass(BASE, COLOR, BeginTr, EndTr, LOCKUP_TYPE);
}


class TransitionLoopClass extends MACRO {
    constructor(COLOR, TRANSITION) {
        super("Continiously loop a transition", arguments);
        this.add_arg("COLOR", "COLOR", "Color");
        this.add_arg("TRANSITION", "TRANSITION", "Transition");
        this.SetExpansion(Layers(COLOR, TransitionLoopL(TRANSITION)));
    }
};

function TransitionLoop(C, T) { return new TransitionLoopClass(C, T); }


class MultiTransitionEffectClass extends MACRO {
    constructor(T, EFFECT_COLOR, TRANSITION1, TRANSITION2, EFFECT, N) {
        super("Trigger transitions on an effect.", arguments);
        this.add_arg("T", "COLOR", "Base color.");
        this.add_arg("EFFECT_COLOR", "COLOR", "Effect color.");
        this.add_arg("TRANSITION1", "TRANSITION", "from T to EFFECT_COLOR");
        this.add_arg("TRANSITION2", "TRANSITION", "from EFFECT_COLOR T");
        this.add_arg("EFFECT", "EFFECT", "Effect type");
        this.add_arg("N", "INT", "Number of simultaneous effects.", 3);
        this.SetExpansion(Layers(this.T, MultiTransitionEffectL(TrConcat(this.TRANSITION1, this.EFFECT_COLOR, this.TRANSITION2), this.EFFECT, this.N)));
    }
};

function MultiTransitionEffect(T, EC, T1, T2, E, N) {
    return new MultiTransitionEffectClass(T, EC, T1, T2, E, N);
}


class TransitionEffectClass extends MACRO {
    constructor(T, EFFECT_COLOR, TRANSITION1, TRANSITION2, EFFECT_ARG) {
        super("Trigger transitions on an effect.", arguments);
        this.add_arg("T", "COLOR", "Base color.");
        this.add_arg("EFFECT_COLOR", "COLOR", "Effect color.");
        this.add_arg("TRANSITION1", "TRANSITION", "from T to EFFECT_COLOR");
        this.add_arg("TRANSITION2", "TRANSITION", "from EFFECT_COLOR T");
        this.add_arg("EFFECT", "EFFECT", "Effect type");
        this.SetExpansion(Layers(this.T, TransitionEffectL(TrConcat(this.TRANSITION1, this.EFFECT_COLOR, this.TRANSITION2), this.EFFECT)));
    }
};

function TransitionEffect(T, EC, T1, T2, E) {
    return new TransitionEffectClass(T, EC, T1, T2, E);
}


class InOutTrClass extends MACRO {
    constructor(ON, OUT_TR, IN_TR, OFF, AD) {
        super("In-out based on transitions", arguments);
        this.add_arg("ON", "COLOR", "Color when on.");
        this.add_arg("OUT_TR", "TRANSITION", "IN-OUT transition");
        this.add_arg("IN_TR", "TRANSITION", "OUT-IN transition");
        this.add_arg("OFF", "COLOR", "Color when off", BLACK.DOCOPY());
        this.add_arg("ALLOW_DISABLE", "INT", "allow disable?", 1);
        this.SetExpansion(Layers(ON, InOutTrL(OUT_TR, IN_TR, this.OFF, this.ALLOW_DISABLE)));
    }
};

function InOutTr(ON, OUT_TR, IN_TR, OFF, AD) {
    return new InOutTrClass(ON, OUT_TR, IN_TR, OFF, AD);
}

class RotateColorsXClass extends MODEL {
    constructor(ROTATION, COLOR) {
        super("Rotate colors", arguments);//构造函数，用于初始化
        this.add_arg("ROTATION", "FUNCTION", "Rotation");
        this.add_arg("COLOR", "COLOR", "Color");
    }
    getColor(led) {
        var ret = this.COLOR.getColor(led);
        ret = ret.rotate((this.ROTATION.getInteger(led) & 0x7fff) * 3);
        return ret;
    }
    argify(state) {
        if (this.ROTATION.constructor == VariationClass) {
            return this.COLOR.argify(state);
        }
        return super.argify(state);
    }
};

function RotateColorsX(R, C) { return new RotateColorsXClass(R, C); }

class RotateColorsClass extends MACRO {
    constructor(ROTATION, COLOR) {
        super("Rotate colors", arguments);
        this.add_arg("ROTATION", "INT", "Rotation");
        this.add_arg("COLOR", "COLOR", "Color");
        this.SetExpansion(RotateColorsX(Int(this.ROTATION), this.COLOR));
    }
};

function RotateColors(R, C) { return new RotateColorsClass(R, C); }

class HueXClass extends MACRO {
    constructor(ROTATION, COLOR) {
        super("Rotate colors", arguments);
        this.add_arg("HUE", "FUNCTION", "Hue");
        this.SetExpansion(RotateColorsX(this.HUE, RED.DOCOPY()));
    }
};

function HueX(H) { return new HueXClass(H); }

class HueClass extends MACRO {
    constructor(ROTATION, COLOR) {
        super("Rotate colors", arguments);
        this.add_arg("HUE", "INT", "Hue");
        this.SetExpansion(HueX(Int(this.HUE)));
    }
};

function Hue(H) { return new HueClass(H); }





class SwingSpeedClass extends MACRO {
    constructor() {
        super("Swing Speed", arguments);
        this.add_arg("MAX", "INT", "What swing speed returns 32768.");
        this.SetExpansion(SwingSpeedX(Int(this.MAX)));
    }
};

function SwingSpeed(MAX) { return new SwingSpeedClass(MAX); }


class BladeAngleClass extends MACRO {
    constructor() {
        super("Blade Angle", arguments);
        this.add_arg("MIN", "INT", "What angle returns 0.", 0);
        this.add_arg("MAX", "INT", "What angle returns 0.", 32768);
        this.SetExpansion(BladeAngleX(Int(this.MIN), Int(this.MAX)));
    }
};

function BladeAngle(MIN, MAX) {
    return new BladeAngleClass(MIN, MAX);
}



///////

class IgnitionTimeClass extends MACRO {
    constructor(DEFAULT_VALUE) {
        super("arg/wavlen ignition time", arguments);
        this.add_arg("DEFAULT_VALUE", "INT", "Default value.", 300);
        this.SetExpansion(Scale(IsLessThan(IntArg_(ArgumentName(IGNITION_TIME_ARG), this.DEFAULT_VALUE), Int(1)), IntArg_(ArgumentName(IGNITION_TIME_ARG), this.DEFAULT_VALUE), WavLen(EFFECT(EFFECT_IGNITION))));
    }
}

function IgnitionTime(DEFAULT_VALUE) {
    return new IgnitionTimeClass(DEFAULT_VALUE);
}

class RetractionTimeClass extends MACRO {
    constructor(DEFAULT_VALUE) {
        super("arg/wavlen ignition time", arguments);
        this.add_arg("DEFAULT_VALUE", "INT", "Default value.", 0);
        this.SetExpansion(Scale(IsLessThan(IntArg_(ArgumentName(RETRACTION_TIME_ARG), this.DEFAULT_VALUE), Int(1)), IntArg_(ArgumentName(RETRACTION_TIME_ARG), this.DEFAULT_VALUE), WavLen(EFFECT(EFFECT_RETRACTION))));
    }
}

function RetractionTime(DEFAULT_VALUE) {
    return new RetractionTimeClass(DEFAULT_VALUE);
}


class EasyBladeClass extends MACRO {
    constructor(COLOR, CLASH_COLOR, LOCKUP_FLICKER_COLOR) {
        super("Adds clash/lockup/blast/drag", arguments);
        this.add_arg("COLOR", "COLOR", "Main color");
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color");
        this.add_arg("LOCKUP_FLICKER_COLOR", "COLOR", "lockup flicker color", WHITE.DOCOPY());

        this.SetExpansion(
            SimpleClash(Lockup(Blast(this.COLOR, WHITE.DOCOPY()), AudioFlicker(this.COLOR.DOCOPY(), this.LOCKUP_FLICKER_COLOR)), this.CLASH_COLOR)
        );
    }
};

function EasyBlade(color, clash_color, lockup_flicker_color) {
    return new EasyBladeClass(color, clash_color, lockup_flicker_color);
}

class StyleNormalPtrClass extends MACRO {
    constructor(base_color, clash_color, out_ms, in_ms, lockup_flicker_color, blast_color) {
        super("Blade to color.", arguments);
        this.add_arg("BASE_COLOR", "COLOR", "Main color");
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color");
        this.add_arg("OUT_MS", "INT", "extension length in milliseconds");
        this.add_arg("IN_MS", "INT", "retraction length in milliseconds");
        this.add_arg("LOCKUP_FLICKER_COLOR", "COLOR", "lockup flicker color", WHITE.DOCOPY());
        this.add_arg("BLAST_COLOR", "COLOR", "Blast color", WHITE.DOCOPY());

        var tmp = AudioFlicker(this.BASE_COLOR, this.LOCKUP_FLICKER_COLOR);
        var tmp2 = Blast(this.BASE_COLOR.DOCOPY(), this.BLAST_COLOR);
        tmp = Lockup(tmp2, tmp);
        tmp = SimpleClash(tmp, this.CLASH_COLOR);
        this.SetExpansion(InOutHelper(tmp, this.OUT_MS, this.IN_MS));
    }
}

function StyleNormalPtr(base_color, clash_color, out_ms, in_ms, lockup_flicker_color, blast_color) {
    return new StyleNormalPtrClass(base_color, clash_color, out_ms, in_ms, lockup_flicker_color, blast_color);
}

class StyleRainbowPtrClass extends MACRO {
    constructor(OUT_MS, IN_MS, CLASH_COLOR, LOCKUP_FLICKER_COLOR) {
        super("Rainbow style template", arguments);
        this.add_arg("OUT_MS", "INT", "extension length in milliseconds");
        this.add_arg("IN_MS", "INT", "retraction length in milliseconds");
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color", WHITE.DOCOPY());
        this.add_arg("LOCKUP_FLICKER_COLOR", "COLOR", "lockup flicker color", WHITE.DOCOPY());

        var tmp = AudioFlicker(Rainbow(), this.LOCKUP_FLICKER_COLOR);
        tmp = Lockup(Rainbow(), tmp);
        tmp = SimpleClash(tmp, this.CLASH_COLOR);
        this.SetExpansion(InOutHelper(tmp, this.OUT_MS, this.IN_MS));
    }
};

function StyleRainbowPtr(out_ms, in_ms, clash_color, lockup_flicker_color) {
    return new StyleRainbowPtrClass(out_ms, in_ms, clash_color, lockup_flicker_color);
}


class StyleStrobePtrClass extends MACRO {
    constructor(STROBE_COLOR, CLASH_COLOR, FREQUENCY, OUT_MS, IN_MS) {
        super("Rainbow style template", arguments);
        this.add_arg("STROBE_COLOR", "COLOR", "Strobe color");
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color");
        this.add_arg("FREQUENCY", "INT", "frequency");
        this.add_arg("OUT_MS", "INT", "extension length in milliseconds");
        this.add_arg("IN_MS", "INT", "retraction length in milliseconds");

        var strobe = Strobe(BLACK.DOCOPY(), this.STROBE_COLOR, this.FREQUENCY, 1);
        var fast_strobe = Strobe(BLACK.DOCOPY(), this.STROBE_COLOR.DOCOPY(), this.FREQUENCY * 3, 1);
        var tmp = Lockup(strobe, fast_strobe);
        tmp = SimpleClash(tmp, this.CLASH_COLOR);
        this.SetExpansion(InOutHelper(tmp, this.OUT_MS, this.IN_MS));
    }
};

function StyleStrobePtr(strobe_color, clash_color, frequency, out_ms, in_ms) {
    return new StyleStrobePtrClass(strobe_color, clash_color, frequency, out_ms, in_ms);
}

class StyleFirePtrClass extends MACRO {
    constructor(COLOR1, COLOR2,
        BLADE_NUM, DELAY, SPEED,
        NORM_BASE, NORM_RAND, NORM_COOL,
        CLSH_BASE, CLSH_RAND, CLSH_COOL,
        LOCK_BASE, LOCK_RAND, LOCK_COOL,
        OFF_BASE, OFF_RAND, OFF_COOL) {
        super("Fire Blade", arguments);
        this.add_arg("COLOR1", "COLOR", "Warm color.");
        this.add_arg("COLOR2", "COLOR", "Hot color.");
        this.add_arg("BLADE_NUM", "INT", "Ignored", INT(1));
        this.add_arg("DELAY", "INT", "ignition delay", INT(0));
        this.add_arg("SPEED", "INT", "fire speed", INT(2));
        this.add_arg("NORM_BASE", "INT", "constant heat added in normal mode", INT(0));
        this.add_arg("NORM_RAND", "INT", "random heat added in normal mode", INT(2000));
        this.add_arg("NORM_COOL", "INT", "cooling in normal mode", INT(5));

        this.add_arg("CLSH_BASE", "INT", "constant heat added in clash mode", INT(3000));
        this.add_arg("CLSH_RAND", "INT", "random heat added in clash mode", INT(0));
        this.add_arg("CLSH_COOL", "INT", "cooling in clash mode", INT(0));

        this.add_arg("LOCK_BASE", "INT", "constant heat added in lockup mode", INT(0));
        this.add_arg("LOCK_RAND", "INT", "random heat added in lockup mode", INT(5000));
        this.add_arg("LOCK_COOL", "INT", "cooling in lockup mode", INT(10));

        this.add_arg("OFF_BASE", "INT", "constant heat added in off mode", INT(0));
        this.add_arg("OFF_RAND", "INT", "random heat added in off mode", INT(0));
        this.add_arg("OFF_COOL", "INT", "cooling in off mode", INT(10));
        this.SetExpansion(StyleFire(
            this.COLOR1, this.COLOR2,
            this.DELAY, this.SPEED,
            FireConfig(this.NORM_BASE, this.NORM_RAND, this.NORM_COOL),
            FireConfig(this.CLSH_BASE, this.CLSH_RAND, this.CLSH_COOL),
            FireConfig(this.LOCK_BASE, this.LOCK_RAND, this.LOCK_COOL),
            FireConfig(this.OFF_BASE, this.OFF_RAND, this.OFF_COOL)));
    }
};

function StyleFirePtr(COLOR1, COLOR2,
    BLADE_NUM, DELAY, SPEED,
    NORM_BASE, NORM_RAND, NORM_COOL,
    CLSH_BASE, CLSH_RAND, CLSH_COOL,
    LOCK_BASE, LOCK_RAND, LOCK_COOL,
    OFF_BASE, OFF_RAND, OFF_COOL) {
    return new StyleFirePtrClass(COLOR1, COLOR2,
        BLADE_NUM, DELAY, SPEED,
        NORM_BASE, NORM_RAND, NORM_COOL,
        CLSH_BASE, CLSH_RAND, CLSH_COOL,
        LOCK_BASE, LOCK_RAND, LOCK_COOL,
        OFF_BASE, OFF_RAND, OFF_COOL);
}


class InOutHelperXClass extends MACRO {
    constructor(T, EXTENSION, OFF_COLOR, ALLOW_DISABLE) {
        super("0=retracted, 32768=extended", arguments);
        this.add_arg("T", "COLOR", "base color");
        this.add_arg("EXTENSION", "FUNCTION", "extension amount");
        this.add_arg("OFF_COLOR", "COLOR", "color when retracted", BLACK.DOCOPY());
        this.add_arg("ALLOW_DISABLE", "INT", "allow disable?", 1);
        this.SetExpansion(Layers(T, InOutHelperL(EXTENSION, this.OFF_COLOR, this.ALLOW_DISABLE)));
    }
}

function InOutHelperX(T, EX, O, AD) {
    return new InOutHelperXClass(T, EX, O, AD);
}


//--
class InOutHelperClass extends MACRO {
    constructor(T, OUT_MILLIS, IN_MILLIS, OFF_COLOR) {
        super("Extend/extract blade", arguments);
        this.add_arg("T", "COLOR", "Base color");
        this.add_arg("OUT_MILLIS", "INT", "Time to extend.");
        this.add_arg("IN_MILLIS", "INT", "Time to retract.");
        this.add_arg("OFF_COLOR", "COLOR", "color when retracted", BLACK.DOCOPY());
        this.SetExpansion(InOutHelperX(T, InOutFunc(OUT_MILLIS, IN_MILLIS), this.OFF_COLOR));
    }
};

function InOutHelper(T, I, O, OFF) {
    return new InOutHelperClass(T, I, O, OFF);
}


class InOutSparkTipClass extends MODEL {
    constructor(T, OUT_MILLIS, IN_MILLIS, OFF_COLOR) {
        super("Implements extention/retraction", arguments);
        this.add_arg("T", "COLOR", "base color");
        this.add_arg("OUT_MILLIS", "INT", "extentions length in ms");
        this.add_arg("IN_MILLIS", "INT", "retraction length in ms");
        this.add_arg("SPARK_COLOR", "COLOR", "color of spark tip", WHITE.DOCOPY());
        this.last_micros_ = 0;
        this.extension = 0;
    }
    run(blade) {
        this.T.run(blade);
        this.SPARK_COLOR.run(blade);

        var now = micros();
        var delta = now - this.last_micros_;
        this.last_micros_ = now;
        if (blade.is_on()) {
            if (this.extension == 0.0) {
                // We might have been off for a while, so delta might
                // be insanely high.
                this.extension = 0.00001;
            } else {
                this.extension += delta / (this.OUT_MILLIS * 1000.0);
                this.extension = Math.min(this.extension, 1.0);
            }
        } else {
            this.extension -= delta / (this.IN_MILLIS * 1000.0);
            this.extension = Math.max(this.extension, 0.0);
        }
        var thres = this.extension * (blade.num_leds() + 5) * 256;
        this.thres1 = Math.floor(thres);
        if (blade.is_on()) {
            this.thres2 = Math.floor(thres) - 1024;
        } else {
            this.thres2 = Math.floor(thres) + 1024;
        }
    }
    getColor(led) {
        var x1 = led + 1 - this.thres1 / 256.0;
        x1 = min(x1, 1.0);
        x1 = max(x1, 0.0);
        var x2 = led + 1 - this.thres2 / 256.0;
        x2 = min(x2, 1.0);
        x2 = max(x2, 0.0);
        var c = this.T.getColor(led);
        var spark_color = this.SPARK_COLOR.getColor(led);
        var off = Rgb(0, 0, 0);
        return c.mix(spark_color, x2).mix(off, x1);
    }
};

function InOutSparkTip(T, I, O, S) {
    return new InOutSparkTipClass(T, I, O, S);
}

class ColorChangeClass extends MACRO {
    constructor(ARGS) {
        super("Change color based on variation", ARGS);
        this.COLORS = Array.from(ARGS).slice(1);
        this.add_arg("TRANSITION", "TRANSITION", "Transition");
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.SetExpansion(new ColorSelectClass([Variation(), this.TRANSITION].concat(this.COLORS)));
    }
};

function ColorChange(T, A, B) {
    return new ColorChangeClass(Array.from(arguments));
}

class ColorSelectClass extends MODEL {
    constructor(ARGS) {
        super("Change color based on function", ARGS);
        this.COLORS = Array.from(ARGS).slice(2);
        this.add_arg("F", "FUNCTION", "Selector function");
        this.add_arg("TRANSITION", "TRANSITION", "Transition");
        for (var i = 1; i < this.COLORS.length + 1; i++)
            this.add_arg("COLOR" + i, "COLOR", "COLOR " + i);
        this.selection = this.F.getInteger(0);
        this.old_selection = this.selection;
        if (this.F.pp() == "Variation") {
            HandleEffectType(EFFECT_CHANGE);
        }
    }
    run(blade) {
        this.F.run(blade);
        for (var i = 0; i < this.COLORS.length; i++)
            this.COLORS[i].run(blade);
        var f = this.F.getInteger(0);
        while (f < 0) f += this.COLORS.length * 256;
        var selection = f % this.COLORS.length;
        if (selection != this.selection) {
            // Start transition
            this.old_selection = this.selection;
            this.selection = selection;
            this.TRANSITION.begin();
        }
        if (this.selection != this.old_selection) {
            this.TRANSITION.run(blade);
            if (this.TRANSITION.done()) {
                this.old_selection = this.selection;
            }
        }
    }
    getColor(led) {
        var ret = this.COLORS[this.selection + 0].getColor(led);
        if (this.selection != this.old_selection) {
            var old = this.COLORS[this.old_selection].getColor(led);
            ret = this.TRANSITION.getColor(old, ret, led);
        }
        return ret;
    }
};

function ColorSelect(F, T, A, B) {
    return new ColorSelectClass(Array.from(arguments));
}

