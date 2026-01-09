import "client-only";

export function emitGa4Event(eventName: string) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName);
  }
}
