import 'mocha'

import * as chai from 'chai'
import * as sinon from 'sinon'

import {
  Connection,
  ConnectionInterface,
  DeviceManager,
  DiscoveryHintTransformer,
  Hint,
  Sink,
  Source,
} from '@electricui/core'

import HIDHintProducer from '../src/hint-producer'

const delay = (time: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time)
  })
}

const HID = require('@electricui/node-hid')

const assert = chai.assert

const options = {
  HID: HID,
}

type TransformCallback = (hint: Hint) => void

class TestTransformer extends DiscoveryHintTransformer {
  callback: TransformCallback

  constructor(callback: TransformCallback) {
    super()
    this.callback = callback
  }

  canTransform(hint: Hint): boolean {
    return true
  }

  transform(hint: Hint) {
    this.callback(hint)
    return hint
  }
}

function factory() {
  const spy = sinon.spy()

  const deviceManager = new DeviceManager()

  const producer = new HIDHintProducer(options)

  deviceManager.addHintProducers([producer])

  let callback: () => void

  let transformer = new TestTransformer((hint: Hint) => {
    spy(hint)
    callback()
  })

  const hintReceived = new Promise((resolve, reject) => {
    callback = resolve
  })

  deviceManager.addHintTransformers([transformer])

  return {
    spy,
    deviceManager,
    hintReceived,
  }
}

describe('Node HID Hint Producer', () => {
  it('Produces hints based on the available HID devices', async () => {
    const { spy, deviceManager, hintReceived } = factory()

    await deviceManager.poll()

    await hintReceived

    assert.isTrue(spy.called)
  })
})
