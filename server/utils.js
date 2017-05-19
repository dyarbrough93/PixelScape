const config = require('./config.js').server

module.exports = {

    getPosStr: function(gPos) {
        return 'x' + gPos.x + 'y' + gPos.y + 'z' + gPos.z
    },

    dbErr: function(err) {
        if (err) {
            console.log(err)
            return true
        }
        return false
    },

    withinGridBoundaries: function(gPos) {

        let minxz = config.minXZ
        let maxxz = config.maxXZ

        return (gPos.x >= minxz &&
            gPos.z >= minxz &&
            gPos.x <= maxxz &&
            gPos.z <= maxxz)

    },

    coordStrParse: function(coordStr) {

        let xreg = /x[-]*\d+/,
            yreg = /y[-]*\d+/,
            zreg = /z[-]*\d+/

        let pos = {
            x: parseInt(xreg.exec(coordStr)[0].slice(1)),
            y: parseInt(yreg.exec(coordStr)[0].slice(1)),
            z: parseInt(zreg.exec(coordStr)[0].slice(1))
        }

        return { x: pos.x, y: pos.y, z: pos.z }

    }
}
