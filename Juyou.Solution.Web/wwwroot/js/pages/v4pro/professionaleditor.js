
function AddTabContent(tab, data) {
    FIND(tab + "_tabcontent").innerHTML += data;
}



AddTemplate("InOutHelper<SimpleClash<Lockup<Blast<Blue,White>,AudioFlicker<Blue,White>>,White>, 300, 800>");

AddTemplate("InOutHelper<EasyBlade<OnSpark<Green>, White>, 300, 800>>");
AddTemplate("InOutHelper<EasyBlade<Sparkle<Blue>, White>, 300, 800>>");
AddTemplate("IgnitionDelay<500, InOutHelper<EasyBlade<OnSpark<Green>, White>, 300, 800>>>");
AddTemplate("RetractionDelay<500, InOutHelper<EasyBlade<OnSpark<Green>, White>, 300, 800>>>");
AddTemplate("StyleNormalPtr<AudioFlicker<Yellow, White>, Blue, 300, 800>");
AddTemplate("InOutSparkTip<EasyBlade<Magenta, White>, 300, 800>>");
AddTemplate("StyleNormalPtr<Gradient<Red, Blue>, Gradient<Cyan, Yellow>, 300, 800>");
AddTemplate("StyleNormalPtr<Pulsing<Red, Rgb<50,0,0>, 5000>, White, 300, 800, Red>");
AddTemplate("StyleRainbowPtr<300, 800>");
AddTemplate("StyleStrobePtr<White, Rainbow, 15, 300, 800>");
AddTemplate("StyleFirePtr<Red, Yellow>");
AddTemplate("Layers<Red, ResponsiveLockupL<White, TrInstant, TrInstant, Int<26000>, Int<6000>>,ResponsiveLightningBlockL<White, TrInstant, TrInstant>,ResponsiveMeltL<Mix<TwistAngle<>,Red,Yellow>, TrWipeIn<600>, TrWipe<600>, Int<4000>, Int<10000>>,ResponsiveDragL<White, TrInstant, TrInstant, Int<2000>, Int<10000>>,ResponsiveClashL<White, TrInstant, TrFade<200>, Int<26000>, Int<6000>>,ResponsiveBlastL<White, Int<400>, Int<100>, Int<400>, Int<28000>, Int<8000>>,ResponsiveBlastWaveL<White, Int<400>, Int<100>, Int<400>, Int<28000>, Int<8000>>,ResponsiveBlastFadeL<White, Int<8000>, Int<400>, Int<28000>, Int<8000>>,ResponsiveStabL<White, TrWipeIn<600>, TrWipe<600>, Int<14000>, Int<8000>>,InOutTrL<TrWipe<300>, TrWipeIn<500>>>");


AddLayer("AlphaL<Red, Int<16000>>");
AddLayer("AlphaMixL<Bump<Int<16384>,Int<16384>>,Red,Green,Blue>");
AddEffectWL("AudioFlicker<White, Blue>");
AddEffectWLF("Blast<Blue, White>");
AddEffectWL("BlastFadeout<Blue, White>");
AddEffectWL("Blinking<Red, Blue, 1000, 500>");
AddEffect("BrownNoiseFlicker<Green, Magenta, 50>");
AddLayer("BrownNoiseFlickerL<Magenta, Int<50>>");
AddEffect("ColorChange<TrInstant, Red, Green, Blue>");
AddEffect("ColorSelect<Variation, TrInstant, Red, Green, Blue>");
AddFunction("IntSelect<Variation, 0, 8192,32768>");
AddEffect("ColorCycle<Blue,  0, 1, Cyan,  100, 3000, 5000>");
AddEffect("ColorSequence<500, Red, Green, Blue>");
AddEffect("EffectSequence<EFFECT_CLASH, Red, Green, Blue>");
AddEffect("Cylon<Red, 5, 20>");
AddEffect("Gradient<Blue, Green, Yellow, Red>");
AddEffect("Gradient<Red, Blue, Green>");
AddEffect("Gradient<Red, Blue>");
AddEffect("Hue<16384>");
AddEffectWL("HumpFlicker<Green, Magenta, 50>");
AddEffect("InOutHelper<White, 300, 800, Black>");
AddEffect("InOutSparkTip<Red, 1000, 800, White>");
AddEffect("InOutTr<Green, TrColorCycle<3000>, TrFade<500>>");
AddEffect("Layers<Green, AlphaL<Red, Int<16000>>>");
AddEffectWL("LocalizedClash<Red, White>");
AddEffectWL("Lockup<Green, Red>");
AddEffectWL("LockupTr<Red, White, TrFade<100>, TrFade<100>, SaberBase::LOCKUP_MELT>");
AddEffect("Mix<Int<16384>, Red, Blue>");
AddEffect("OnSpark<Green, White, 200>");
AddLayer("OnSparkL<White, Int<200>>");
AddEffectWL("OriginalBlast<Blue, White>");
AddEffect("Pulsing<Blue, Red, 800>");
AddLayer("PulsingL<Red, Int<800>>");
AddEffect("Rainbow");
AddEffect("Remap<SmoothStep<Sin<Int<10>>, Sin<Int<7>>>, Rainbow>");
AddEffect("RandomBlink<3000>");
AddLayer("RandomBlinkL<Int<3000>, Green>");
AddEffect("RandomFlicker<Yellow, Blue>");
AddLayer("RandomL<Blue>");
AddEffectWL("RandomPerLEDFlicker<Green, Magenta>");
AddEffect("Rgb16<0,0,65536>");
AddEffect("Rgb<100,100,100>");
AddEffect("RgbCycle");
AddEffect("RotateColorsX<Sin<Int<10>>, Red>");
AddEffect("Sequence<Red, Black, 100, 37, 0b0001010100011100, 0b0111000111000101, 0b0100000000000000>");
AddLayer("SequenceL<Red, 100, 37, 0b0001010100011100, 0b0111000111000101, 0b0100000000000000>");
AddEffectWL("SimpleClash<Red, White, 40>");
AddEffect("Sparkle<Blue>");
AddLayer("SparkleL");
AddEffect("Stripes<1000, 1000, Cyan, Magenta, Yellow, Blue>");
AddEffect("Strobe<Black, White, 15, 1>");
AddLayer("StrobeL<White, Int<15>, Int<1>>");
AddEffect("StyleFire<Blue, Cyan>");
AddEffect("MultiTransitionEffect<Blue, White, TrWipe<50>, TrWipe<50>, EFFECT_BLAST>");
AddEffectWL("TransitionLoop<Blue, TrConcat<TrFade<200>, Red, TrFade<200>>>");

AddEffect("IgnitionDelay<500, InOutHelper<EasyBlade<OnSpark<Green>, White>, 300, 800>>>");
AddEffect("RetractionDelay<500, InOutHelper<EasyBlade<OnSpark<Green>, White>, 300, 800>>>");


AddLayer("TransitionEffectL<TrConcat<TrWipe<50>, White, TrWipe<50>>, EFFECT_BLAST>");
AddLayer("MultiTransitionEffectL<TrConcat<TrWipe<50>, White, TrWipe<50>>, EFFECT_BLAST>");

AddTransition("TrBoing<300, 2>");
AddTransition("TrColorCycle<3000>");
AddTransition("TrConcat<TrFade<100>, White, TrFade<100>>");
AddTransition("TrDelay<500>");
AddTransition("TrFade<300>");
AddTransition("TrInstant");
AddTransition("TrJoin<TrFade<500>, TrWipe<500>>");
AddTransition("TrJoinR<TrFade<500>, TrWipe<500>>");
AddTransition("TrRandom<TrFade<500>, TrWipe<500>, TrBoing<500, 2>>");
AddTransition("TrSelect<Variation,TrFade<500>, TrWipe<500>, TrBoing<500, 2>>");
AddTransition("TrSmoothFade<300>");
AddTransition("TrWipe<500>");
AddTransition("TrWipeIn<500>");
AddTransition("TrCenterWipe<500>");
AddTransition("TrCenterWipeSpark<WHITE, 500>");
AddTransition("TrCenterWipeIn<500>");
AddTransition("TrCenterWipeInSpark<WHITE, 500>");
AddTransition("TrWaveX<White>");
AddTransition("TrSparkX<White>");
AddTransition("TrWipeSparkTip<White, 300>");
AddTransition("TrWipeInSparkTip<White, 300>");
AddTransition("TrWipeSparkTipX<White, Int<300>>");
AddTransition("TrWipeInSparkTipX<White, Int<300>>");

AddFunction("BatteryLevel");
AddFunction("BlinkingF<Int<1000>, Int<500>>");
AddFunction("BrownNoiseF<Int<50>>");
AddFunction("HumpFlickerF<50>");
AddFunction("NoisySoundLevel");
AddFunction("NoisySoundLevelCompat");
AddFunction("SmoothSoundLevel");
AddFunction("SwingSpeed<250>");
AddFunction("SwingAcceleration<130>");
AddFunction("ClashImpactF<>");
AddFunction("Bump<Int<16384>>");
AddFunction("Ifon<Int<0>, Int<32768>>");
AddFunction("InOutFunc<300, 800>");
AddFunction("InOutHelperF<InOutFunc<300, 800>>");
AddFunction("Int<32768>");
AddFunction("Scale<Sin<Int<10>>,Int<0>,Int<4000>>");
AddFunction("InvertF<Ifon<Int<0>, Int<32768>>>");
AddFunction("Sin<Int<10>>");
AddFunction("Saw<Int<10>>");
AddFunction("SmoothStep<Sin<Int<10>>, Sin<Int<7>>>");
AddFunction("Trigger<EFFECT_FORCE, Int<500>, Int<1000>, Int<500>>");
AddFunction("ChangeSlowly<NoisySoundLevel, Int<50000>>");
AddFunction("SlowNoise<Int<1000>>");
AddFunction("IsLessThan<SwingSpeed<250>, Int<100>>");
AddFunction("IsGreaterThan<SwingSpeed<250>, Int<100>>");
AddFunction("LayerFunctions<Bump<Int<0>>, Bump<Int<32768>>>");
AddFunction("OnSparkF<Int<200>>");
AddFunction("PulsingF<Int<800>>");
AddFunction("RandomBlinkF<Int<3000>>");
AddFunction("RandomF");
AddFunction("RandomPerLEDF");
AddFunction("SequenceF<100, 37, 0b0001010100011100, 0b0111000111000101, 0b0100000000000000>");
AddFunction("SparkleF");
AddFunction("StrobeF<Int<15>, Int<1>>");
AddFunction("BlastFadeoutF");
AddFunction("OriginalBlastF");
AddFunction("Variation");
AddFunction("TwistAngle<>");
AddFunction("BladeAngle<>");
AddFunction("Sum<RandomPerLEDF, Bump<Int<16384>>>");
AddFunction("Mult<RandomPerLEDF, Bump<Int<16384>>>");
AddFunction("Percentage<RandomPerLEDF, 20>");
AddFunction("HoldPeakF<RandomF, Int<300>, Int<32768>>");
AddFunction("CenterDistF<>");
AddFunction("EffectPosition<>");
AddFunction("TimeSinceEffect<>");
AddFunction("WavNum<>");
AddFunction("WavLen<>");
AddFunction("CircularSectionF<Sin<Int<3>>, Sin<Int<2>>>");
AddFunction("LinearSectionF<Sin<Int<3>>, Sin<Int<2>>>");
AddFunction("EffectRandomF<EFFECT_CLASH>");
AddFunction("EffectPulseF<EFFECT_CLASH>");
AddFunction("IncrementWithReset<EffectPulseF<EFFECT_CLASH>>");
AddFunction("IncrementModuloF<EffectPulseF<EFFECT_CLASH>>");
AddFunction("ThresholdPulseF<Saw<Int<60>>, Int<16384>>");
AddFunction("IncrementF<Saw<Int<60>>, Int<16384>, Int<32768>, Int<1024>>");
AddFunction("EffectIncrementF<EFFECT_CLASH, Int<32768>, Int<8192>>");
AddFunction("MarbleF<Int<-2000>, Int<40000>, Ifon<Int<827680>, Int<0>>, Int<1276800>>");

AddColor("AliceBlue", 223, 239, 255);/*<赋值对应颜色的RGB值>*/
AddColor("Aqua", 0, 255, 255);
AddColor("Aquamarine", 55, 255, 169);
AddColor("Azure", 223, 255, 255);
AddColor("Bisque", 255, 199, 142);
AddColor("Black", 0, 0, 0);
AddColor("BlanchedAlmond", 255, 213, 157);
AddColor("Blue", 0, 0, 255);
AddColor("Chartreuse", 55, 255, 0);
AddColor("Coral", 255, 55, 19);
AddColor("Cornsilk", 255, 239, 184);
AddColor("Cyan", 0, 255, 255);
AddColor("DarkOrange", 255, 68, 0);
AddColor("DeepPink", 255, 0, 75);
AddColor("DeepSkyBlue", 0, 135, 255);
AddColor("DodgerBlue", 2, 72, 255);
AddColor("FloralWhite", 255, 244, 223);
AddColor("GhostWhite", 239, 239, 255);
AddColor("Green", 0, 255, 0);
AddColor("GreenYellow", 108, 255, 6);
AddColor("HoneyDew", 223, 255, 223);
AddColor("HotPink", 255, 36, 118);
AddColor("Ivory", 255, 255, 223);
AddColor("LavenderBlush", 255, 223, 233);
AddColor("LemonChiffon", 255, 244, 157);
AddColor("LightCyan", 191, 255, 255);
AddColor("LightPink", 255, 121, 138);
AddColor("LightSalmon", 255, 91, 50);
AddColor("LightYellow", 255, 255, 191);
AddColor("Magenta", 255, 0, 255);
AddColor("MintCream", 233, 255, 244);
AddColor("MistyRose", 255, 199, 193);
AddColor("Moccasin", 255, 199, 119);
AddColor("NavajoWhite", 255, 187, 108);
AddColor("Orange", 255, 97, 0);
AddColor("OrangeRed", 255, 14, 0);
AddColor("PapayaWhip", 255, 221, 171);
AddColor("PeachPuff", 255, 180, 125);
AddColor("Pink", 255, 136, 154);
AddColor("Red", 255, 0, 0);
AddColor("SeaShell", 255, 233, 219);
AddColor("Snow", 255, 244, 244);
AddColor("SpringGreen", 0, 255, 55);
AddColor("SteelBlue", 14, 57, 118);
AddColor("Tomato", 255, 31, 15);
AddColor("White", 255, 255, 255);
AddColor("Yellow", 255, 255, 0);

AddLayer("InOutHelperL<InOutFuncX<Int<300>,Int<800>>>");
AddLayer("InOutTrL<TrColorCycle<3000>,TrFade<500>>");

AddLayer("ResponsiveLockupL<White, TrInstant, TrInstant, Int<26000>, Int<6000>>");
AddLayer("ResponsiveLightningBlockL<White, TrInstant, TrInstant>");
AddLayer("ResponsiveMeltL<Mix<TwistAngle<>,Red,Yellow>, TrInstant, TrInstant, Int<4000>, Int<10000>>");
AddLayer("ResponsiveDragL<White, TrInstant, TrInstant, Int<2000>, Int<10000>>");
AddLayer("ResponsiveClashL<White, TrInstant, TrFade<200>, Int<26000>, Int<6000>>");
AddLayer("ResponsiveBlastL<White, Int<400>, Int<100>, Int<400>, Int<28000>, Int<8000>>");
AddLayer("ResponsiveBlastWaveL<White, Int<400>, Int<100>, Int<400>, Int<28000>, Int<8000>>");
AddLayer("ResponsiveBlastFadeL<White, Int<8000>, Int<400>, Int<28000>, Int<8000>>");
AddLayer("ResponsiveStabL<White, TrWipeIn<600>, TrWipe<600>, Int<14000>, Int<8000>>");


function initUI() {
    AddTab("color", "Styles", effect_links.sort().join(""))
    AddTab("rgb", "Colors",
        "<input type=color id=COLOR value='#ff0000' onclick='ClickColor()' />" +
        qlinks.sort().join(""));
    AddTab("layer", "Layers", layer_links.sort().join(""));
    AddTab("function", "Functions", function_links.sort().join(""));
    AddTab("transition", "Transitions", transition_links.sort().join(""));
    AddTab("effect", "Effects");
    AddTab("lockup_type", "Lockup Types");
    AddTab("arguments", "Arguments");
    AddTab("example", "Examples", template_links.join(""));
    AddTab("history", "History");
    AddTab("arg_string", "ArgString");
    EFFECT_ENUM_BUILDER.addToTab("effect", "EFFECT_");
    LOCKUP_ENUM_BUILDER.addToTab("lockup_type", "LOCKUP_");
    ArgumentName_ENUM_BUILDER.addToTab("arguments", "");

    // Add arg string.
    var A = "";
    A += "Arg string: <input id=ARGSTR name=arg type=input size=80 value='builtin 0 1' onchange='ArgStringChanged()' /><br><table>";
    var v = Object.keys(ArgumentName_ENUM_BUILDER.value_to_name);
    for (var i = 0; i < v.length; i++) {
        var V = parseInt(v[i]);
        var N = ArgumentName_ENUM_BUILDER.value_to_name[V];
        A += "<tr><td>" + N + "</td><td>";
        if (N.search("COLOR") >= 0) {
            A += "<input type=color id=ARGSTR_" + N + " onclick='ClickArgColor(" + N + ")' onchange='ClickArgColor(" + N + ")' >";
        } else {
            A += "<input type=button value='<'  onclick='IncreaseArg(" + N + ",-1)' >";
            A += "<input id=ARGSTR_" + N + " type=input size=6 value=0 onchange='ArgChanged(" + N + ")' >";
            A += "<input type=button value='>'  onclick='IncreaseArg(" + N + ",1)' >";
        }
        A += "</td></tr>\n";
    }
    A += "</table\n";
    AddTabContent("arg_string", A);
    checkStateOn();
}

initUI();
initGL(960, 200);
