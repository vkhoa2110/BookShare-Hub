import { bookCoverAspectRatio, bookCoverMaxWidth } from '../constants/rules'

export function extensionForImageType(type: string) {
  if (type === 'image/png') {
    return 'png'
  }

  if (type === 'image/webp') {
    return 'webp'
  }

  return 'jpg'
}

export function getCenteredCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetRatio = bookCoverAspectRatio,
) {
  const sourceRatio = sourceWidth / sourceHeight
  const width = sourceRatio > targetRatio ? sourceHeight * targetRatio : sourceWidth
  const height = sourceRatio > targetRatio ? sourceHeight : sourceWidth / targetRatio

  return {
    x: (sourceWidth - width) / 2,
    y: (sourceHeight - height) / 2,
    width,
    height,
  }
}

function loadImageFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không đọc được ảnh bìa.'))
    }
    image.src = objectUrl
  })
}

export async function cropBookCoverFile(file: File) {
  const image = await loadImageFile(file)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Ảnh bìa không hợp lệ.')
  }

  const crop = getCenteredCrop(sourceWidth, sourceHeight)
  const outputWidth = Math.round(Math.min(crop.width, bookCoverMaxWidth))
  const outputHeight = Math.round(outputWidth / bookCoverAspectRatio)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Không thể xử lý ảnh bìa.')
  }

  canvas.width = outputWidth
  canvas.height = outputHeight
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight)

  const outputType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? file.type : 'image/jpeg'
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Không thể cắt ảnh bìa.'))
        }
      },
      outputType,
      0.9,
    )
  })

  return new File([blob], `book-cover.${extensionForImageType(outputType)}`, {
    type: outputType,
    lastModified: Date.now(),
  })
}
