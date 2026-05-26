import { describe, expect, it } from 'vitest'
import { getCenteredCrop } from './image'

describe('getCenteredCrop', () => {
  it('crops wide images to the target cover ratio', () => {
    expect(getCenteredCrop(1200, 800, 3 / 4)).toEqual({
      x: 300,
      y: 0,
      width: 600,
      height: 800,
    })
  })

  it('crops tall images from top and bottom', () => {
    expect(getCenteredCrop(600, 1200, 3 / 4)).toEqual({
      x: 0,
      y: 200,
      width: 600,
      height: 800,
    })
  })
})
