---
id: "FFmpeg"
title: "Class: FFmpeg"
sidebar_label: "FFmpeg"
sidebar_position: 0
custom_edit_url: null
---

Provides APIs to interact with ffmpeg web worker.

**`Example`**

```ts
const ffmpeg = new FFmpeg();
```

## Hierarchy

- `EventEmitter`

  ↳ **`FFmpeg`**

## Constructors

### constructor

• **new FFmpeg**()

#### Defined in

[packages/ffmpeg/src/classes.ts:99](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L99)

## Properties

### #rejects

• `Private` **#rejects**: `Callbacks` = `{}`

#### Defined in

[packages/ffmpeg/src/classes.ts:95](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L95)

___

### #resolves

• `Private` **#resolves**: `Callbacks` = `{}`

#resolves and #rejects tracks Promise resolves and rejects to
be called when we receive message from web worker.

#### Defined in

[packages/ffmpeg/src/classes.ts:94](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L94)

___

### #worker

• `Private` **#worker**: ``null`` \| `Worker` = `null`

#### Defined in

[packages/ffmpeg/src/classes.ts:88](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L88)

___

### loaded

• **loaded**: `boolean` = `false`

#### Defined in

[packages/ffmpeg/src/classes.ts:97](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L97)

___

### captureRejectionSymbol

▪ `Static` `Readonly` **captureRejectionSymbol**: typeof [`captureRejectionSymbol`](FFmpeg.md#capturerejectionsymbol)

#### Defined in

node_modules/@types/node/events.d.ts:291

___

### captureRejections

▪ `Static` **captureRejections**: `boolean`

Sets or gets the default captureRejection value for all emitters.

#### Defined in

node_modules/@types/node/events.d.ts:296

___

### defaultMaxListeners

▪ `Static` **defaultMaxListeners**: `number`

#### Defined in

node_modules/@types/node/events.d.ts:297

___

### errorMonitor

▪ `Static` `Readonly` **errorMonitor**: typeof [`errorMonitor`](FFmpeg.md#errormonitor)

This symbol shall be used to install a listener for only monitoring `'error'`
events. Listeners installed using this symbol are called before the regular
`'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an
`'error'` event is emitted, therefore the process will still crash if no
regular `'error'` listener is installed.

#### Defined in

node_modules/@types/node/events.d.ts:290

## Events

### DOWNLOAD

▪ `Static` `Readonly` **DOWNLOAD**: ``"download"``

#### Defined in

[packages/ffmpeg/src/classes.ts:84](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L84)

___

### LOG

▪ `Static` `Readonly` **LOG**: ``"log"``

#### Defined in

[packages/ffmpeg/src/classes.ts:85](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L85)

___

### PROGRESS

▪ `Static` `Readonly` **PROGRESS**: ``"progress"``

#### Defined in

[packages/ffmpeg/src/classes.ts:86](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L86)

## Event Methods

### on

▸ **on**(`event`, `listener`): [`FFmpeg`](FFmpeg.md)

Listen to download progress events from `ffmpeg.load()`.

**`Example`**

```ts
ffmpeg.on(FFmpeg.DOWNLOAD, ({ url, total, received, delta, done }) => {
  // ...
})
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"download"`` |
| `listener` | (`data`: `DownloadProgressEvent`) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

[packages/ffmpeg/src/classes.ts:33](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L33)

▸ **on**(`event`, `listener`): [`FFmpeg`](FFmpeg.md)

Listen to log events from `ffmpeg.exec()`.

**`Example`**

```ts
ffmpeg.on(FFmpeg.LOG, ({ message }) => {
  // ...
})
```

**`Remarks`**

log includes output to stdout and stderr.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"log"`` |
| `listener` | (`log`: `LogEvent`) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

[packages/ffmpeg/src/classes.ts:52](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L52)

▸ **on**(`event`, `listener`): [`FFmpeg`](FFmpeg.md)

Listen to progress events from `ffmpeg.exec()`.

**`Example`**

```ts
ffmpeg.on(FFmpeg.PROGRESS, ({ progress }) => {
  // ...
})
```

**`Remarks`**

The progress events are accurate only when the length of
input and output video/audio file are the same.

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | ``"progress"`` |
| `listener` | (`progress`: `Progress`) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

[packages/ffmpeg/src/classes.ts:69](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L69)

___

## FFmpeg Methods

### exec

▸ **exec**(`args`, `timeout?`): `Promise`<`number`\>

Execute ffmpeg command.

**`Remarks`**

To avoid common I/O issues, ["-nostdin", "-y"] are prepended to the args
by default.

**`Example`**

```ts
const ffmpeg = new FFmpeg();
await ffmpeg.load();
await ffmpeg.writeFile("video.avi", ...);
// ffmpeg -i video.avi video.mp4
await ffmpeg.exec(["-i", "video.avi", "video.mp4"]);
const data = ffmpeg.readFile("video.mp4");
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `args` | `string`[] | `undefined` | ffmpeg command line args |
| `timeout` | `number` | `-1` | milliseconds to wait before stopping the command execution.  **`Default Value`**  -1 |

#### Returns

`Promise`<`number`\>

`0` if no error, `!= 0` if timeout (1) or error.

#### Defined in

[packages/ffmpeg/src/classes.ts:202](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L202)

___

### load

▸ **load**(`config?`): `Promise`<`boolean`\>

Loads ffmpeg-core inside web worker. It is required to call this method first
as it initializes WebAssembly and other essential variables.

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | `FFMessageLoadConfig` |

#### Returns

`Promise`<`boolean`\>

`true` if ffmpeg core is loaded for the first time.

#### Defined in

[packages/ffmpeg/src/classes.ts:171](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L171)

___

### terminate

▸ **terminate**(): `void`

Terminate all ongoing API calls and terminate web worker.
`FFmpeg.load()` must be called again before calling any other APIs.

#### Returns

`void`

#### Defined in

[packages/ffmpeg/src/classes.ts:223](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L223)

___

## File System Methods

### createDir

▸ **createDir**(`path`): `Promise`<`boolean`\>

Create a directory.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:321](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L321)

___

### deleteDir

▸ **deleteDir**(`path`): `Promise`<`boolean`\>

Delete an empty directory.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:343](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L343)

___

### deleteFile

▸ **deleteFile**(`path`): `Promise`<`boolean`\>

Delete a file.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:299](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L299)

___

### listDir

▸ **listDir**(`path`): `Promise`<`FSNode`[]\>

List directory contents.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`FSNode`[]\>

#### Defined in

[packages/ffmpeg/src/classes.ts:332](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L332)

___

### readFile

▸ **readFile**(`path`, `encoding?`): `Promise`<`FileData`\>

Read data from ffmpeg.wasm.

**`Example`**

```ts
const ffmpeg = new FFmpeg();
await ffmpeg.load();
const data = await ffmpeg.readFile("video.mp4");
```

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `path` | `string` | `undefined` | - |
| `encoding` | `string` | `"binary"` | File content encoding, supports two encodings: - utf8: read file as text file, return data in string type. - binary: read file as binary file, return data in Uint8Array type.  **`Default Value`**  binary |

#### Returns

`Promise`<`FileData`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:278](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L278)

___

### rename

▸ **rename**(`oldPath`, `newPath`): `Promise`<`boolean`\>

Rename a file or directory.

#### Parameters

| Name | Type |
| :------ | :------ |
| `oldPath` | `string` |
| `newPath` | `string` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:310](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L310)

___

### writeFile

▸ **writeFile**(`path`, `data`): `Promise`<`boolean`\>

Write data to ffmpeg.wasm.

**`Example`**

```ts
const ffmpeg = new FFmpeg();
await ffmpeg.load();
await ffmpeg.writeFile("video.avi", await fetchFile("../video.avi"));
await ffmpeg.writeFile("text.txt", "hello world");
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `data` | `FileData` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:252](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L252)

___

## Other Methods

### #registerHandlers

▸ `Private` **#registerHandlers**(): `void`

register worker message event handlers.

#### Returns

`void`

#### Defined in

[packages/ffmpeg/src/classes.ts:106](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L106)

___

### #send

▸ `Private` **#send**(`__namedParameters`, `trans?`): `Promise`<`CallbackData`\>

Generic function to send messages to web worker.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `__namedParameters` | `Message` | `undefined` |
| `trans` | `Transferable`[] | `[]` |

#### Returns

`Promise`<`CallbackData`\>

#### Defined in

[packages/ffmpeg/src/classes.ts:148](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/4a950d7/packages/ffmpeg/src/classes.ts#L148)

___

### addListener

▸ **addListener**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Alias for `emitter.on(eventName, listener)`.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:317

___

### emit

▸ **emit**(`eventName`, ...`args`): `boolean`

Synchronously calls each of the listeners registered for the event named`eventName`, in the order they were registered, passing the supplied arguments
to each.

Returns `true` if the event had listeners, `false` otherwise.

```js
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `...args` | `any`[] |

#### Returns

`boolean`

#### Defined in

node_modules/@types/node/events.d.ts:573

___

### eventNames

▸ **eventNames**(): (`string` \| `symbol`)[]

Returns an array listing the events for which the emitter has registered
listeners. The values in the array are strings or `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

**`Since`**

v6.0.0

#### Returns

(`string` \| `symbol`)[]

#### Defined in

node_modules/@types/node/events.d.ts:632

___

### getMaxListeners

▸ **getMaxListeners**(): `number`

Returns the current max listener value for the `EventEmitter` which is either
set by `emitter.setMaxListeners(n)` or defaults to [defaultMaxListeners](FFmpeg.md#defaultmaxlisteners).

**`Since`**

v1.0.0

#### Returns

`number`

#### Defined in

node_modules/@types/node/events.d.ts:489

___

### listenerCount

▸ **listenerCount**(`eventName`): `number`

Returns the number of listeners listening to the event named `eventName`.

**`Since`**

v3.2.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event being listened for |

#### Returns

`number`

#### Defined in

node_modules/@types/node/events.d.ts:579

___

### listeners

▸ **listeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Defined in

node_modules/@types/node/events.d.ts:502

___

### off

▸ **off**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Alias for `emitter.removeListener()`.

**`Since`**

v10.0.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:462

___

### once

▸ **once**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Adds a **one-time**`listener` function for the event named `eventName`. The
next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The`emitter.prependOnceListener()` method can be used as an alternative to add the
event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

**`Since`**

v0.3.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:377

___

### prependListener

▸ **prependListener**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Adds the `listener` function to the _beginning_ of the listeners array for the
event named `eventName`. No checks are made to see if the `listener` has
already been added. Multiple calls passing the same combination of `eventName`and `listener` will result in the `listener` being added, and called, multiple
times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v6.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:597

___

### prependOnceListener

▸ **prependOnceListener**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Adds a **one-time**`listener` function for the event named `eventName` to the _beginning_ of the listeners array. The next time `eventName` is triggered, this
listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v6.0.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `eventName` | `string` \| `symbol` | The name of the event. |
| `listener` | (...`args`: `any`[]) => `void` | The callback function |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:613

___

### rawListeners

▸ **rawListeners**(`eventName`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`,
including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

**`Since`**

v9.4.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Defined in

node_modules/@types/node/events.d.ts:532

___

### removeAllListeners

▸ **removeAllListeners**(`event?`): [`FFmpeg`](FFmpeg.md)

Removes all listeners, or those of the specified `eventName`.

It is bad practice to remove listeners added elsewhere in the code,
particularly when the `EventEmitter` instance was created by some other
component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | `string` \| `symbol` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:473

___

### removeListener

▸ **removeListener**(`eventName`, `listener`): [`FFmpeg`](FFmpeg.md)

Removes the specified `listener` from the listener array for the event named`eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the
listener array. If any single listener has been added multiple times to the
listener array for the specified `eventName`, then `removeListener()` must be
called multiple times to remove each instance.

Once an event is emitted, all listeners attached to it at the
time of emitting are called in order. This implies that any`removeListener()` or `removeAllListeners()` calls _after_ emitting and _before_ the last listener finishes execution
will not remove them from`emit()` in progress. Subsequent events behave as expected.

```js
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will
change the position indices of any listener registered _after_ the listener
being removed. This will not impact the order in which listeners are called,
but it means that any copies of the listener array as returned by
the `emitter.listeners()` method will need to be recreated.

When a single function has been added as a handler multiple times for a single
event (as in the example below), `removeListener()` will remove the most
recently added instance. In the example the `once('ping')`listener is removed:

```js
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.1.26

#### Parameters

| Name | Type |
| :------ | :------ |
| `eventName` | `string` \| `symbol` |
| `listener` | (...`args`: `any`[]) => `void` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:457

___

### setMaxListeners

▸ **setMaxListeners**(`n`): [`FFmpeg`](FFmpeg.md)

By default `EventEmitter`s will print a warning if more than `10` listeners are
added for a particular event. This is a useful default that helps finding
memory leaks. The `emitter.setMaxListeners()` method allows the limit to be
modified for this specific `EventEmitter` instance. The value can be set to`Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

**`Since`**

v0.3.5

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `number` |

#### Returns

[`FFmpeg`](FFmpeg.md)

#### Defined in

node_modules/@types/node/events.d.ts:483

___

### getEventListeners

▸ `Static` **getEventListeners**(`emitter`, `name`): `Function`[]

Returns a copy of the array of listeners for the event named `eventName`.

For `EventEmitter`s this behaves exactly the same as calling `.listeners` on
the emitter.

For `EventTarget`s this is the only way to get the event listeners for the
event target. This is useful for debugging and diagnostic purposes.

```js
const { getEventListeners, EventEmitter } = require('events');

{
  const ee = new EventEmitter();
  const listener = () => console.log('Events are fun');
  ee.on('foo', listener);
  getEventListeners(ee, 'foo'); // [listener]
}
{
  const et = new EventTarget();
  const listener = () => console.log('Events are fun');
  et.addEventListener('foo', listener);
  getEventListeners(et, 'foo'); // [listener]
}
```

**`Since`**

v15.2.0, v14.17.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `EventEmitter` \| `DOMEventTarget` |
| `name` | `string` \| `symbol` |

#### Returns

`Function`[]

#### Defined in

node_modules/@types/node/events.d.ts:262

___

### listenerCount

▸ `Static` **listenerCount**(`emitter`, `eventName`): `number`

A class method that returns the number of listeners for the given `eventName`registered on the given `emitter`.

```js
const { EventEmitter, listenerCount } = require('events');
const myEmitter = new EventEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(listenerCount(myEmitter, 'event'));
// Prints: 2
```

**`Since`**

v0.9.12

**`Deprecated`**

Since v3.2.0 - Use `listenerCount` instead.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | The emitter to query |
| `eventName` | `string` \| `symbol` | The event name |

#### Returns

`number`

#### Defined in

node_modules/@types/node/events.d.ts:234

___

### on

▸ `Static` **on**(`emitter`, `eventName`, `options?`): `AsyncIterableIterator`<`any`\>

```js
const { on, EventEmitter } = require('events');

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo')) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw
if the `EventEmitter` emits `'error'`. It removes all listeners when
exiting the loop. The `value` returned by each iteration is an array
composed of the emitted event arguments.

An `AbortSignal` can be used to cancel waiting on events:

```js
const { on, EventEmitter } = require('events');
const ac = new AbortController();

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo', { signal: ac.signal })) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
  // Unreachable here
})();

process.nextTick(() => ac.abort());
```

**`Since`**

v13.6.0, v12.16.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `emitter` | `EventEmitter` | - |
| `eventName` | `string` | The name of the event being listened for |
| `options?` | `StaticEventEmitterOptions` | - |

#### Returns

`AsyncIterableIterator`<`any`\>

that iterates `eventName` events emitted by the `emitter`

#### Defined in

node_modules/@types/node/events.d.ts:217

___

### once

▸ `Static` **once**(`emitter`, `eventName`, `options?`): `Promise`<`any`[]\>

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given
event or that is rejected if the `EventEmitter` emits `'error'` while waiting.
The `Promise` will resolve with an array of all the arguments emitted to the
given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special`'error'` event
semantics and does not listen to the `'error'` event.

```js
const { once, EventEmitter } = require('events');

async function run() {
  const ee = new EventEmitter();

  process.nextTick(() => {
    ee.emit('myevent', 42);
  });

  const [value] = await once(ee, 'myevent');
  console.log(value);

  const err = new Error('kaboom');
  process.nextTick(() => {
    ee.emit('error', err);
  });

  try {
    await once(ee, 'myevent');
  } catch (err) {
    console.log('error happened', err);
  }
}

run();
```

The special handling of the `'error'` event is only used when `events.once()`is used to wait for another event. If `events.once()` is used to wait for the
'`error'` event itself, then it is treated as any other kind of event without
special handling:

```js
const { EventEmitter, once } = require('events');

const ee = new EventEmitter();

once(ee, 'error')
  .then(([err]) => console.log('ok', err.message))
  .catch((err) => console.log('error', err.message));

ee.emit('error', new Error('boom'));

// Prints: ok boom
```

An `AbortSignal` can be used to cancel waiting for the event:

```js
const { EventEmitter, once } = require('events');

const ee = new EventEmitter();
const ac = new AbortController();

async function foo(emitter, event, signal) {
  try {
    await once(emitter, event, { signal });
    console.log('event emitted!');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Waiting for the event was canceled!');
    } else {
      console.error('There was an error', error.message);
    }
  }
}

foo(ee, 'foo', ac.signal);
ac.abort(); // Abort waiting for the event
ee.emit('foo'); // Prints: Waiting for the event was canceled!
```

**`Since`**

v11.13.0, v10.16.0

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `NodeEventTarget` |
| `eventName` | `string` \| `symbol` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`<`any`[]\>

#### Defined in

node_modules/@types/node/events.d.ts:157

▸ `Static` **once**(`emitter`, `eventName`, `options?`): `Promise`<`any`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `emitter` | `DOMEventTarget` |
| `eventName` | `string` |
| `options?` | `StaticEventEmitterOptions` |

#### Returns

`Promise`<`any`[]\>

#### Defined in

node_modules/@types/node/events.d.ts:158

___

### setMaxListeners

▸ `Static` **setMaxListeners**(`n?`, ...`eventTargets`): `void`

```js
const {
  setMaxListeners,
  EventEmitter
} = require('events');

const target = new EventTarget();
const emitter = new EventEmitter();

setMaxListeners(5, target, emitter);
```

**`Since`**

v15.4.0

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `n?` | `number` | A non-negative number. The maximum number of listeners per `EventTarget` event. |
| `...eventTargets` | (`EventEmitter` \| `DOMEventTarget`)[] | - |

#### Returns

`void`

#### Defined in

node_modules/@types/node/events.d.ts:280
