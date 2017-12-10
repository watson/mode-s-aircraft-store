'use strict'

const test = require('tape')
const Decoder = require('mode-s-decoder')
const AircraftStore = require('./')

const msgs = [
  Buffer.from('8d780d9f9901ce19f008cff4b54c', 'hex'),
  Buffer.from('8d780d9f58a10485845a5d77bb0a', 'hex'),
  Buffer.from('8d780d9f9901ce1a1004cfe5686f', 'hex'),
  Buffer.from('8d780d9f58a10124566d9184e589', 'hex')
]

test('normal', function (t) {
  const store = new AircraftStore()
  const start = Date.now()

  populateStore(store, function () {
    const aircrafts = store.getAircrafts()
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= start)
    t.ok(aircraft.seen <= Date.now())
    t.equal(aircraft.altitude, 31000)
    t.equal(aircraft.unit, 0)
    t.equal(aircraft.speed, 506.66359648192605)
    t.equal(aircraft.heading, 65.76194226683805)
    t.equal(aircraft.lat, 55.71290588378906)
    t.equal(aircraft.lng, 13.243602405894885)
    t.equal(aircraft.callsign, '')

    t.end()
  })
})

test('cpr timeout', function (t) {
  const store = new AircraftStore()
  const start = Date.now()

  // if more than 10 seconds between messages, lat/lng decoding will be
  // skipped, so lets hack the clock to simulate that scenario
  let offset = 0
  const origNow = Date.now
  Date.now = function () {
    return start + offset++ * 10001
  }

  populateStore(store, function () {
    const aircrafts = store.getAircrafts()
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= start)
    t.ok(aircraft.seen <= Date.now())
    t.equal(aircraft.altitude, 31000)
    t.equal(aircraft.unit, 0)
    t.equal(aircraft.speed, 506.66359648192605)
    t.equal(aircraft.heading, 65.76194226683805)
    t.equal(aircraft.lat, 0)
    t.equal(aircraft.lng, 0)
    t.equal(aircraft.callsign, '')

    t.end()

    Date.now = origNow
  })
})

test('store timeout', function (t) {
  const store = new AircraftStore({timeout: 50})

  populateStore(store, function () {
    const aircrafts = store.getAircrafts()
    t.equal(aircrafts.length, 1)
    setTimeout(function () {
      const aircrafts = store.getAircrafts()
      t.equal(aircrafts.length, 0)
      t.end()
    }, 51)
  })
})

function populateStore (store, cb, _decoder, _index) {
  if (!_decoder) _decoder = new Decoder()
  if (!_index) _index = 0
  if (msgs.length === _index) return cb()
  setTimeout(function () {
    store.addMessage(_decoder.parse(msgs[_index]))
    populateStore(store, cb, _decoder, ++_index)
  }, 1)
}
