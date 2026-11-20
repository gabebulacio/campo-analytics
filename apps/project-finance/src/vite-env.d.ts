/// <reference types="vite/client" />

/** Planted vs found per rule from the site's synthetic snapshot (vite.config.ts), or null. */
declare const __PLANTED__: Record<string, { planted: number; found: number }> | null;
