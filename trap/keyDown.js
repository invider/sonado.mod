module.exports = function(e) {
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {

        lab.terminal.key(e.key, e.code)

        switch(e.key) {
        case 'ArrowLeft': lab.vm.emu.keyDown(1); break;
        case 'ArrowUp': lab.vm.emu.keyDown(2); break;
        case 'ArrowRight': lab.vm.emu.keyDown(3); break;
        case 'ArrowDown': lab.vm.emu.keyDown(4); break;
        }

    }
}
