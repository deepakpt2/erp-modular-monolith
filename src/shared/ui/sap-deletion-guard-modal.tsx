"use client";

import React, { useState } from 'react';

export interface DeletionReason {
  code: string;
  message: string;
  resolution: string;
  tcode: string;
  count?: number;
}

export interface DeletionDiagnostic {
  canDelete: boolean;
  entityType: string;
  entityIdentifier: string;
  errorTitle: string;
  reasons: DeletionReason[];
  deactivationAction?: {
    type: 'POSTING_BLOCK' | 'DELETION_FLAG';
    label: string;
    endpoint: string;
    payload: Record<string, any>;
  };
}

interface SapDeletionGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostic: DeletionDiagnostic | null;
  onDeactivateSuccess?: () => void;
}

export function SapDeletionGuardModal({
  isOpen,
  onClose,
  diagnostic,
  onDeactivateSuccess,
}: SapDeletionGuardModalProps) {
  const [isApplyingBlock, setIsApplyingBlock] = useState(false);
  const [blockSuccessMessage, setBlockSuccessMessage] = useState<string | null>(null);
  const [blockErrorMessage, setBlockErrorMessage] = useState<string | null>(null);

  if (!isOpen || !diagnostic) return null;

  const handleApplyDeactivation = async () => {
    if (!diagnostic.deactivationAction) return;
    setIsApplyingBlock(true);
    setBlockErrorMessage(null);
    try {
      const res = await fetch(diagnostic.deactivationAction.endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(diagnostic.deactivationAction.payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update deactivation status.');
      }
      setBlockSuccessMessage(
        `✅ ${diagnostic.deactivationAction.label} applied successfully. Future operational postings are blocked.`
      );
      if (onDeactivateSuccess) {
        setTimeout(() => {
          onDeactivateSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setBlockErrorMessage(err.message);
    } finally {
      setIsApplyingBlock(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-zinc-300 shadow-2xl max-w-2xl w-full overflow-hidden text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header - SAP System Message Style */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-red-600 font-bold text-lg">
            ✕
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                SAP Integrity Violation
              </span>
              <span className="text-xs font-mono text-red-700">
                {diagnostic.entityType}
              </span>
            </div>
            <h3 className="text-base font-bold text-red-950 mt-1">
              {diagnostic.errorTitle}
            </h3>
            <p className="text-xs text-red-800 mt-0.5">
              Physical deletion rejected to preserve legal audit trail and operational data integrity.
            </p>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Blocked Dependencies ({diagnostic.reasons.length})
          </div>

          <div className="space-y-3">
            {diagnostic.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-mono font-bold text-zinc-900">
                      {reason.code}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] bg-zinc-200 text-zinc-800 px-2 py-0.5 rounded font-semibold">
                    TCode: {reason.tcode}
                  </span>
                </div>

                <p className="text-zinc-700 font-medium">
                  {reason.message}
                </p>

                <div className="bg-white p-2.5 rounded-lg border border-zinc-200 text-[11px] text-zinc-600">
                  <span className="font-bold text-zinc-800">Standard Resolution: </span>
                  {reason.resolution}
                </div>
              </div>
            ))}
          </div>

          {blockSuccessMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-medium">
              {blockSuccessMessage}
            </div>
          )}

          {blockErrorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-800 text-xs font-medium">
              ❌ {blockErrorMessage}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="bg-zinc-100 border-t border-zinc-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-500 font-mono">
            SAP Standard: OBR2 / FS00 / OX02
          </div>
          <div className="flex items-center gap-2">
            {diagnostic.deactivationAction && !blockSuccessMessage && (
              <button
                type="button"
                onClick={handleApplyDeactivation}
                disabled={isApplyingBlock}
                className="px-4 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isApplyingBlock ? 'Applying...' : diagnostic.deactivationAction.label}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium bg-white hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
