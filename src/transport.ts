import { Sink, Transport } from '@electricui/core'

const dTransport = require('debug')('electricui-transport-node-hid:transport')

export interface HIDTransportOptions {
  path: string
  HID: any
  autoOpen?: false
  lock?: false
}

class HIDWriteSink extends Sink {
  callback: (chunk: any) => Promise<any>

  constructor(callback: (chunk: any) => Promise<any>) {
    super()
    this.callback = callback
  }

  receive(chunk: any) {
    return this.callback(chunk)
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

    this.readPipeline.push(chunk)
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.hid = new this.options.HID(this.options.path)

      this.hid.on('error', this.error)
      this.hid.on('data', this.receiveData)
      this.hid.on('close', this.close)
      resolve()
    })
  }

  disconnect() {
    return new Promise((resolve, reject) => {
      this.hid.removeListener('error', this.error)
      this.hid.removeListener('data', this.receiveData)
      this.hid.removeListener('close', this.close)
      this.hid.close()

      resolve()
    })

    return Promise.resolve()
  }

  writeToDevice(chunk: any) {
    dTransport('writing raw hid data', chunk)

    return new Promise((resolve, reject) => {
      this.hid.write(chunk)
      resolve()
    })
  }
}
