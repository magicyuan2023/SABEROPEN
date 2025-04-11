
var _cycle = 300;
var skipNumber = 200;
var _outputRgbs;
var _outputOffset = 0;
var _afterGenerate = null;
var _beforeCount = 0;
function generateRGBData(callback) {
    _afterGenerate = callback;
    _beforeCount = 0;
    _outputRgbs = new Uint8Array(num_leds * 3 * _cycle * 1);
    _outputOffset = 0;
    stopTick();
    Run();
    generateRGBsCycle();

}

function generateRGBsCycle() {
    _beforeCount++;
    generateRGBs();
    if (_outputOffset >= _outputRgbs.length) {
        startTick();
        if (_afterGenerate) {
            _afterGenerate();
        }

    }
    else {
        window.requestAnimationFrame(generateRGBsCycle);
    }
}

function generateRGBs() {
    last_micros = current_micros;
    current_micros = actual_millis() * 1000;
    num_leds = blade.num_leds()
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
        if (_beforeCount > skipNumber) {
            for (var i = 0; i < num_leds; i++) {
                c = S.getColor(i);
                _outputRgbs[_outputOffset++] = Math.round(c.r * 255);
                _outputRgbs[_outputOffset++] = Math.round(c.g * 255);
                _outputRgbs[_outputOffset++] = Math.round(c.b * 255);
            }
        }
        if (last_micros != 0) {
            current_micros += (current_micros - last_micros) / 2;
        }
        if (framesPerUpdate == 0) {
            S.run(blade);
        }

    }

    return _outputOffset;
}

function getRGBData() {
    return _outputRgbs;
}


function download(name, desc) {
    downloadObject(name + ".bin", _outputRgbs, "application/octet-stream");
    downloadObject(name + "_readme.txt", desc, "text/plain");
}