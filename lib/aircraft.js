'use strict'

const decodeCPR = require('./cpr')

module.exports = Aircraft

function Aircraft () {
  if (!(this instanceof Aircraft)) return new Aircraft(0)

  this.icao = 0
  this.count = 0
  this.seen = 0
  this.altitude = 0
  this.unit = 0
  this.speed = 0
  this.heading = 0
  this.lat = 0
  this.lng = 0
  this.callsign = ''

  this._oddCprLat = 0
  this._oddCprLng = 0
  this._oddCprTime = 0
  this._evenCprLat = 0
  this._evenCprLng = 0
  this._evenCprTime = 0
}

Aircraft.prototype.update = function (msg, receptionTime) {
  this.count++
  this.seen = receptionTime
  this.icao = msg.icao

  if (msg.msgtype === 0 || msg.msgtype === 4 || msg.msgtype === 20) {
    this.altitude = msg.altitude
    this.unit = msg.unit
  } else if (msg.msgtype === 17) {
    if (msg.metype >= 1 && msg.metype <= 4) {
      this.callsign = msg.callsign
    } else if (msg.metype >= 9 && msg.metype <= 18) {
      this.altitude = msg.altitude
      this.unit = msg.unit
      if (msg.fflag) {
        this._oddCprLat = msg.rawLatitude
        this._oddCprLng = msg.rawLongitude
        this._oddCprTime = receptionTime
      } else {
        this._evenCprLat = msg.rawLatitude
        this._evenCprLng = msg.rawLongitude
        this._evenCprTime = receptionTime
      }

      // if the two messages are less than 10 seconds apart, compute the position
      if (Math.abs(this._evenCprTime - this._oddCprTime) <= 10000) {
        decodeCPR(this)
      }
    } else if (msg.metype === 19) {
      if (msg.mesub === 1 || msg.mesub === 2) {
        this.speed = msg.speed
        this.heading = msg.heading
      }
    }
  }
}
