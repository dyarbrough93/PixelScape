const path = require('path')

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        uglify: {
            client: {
                // Grunt will search for "**/*.js" under "lib/" when the "uglify" task
                // runs and build the appropriate src-dest file mappings then, so you
                // don't need to update the Gruntfile when files are added or removed.
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: 'client/js/', // Src matches are relative to this path.
                    src: ['**/*.js'], // Actual pattern(s) to match.
                    dest: 'build/js/', // Destination path prefix.
                    ext: '.min.js', // Dest filepaths will have this extension.
                    extDot: 'last' // Extensions in filenames begin after the last dot
                }]
            }
        },
        copy: {
            css: {
                files: [
                    {
                        expand: true,
                        cwd: 'client/css/',
                        src: ['*'],
                        dest: 'build/css',
                        filter: 'isFile'
                    }
                ]
            },
            img: {
                files: [
                    {
                        expand: true,
                        cwd: 'client/img/',
                        src: ['*'],
                        dest: 'build/img',
                        filter: 'isFile'
                    }
                ]
            }
        }
    })

    grunt.loadNpmTasks('grunt-newer')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-uglify')

    // Default task(s).
    grunt.registerTask('default', ['newer:uglify', 'newer:copy'])

};
