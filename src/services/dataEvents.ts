/**
 * A tiny "something changed" signal.
 * Services call notifyDataChanged() after every successful write;
 * screens (through hooks) subscribe and reload their data.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Registers a listener. Returns a function that unsubscribes it. */
export function subscribeToDataChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Tells every subscriber that stored data changed. */
export function notifyDataChanged(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.warn('[dataEvents] A listener failed:', error);
    }
  }
}
