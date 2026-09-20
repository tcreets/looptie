import { Capacitor, registerPlugin } from "@capacitor/core";

const NativeArticleReader = registerPlugin("NativeArticleReader");

export function canUseNativeArticleReader() {
  return Capacitor.isNativePlatform();
}

export async function mountNativeArticleReader({ url, rect }) {
  if (!canUseNativeArticleReader() || !url || !rect) return false;
  await NativeArticleReader.mount({
    url,
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    scale: window.devicePixelRatio || 1,
  });
  return true;
}

export async function updateNativeArticleReaderFrame(rect) {
  if (!canUseNativeArticleReader() || !rect) return;
  await NativeArticleReader.updateFrame({
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    scale: window.devicePixelRatio || 1,
  });
}

export async function unmountNativeArticleReader() {
  if (!canUseNativeArticleReader()) return;
  try {
    await NativeArticleReader.unmount();
  } catch (error) {
    console.warn("Could not unmount native article reader", error);
  }
}
