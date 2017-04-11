'use strict'

var me = module.exports

me.server = {
    /*  */
    maxVoxelHeight: 75,
    /* x */
    actionDelay: 0.4, // s
    /* x */
    chatDelay: 3, // s
    /* x */
    maxGlobalBlocks: 1000000,
    /* x */
    dataChunkSize: 15000, // keys
    /* x */
    chunkInterval: 50, // ms
    /* x */
    maxClients: 1000
}

// each set much be contanined within
// an object for generation to work properly
me.client = {
    general: {
        maxVoxelHeight: me.server.maxVoxelHeight,
        actionDelay: me.server.actionDelay,
        chatDelay: me.server.chatDelay,
        clearColor: 0xffffff
    },
    convert: {
        warnThreshold: 15000,
        errorThreshold: 30000
    },
    grid: {
        blockSize: 50, // even
        sqPerSideOfSelectPlane: 51, // must be odd
        sqPerSideOfSection: 151, // must be odd
        sectionsPerSide: 15,
        init: function() {
            // must be odd
            this.sqPerSideOfGrid = this.sqPerSideOfSection *
                this.sectionsPerSide - 1

            // scene size of the grid; must be even
            this.size = this.sqPerSideOfGrid * (this.blockSize / 2)

            return this
        }
    }.init(),

    mapControls: {
        zoomSpeed: 1.0,
        minDistance: 0,
        maxDistance: Number.MAX_VALUE,
        camMinxz: -100000,
        camMaxxz: 100000,
        camMiny: 100,
        camMaxy: 75000,
        rotateSpeed: 0.5,
        // How far you can orbit vertically, upper and lower limits.
        minPolarAngle: 0.05, // radians
        maxPolarAngle: Math.PI / 2.15 // radians
    }
}
