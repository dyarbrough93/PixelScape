const path = require('path')

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        uglify: {
            lib: {
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: 'client/js/lib/', // Src matches are relative to this path.
                    src: ['*.js'], // Actual pattern(s) to match.
                    dest: 'build/js/lib/', // Destination path prefix.
                    ext: '.min.js', // Dest filepaths will have this extension.
                    extDot: 'last' // Extensions in filenames begin after the last dot
                }]
            }
        },
        obfuscator: {
            classes: {
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: 'client/js/', // Src matches are relative to this path.
                    src: ['*.js', 'classes/*.js'], // Actual pattern(s) to match.
                    dest: 'build/js/', // Destination path prefix.
                    ext: '.obs.js', // Dest filepaths will have this extension.
                    extDot: 'last' // Extensions in filenames begin after the last dot
                }]
            }
        },
        copy: {
            css: {
                files: [{
                    expand: true,
                    cwd: 'client/css/',
                    src: ['*'],
                    dest: 'build/css',
                    filter: 'isFile'
                }]
            },
            img: {
                files: [{
                    expand: true,
                    cwd: 'client/img/',
                    src: ['*'],
                    dest: 'build/img',
                    filter: 'isFile'
                }]
            }
        }
    })

    grunt.loadNpmTasks('grunt-newer')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-obfuscator')

    // Default task(s).
    grunt.registerTask('default', ['newer:obfuscator', 'newer:uglify', 'newer:copy'])

};
