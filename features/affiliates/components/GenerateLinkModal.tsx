"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type GenerateLinkModalProps = {
  isOpen: boolean;
  onClose: () => void;
  affiliateName: string;
  affiliateCode: string;
  events: Array<{ id: string; code: string; name: string }>;
};

export default function GenerateLinkModal({
  isOpen,
  onClose,
  affiliateName,
  affiliateCode,
  events,
}: GenerateLinkModalProps) {
  const [selectedEventSlug, setSelectedEventSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEventSlug) {
      setSelectedEventSlug(events[0].code);
    }
  }, [events, selectedEventSlug]);

  if (!isOpen) return null;

  const generatedLink = selectedEventSlug
    ? `${origin}/events/${selectedEventSlug}?ref=${affiliateCode}`
    : "";

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("❌ Failed to copy link:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg border border-gray-200/80 rounded-2xl shadow-xl p-5 flex flex-col gap-5 relative animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-lg font-extrabold text-[#2C1F63]">
              Buat Link Afiliasi
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Generate tautan promosi khusus untuk partner **{affiliateName}**
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Pilih Event</label>
            <select
              value={selectedEventSlug}
              onChange={(e) => setSelectedEventSlug(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus:border-[#2E4EEA] focus:outline-none transition-colors"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.code}>
                  {evt.name} ({evt.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-600">Link Rujukan Unik</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 text-xs font-semibold text-gray-600 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 focus:outline-none select-all"
              />
              <Button
                onClick={handleCopy}
                variant="default"
                className="shrink-0 rounded-xl border border-black bg-[#CAFF04] hover:bg-[#b0df03] text-black font-extrabold flex items-center gap-1.5 h-[42px] px-4 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-700" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Salin</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="rounded-xl border border-gray-300 font-bold px-5 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
