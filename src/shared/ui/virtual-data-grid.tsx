"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

interface VirtualDataGridProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  height?: number;
  rowHeight?: number;
  enableSorting?: boolean;
  enableKeyboardNav?: boolean;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  selectedRowId?: string;
  getRowId?: (row: T) => string;
  emptyMessage?: string;
}

export function VirtualDataGrid<T>({
  data,
  columns,
  height = 600,
  rowHeight = 32,
  enableSorting = true,
  enableKeyboardNav = true,
  onRowClick,
  onRowDoubleClick,
  selectedRowId,
  getRowId,
  emptyMessage = "No data",
}: VirtualDataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [focusedRowIndex, setFocusedRowIndex] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId as any,
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!parentRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.min(prev + 1, rows.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          if (onRowClick && rows[focusedRowIndex]) {
            onRowClick(rows[focusedRowIndex].original);
          }
          break;
        case 'PageDown':
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.min(prev + 10, rows.length - 1));
          break;
        case 'PageUp':
          e.preventDefault();
          setFocusedRowIndex((prev) => Math.max(prev - 10, 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNav, focusedRowIndex, rows, onRowClick]);

  // Scroll focused row into view
  useEffect(() => {
    virtualizer.scrollToIndex(focusedRowIndex, { align: 'auto' });
  }, [focusedRowIndex, virtualizer]);

  const virtualRows = virtualizer.getVirtualItems();

  if (data.length === 0) {
    return (
      <div className="border border-black bg-white flex items-center justify-center" style={{ height }}>
        <span className="font-mono text-xs text-gray-500">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="border border-black bg-white flex flex-col font-mono text-[11px]">
      {/* Header */}
      <div className="bg-black text-white flex border-b border-black sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <React.Fragment key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className="px-2 py-1 border-r border-gray-700 font-bold flex items-center justify-between cursor-pointer hover:bg-gray-900"
                style={{ width: header.getSize(), minWidth: header.getSize() }}
                onClick={header.column.getToggleSortingHandler()}
              >
                <span className="truncate">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </span>
                {enableSorting && header.column.getIsSorted() && (
                  <span className="ml-1">{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: height - 32, contain: 'strict' }}
        tabIndex={0}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const isSelected = selectedRowId && getRowId ? getRowId(row.original) === selectedRowId : false;
            const isFocused = virtualRow.index === focusedRowIndex;

            return (
              <div
                key={row.id}
                className={`
                  absolute top-0 left-0 w-full flex border-b border-gray-200 cursor-pointer
                  ${isSelected ? 'bg-zinc-100 border-zinc-300' : isFocused ? 'bg-zinc-50' : 'bg-white hover:bg-gray-50'}
                  ${isFocused ? 'ring-1 ring-black ring-inset' : ''}
                `}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => {
                  setFocusedRowIndex(virtualRow.index);
                  onRowClick?.(row.original);
                }}
                onDoubleClick={() => onRowDoubleClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-2 py-1 border-r border-gray-100 flex items-center truncate"
                    style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}
                    title={String(cell.getValue() ?? '')}
                  >
                    <span className="truncate">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-black px-2 py-1 flex justify-between text-[10px]">
        <span>{rows.length} rows • Virtualized with @tanstack/react-virtual • Keyboard: ↑↓ Enter PgUp/PgDn</span>
        <span>Row {focusedRowIndex + 1} / {rows.length}</span>
      </div>
    </div>
  );
}

// Helper for expiry badge
export function ExpiryBadge({ expiryDate, minExpiry }: { expiryDate?: Date | string | null; minExpiry?: Date | string | null }) {
  const targetDate = expiryDate || minExpiry;
  if (!targetDate) return <span className="text-gray-400">-</span>;

  const exp = new Date(targetDate);
  const now = new Date();
  const diffHours = (exp.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  let className = "px-1 py-0.5 text-[10px] font-bold border ";
  let label = exp.toLocaleDateString();

  if (diffHours < 0) {
    className += "bg-red-600 text-white border-red-800";
    label = `EXPIRED ${exp.toLocaleDateString()}`;
  } else if (diffHours < 24) {
    className += "bg-red-500 text-white border-red-700 animate-pulse";
    label = `⚠ ${Math.floor(diffHours)}h LEFT ${exp.toLocaleDateString()}`;
  } else if (diffHours < 48) {
    className += "bg-orange-400 text-black border-orange-600";
    label = `⚠ ${Math.floor(diffHours)}h ${exp.toLocaleDateString()}`;
  } else if (diffDays < 7) {
    className += "bg-yellow-200 text-black border-yellow-400";
    label = `${Math.floor(diffDays)}d ${exp.toLocaleDateString()}`;
  } else {
    className += "bg-green-100 text-black border-green-300";
  }

  return <span className={className}>{label}</span>;
}

// Kitting Preview Component with minExpiry safeguard
export function KittingPreview({
  components,
  kitQuantity,
  minExpiry,
  calculatedExpiry,
  totalCost,
}: {
  components: { materialId: string; materialNumber?: string; description?: string; quantity: number; batchNumber?: string; expiryDate?: Date | string | null; unitCost?: number }[];
  kitQuantity: number;
  minExpiry?: Date | string | null;
  calculatedExpiry?: Date | string | null;
  totalCost?: number;
}) {
  const exp = minExpiry ? new Date(minExpiry) : null;
  const now = new Date();
  const diffHours = exp ? (exp.getTime() - now.getTime()) / (1000 * 60 * 60) : null;

  let expiryAlert: { level: 'critical' | 'warning' | 'ok' | 'none'; message: string } = { level: 'none', message: '' };

  if (diffHours !== null) {
    if (diffHours < 0) {
      expiryAlert = { level: 'critical', message: `EXPIRED - Kit would be expired on creation! Min expiry ${exp?.toLocaleString()}` };
    } else if (diffHours < 24) {
      expiryAlert = { level: 'critical', message: `CRITICAL - Kit expires in ${Math.floor(diffHours)}h! Less than 24h bottleneck. Do not produce unless immediate consumption.` };
    } else if (diffHours < 48) {
      expiryAlert = { level: 'warning', message: `WARNING - Kit expires in ${Math.floor(diffHours)}h (<48h). Kitchen should consume quickly.` };
    } else {
      expiryAlert = { level: 'ok', message: `OK - Kit expiry ${exp?.toLocaleDateString()} (${Math.floor(diffHours/24)} days)` };
    }
  }

  return (
    <div className="border-2 border-black bg-white font-mono text-[11px]">
      <div className="bg-black text-white px-2 py-1 font-bold flex justify-between">
        <span>KITTING PREVIEW K01/K02 - Stocked Kit Make-to-Stock</span>
        <span>{kitQuantity} KIT</span>
      </div>

      {expiryAlert.level !== 'none' && (
        <div className={`
          px-2 py-2 border-b-2 border-black font-bold text-xs
          ${expiryAlert.level === 'critical' ? 'bg-red-600 text-white' : expiryAlert.level === 'warning' ? 'bg-orange-400 text-black' : 'bg-green-100 text-black'}
        `}>
          {expiryAlert.level === 'critical' ? '🚨 ' : expiryAlert.level === 'warning' ? '⚠️ ' : '✓ '}
          {expiryAlert.message}
          <div className="mt-1 text-[10px] font-normal">
            Inherited minExpiry = MIN(component expiries) | Calculated = {calculatedExpiry ? new Date(calculatedExpiry).toLocaleString() : 'MIN'}
          </div>
        </div>
      )}

      <div className="p-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="font-bold mb-1">K01 - CONSUMPTION (Issue Components)</div>
            <div className="border border-black">
              <div className="bg-gray-100 flex font-bold border-b border-black">
                <div className="w-24 px-1 py-0.5 border-r">Material</div>
                <div className="w-20 px-1 py-0.5 border-r">Batch</div>
                <div className="w-16 px-1 py-0.5 border-r">Qty</div>
                <div className="flex-1 px-1 py-0.5">Expiry</div>
              </div>
              {components.map((c, i) => (
                <div key={i} className="flex border-b border-gray-200">
                  <div className="w-24 px-1 py-0.5 border-r truncate" title={c.description}>{c.materialNumber || c.materialId.slice(0,8)}</div>
                  <div className="w-20 px-1 py-0.5 border-r truncate">{c.batchNumber || '-'}</div>
                  <div className="w-16 px-1 py-0.5 border-r">{c.quantity}</div>
                  <div className="flex-1 px-1 py-0.5"><ExpiryBadge expiryDate={c.expiryDate} /></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-bold mb-1">K02 - PRODUCTION (Receipt Kit)</div>
            <div className="border-2 border-black bg-zinc-50 p-2">
              <div className="space-y-1">
                <div>Kit Qty: <b>{kitQuantity}</b></div>
                <div>Min Expiry (inherited): <ExpiryBadge expiryDate={minExpiry} /></div>
                <div>Calculated Expiry: <ExpiryBadge expiryDate={calculatedExpiry} /></div>
                <div>Total Cost: <b>{totalCost?.toFixed(3) || '0.000'} KWD</b> = Σ component MAP</div>
                <div className="mt-2 text-[10px]">Movement: K01 (-components) + K02 (+kit batch KIT-... with expiry MIN)</div>
              </div>
            </div>

            {diffHours !== null && diffHours < 48 && (
              <div className="mt-2 border border-red-600 bg-red-50 p-2">
                <div className="font-bold text-red-800">OPERATOR ACTION REQUIRED:</div>
                <div className="mt-1">
                  {diffHours < 24 ? (
                    <span className="text-red-700">⛔ DO NOT produce this kit unless immediate use in next 24h. Consider using fresher component batches or reducing kit qty.</span>
                  ) : (
                    <span className="text-orange-700">⚠️ Produce only if kit will be consumed within 48h. Flag kitchen for priority consumption.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
