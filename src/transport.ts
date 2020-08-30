import { CancellationToken, Message, Sink, Transport } from '@electricui/core'

const dTransport = require('debug')('electricui-transport-node-hid:transport')

export interface HIDTransportOptions {
  path: string
  HID: any
  autoOpen?: false
  lock?: false
}

class HIDWriteSink extends Sink {
  callback: (chunk: any, cancellationToken: CancellationToken) => Promise<any>

  constructor(
    callback: (
      chunk: any,
      cancellationToken: CancellationToken,
    ) => Promise<any>,
  ) {
    super()
    this.callback = callback
  }

  receive(chunk: any, cancellationToken: CancellationToken) {
    return this.callback(chunk, cancellationToken)
  }
}

export default class HIDTransport extends Transport {
  hid: any | null = null
  options: HIDTransportOptions

  constructor(options: HIDTransportOptions) {
    super(options)

    this.options = options

    this.writeToDevice = this.writeToDevice.bind(this)

    this.writePipeline = new HIDWriteSink(this.writeToDevice)

    this.receiveData = this.receiveData.bind(this)
    this.error = this.error.bind(this)
    this.close = this.close.bind(this)
  }

  error(err: Error) {
    this.onError(err)
  }

  close(err: Error) {
    this.onClose(err)
  }

  receiveData(chunk: any) {
    dTransport('received raw hid data', chunk)

    // immediately convert it to a message
    const message = new Message('event', chunk)

    // This is a bit meaningless since nothing should fail now.
    const cancellationToken = new CancellationToken()

    this.readPipeline.push(message, cancellationToken)
  }

  async connect() {
    this.hid = new this.options.HID.HID(this.options.path)

    this.hid.on('error', this.error)
    this.hid.on('data', this.receiveData)
    this.hid.on('close', this.close)
  }

  async disconnect() {
    this.hid.removeListener('error', this.error)
    this.hid.removeListener('data', this.receiveData)
    this.hid.removeListener('close', this.close)
    this.hid.close()
  }

  writeToDevice(chunk: any, cancellationToken: CancellationToken) {
    dTransport('writing raw hid data', chunk)

    return new Promise((resolve, reject) => {
      this.hid.write(chunk)
      resolve()
      cancellationToken.subscribe(reject)
    })
  }
}
