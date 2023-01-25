import { writable } from "svelte/store"

export const currentZoom = writable(0);
export const mapConfig = writable(null);
export const currentWorld = writable(null);