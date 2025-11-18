import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import $ from "jquery";
import ReactDOMServer from "react-dom/server";
import "datatables.net-dt/js/dataTables.dataTables.js";

const TableDataLayer = ({
                            title = "Data Table",
                            headers = [],
                            data = [],
                            onView,
                            onEdit,
                            onDelete,
                            onInvoice,
                            actionLabels = {}
                        }) => {
    const tableRef = useRef(null);
    const dataTable = useRef(null);

    // Helper to map header text to value key
    const getValue = (item, header) => {
        if (header === "#") return item["#"];
        const key = header.toLowerCase().replace(/\s+/g, "");
        return item[key] ?? "";
    };

    useEffect(() => {
        if (!tableRef.current) return;

        const $table = $(tableRef.current);

        // ✅ Initialize DataTable once
        if (!dataTable.current) {
            dataTable.current = $table.DataTable({
                pageLength: 10,
                ordering: true,
                destroy: true,
                deferRender: true,
                autoWidth: false,
                responsive: true,
                columnDefs: [
                    { targets: "_all", render: (data) => data }, // ✅ allow HTML rendering
                ],
            });

        }

        const table = dataTable.current;
        table.clear();

        // ✅ Safely convert JSX or strings to HTML
        const formatCell = (value) => {
            if (React.isValidElement(value)) {
                return ReactDOMServer.renderToString(value); // convert JSX to HTML string
            }
            if (typeof value === "string" || typeof value === "number") {
                return value;
            }
            return "";
        };

        const newRows = data.map((item, i) => [
            ...headers.map((h) => formatCell(getValue(item, h))),
            `
        <div class="text-center">
          <div class="dropdown d-inline-block">
            <button data-bs-toggle='dropdown' aria-expanded='false'>
              <i class='ri-more-2-fill'></i>
            </button>
            <ul class='dropdown-menu dropdown-menu-end'>
              <li><a class='dropdown-item action-view' href='#' data-index='${i}'>${actionLabels.view || 'View'}</a></li>
              <li><a class='dropdown-item action-edit' href='#' data-index='${i}'>${actionLabels.edit || 'Edit'}</a></li>
              ${onInvoice ? `<li><a class='dropdown-item action-invoice' href='#' data-index='${i}'>${actionLabels.invoice || 'Invoice'}</a></li>` : ''}
              <li><a class='dropdown-item text-danger action-delete' href='#' data-index='${i}'>Delete</a></li>
            </ul>
          </div>
        </div>
      `,
        ]);

        // ✅ Render new data
        table.rows.add(newRows).draw();

        // ✅ Bind click events
        $table.off("click", ".action-view").on("click", ".action-view", (e) => {
            const index = $(e.currentTarget).data("index");
            onView && onView(data[index]);
        });

        $table.off("click", ".action-edit").on("click", ".action-edit", (e) => {
            const index = $(e.currentTarget).data("index");
            onEdit && onEdit(data[index]);
        });

        $table.off("click", ".action-delete").on("click", ".action-delete", (e) => {
            const index = $(e.currentTarget).data("index");
            onDelete && onDelete(data[index]);
        });

        $table.off("click", ".action-invoice").on("click", ".action-invoice", (e) => {
            const index = $(e.currentTarget).data("index");
            onInvoice && onInvoice(data[index]);
        });
    }, [data]);

    return (
        <div className="card basic-data-table">
            <div className="card-body">
                <table
                    ref={tableRef}
                    className="table bordered-table table-hover mb-0"
                    id="dataTable"
                    style={{ width: "100%" }}
                >
                    <thead>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i}>{h}</th>
                        ))}
                        <th className="text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    );
};

TableDataLayer.propTypes = {
    title: PropTypes.string,
    headers: PropTypes.arrayOf(PropTypes.string).isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onInvoice: PropTypes.func,
    actionLabels: PropTypes.object,
};

export default TableDataLayer;
