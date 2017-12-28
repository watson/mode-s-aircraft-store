'use strict'

const Aircraft = require('./lib/aircraft')

module.exports = AircraftStore

function AircraftStore (opts) {
  if (!(this instanceof AircraftStore)) return new AircraftStore(opts)
  if (!opts) opts = {}

  this._timeout = opts.timeout || 120000 // forget aircrafts if not seen for 2 minutes
  this._index = {}
}

AircraftStore.prototype.addMessage = function (msg, receptionTime) {
  receptionTime = receptionTime || Date.now()
  const aircraft = this._index[msg.icao] = this._index[msg.icao] || new Aircraft()
  aircraft.update(msg, receptionTime)
}

AircraftStore.prototype.getAircrafts = function (currentTime) {
  currentTime = currentTime || Date.now()
  const self = this
  this._prune(currentTime)
  return Object.keys(this._index).map(function (icao) {
    return self._index[icao]
  })
}

AircraftStore.prototype._prune = function (currentTime) {
  const self = this
  const threshold = currentTime - this._timeout
  Object.keys(this._index).forEach(function (icao) {
    const aircraft = self._index[icao]
    if (aircraft.seen < threshold) {
      delete self._index[icao]
    }
  })
}
