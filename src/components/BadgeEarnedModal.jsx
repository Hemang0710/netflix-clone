"use client";

import { useState } from "react";
import QRCode from "qrcode.react";

export default function BadgeEarnedModal({ badge, issuance, onClose }) {
  const [copied, setCopied] = useState(false);
  const verificationUrl = `${typeof window !== "undefined" ? window.location.origin : "https://learnai.io"}/verify/${issuance.verificationCode}`;

  const handleShare = (platform) => {
    const badgeName = badge?.name || "Achievement";
    const text = `I just earned the "${badgeName}" badge on LearnAI! Verify it here: ${verificationUrl}`;

    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank"
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`,
        "_blank"
      );
    } else if (platform === "copy") {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#0d1a2e] to-[#1a2a3a] border border-indigo-500/30 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
        {/* Celebration animation */}
        <div className="text-6xl animate-bounce">🎉</div>

        {/* Badge icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center p-4 shadow-xl shadow-indigo-500/50">
            {badge?.icon ? (
              <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: badge.icon }}
              />
            ) : (
              <span className="text-5xl">🏆</span>
            )}
          </div>
        </div>

        {/* Badge name + description */}
        <div>
          <h2 className="text-2xl font-black text-white mb-2">
            {badge?.name || "Achievement Unlocked"}
          </h2>
          <p className="text-slate-400 text-sm">
            {badge?.description || "You've earned a badge!"}
          </p>
        </div>

        {/* Verification info */}
        <div className="bg-white/3 rounded-xl p-4 space-y-2">
          <p className="text-xs text-slate-500">Blockchain Verified</p>
          {issuance?.hederaTxHash && (
            <>
              <p className="text-xs font-mono text-indigo-300 break-all">
                {issuance.hederaTxHash.slice(0, 20)}...
              </p>
              <a
                href={`https://hashscan.io/testnet/transaction/${issuance.hederaTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 inline-block"
              >
                View on Hedera ↗
              </a>
            </>
          )}
        </div>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg flex justify-center">
          <QRCode value={verificationUrl} size={160} level="H" />
        </div>

        {/* Share buttons */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Share your achievement</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => handleShare("twitter")}
              className="flex-1 min-w-[80px] bg-[#1DA1F2] hover:bg-[#1a91da] text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              𝕏
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              className="flex-1 min-w-[80px] bg-[#0A66C2] hover:bg-[#095195] text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              LinkedIn
            </button>
            <button
              onClick={() => handleShare("copy")}
              className="flex-1 min-w-[80px] bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
