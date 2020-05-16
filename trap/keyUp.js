module.exports = function(e) {

    if (e.key === 'Shift') lab.vm.emu.reload()
    if (e.key === ' ') lab.vm.emu.fire()

    switch(e.key) {
    case 'ArrowLeft': lab.vm.emu.keyUp(1); break;
    case 'ArrowUp': lab.vm.emu.keyUp(2); break;
    case 'ArrowRight': lab.vm.emu.keyUp(3); break;
    case 'ArrowDown': lab.vm.emu.keyUp(4); break;
    }
}
