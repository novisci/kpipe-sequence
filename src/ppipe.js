const { pipeline } = require('stream')

/***
 * Pipeline wrapped in a promise. Very simple except for some handling of
 *  special notification events.
 *
 * Two custom events are used:
 *  'notify' => notify events may be emitted by each stream. They are handled
 *              and forwarded to an emitter for the entire pipeline.
 *  'report' => report events are handled by the promise pipe and are forwarded
 *              to all streams.
 */
module.exports = function (...streams) {
  const ee = new (require('events').EventEmitter)()

  const ppipe = new Promise((resolve, reject) => {
    // Each stream captures 'notify' events and forwards
    //  them to the promise-pipe event emitter
    streams.forEach((s) => {
      s.on('notify', ({ type, ...rest }) => {
        if (typeof type === 'undefined') {
          throw Error('notify events require a "type" property')
        }
        ee.emit('notify', { type, ...rest })
      })
    })

    pipeline(
      ...streams,
      (err) => err ? reject(err) : resolve()
    )
  })

  // Listen for 'report' events and forward them to all streams
  ee.on('report', ({ type, ...rest }) => {
    if (typeof type === 'undefined') {
      throw Error('report events require a "type" property')
    }
    streams.forEach((s) => {
      s.emit('report', { type, ...rest })
    })
  })

  // Trace events (debugging)
  // ee.on('notify', (msg) => console.debug('ppipe notify: ', msg))
  // ee.on('report', (msg) => console.debug('ppipe report: ', msg))

  // Masquerade on(), off(), and emit() methods to access the bundled event emitter
  ppipe.on = (name, listener) => ee.on(name, listener)
  ppipe.off = (name, listener) => ee.off(name, listener)
  ppipe.emit = (name, ...args) => ee.emit(name, ...args)

  // Some standard notify event output
  let sizeKnown = false
  let totalSize = BigInt(1)
  let lastPct = BigInt(0)
  ee.on('notify', ({ type, ...rest }) => {
    switch (type) {
      case 'readsize':
        totalSize = rest.size
        sizeKnown = true
        break
      case 'readprogress':
        if (sizeKnown) {
          const pct = (rest.size * BigInt(20) / totalSize) * BigInt(5)
          if (pct > lastPct) {
            console.info(`readprogress [${pct}%]`)
            lastPct = pct
          } else {
            // process.stderr.write('.')
          }
        } else {
          // process.stderr.write('.')
        }
        break
      case 'readcomplete':
        // process.stderr.write('\n')
    }
  })

  return ppipe
}
