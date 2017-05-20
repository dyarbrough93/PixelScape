let ArchiveConfig = function(window, undefined) {

	let settings = {
        sqPerSideOfSection: 151,
        sectionsPerSide: 17,
		blockSize: 50,
        init: function() {

            this.sqPerSideOfGrid = this.sqPerSideOfSection *
                this.sectionsPerSide - 1

            this.size = this.sqPerSideOfGrid * (this.blockSize / 2)

            return this
        },
		mapControls: {
			minDistance: 0,
			maxDistance: 1.7976931348623157e+308,
			camMinxz: -75000,
			camMaxxz: 75000,
			camMiny: 100,
			camMaxy: 100000,
			rotateSpeed: 0.5,
			zoomSpeed: 1,
			minPolarAngle: 0.05,
			maxPolarAngle: 1.4959965017094252
		},

	}.init()

	function get() {
		return settings
	}

	function getMapControls() {
		return settings.mapControls
	}

	return {
		get: get,
		getMapControls: getMapControls
	}

}()
