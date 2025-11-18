import React, { useCallback, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const defaultMargins = { top: 20, right: 0, bottom: 0, left: 0 };

const InvoicePrintControls = ({
                                selector = "#invoice-card",
                                fileName = "invoice.pdf",
                                paperSize = "a4",
                                orientation = "portrait",
                                margins = defaultMargins,
                                scale = 2,
                              }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resolvedMargins = useMemo(
      () => ({ ...defaultMargins, ...(margins || {}) }),
      [margins]
  );

  const getTargetElement = useCallback(() => {
    const el = document.querySelector(selector);
    if (!el)
      throw new Error(`InvoicePrintControls: target selector not found: ${selector}`);
    return el;
  }, [selector]);

  const preprocessImages = useCallback((target) => {
    const imgs = Array.from(target.querySelectorAll("img"));
    const originals = imgs.map((img) => ({
      img,
      src: img.getAttribute("src"),
      crossOrigin: img.crossOrigin,
    }));
    imgs.forEach((img) => {
      try {
        const src = img.getAttribute("src") || "";
        const isAbsolute = /^https?:\/\//i.test(src) || src.startsWith("data:");
        const absoluteSrc = isAbsolute ? src : new URL(src, window.location.origin).href;
        img.setAttribute("src", absoluteSrc);
        img.crossOrigin = "anonymous";
      } catch (_) {}
    });
    return () => {
      originals.forEach(({ img, src, crossOrigin }) => {
        if (src) img.setAttribute("src", src);
        else img.removeAttribute("src");
        img.crossOrigin = crossOrigin || "";
      });
    };
  }, []);

  const renderCanvas = useCallback(
      async (target) => {
        target.style.width = "210mm";
        target.style.minHeight = "297mm";
        target.style.margin = "0";
        target.style.background = "#ffffff";
        target.style.border = "none";
        target.style.boxShadow = "none";
        target.style.padding = "0";

        return await html2canvas(target, {
          scale,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          logging: false,
          windowWidth: target.scrollWidth,
          windowHeight: target.scrollHeight,
        });
      },
      [scale]
  );

  const buildFullPagePdf = useCallback(
      (canvas) => {
        const pdf = new jsPDF({ unit: "mm", format: paperSize, orientation });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // --- Center vertically if smaller than A4 ---
        const yOffset = imgHeight < pageHeight ? (pageHeight - imgHeight) / 2 : 0;

        pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight);
        return pdf;
      },
      [paperSize, orientation]
  );

  const onDownloadPdf = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const target = getTargetElement();
      const cleanup = preprocessImages(target);
      const canvas = await renderCanvas(target);
      cleanup && cleanup();

      const pdf = buildFullPagePdf(canvas);
      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to generate PDF");
      alert(err?.message || "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  }, [getTargetElement, preprocessImages, renderCanvas, buildFullPagePdf, fileName]);

  const onOpenPreview = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const target = getTargetElement();
      const cleanup = preprocessImages(target);
      const canvas = await renderCanvas(target);
      cleanup && cleanup();

      const imgSrc = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) throw new Error("Popup blocked. Please allow popups for preview.");

      const paperCss = paperSize.toString().toLowerCase() === "letter" ? "letter" : "a4";

      win.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Invoice Preview</title>
            <style>
              @page { size: ${paperCss} ${orientation}; margin: 0; }
              html, body {
                margin: 0;
                padding: 0;
                background: #fff;
                color: #000;
                height: 100%;
                font-family: Arial, sans-serif;
              }
              .page {
                width: 210mm;
                height: 297mm;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                page-break-after: always;
              }
              img {
                width: auto;
                max-width: 100%;
                max-height: 100%;
                display: block;
                object-fit: contain;
              }
              /* Clean layout */
              #invoice-card, .card, .container, .wrapper {
                border: none !important;
                box-shadow: none !important;
                background: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .page:last-child { page-break-after: auto; }
            </style>
          </head>
          <body>
            <div class="page">
              <img src="${imgSrc}" alt="Invoice Preview" />
            </div>
          </body>
        </html>
      `);
      win.document.close();
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to open print preview");
      alert(err?.message || "Failed to open print preview");
    } finally {
      setLoading(false);
    }
  }, [getTargetElement, renderCanvas, paperSize, orientation, preprocessImages]);

  return (
      <div className="d-inline-flex align-items-center gap-2">
        <button
            type="button"
            className="btn btn-sm btn-warning radius-8"
            onClick={onDownloadPdf}
            disabled={loading}
        >
          {loading ? "Generating…" : "Download Full-Page PDF"}
        </button>
        <button
            type="button"
            className="btn btn-sm btn-danger radius-8"
            onClick={onOpenPreview}
            disabled={loading}
        >
          {loading ? "Preparing…" : "Open Full-Page Preview"}
        </button>
      </div>
  );
};

export default InvoicePrintControls;
