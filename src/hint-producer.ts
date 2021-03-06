import {
  CancellationToken,
  DiscoveryHintProducer,
  Hint,
} from '@electricui/core'

interface HIDHintProducerOptions {
  transportKey?: string
  HID: any
}

export default class HIDHintProducer extends DiscoveryHintProducer {
  transportKey: string
  hid: any
  options: HIDHintProducerOptions
  constructor(options: HIDHintProducerOptions) {
    super()

    this.transportKey = options.transportKey || 'hid'
    this.options = options

    this.hid = options.HID
  }

  async poll(cancellationToken: CancellationToken) {
    this.setPolling(true)

    // TODO: figure out how to do this dependency injection
    const devices = this.hid.devices()

    if (!this.polling) {
      // if we were cancelled just don't send them up.
      return []
    }

    const hintList: Hint[] = []

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

      this.foundHint(hint, cancellationToken)

      hintList.push(hint)
    }

    this.setPolling(false)

    return hintList
  }
}
