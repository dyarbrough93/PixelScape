const _ = require('lodash')

const sharedConfig = {
    maxVoxelHeight: 75,
    actionDelay: 50, // ms
    guestActionDelay: 50, // ms
    deleteOtherDelay: 1500, // ms
    guestDeleteOtherDelay: 1750, // ms
    chatDelay: 3, // s
    maxGlobalBlocks: 1000000,
}

const serverConfig = {
    dataChunkSize: 15000, // keys
    chunkInterval: 50, // ms
    maxClients: 1000,
    guestVoxelTime: 90, // minutes (time guest voxels will persist)
    loginForm: {
        lowMaxLength: 20,
        highMaxLength: 40,
        minLength: 8
    }
}

// each set much be contanined within
// an object for generation to work properly
const clientConfig = {
    general: {
        maxVoxelHeight: serverConfig.maxVoxelHeight,
        actionDelay: serverConfig.actionDelay,
        chatDelay: serverConfig.chatDelay,
        deleteOtherDelay: serverConfig.deleteOtherDelay,
        aaOnByDefault: true
    },
    convert: {
        warnThreshold: 15000,
        errorThreshold: 30000
    },
    grid: {
        blockSize: 50, // even
        sqPerSideOfSelectPlane: 71, // must be odd
        sqPerSideOfSection: 55, // must be odd
        sectionsPerSide: 7,
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
        camMinxz: -17000,
        camMaxxz: 17000,
        camMiny: 100,
        camMaxy: 35000,
        // cam rotation / zoom speed
        rotateSpeed: 0.5,
        zoomSpeed: 1.0,
        // How far you can orbit vertically, upper and lower limits.
        minPolarAngle: 0.05, // radians
        maxPolarAngle: Math.PI / 2.1 // radians
    },

    GUI: {
        maxSavedColors: 5
    }
}

_.merge(serverConfig, sharedConfig)
_.merge(clientConfig.general, sharedConfig)

serverConfig.minXZ = -(clientConfig.grid.sqPerSideOfGrid / 2)
serverConfig.maxXZ = (clientConfig.grid.sqPerSideOfGrid / 2)

module.exports = {
    server: serverConfig,
    client: clientConfig
}
