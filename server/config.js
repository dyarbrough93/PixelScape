const generateClientConfig = require('./generateClientConfig.js')

var me = module.exports

me = {
    maxVoxelHeight: 75,
    actionDelay: 0.4, // s
    chatDelay: 3, // s
    maxGlobalBlocks: 1000000,
    dataChunkSize: 15000, // keys
    chunkInterval: 50, // ms
    maxClients: 1000
}

// each set much be contanined within
// an object for generation to work properly
const clientConfig = {
    general: {
        maxVoxelHeight: me.maxVoxelHeight,
        actionDelay: me.actionDelay,
        chatDelay: me.chatDelay,
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
        // these two are not really
        // used, look into removing
        minDistance: 0,
        maxDistance: Number.MAX_VALUE,
        // cam position constraints
        camMinxz: -100000,
        camMaxxz: 100000,
        camMiny: 100,
        camMaxy: 75000,
        // cam rotation / zoom speed
        rotateSpeed: 0.5,
        zoomSpeed: 1.0,
        // How far you can orbit vertically, upper and lower limits.
        minPolarAngle: 0.05, // radians
        maxPolarAngle: Math.PI / 2.15 // radians
    }
}

generateClientConfig(clientConfig)
