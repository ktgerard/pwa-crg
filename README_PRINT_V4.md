# CRG Specifications Worksheet — Landscape Print Fix v4

## Replace only
- `specifications.css`
- `service-worker.js`

## What changed
- Explicit US Letter landscape @page dimensions.
- Removed portrait-specific print CSS that encouraged a narrow, tiny layout.
- Reset the 980px mobile min-width and scrolling wrapper **for print only**.
- Restore two-column metadata and five-column identity layout when printing on an iPad.
- Prevent Safari text autosizing; print table uses 9pt, headers 8–9pt.
- Allow specification rows to continue onto a second sheet with repeating table headings.
- New service-worker cache name and print resource caching.

## Test
1. Commit both files to pwa-crg and wait for GitHub Pages deployment.
2. Reload CRG; if installed on iPad, close/reopen the PWA (or test directly in Safari).
3. Select a regular iron set, open Print Specifications and inspect the print preview.
4. Select a wedge family with many rows and verify page 2 repeats the table header.
5. In Windows Chrome print settings, verify Paper size = Letter and Layout = Landscape. If the dialog locks portrait, try Destination = Save as PDF and inspect its layout. Browser/printer UI may override CSS @page.

No database changes. Screen styles and worksheet logic are untouched.
