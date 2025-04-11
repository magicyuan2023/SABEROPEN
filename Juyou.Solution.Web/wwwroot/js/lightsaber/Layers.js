

function ReplaceNode(old_node, new_node) {
    FocusOnLow(old_node.get_id());
    pp_is_url++;
    FIND("style").value = new_node.pp();
    pp_is_url--;
    Run();
}

function DuplicateLayer(id, arg, event) {
    event.stopPropagation();
    console.log("DuplicateLayer: " + id + ", " + arg);
    arg -= 2;
    var layer = style_ids[id];
    var new_layer = new LayersClass([layer.BASE].concat(layer.LAYERS.slice(0, arg), [layer.LAYERS[arg].DOCOPY()], layer.LAYERS.slice(arg)));
    ReplaceNode(layer, new_layer);
}

function RemoveLayer(id, arg, event) {
    event.stopPropagation();
    console.log("RemoveLayer: " + id + ", " + arg);
    arg -= 2;
    var layer = style_ids[id];
    var new_layer = new LayersClass([layer.BASE].concat(layer.LAYERS.slice(0, arg), layer.LAYERS.slice(arg + 1)));
    ReplaceNode(layer, new_layer);
}

function DownLayer(id, arg, event) {
    event.stopPropagation();
    console.log("DownLayer: " + id + ", " + arg);
    arg -= 2;
    var layer = style_ids[id];
    var new_layer = new LayersClass([layer.BASE].concat(layer.LAYERS.slice(0, arg),
        [layer.LAYERS[arg + 1], layer.LAYERS[arg]],
        layer.LAYERS.slice(arg + 2)));
    ReplaceNode(layer, new_layer);
}

function UpLayer(id, arg, event) {
    console.log("UpLayer: " + id + ", " + arg);
    DownLayer(id, arg - 1, event);
}

class LayersClass extends MODEL {
    Indent(text) {
        return "\n  " + text.split("\n").join("\n  ");
    }
    extraButtons(arg) {
        if (arg == 1) return "";
        var id = this.get_id();
        var ret = "<button onclick='DuplicateLayer(" + id + "," + arg + ",event)'>+</button>";
        ret += "<button onclick='RemoveLayer(" + id + "," + arg + ",event)'>&#10799;</button>";
        if (arg > 2) ret += "<button onclick='UpLayer(" + id + "," + arg + ",event)'>&#5169;</button>";
        if (arg <= this.LAYERS.length) ret += "<button onclick='DownLayer(" + id + "," + arg + ",event)'>&#5167;</button>";
        return ret;
    }
    constructor(ARGS) {
        super("Mix alpha-blended layers", ARGS);
        this.LAYERS = Array.from(ARGS).slice(1);
        this.add_arg("BASE", "COLOR", "Base layer");
        for (var i = 1; i < this.LAYERS.length + 1; i++)
            this.add_arg("LAYER" + i, "COLOR", "Layer " + i);
    }
    getColor(led) {
        var ret = this.BASE.getColor(led);
        for (var i = 0; i < this.LAYERS.length; i++) {
            ret = ret.paintOver(this.LAYERS[i].getColor(led));
        }
        return ret.rotate((Variation().getInteger(led) & 0x7fff) * 3);
    }
    argify(state) {
        this.BASE = this.BASE.argify(state);
        state.color_argument = false;
        var ret = super.argify(state);
        state.color_argument = false;
        return ret;
    }
}

function Layers(BASE, Layer1, Layer2) {
    return new LayersClass(Array.from(arguments));
}


class SimpleClashLClass extends MODEL {
    constructor(T, CLASH, CLASH_MILLIS, EFFECT_ARG, STAB_SHAPE) {
        super("Implements the clash effect", Array.from(arguments));
        this.add_arg("CLASH", "COLOR", "Clash color");
        this.add_arg("CLASH_MILLIS", "INT", "How many MS to show the clash color for.", 40);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_CLASH));
        this.add_arg("STAB_SHAPE", "FUNCTION", "Stab shape", SmoothStep(Int(16384), Int(24000)));
        this.effect_ = new OneshotEffectDetector(this.EFFECT);
        this.clash_ = false;
        this.stab_ = false;
    }
    run(blade) {
        super.run(blade);

        if (this.clash_ && micros() - this.effect_.last_detected_ > this.CLASH_MILLIS * 1000) {
            this.clash_ = false;
        }
        var e = this.effect_.Detect(blade);
        if (e) {
            this.clash_ = true;
            this.stab_ = this.EFFECT == EFFECT_CLASH && e.type == EFFECT_STAB && blade.num_leds() > 1;
        }
    }
    getColor(led) {
        var ret = Transparent();
        if (this.clash_) {
            var ret = this.CLASH.getColor(led);
            if (this.stab_) {
                ret = ret.multiply(this.STAB_SHAPE.getInteger(led) / 32768.0);
            }
        }
        return ret;
    }
    IS_RUNNING() {
        return this.clash_;
    }
    argify(state) {
        state.color_argument = effect_to_argument(this.EFFECT);
        console.log("STATE IN SIMPLECLASHL:");
        console.log(state);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function SimpleClashL(T, CLASH, MILLIS, EF, SS) {
    return new SimpleClashLClass(T, CLASH, MILLIS, EF, SS);
}


class LocalizedClashLClass extends MODEL {
    constructor(CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EFFECT_ARG) {
        super("Localized clash", arguments);
        this.add_arg("CLASH_COLOR", "COLOR", "Clash color", WHITE.DOCOPY());
        this.add_arg("CLASH_MILLIS", "INT", "Clash duration in milliseconds", 40);
        this.add_arg("CLASH_WIDTH_PERCENT", "INT", "Clash width in percent of entire blade", 50);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_CLASH));
        this.effect_ = new OneshotEffectDetector(this.EFFECT);
    }
    run(blade) {
        super.run(blade);

        var m = millis();
        var clashing = 0;
        var e = this.effect_.Detect(blade);
        if (e) {
            this.clash = true;
            this.mult = blast_hump.length * 2 * 102400 / this.CLASH_WIDTH_PERCENT / blade.num_leds();
            this.clash_location = e.location * blade.num_leds() * this.mult;
        } else if (micros() - this.effect_.last_detected_ < this.CLASH_MILLIS.getInteger(0) * 1000) {
            this.clash = true;
        } else {
            this.clash = false;
        }
    }
    getColor(led) {
        var ret = Transparent();
        if (this.clash) {
            var dist = Math.floor(Math.abs(led * this.mult - this.clash_location) / 1024);
            if (dist < blast_hump.length) {
                var ret = this.CLASH_COLOR.getColor(led);
                ret = ret.multiply(blast_hump[dist] / 255.0);
            }
        }
        return ret;
    }
    IS_RUNNING() {
        return this.clash;
    }
    argify(state) {
        state.color_argument = effect_to_argument(this.EFFECT);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
}

function LocalizedClashL(CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EF) {
    return new LocalizedClashLClass(CLASH_COLOR, CLASH_MILLIS, CLASH_WIDTH_PERCENT, EF);
}


class LockupLClass extends MODEL {
    isEffect() { return true; }
    constructor(LOCKUP, DRAG_COLOR, LOCKUP_SHAPE, DRAG_SHAPE, LB_SHAPE) {
        super("Implements the lockup and drag effects.", arguments);
        this.add_arg("LOCKUP", "COLOR", "lockup color");
        this.add_arg("DRAG_COLOR", "COLOR", "drag color", this.LOCKUP.DOCOPY());
        this.add_arg("LOCKUP_SHAPE", "FUNCTION", "Lockup shape", Int(32768));
        this.add_arg("DRAG_SHAPE", "FUNCTION", "Drag shape", SmoothStep(Int(28671), Int(4096)));
        this.add_arg("LB_SHAPE", "FUNCTION", "Lightning block shape",
            LayerFunctions(Bump(Scale(SlowNoise(Int(2000)), Int(3000), Int(16000)),
                Scale(BrownNoiseF(Int(10)), Int(14000), Int(8000))),
                Bump(Scale(SlowNoise(Int(2300)), Int(26000), Int(8000)),
                    Scale(NoisySoundLevel(), Int(5000), Int(10000))),
                Bump(Scale(SlowNoise(Int(2300)), Int(20000), Int(30000)),
                    Scale(IsLessThan(SlowNoise(Int(1500)), Int(8000)), Scale(NoisySoundLevel(), Int(5000), Int(0)), Int(0)))));
    }
    run(blade) {
        super.run(blade);
        this.single_pixel_ = blade.num_leds() == 1;
        this.handled = IsHandledLockup(STATE_LOCKUP);
    }
    getColor(led) {
        var ret = Transparent();
        if (this.handled) return ret;
        if (STATE_LOCKUP == LOCKUP_LIGHTNING_BLOCK) {
            ret = ret.mix(this.LOCKUP.getColor(led), this.LB_SHAPE.getInteger(led) / 32768.0);
        }
        if (STATE_LOCKUP == LOCKUP_DRAG) {
            var blend = this.single_pixel_ ? 32768 : this.DRAG_SHAPE.getInteger(led);
            ret = ret.mix(this.DRAG_COLOR.getColor(led), blend / 32768.0);
        }
        if (STATE_LOCKUP == LOCKUP_NORMAL) {
            ret = ret.mix(this.LOCKUP.getColor(led), this.LOCKUP_SHAPE.getInteger(led) / 32768.0);
        }
        return ret;
    }
    IS_RUNNING() {
        if (this.handled) return false;
        if (STATE_LOCKUP == LOCKUP_LIGHTNING_BLOCK) true;
        if (STATE_LOCKUP == LOCKUP_DRAG) return true;
        if (STATE_LOCKUP == LOCKUP_NORMAL) return true;
        return false;
    }
    argify(state) {
        state.color_argument = LOCKUP_COLOR_ARG;
        this.LOCKUP = this.LOCKUP.argify(state);
        state.color_argument = DRAG_COLOR_ARG;
        this.DRAG_COLOR = this.DRAG_COLOR.argify(state);
        state.color_argument = null;
        return this;
    }
};

function LockupL(LOCKUP, DRAG, LOCKUP_SHAPE, DRAG_SHAPE, LB_SHAPE) {
    return new LockupLClass(LOCKUP, DRAG, LOCKUP_SHAPE, DRAG_SHAPE, LB_SHAPE);
}


class LockupTrLClass extends MODEL {
    constructor(COLOR, BeginTr, EndTr, LOCKUP_TYPE) {
        super("Transition based lockup effect.", arguments);
        this.add_arg("COLOR", "COLOR", "Effect color.");
        this.add_arg("BEGIN_TR", "TRANSITION", "Begin lockup transition.");
        this.add_arg("END_TR", "TRANSITION", "End lockup transition.");
        this.add_arg("LOCKUP_TYPE", "LOCKUP_TYPE", "Lockup type");
        HandleLockup(LOCKUP_TYPE);
        this.active = false;
        this.begin_active = false;
        this.end_active = false;
    }
    run(blade) {
        super.run(blade);
        if (this.active != (STATE_LOCKUP == this.LOCKUP_TYPE)) {
            this.active = (STATE_LOCKUP == this.LOCKUP_TYPE);
            if (this.active) {
                this.BEGIN_TR.begin();
                this.begin_active = true;
            } else {
                this.END_TR.begin();
                this.end_active = true;
            }
        }

        if (this.begin_active) {
            this.BEGIN_TR.run(blade);
            if (this.BEGIN_TR.done()) this.begin_active = false;
        }
        if (this.end_active) {
            this.END_TR.run(blade);
            if (this.END_TR.done()) this.end_active = false;
        }
    }
    runBegin(a, b, led) {
        if (this.begin_active) {
            return this.BEGIN_TR.getColor(a, b, led);
        } else {
            return b;
        }
    }
    runEnd(a, b, led) {
        if (this.end_active) {
            return this.END_TR.getColor(a, b, led);
        } else {
            return b;
        }
    }
    getColor(led) {
        var off_color = Transparent();
        if (!this.begin_active && !this.end_active) {
            if (this.active) {
                return this.COLOR.getColor(led);
            } else {
                return off_color;
            }
        } else {
            var on_color = this.COLOR.getColor(led);
            if (this.active) {
                return this.runBegin(this.runEnd(on_color, off_color, led), on_color, led);
            } else {
                return this.runEnd(this.runBegin(off_color, on_color, led), off_color, led);
            }
        }
    }
    IS_RUNNING() {
        return this.active;
    }
    argify(state) {
        state.color_argument = lockup_to_argument(this.LOCKUP_TYPE);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function LockupTrL(COLOR, BeginTr, EndTr, LOCKUP_TYPE) {
    return new LockupTrLClass(COLOR, BeginTr, EndTr, LOCKUP_TYPE);
}


class OnSparkLClass extends MACRO {
    constructor(SPARK_COLOR, MILLIS) {
        super("Shows the spark color for 'MILLIS' milliseconds on startup.", arguments);
        this.add_arg("SPARK_COLOR", "COLOR", "Spark color", WHITE.DOCOPY());
        this.add_arg("MILLIS", "FUNCTION", "Millis", Int(200));
        this.SetExpansion(AlphaL(this.SPARK_COLOR, OnSparkF(this.MILLIS)));
    }
};

function OnSparkL(SPARK_COLOR, MILLIS) {
    return new OnSparkLClass(SPARK_COLOR, MILLIS);
}


class PulsingLClass extends MACRO {
    constructor(COLOR2, PULSE_MILLIS) {
        super("Pulses between transparent and B every M milliseconds", Array.from(arguments));
        this.add_arg("COLOR2", "COLOR", "B");
        this.add_arg("PULSE_MILLIS", "FUNCTION", "M");
        this.SetExpansion(AlphaL(COLOR2, PulsingF(PULSE_MILLIS)));
    }
}

function PulsingL(COLOR2, PULSE_MILLIS) {
    return new PulsingLClass(COLOR2, PULSE_MILLIS);
}


class SparkleLClass extends MACRO {
    constructor(SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
        super("Sparkles!!", Array.from(arguments));
        this.add_arg("SPARKLE_COLOR", "COLOR", "Spark color", Rgb(255, 255, 255));
        this.add_arg("SPARK_CHANCE_PROMILLE", "INT", "Chance of new sparks.", 300);
        this.add_arg("SPARK_INTENSITY", "INT", "Initial spark intensity", 1024);
        this.SetExpansion(AlphaL(this.SPARKLE_COLOR, SparkleF(this.SPARK_CHANCE_PROMILLE, this.SPARK_INTENSITY)));
    }
}

function SparkleL(SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY) {
    return new SparkleLClass(SPARKLE_COLOR, SPARK_CHANCE_PROMILLE, SPARK_INTENSITY);
}


class StrobeLClass extends MACRO {
    constructor(STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
        super("Stroboscope effect", arguments);
        this.add_arg("STROBE_COLOR", "COLOR", "Strobe color");
        this.add_arg("STROBE_FREQUENCY", "FUNCTION", "Strobe frequency.");
        this.add_arg("STROBE_MILLIS", "FUNCTION", "Pulse length in milliseconds.");
        this.SetExpansion(AlphaL(STROBE_COLOR, StrobeF(STROBE_FREQUENCY, STROBE_MILLIS)));
    }
};

function StrobeL(STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS) {
    return new StrobeLClass(STROBE_COLOR, STROBE_FREQUENCY, STROBE_MILLIS);
}


class RandomBlinkLClass extends MACRO {
    constructor(MILLIHZ, COLOR1, COLOR2) {
        super("Blink each LED randomly MILLIHZ times per second.", arguments);
        this.add_arg("MILLIHZ", "FUNCTION", "how often to blink");
        this.add_arg("COLOR2", "COLOR", "second color", BLACK.DOCOPY());
        this.SetExpansion(AlphaL(this.COLOR2, RandomBlinkF(MILLIHZ)));
    }
};

function RandomBlinkL(millihz, c1) {
    return new RandomBlinkLClass(millihz, c1);
}


class SequenceLClass extends MACRO {
    constructor(ARGS) {
        super("Pre-defined sequence", ARGS);
        this.add_arg("COLOR", "COLOR", "Color if bit is 2");
        this.add_arg("MILLIS_PER_BIT", "INT", "Milliseconds per bit.");
        this.add_arg("BITS", "INT", "total bits");
        for (var i = 0; i < this.BITS; i += 16) {
            this.add_arg("BITS" + i, "INT", "Bit sequence " + ((i / 16) + 1));
        }
        this.SetExpansion(AlphaL(this.COLOR, new SequenceFClass(ARGS.slice(1))));
    }
};

function SequenceL(COLOR2, MILLIHZ_PER_BIT, BITS, SEQUENCE) {
    return new SequenceLClass(Array.from(arguments));
}



class AudioFlickerLClass extends MACRO {
    constructor(COLOR) {
        super("Audio flicker layer, higher volumes means less transparent.", arguments);
        this.add_arg("COLOR", "COLOR", "COLOR");
        this.SetExpansion(AlphaL(this.COLOR, NoisySoundLevelCompat()));
    }
}

function AudioFlickerL(B) {
    return new AudioFlickerLClass(B);
}



class RandomLClass extends MACRO {
    constructor(A) {
        super("Selects between A and transparent randomly.", arguments);
        this.add_arg("A", "COLOR", "A");
        this.SetExpansion(AlphaL(A, RandomF()));
    }
};

function RandomL(A) {
    return new RandomLClass(A);
}


class RandomPerLEDFlickerLClass extends MACRO {
    constructor(A) {
        super("Selects between A and transparent randomly.", arguments);
        this.add_arg("A", "COLOR", "A");
        this.SetExpansion(AlphaL(A, RandomPerLEDF()));
    }
};

function RandomPerLEDFlickerL(A) {
    return new RandomPerLEDFlickerLClass(A);
}


class BrownNoiseFlickerLClass extends MACRO {
    constructor(B, GRADE) {
        super("Randomly selects between A and B but keeps nearby pixels similar", Array.from(arguments));
        this.add_arg("B", "COLOR", "B");
        this.add_arg("GRADE", "FUNCTION", "grade");
        this.SetExpansion(AlphaL(B, BrownNoiseF(GRADE)))
    }
};

function BrownNoiseFlickerL(B, grade) {
    return new BrownNoiseFlickerLClass(B, grade);
}


class HumpFlickerLClass extends MACRO {
    constructor(B, hump_width) {
        super("Picks a random spot for a bump each frame.", Array.from(arguments));
        this.add_arg("B", "COLOR", "B");
        this.add_arg("hump_width", "INT", "Hump width");
        this.SetExpansion(AlphaL(B, HumpFlickerF(hump_width)));
    }
};

function HumpFlickerL(B, hump_width) {
    return new HumpFlickerLClass(B, hump_width);
}


class BlastLClass extends MACRO {
    constructor(BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT_ARG) {
        super("Blast layer", Array.from(arguments));
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("WAVE_SIZE", "INT", "wave size", 100);
        this.add_arg("WAVE_MS", "INT", "wave speed", 400);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(AlphaL(BLAST, BlastF(FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT_ARG)));
    }
    argify(state) {
        state.color_argument = BLAST_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function BlastL(BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT) {
    return new BlastLClass(BLAST, FADEOUT_MS, WAVE_SIZE, WAVE_MS, EFFECT);
}


class BlastFadeoutLClass extends MACRO {
    constructor(BLAST, FADEOUT_MS, EFFECT_ARG) {
        super("BlastFadeout layers", Array.from(arguments));
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("FADEOUT_MS", "INT", "fadeout time in milliseconds", 200);
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(AlphaL(BLAST, BlastFadeoutF(FADEOUT_MS, EFFECT_ARG)));
    }
};

function BlastFadeoutL(BLAST, FADEOUT_MS, EFFECT) {
    return new BlastFadeoutLClass(BLAST, FADEOUT_MS, EFFECT);
}


class OriginalBlastLClass extends MACRO {
    constructor(BLAST, EFFECT_ARG) {
        super("Original blast effect", Array.from(arguments));
        this.add_arg("BLAST", "COLOR", "blast color");
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(AlphaL(BLAST, OriginalBlastF(this.EFFECT)));
    }
};

function OriginalBlastL(BLAST, EFFECT) {
    return new OriginalBlastLClass(BLAST, EFFECT);
}


class BlinkingLClass extends MACRO {
    constructor(COLOR, BLINK_MILLIS, BLINK_PROMILLE) {
        super("Blinks transparent/opaque COLOR", Array.from(arguments));
        this.add_arg("COLOR", "COLOR", "COLOR");
        this.add_arg("BLINK_MILLIS", "FUNCTION", "milliseconds between blinks");
        this.add_arg("BLINK_PROMILLE", "FUNCTION", "0 = off, 1000 = on");
        this.SetExpansion(AlphaL(COLOR, BlinkingF(BLINK_MILLIS, BLINK_PROMILLE)));
    }
};

function BlinkingL(A, B, BM, BP) {
    return new BlinkingLClass(A, B, BM, BP);
}


class InOutHelperLClass extends MACRO {
    isEffect() { return true; }
    constructor(EXTENSION, OFF_COLOR, ALLOW_DISABLE) {
        super("0=retracted, 32768=extended", arguments);
        this.add_arg("EXTENSION", "FUNCTION", "extension amount");
        this.add_arg("OFF_COLOR", "COLOR", "color when retracted", BLACK.DOCOPY());
        this.add_arg("ALLOW_DISABLE", "INT", "allow disable?", 1);
        this.SetExpansion(AlphaL(this.OFF_COLOR, InOutHelperF(EXTENSION, this.ALLOW_DISABLE)));
    }
}

function InOutHelperL(EX, O, AD) {
    return new InOutHelperLClass(EX, O, AD);
}


class TransitionLoopLClass extends MODEL {
    constructor(TRANSITION) {
        super("Continiously loop a transition", arguments);
        this.add_arg("TRANSITION", "TRANSITION", "Transition");
        this.TRANSITION.begin();
    }
    run(blade) {
        if (this.TRANSITION.done()) this.TRANSITION.begin();
        super.run(blade);
    }
    getColor(led) {
        return this.TRANSITION.getColor(Transparent(), Transparent(), led);
    }
};

function TransitionLoopL(T) { return new TransitionLoopLClass(T); }


class MultiTransitionEffectLClass extends MODEL {
    constructor(TRANSITION, EFFECT_ARG, N) {
        super("Trigger transitions on an effect.", arguments);
        this.add_arg("TRANSITION", "TRANSITION", "from EFFECT_COLOR T");
        this.add_arg("EFFECT", "EFFECT", "Effect type");
        this.add_arg("N", "INT", "Simultaneous effects.", 3);
        this.effect_ = new OneshotEffectDetector(this.EFFECT);
        this.TRANSITIONS = [];
        this.running = [];
        this.pos = 0;
        for (var i = 0; i < this.N; i++) {
            this.TRANSITIONS.push(this.TRANSITION.DOCOPY());
            this.running.push(false);
        }
        HandleEffectType(EFFECT_ARG);
    }
    run(blade) {
        var e = this.effect_.Detect(blade);
        if (e) {
            this.TRANSITIONS[this.pos].begin();
            this.running[this.pos] = true;
            this.pos++;
            if (this.pos == this.N) this.pos = 0;
        }
        for (var i = 0; i < this.N; i++) {
            if (this.running[i]) {
                this.TRANSITIONS[i].run(blade);
                if (this.TRANSITIONS[i].done()) {
                    this.running[i] = false;
                }
            }
        }
    }
    getColor(led) {
        var ret = Transparent();
        var P = this.pos + 1;
        for (var i = 0; i < this.N; i++) {
            if (P > this.N) P = 0;
            if (this.running[P]) {
                ret = this.TRANSITIONS[P].getColor(ret, ret, led);
            }
            P++;
        }
        return ret;
    }
    IS_RUNNING() {
        for (var i = 0; i < this.N; i++) {
            if (this.running[i]) return true;
        }
        return false;
    }

    argify(state) {
        state.color_argument = effect_to_argument(this.EFFECT);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function MultiTransitionEffectL(T, E, N) {
    return new MultiTransitionEffectLClass(T, E, N);
}


class TransitionEffectLClass extends MODEL {
    constructor(EFFECT_COLOR, TRANSITION1, TRANSITION2, EFFECT_ARG) {
        super("Trigger transitions on an effect.", arguments);
        this.add_arg("TRANSITION", "TRANSITION", "from EFFECT_COLOR T");
        this.add_arg("EFFECT", "EFFECT", "Effect type");
        this.effect_ = new OneshotEffectDetector(this.EFFECT);
        this.run_ = false;
    }
    run(blade) {
        var e = this.effect_.Detect(blade);
        if (e) {
            this.TRANSITION.begin();
            this.run_ = true;
        }
        this.TRANSITION.run(blade);
        if (this.run_ && this.TRANSITION.done()) {
            this.run_ = false;
        }
    }
    getColor(led) {
        var ret = Transparent();
        if (this.run_) {
            ret = this.TRANSITION.getColor(ret, ret, led);
        }
        return ret;
    }
    IS_RUNNING() { return this.run_; }

    argify(state) {
        state.color_argument = effect_to_argument(this.EFFECT);
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function TransitionEffectL(T, E) {
    return new TransitionEffectLClass(T, E);
}


class InOutTrLClass extends MODEL {
    isEffect() { return true; }
    constructor(OUT_TR, IN_TR, OFF, AD) {
        super("In-out based on transitions", arguments);
        this.add_arg("OUT_TR", "TRANSITION", "IN-OUT transition");
        this.add_arg("IN_TR", "TRANSITION", "OUT-IN transition");
        this.add_arg("OFF", "COLOR", "Color when off", BLACK.DOCOPY());
        this.add_arg("ALLOW_DISABLE", "INT", "allow disable?", 1);
        this.on_ = false;
        this.out_active_ = false;
        this.in_active_ = false;
    }
    run(blade) {
        this.OFF.run(blade);

        if (this.on_ != blade.is_on()) {
            this.on_ = blade.is_on();
            if (this.on_) {
                this.OUT_TR.begin();
                this.out_active_ = true;
            } else {
                this.IN_TR.begin();
                this.in_active_ = true;
            }
        }

        if (this.out_active_) {
            this.OUT_TR.run(blade);
            if (this.OUT_TR.done()) {
                this.out_active_ = false;
            }
        }

        if (this.in_active_) {
            this.IN_TR.run(blade);
            if (this.IN_TR.done()) {
                this.in_active_ = false;
            }
        }
    }

    runIn(A, B, led) {
        if (this.in_active_) {
            return this.IN_TR.getColor(A, B, led);
        } else {
            return B;
        }
    }

    runOut(A, B, led) {
        if (this.out_active_) {
            return this.OUT_TR.getColor(A, B, led);
        } else {
            return B;
        }
    }

    getColor(led) {
        if (!this.out_active_ && !this.in_active_) {
            if (this.on_) {
                return Transparent();
            } else {
                return this.OFF.getColor(led);
            }
        } else {
            var on = Transparent();
            var off = this.OFF.getColor(led);
            if (this.on_) {
                return this.runOut(this.runIn(on, off, led), on, led);
            } else {
                return this.runIn(this.runOut(off, on, led), off, led);
            }
        }
    }
};

function InOutTrL(OUT_TR, IN_TR, OFF, AD) {
    return new InOutTrLClass(OUT_TR, IN_TR, OFF, AD);
}


class ResponsiveLockupLClass extends MACRO {
    constructor(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
        super("Responsive localized lockup layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrInstant());
        this.add_arg("TR2", "TRANSITION", "End transition", TrInstant());
        this.add_arg("TOP", "FUNCTION", "uppermost lockup limit", Scale(BladeAngle(0, 16000), Int(4000), Int(26000)));
        this.add_arg("BOTTOM", "FUNCTION", "lowermost lockup limit", Int(6000));
        this.add_arg("SIZE", "FUNCTION", "lockup size", Scale(SwingSpeed(100), Int(9000), Int(14000)));
        this.SetExpansion(LockupTrL(AlphaL(COLOR, Bump(Scale(BladeAngle(), this.TOP, this.BOTTOM), this.SIZE)),
            this.TR1,
            this.TR2,
            LOCKUP_TYPE(LOCKUP_NORMAL)));;
    }
    argify(state) {
        state.color_argument = LOCKUP_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveLockupL(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
    return new ResponsiveLockupLClass(COLOR, TR1, TR2, TOP, BOTTOM, SIZE);
}

class ResponsiveDragLClass extends MACRO {
    constructor(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
        super("Responsive localized drag layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrInstant());
        this.add_arg("TR2", "TRANSITION", "End transition", TrInstant());
        this.add_arg("SIZE1", "FUNCTION", "lower twist limit", Int(2000));
        this.add_arg("SIZE2", "FUNCTION", "upper twist limit", Int(10000));
        this.SetExpansion(LockupTrL(AlphaL(COLOR, SmoothStep(Int(32000), Scale(TwistAngle(), this.SIZE1, this.SIZE2))),
            this.TR1,
            this.TR2,
            LOCKUP_TYPE(LOCKUP_DRAG)));
    }
    argify(state) {
        state.color_argument = DRAG_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveDragL(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
    return new ResponsiveDragLClass(COLOR, TR1, TR2, TOP, BOTTOM, SIZE);
}

class ResponsiveMeltLClass extends MACRO {
    constructor(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
        super("Responsive localized melt layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.", Mix(TwistAngle(), OrangeRed.DOCOPY(), RED.DOCOPY()));
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrWipeIn(600));
        this.add_arg("TR2", "TRANSITION", "End transition", TrWipe(600));
        this.add_arg("SIZE1", "FUNCTION", "lower twist limit", Int(4000));
        this.add_arg("SIZE2", "FUNCTION", "upper twist limit", Int(10000));
        this.SetExpansion(LockupTrL(AlphaL(this.COLOR, SmoothStep(Int(30000), Scale(TwistAngle(), this.SIZE1, this.SIZE2))),
            this.TR1,
            this.TR2,
            LOCKUP_TYPE(LOCKUP_MELT)));
    }
};

function ResponsiveMeltL(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
    return new ResponsiveMeltLClass(COLOR, TR1, TR2, TOP, BOTTOM, SIZE);
}

class ResponsiveLightningBlockLClass extends MACRO {
    constructor(COLOR, TR1, TR2) {
        super("Responsive lightning block layer", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrInstant());
        this.add_arg("TR2", "TRANSITION", "End transition", TrInstant());
        this.SetExpansion(
            LockupTrL(
                AlphaL(COLOR,
                    LayerFunctions(
                        Bump(Scale(SlowNoise(Scale(BladeAngle(24000, 32768), Int(2100), Int(1000))), Scale(BladeAngle(24000, 32768), Int(3000), Int(10000)), Int(16000)),
                            Scale(BrownNoiseF(Int(10)), Scale(TwistAngle(), Int(4000), Int(10000)), Scale(TwistAngle(), Int(9000), Int(14000)))),
                        Bump(Scale(SlowNoise(Int(2200)), Scale(BladeAngle(24000, 32768), Int(26000), Int(18000)), Int(8000)),
                            Scale(NoisySoundLevel(), Scale(TwistAngle(), Int(6000), Int(10000)), Scale(TwistAngle(), Int(10000), Int(14000)))),
                        Bump(Scale(SlowNoise(Int(2300)), Scale(BladeAngle(24000, 32768), Int(20000), Int(16000)), Scale(BladeAngle(24000, 32768), Int(30000), Int(24000))),
                            Scale(IsLessThan(SlowNoise(Int(2000)), Int(12000)), Scale(NoisySoundLevel(), Scale(TwistAngle(), Int(9000), Int(5000)), Int(0)), Int(0))))),
                this.TR1,
                this.TR2,
                LOCKUP_TYPE(LOCKUP_LIGHTNING_BLOCK)));
    }
    argify(state) {
        state.color_argument = LB_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveLightningBlockL(COLOR, TR1, TR2) {
    return new ResponsiveLightningBlockLClass(COLOR, TR1, TR2);
}

class ResponsiveClashLClass extends MACRO {
    constructor(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
        super("Responsive localized lockup layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrInstant());
        this.add_arg("TR2", "TRANSITION", "End transition", TrFade(200));
        this.add_arg("TOP", "FUNCTION", "uppermost lockup limit", Scale(BladeAngle(0, 16000), Int(4000), Int(26000)));
        this.add_arg("BOTTOM", "FUNCTION", "lowermost lockup limit", Int(6000));
        this.add_arg("SIZE", "FUNCTION", "lockup size", Int(10000));
        this.SetExpansion(TransitionEffectL(TrConcat(this.TR1,
            AlphaL(COLOR, Bump(Scale(BladeAngle(), this.TOP, this.BOTTOM), this.SIZE)),
            this.TR2),
            EFFECT(EFFECT_CLASH)));
    }
    argify(state) {
        state.color_argument = CLASH_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveClashL(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
    return new ResponsiveClashLClass(COLOR, TR1, TR2, TOP, BOTTOM, SIZE);
}

class ResponsiveBlastLClass extends MACRO {
    constructor(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT_ARG) {
        super("Responsive localized blast layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("FADE", "FUNCTION", "fadeout time", Int(400));
        this.add_arg("SIZE", "FUNCTION", "blast size", Int(100));
        this.add_arg("SPEED", "FUNCTION", "blast speed", Int(400));
        this.add_arg("TOP", "FUNCTION", "uppermost blast limit", Int(28000));
        this.add_arg("BOTTOM", "FUNCTION", "lowermost blast limit", Int(8000));
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(
            AlphaL(MultiTransitionEffectL(
                TrWaveX(this.COLOR, this.FADE, this.SIZE, this.SPEED, Scale(BladeAngle(), this.TOP, this.BOTTOM)),
                this.EFFECT),
                Bump(Scale(BladeAngle(), this.TOP, this.BOTTOM), Int(24000))));
    }
    argify(state) {
        state.color_argument = BLAST_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveBlastL(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT) {
    return new ResponsiveBlastLClass(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT);
}

class ResponsiveBlastWaveLClass extends MACRO {
    constructor(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT_ARG) {
        super("Responsive localized blast layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("FADE", "FUNCTION", "fadeout time", Int(400));
        this.add_arg("SIZE", "FUNCTION", "blast size", Int(100));
        this.add_arg("SPEED", "FUNCTION", "blast speed", Int(400));
        this.add_arg("TOP", "FUNCTION", "uppermost blast limit", Int(28000));
        this.add_arg("BOTTOM", "FUNCTION", "lowermost blast limit", Int(8000));
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(
            MultiTransitionEffectL(
                TrWaveX(this.COLOR, this.FADE, this.SIZE, this.SPEED, Scale(BladeAngle(), this.TOP, this.BOTTOM)),
                this.EFFECT));

    }
    argify(state) {
        state.color_argument = BLAST_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveBlastWaveL(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT) {
    return new ResponsiveBlastWaveLClass(COLOR, FADE, SIZE, SPEED, TOP, BOTTOM, EFFECT);
}

class ResponsiveBlastFadeLClass extends MACRO {
    constructor(COLOR, FADE, SIZE, TOP, BOTTOM, EFFECT_ARG) {
        super("Responsive localized blast layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("SIZE", "FUNCTION", "blast size", Int(8000));
        this.add_arg("FADE", "FUNCTION", "fadeout time", Int(400));
        this.add_arg("TOP", "FUNCTION", "uppermost blast limit", Int(28000));
        this.add_arg("BOTTOM", "FUNCTION", "lowermost blast limit", Int(8000));
        this.add_arg("EFFECT", "EFFECT", "effect type", EFFECT(EFFECT_BLAST));
        this.SetExpansion(
            MultiTransitionEffectL(
                TrConcat(TrInstant(),
                    AlphaL(this.COLOR, Bump(Scale(BladeAngle(), this.TOP, this.BOTTOM), this.SIZE)),
                    TrFadeX(this.FADE)),
                this.EFFECT));

    }
    argify(state) {
        state.color_argument = BLAST_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveBlastFadeL(COLOR, FADE, SIZE, TOP, BOTTOM, EFFECT) {
    return new ResponsiveBlastFadeLClass(COLOR, FADE, SIZE, TOP, BOTTOM, EFFECT);
}

class ResponsiveStabLClass extends MACRO {
    constructor(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
        super("Responsive localized stab layer.", arguments);
        this.add_arg("COLOR", "COLOR", "Color.");
        this.add_arg("TR1", "TRANSITION", "Begin transition", TrWipeIn(600));
        this.add_arg("TR2", "TRANSITION", "End transition", TrWipe(600));
        this.add_arg("SIZE1", "FUNCTION", "lower twist limit", Int(14000));
        this.add_arg("SIZE2", "FUNCTION", "upper twist limit", Int(8000));
        this.SetExpansion(
            TransitionEffectL(TrConcat(this.TR1,
                AlphaL(COLOR, SmoothStep(Int(32000), Scale(BladeAngle(), this.SIZE1, this.SIZE2))),
                this.TR2),
                EFFECT(EFFECT_STAB)));

    }
    argify(state) {
        state.color_argument = STAB_COLOR_ARG;
        var ret = super.argify(state);
        state.color_argument = null;
        return ret;
    }
};

function ResponsiveStabL(COLOR, TR1, TR2, TOP, BOTTOM, SIZE) {
    return new ResponsiveStabLClass(COLOR, TR1, TR2, TOP, BOTTOM, SIZE);
}