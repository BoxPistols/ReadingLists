export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => {
      console.error('Failed to load image for cropping:', error);
      reject(error);
    });
    // Base64データ（ペーストされた画像）の場合は crossOrigin を設定しない
    if (!url.startsWith('data:')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

/**
 * リサイズ・圧縮された画像を Base64 形式で取得する
 */
export async function getCroppedImgBase64(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  targetWidth = 400, // サムネイルとして十分なサイズにリサイズ
  targetHeight = 250
): Promise<string | null> {
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 元の画像から指定範囲を切り出し、ターゲットサイズに引き伸ばして描画
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );

    // 軽量化のため JPEG 圧縮 (品質 0.7)
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) {
    console.error('getCroppedImgBase64 error:', e);
    throw e;
  }
}
