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

test('normal with system time', function (t) {
  const store = new AircraftStore()
  const start = Date.now()

  const options = {
    refTime: null,
    timeBetweenMessages: 1
  }

  populateStore(store, options, function () {
    const aircrafts = store.getAircrafts()
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= start)
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

test('normal with reference time', function (t) {
  const store = new AircraftStore()

  const options = {
    refTime: 4815162342,
    timeBetweenMessages: 1
  }

  populateStore(store, options, function () {
    const aircrafts = store.getAircrafts(options.refTime)
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= options.refTime)
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

test('cpr timeout with system time', function (t) {
  const store = new AircraftStore()
  const start = Date.now()

  // if more than 10 seconds between messages, lat/lng decoding will be
  // skipped, so lets simulate a long delay between messages
  const options = {
    refTime: null,
    timeBetweenMessages: 11000
  }

  populateStore(store, options, function () {
    const aircrafts = store.getAircrafts()
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= start)
    t.equal(aircraft.altitude, 31000)
    t.equal(aircraft.unit, 0)
    t.equal(aircraft.speed, 506.66359648192605)
    t.equal(aircraft.heading, 65.76194226683805)
    t.equal(aircraft.lat, 0)
    t.equal(aircraft.lng, 0)
    t.equal(aircraft.callsign, '')

    t.end()
  })
})

test('cpr timeout with reference time', function (t) {
  const store = new AircraftStore()

  // if more than 10 seconds between messages, lat/lng decoding will be
  // skipped, so lets simulate a long delay between messages
  const options = {
    refTime: 4815162342,
    timeBetweenMessages: 11000
  }

  populateStore(store, options, function () {
    const aircrafts = store.getAircrafts(options.refTime)
    t.equal(aircrafts.length, 1)

    const aircraft = aircrafts[0]
    t.equal(aircraft.icao, 7867807)
    t.equal(aircraft.count, msgs.length)
    t.ok(aircraft.seen >= options.refTime)
    t.equal(aircraft.altitude, 31000)
    t.equal(aircraft.unit, 0)
    t.equal(aircraft.speed, 506.66359648192605)
    t.equal(aircraft.heading, 65.76194226683805)
    t.equal(aircraft.lat, 0)
    t.equal(aircraft.lng, 0)
    t.equal(aircraft.callsign, '')

    t.end()
  })
})

test('store timeout with system time', function (t) {
  const store = new AircraftStore({timeout: 50})
  const start = Date.now()

  const options = {
    refTime: null,
    timeBetweenMessages: 0
  }

  populateStore(store, options, function () {
    t.equal(store.getAircrafts().length, 1)
    t.equal(store.getAircrafts(start + 51).length, 0)
    t.end()
  })
})

test('store timeout with reference time', function (t) {
  const store = new AircraftStore({timeout: 50})

  const options = {
    refTime: 4815162342,
    timeBetweenMessages: 0
  }

  populateStore(store, options, function () {
    t.equal(store.getAircrafts(options.refTime).length, 1)
    t.equal(store.getAircrafts(options.refTime + 51).length, 0)
    t.end()
  })
})

function populateStore (store, options, cb) {
  options.decoder = options.decoder || new Decoder()

  if (options.refTime) {
    for (let i = 0; i < msgs.length; i++) {
      store.addMessage(
        options.decoder.parse(msgs[i]),
        options.refTime + options.timeBetweenMessages * i
      )
    }
  } else {
    const start = Date.now()
    const origNow = Date.now

    for (let i = 0; i < msgs.length; i++) {
      Date.now = () => start + options.timeBetweenMessages * i
      store.addMessage(options.decoder.parse(msgs[i]))
    }

    Date.now = origNow
  }

  return cb()
}
