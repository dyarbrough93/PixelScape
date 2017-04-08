const config = require('./config.js')
const fs = require('fs')

var clientConfig = {
    maxVoxelHeight: config.maxVoxelHeight,
    actionDelay: config.actionDelay,
    chatDelay: config.chatDelay
}

var file;
(function createClientConfigFile() {

    file = ''
    file += 'var Config = function(window, undefined) {\n\n'
    file += 'var settings = ' + JSON.stringify(clientConfig) + '\n\n'
    file += 'function get() {\n'
    file += 'return settings\n'
    file += '}\n\n'
    file += 'return {\n'
    file += 'get: get\n'
    file += '}\n\n'
    file += '}()'

})()

fs.writeFileSync('../client/js/classes/Config.js', file)
