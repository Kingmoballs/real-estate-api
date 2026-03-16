const EventEmitter = require('events');

class EventBus extends EventEmitter {}

const eventBus = new EventBus();


eventBus.setMaxListeners(100);

module.exports = eventBus;