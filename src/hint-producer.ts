import { DiscoveryHintProducer, Hint } from '@electricui/core'

/**
 * The baudrate is optional, as they may use a transformer to add several baudRate options if they wish
 */
interface HIDHintProducerOptions {
  transportKey?: string
  HID: any
  baudRate?: number
}

export default class HIDHintProducer extends DiscoveryHintProducer {
  transportKey: string
  hid: any // HID
  options: HIDHintProducerOptions
  constructor(options: HIDHintProducerOptions) {
    super()

    this.transportKey = options.transportKey || 'hid'
    this.options = options

    this.hid = options.HID
  }

  async poll() {
    this.setPolling(true)

    // TODO: figure out how to do this dependency injection
    const devices = this.hid.devices()

    if (!this.polling) {
      // if we were cancelled just don't send them up.
      return
    }

    for (const device of devices) {
      const hint = new Hint(this.transportKey)

      hint.setAvailabilityHint()

      hint.setIdentification({
        path: device.path,
        vendorId: device.vendorId,
        productId: device.productId,
        serialNumber: device.serialNumber,
        manufacturer: device.manufacturer,
        product: device.product,
        release: device.release,
        interface: device.interface,
        usagePage: device.usagePage,
        usage: device.usage,
      })

      this.foundHint(hint)
    }

    this.setPolling(false)
  }
}
