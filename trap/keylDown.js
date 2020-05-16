module.exports = function(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        lab.vm.emu.selectROM()
    }
}
