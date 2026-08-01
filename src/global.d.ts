export {};

declare global {
  interface Window {
    __DENTZOO_DEHYDRATED__?: unknown;
    __DENTZOO_SNAPSHOT__?: () => unknown;
  }
}
