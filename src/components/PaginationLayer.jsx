import React from "react";

/**
 * PaginationLayer: square buttons with icons, centered.
 * Props:
 * - page: current page (number)
 * - totalPages: total number of pages (number)
 * - onPageChange: (newPage:number) => void
 */
const PaginationLayer = ({ page = 1, totalPages = 1, onPageChange }) => {
  const sizePx = 36; // small square buttons
  const baseBtnStyle = {
    width: sizePx,
    height: sizePx,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  const makePageWindow = (current, total) => {
    const maxVisible = 7;
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [1];
    let start = Math.max(2, current - 2);
    let end = Math.min(total - 1, current + 2);
    if (start > 2) pages.push("ellipsis-prev");
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total - 1) pages.push("ellipsis-next");
    pages.push(total);
    return pages;
  };

  const goTo = (p) => {
    if (!onPageChange) return;
    if (typeof p === "number" && p >= 1 && p <= totalPages && p !== page) {
      onPageChange(p);
    }
  };

  const isDisabledPrev = page <= 1;
  const isDisabledNext = page >= totalPages;
  const windowPages = makePageWindow(page, totalPages);

  return (
    <div className="d-flex justify-content-center mt-16">
      <div className="d-flex align-items-center gap-8">
        {/* Previous */}
        <button
          className={`btn btn-sm radius-8 ${isDisabledPrev ? "btn-neutral-400 disabled" : "btn-neutral-400"}`}
          style={baseBtnStyle}
          disabled={isDisabledPrev}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
        >
          <i className="ri-arrow-left-s-line" />
        </button>

        {/* Numeric pages */}
        {windowPages.map((p, idx) => {
          if (typeof p !== "number") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="text-secondary-light"
                style={{ ...baseBtnStyle, lineHeight: `${sizePx}px` }}
              >
                …
              </span>
            );
          }
          const isActive = p === page;
          const className = isActive
            ? "btn btn-sm radius-8 btn-primary-600 text-white"
            : "btn btn-sm radius-8 btn-neutral-400";
          return (
            <button
              key={p}
              className={className}
              style={baseBtnStyle}
              onClick={() => goTo(p)}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          );
        })}

        {/* Next */}
        <button
          className={`btn btn-sm radius-8 ${isDisabledNext ? "btn-neutral-400 disabled" : "btn-neutral-400"}`}
          style={baseBtnStyle}
          disabled={isDisabledNext}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
};

export default PaginationLayer;
