var p = new URL(window.location.href).searchParams;
var w = p.get('w');
var h = p.get("h");
initGL(w,h);
ClickPower();

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