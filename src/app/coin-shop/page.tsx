"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Coins,
  Sparkles,
  QrCode,
  CreditCard,
  Smartphone,
  CheckCircle2,
  X,
  History,
  ShieldCheck,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceThb: number;
  badge?: string | null;
  isPopular: boolean;
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  coinType: string;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export default function CoinShopPage() {
  const { user, refreshUser } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"PROMPTPAY" | "CREDIT_CARD" | "TRUEMONEY">("PROMPTPAY");
  const [processing, setProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    coinsCredited: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [pkgRes, walletRes] = await Promise.all([
          fetch("/api/v1/coin/packages"),
          fetch("/api/v1/wallet/balance"),
        ]);
        const pkgJson = await pkgRes.json();
        const walletJson = await walletRes.json();

        if (pkgJson.success) setPackages(pkgJson.data);
        if (walletJson.success && walletJson.data?.transactions) {
          setTransactions(walletJson.data.transactions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleBuy = async () => {
    if (!selectedPackage) return;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนซื้อเหรียญ");
      return;
    }

    setProcessing(true);
    try {
      const idempotencyKey = `BUY-${user.id}-${selectedPackage.id}-${Date.now()}`;
      const res = await fetch("/api/v1/coin/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          provider: paymentProvider,
          idempotencyKey,
        }),
      });

      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        setSuccessOrder({
          orderId: json.data.order.id,
          coinsCredited: selectedPackage.coins + selectedPackage.bonusCoins,
        });
        refreshUser();
        // Refresh wallet transactions
        const wRes = await fetch("/api/v1/wallet/balance");
        const wJson = await wRes.json();
        if (wJson.success && wJson.data?.transactions) {
          setTransactions(wJson.data.transactions);
        }
      } else {
        alert(json.error?.message || "ชำระเงินไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setProcessing(false);
    }
  };

  const paidBalance = user?.wallet?.paidBalance || 0;
  const freeBalance = user?.wallet?.freeBalance || 0;
  const totalBalance = paidBalance + freeBalance;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Page Title & Balance Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Coin Shop & Wallet</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-prompt">
            ร้านค้าเหรียญทอง (Coin Store)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            เติมเหรียญเพื่อปลดล็อกตอนพรีเมียม สนับสนุนนักเขียนคนโปรดได้ทันที
          </p>
        </div>

        {/* Current Wallet Balance Card */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 flex items-center gap-5 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">เหรียญคงเหลือทั้งหมด</p>
            <p className="text-2xl font-black text-amber-300 font-prompt">
              {totalBalance.toLocaleString()}{" "}
              <span className="text-xs font-normal text-zinc-400">เหรียญ</span>
            </p>
            <div className="flex gap-3 text-[11px] text-zinc-500 mt-0.5">
              <span>ซื้อ: {paidBalance}</span>
              <span>•</span>
              <span className="text-amber-400/80">ฟรี: {freeBalance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="my-10">
        <h2 className="text-xl font-bold text-white font-prompt mb-6">
          เลือกแพ็กเกจเหรียญสุดคุ้ม
        </h2>

        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const totalCoins = pkg.coins + pkg.bonusCoins;
              return (
                <div
                  key={pkg.id}
                  className={`relative p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${
                    pkg.isPopular
                      ? "bg-gradient-to-b from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500/60 shadow-xl shadow-amber-500/10"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-[11px] shadow-md uppercase tracking-wider font-prompt">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Coins className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-lg text-white font-prompt">{pkg.name}</h3>
                    </div>

                    <div className="my-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-amber-300 font-prompt">
                          {totalCoins.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-400">เหรียญ</span>
                      </div>
                      {pkg.bonusCoins > 0 && (
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                          <Zap className="w-3.5 h-3.5" />
                          <span>(เหรียญหลัก {pkg.coins} + โบนัสพิเศษ {pkg.bonusCoins})</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-zinc-400">ราคา</span>
                      <span className="text-xl font-bold text-white font-prompt">
                        ฿{pkg.priceThb.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setSuccessOrder(null);
                      }}
                      className={`w-full py-3 rounded-2xl font-bold text-sm transition ${
                        pkg.isPopular
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black shadow-lg shadow-amber-500/20"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                      }`}
                    >
                      ซื้อแพ็กเกจนี้
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History Ledger */}
      <div className="my-14 pt-8 border-t border-zinc-800">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white font-prompt">ประวัติการทำรายการเหรียญ (Ledger)</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-center text-zinc-500 text-sm">
            ยังไม่มีประวัติการทำรายการ
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/60">
            <div className="divide-y divide-zinc-800 text-xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-200 text-sm">{tx.note || tx.type}</p>
                    <p className="text-zinc-500 text-[11px] mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("th-TH")} • ประเภทเหรียญ: {tx.coinType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                    </span>
                    <p className="text-[11px] text-zinc-500">คงเหลือ: {tx.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            {successOrder ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white font-prompt">ชำระเงินสำเร็จ!</h3>
                <p className="text-sm text-zinc-300 mt-2">
                  คุณได้รับเหรียญจำนวน{" "}
                  <strong className="text-amber-400 font-bold">
                    +{successOrder.coinsCredited} เหรียญ
                  </strong>{" "}
                  เรียบร้อยแล้ว
                </p>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="mt-6 w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition"
                >
                  เรียบร้อย
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-white font-prompt mb-1">
                  ยืนยันการชำระเงิน
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  {selectedPackage.name} • ยอดชำระ ฿{selectedPackage.priceThb}
                </p>

                {/* Payment Method Selector */}
                <div className="space-y-2.5 mb-6">
                  <label className="text-xs font-semibold text-zinc-300 block">เลือกช่องทางชำระเงิน</label>

                  <div
                    onClick={() => setPaymentProvider("PROMPTPAY")}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "PROMPTPAY"
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-white">พร้อมเพย์ (PromptPay QR)</p>
                        <p className="text-[10px] text-zinc-400">สแกนจ่ายผ่านแอปธนาคารทุกแห่ง</p>
                      </div>
                    </div>
                    {paymentProvider === "PROMPTPAY" && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>

                  <div
                    onClick={() => setPaymentProvider("CREDIT_CARD")}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "CREDIT_CARD"
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs font-bold text-white">บัตรเครดิต / เดบิต (Visa/Mastercard)</p>
                        <p className="text-[10px] text-zinc-400">ปลอดภัยด้วยมาตรฐาน PCI-DSS</p>
                      </div>
                    </div>
                    {paymentProvider === "CREDIT_CARD" && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>

                  <div
                    onClick={() => setPaymentProvider("TRUEMONEY")}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "TRUEMONEY"
                        ? "bg-amber-500/10 border-amber-500"
                        : "bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-orange-400" />
                      <div>
                        <p className="text-xs font-bold text-white">TrueMoney Wallet</p>
                        <p className="text-[10px] text-zinc-400">ชำระผ่านกระเป๋าเงินทรูมันนี่</p>
                      </div>
                    </div>
                    {paymentProvider === "TRUEMONEY" && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                </div>

                {/* PromptPay QR Mock Display */}
                {paymentProvider === "PROMPTPAY" && (
                  <div className="p-4 rounded-2xl bg-white text-zinc-900 text-center my-4">
                    <p className="text-[11px] font-bold text-blue-900 mb-2">PromptPay QR Code (Sandbox)</p>
                    <div className="w-36 h-36 bg-zinc-100 border-2 border-zinc-800 rounded-xl mx-auto flex items-center justify-center p-2">
                      <QrCode className="w-28 h-28 text-zinc-900" />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">ยอดชำระ: ฿{selectedPackage.priceThb}.00</p>
                  </div>
                )}

                <button
                  onClick={handleBuy}
                  disabled={processing}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{processing ? "กำลังทำรายการ..." : `ยืนยันชำระเงิน ฿${selectedPackage.priceThb}`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
