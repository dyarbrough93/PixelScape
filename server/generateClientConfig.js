const fs = require('fs')

var file;
module.exports = function(clientConfig) {

    file = ''
    file += 'var Config = function(window, undefined) {\n\n'
    file += 'var settings = ' + JSON.stringify(clientConfig) + '\n\n'

    var getFuncs = ''
    getFuncs += 'function get() {\n'
    getFuncs += 'return settings\n'
    getFuncs += '}\n\n'

    var ret = ''
    ret += 'return {\n'
    ret += 'get: get'

    for (var configVar in clientConfig) {
        if (clientConfig.hasOwnProperty(configVar)) {

                var capitalized = configVar.charAt(0).toUpperCase() + configVar.substring(1)
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

}
