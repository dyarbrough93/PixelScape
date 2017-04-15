module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        uglify: {
            lib: {
                // Grunt will search for "**/*.js" under "lib/" when the "uglify" task
                // runs and build the appropriate src-dest file mappings then, so you
                // don't need to update the Gruntfile when files are added or removed.
                files: [{
                    expand: true, // Enable dynamic expansion.
                    cwd: 'client/js/lib/', // Src matches are relative to this path.
                    src: ['*.js'], // Actual pattern(s) to match.
                    dest: 'build/js/lib/', // Destination path prefix.
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
        },
        'regex-replace': {
            views: { //specify a target with any name
                src: ['views/game.ejs', 'views/login.ejs'],
                dest: ['views/dev/game.ejs', 'views/dev/login.ejs'],
                actions: [{
                        name: 'rename-dependencies',
                        search: '\.obs\.',
                        replace: '\.',
                        flags: 'g'
                    },
                    {
                        name: 'force-file-copy',
                        search: '"',
                        replace: '\'',
                        flags: 'g'
                    }
                ]
            }
        }
    })

    grunt.loadNpmTasks('grunt-newer')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-obfuscator')
    grunt.loadNpmTasks('grunt-regex-replace')

    // Default task(s).
    grunt.registerTask('default', ['newer:obfuscator', 'newer:uglify', 'newer:copy'])
    grunt.registerTask('regex', ['regex-replace'])

};
