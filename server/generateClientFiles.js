const fs = require('fs')
const clientConfig = require('./config.js').client
const socketResponses = require('./socketResponses.js')

;
(function genConfig() {

    let file

    file = ''
    file += 'let Config = function(window, undefined) {\n\n'
    file += 'let settings = ' + JSON.stringify(clientConfig) + '\n\n'

    let getFuncs = ''
    getFuncs += 'function get() {\n'
    getFuncs += 'return settings\n'
    getFuncs += '}\n\n'

    let ret = ''
    ret += 'return {\n'
    ret += 'get: get'

    for (let configVar in clientConfig) {
        if (clientConfig.hasOwnProperty(configVar)) {

            let capitalized = configVar.charAt(0).toUpperCase() + configVar.substring(1)
            getFuncs += 'function get' + capitalized + '() {\n'
            getFuncs += 'return settings.' + configVar + '\n'
            getFuncs += '}\n\n'

            ret += ',\nget' + capitalized + ':' + 'get' + capitalized
        }
    }

    ret += '}\n\n'
    ret += '}()'

    file += getFuncs
    file += ret

    fs.writeFileSync('./client/js/classes/Config.js', file)

})()

;
(function genSocketResponses() {

    let file

    file = ''
    file += 'let SocketResponses = function(window, undefined) {\n\n'
    file += 'let responses = ' + JSON.stringify(socketResponses) + '\n\n'

    let getFuncs = ''
    getFuncs += 'function get() {\n'
    getFuncs += 'return responses\n'
    getFuncs += '}\n\n'

    let ret = ''
    ret += 'return {\n'
    ret += 'get: get'
    ret += '}\n\n'
    ret += '}()'

    file += getFuncs
    file += ret

    fs.writeFileSync('./client/js/classes/SocketResponses.js', file)

})()
