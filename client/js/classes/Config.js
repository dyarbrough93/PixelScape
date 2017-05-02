// generated by server/generateClientFiles.js

let Config = function(window, undefined) {

let settings = {"general":{"maxVoxelHeight":75,"actionDelay":225,"chatDelay":3,"deleteOtherDelay":2500,"aaOnByDefault":false,"guestActionDelay":2500,"guestDeleteOtherDelay":5500,"maxGlobalBlocks":1000000},"convert":{"warnThreshold":15000,"errorThreshold":30000},"grid":{"blockSize":50,"sqPerSideOfSelectPlane":41,"sqPerSideOfSection":151,"sectionsPerSide":17,"sqPerSideOfGrid":2566,"size":64150},"mapControls":{"minDistance":0,"maxDistance":1.7976931348623157e+308,"camMinxz":-100000,"camMaxxz":100000,"camMiny":100,"camMaxy":75000,"rotateSpeed":0.5,"zoomSpeed":1,"minPolarAngle":0.05,"maxPolarAngle":1.4959965017094252},"GUI":{"maxSavedColors":5}}

function get() {
return settings
}

function getGeneral() {
return settings.general
}

function getConvert() {
return settings.convert
}

function getGrid() {
return settings.grid
}

function getMapControls() {
return settings.mapControls
}

function getGUI() {
return settings.GUI
}

return {
get: get,
getGeneral:getGeneral,
getConvert:getConvert,
getGrid:getGrid,
getMapControls:getMapControls,
getGUI:getGUI}

}()