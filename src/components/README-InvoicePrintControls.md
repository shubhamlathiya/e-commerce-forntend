# InvoicePrintControls

Client-side controls to print or download a single invoice card/div using `html2canvas` + `jsPDF`. Captures only the target invoice element, builds a multi-page PDF when needed, and opens a clean print preview tab without mutating the main app DOM.

## Install

```
npm install html2canvas jspdf
```

## Import

```
import InvoicePrintControls from "../components/InvoicePrintControls";
```

## Props

- `selector` (string) – CSS selector for invoice element (default `#invoice-card`)
- `fileName` (string) – default `invoice.pdf`
- `paperSize` – `'a4' | 'letter'` (default `'a4'`)
- `orientation` – `'portrait' | 'landscape'` (default `'portrait'`)
- `margins` – `{ top, right, bottom, left }` in mm (default `20` each)
- `scale` – canvas DPI multiplier (default `2`) — increase for crisper text
- `watermarkText` – optional string to overlay per page
- `headerText`, `footerText` – optional strings rendered on each PDF page

## Example Usage

```jsx
// Ensure the invoice content is wrapped in a known container
<div id="invoice-card" className="card-body py-40">
  {/* invoice markup */}
  ...
  {/* Place the controls nearby */}
  <InvoicePrintControls
    selector="#invoice-card"
    fileName={`invoice-12345.pdf`}
    paperSize="a4"
    orientation="portrait"
    margins={{ top: 20, right: 20, bottom: 20, left: 20 }}
    scale={2}
    watermarkText="Copy"
    headerText="Company Name"
    footerText="Thank you for your business"
  />
```

## How Multi-Page Splitting Works

- The invoice is rasterized to a high-DPI canvas via `html2canvas`.
- The PDF content area is computed using the chosen page size and margins.
- We calculate `pxPerMm` so we know how many canvas pixels correspond to the chosen width in mm.
- The canvas is sliced vertically into chunks whose height matches one page’s content area.
- Each chunk is added to the PDF as an image; optional header/footer/watermark are drawn per page.

## DPI Tuning

- Increase `scale` (e.g., `2` → `3` or `4`) for sharper text. Higher values increase memory/time.
- Ensure overlapping shadows, gradients, and transparency are supported by `html2canvas`.

## Preserving Styles and Images

- Styles are preserved because we rasterize the element as rendered on screen.
- Relative images (same-origin) should render. For cross-origin images, ensure proper CORS headers; component uses `useCORS: true`.

## Print Preview Flow

- Opens a new tab/window and injects one `<img>` per page slice with basic A4 CSS.
- The main app window is not modified and does not auto-call `window.print()`.

## Accessibility

- Buttons are keyboard-focusable and have screen-reader labels.
- Add ARIA or role attributes in your host markup if needed.

## Compatibility

- Works in modern browsers (Edge, Chrome, Firefox, Safari).
- For older browsers, you may need polyfills for `Promise`, `URL`, or Canvas.

## Tradeoffs

- Canvas rasterization yields accurate visual fidelity but produces image-based PDFs (not selectable text). For selectable text, a server-side PDF pipeline (e.g., Puppeteer, wkhtmltopdf) or specialized libraries are required.
- Client-only text-based PDFs via `pdf-lib`/`jsPDF` HTML plugins have limitations in CSS support; complex layouts may not match.

## Extras

- `watermarkText`, `headerText`, and `footerText` allow simple per-page decorations.
- For advanced headers/footers (logos, tables), extend the component to draw vector content per page via `jsPDF` APIs.

## CSS Tips for A4 Fit

- Keep the invoice container within ~700–800px width for comfortable A4 scaling.
- Avoid `position: fixed` inside the invoice; prefer static/relative for predictable rendering.
- Test with `scale=2` or higher and adjust margins to avoid clipping.

