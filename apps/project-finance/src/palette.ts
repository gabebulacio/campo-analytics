/**
 * Colours for the exported files (Excel, PowerPoint), as hex without "#". Same values as the light theme in
 * styles.css, which follows the site style guide: neutral ink and hairlines, one orange accent, status red/amber.
 */
export const PALETTE = {
  ink: "111214", ink2: "52555C", ink3: "7A7E87",
  surface: "FFFFFF", surface2: "F2F3F5", surface3: "E9EBEE",
  line: "E4E6EA", lineStrong: "CDD1D7",
  accent: "EA580C", accentStrong: "C2410C", accentSoft: "FFF1E8",
  link: "0B5CD5",
  critical: "C62828", serious: "9A5B00", warning: "7A7E87",
  /** Text on the dark ink band. */
  onInk: "FFFFFF", onInk2: "C9CCD2", inkRule: "3D3F44",
} as const;

export const EXPORT_FONT = "Inter";
