'use strict'

const pinoms = require('pino-multi-stream')

var logger = pinoms({
  streams: [{ stream: process.stdout }]
})
logger.level = 'trace'

logger.trace('trace message')
logger.debug('debug message')
logger.info('info message')
logger.warn('warn message')
logger.error(new Error('error message'))
logger.fatal('fatal message')

logger.trace({ labels: { foo: 'bar' }, source: 'debugger', service: 'myservice' }, 'trace message')
logger.error(new Error('things got bad'), 'error message')
