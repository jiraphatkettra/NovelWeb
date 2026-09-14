"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Coins,
  Zap,
  CheckCircle2,
  History,
  QrCode,
  CreditCard,
  Smartphone,
  ShieldCheck,
  X,
} from "lucide-react";
import confetti from "canvas-confetti";

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  priceThb: number;
  badge?: string | null;
  isPopular?: boolean;
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  coinType: string;
  note?: string | null;
  balanceAfter: number;
  createdAt: string;
}

export default function CoinShopPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"PROMPTPAY" | "CREDIT_CARD" | "TRUEMONEY">("PROMPTPAY");
  const [processing, setProcessing] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ orderId: string; coinsCredited: number } | null>(null);

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
      toast.warning("กรุณาเข้าสู่ระบบ", "เข้าสู่ระบบก่อนทำการซื้อเหรียญ");
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
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        const coinsCredited = selectedPackage.coins + selectedPackage.bonusCoins;
        setSuccessOrder({
          orderId: json.data.order.id,
          coinsCredited,
        });
        toast.success("ชำระเงินสำเร็จ!", `คุณได้รับ ${coinsCredited} เหรียญเรียบร้อยแล้ว`);
        refreshUser();
        // Refresh wallet transactions
        const wRes = await fetch("/api/v1/wallet/balance");
        const wJson = await wRes.json();
        if (wJson.success && wJson.data?.transactions) {
          setTransactions(wJson.data.transactions);
        }
      } else {
        toast.error("ชำระเงินไม่สำเร็จ", json.error?.message);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setProcessing(false);
    }
  };

  const paidBalance = user?.wallet?.paidBalance || 0;
  const freeBalance = user?.wallet?.freeBalance || 0;
  const totalBalance = paidBalance + freeBalance;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-prompt tracking-tight">
            ร้านค้าเหรียญ
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            เติมเหรียญเพื่อปลดล็อกตอนและสนับสนุนผลงานที่ชื่นชอบ
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="p-3.5 px-5 rounded-xl bg-[#121215] border border-white/[0.08] flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-400">เหรียญคงเหลือทั้งหมด</p>
            <p className="text-xl font-bold text-[#FFE600] font-prompt">
              {totalBalance.toLocaleString()}{" "}
              <span className="text-xs font-normal text-neutral-400">เหรียญ</span>
            </p>
            <div className="flex gap-2 text-[10px] text-neutral-500 mt-0.5">
              <span>ซื้อ: {paidBalance}</span>
              <span>•</span>
              <span className="text-neutral-400">ฟรี: {freeBalance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="my-8">
        <h2 className="text-base font-bold text-white font-prompt mb-4">
          แพ็กเกจเหรียญ
        </h2>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#FFE600] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const totalCoins = pkg.coins + pkg.bonusCoins;
              return (
                <div
                  key={pkg.id}
                  className={`relative p-5 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                    pkg.isPopular
                      ? "bg-[#16161A] border-[#FFE600]/60 shadow-lg shadow-[#FFE600]/5"
                      : "bg-[#121215] border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#FFE600] text-black font-bold text-[10px] uppercase tracking-wider font-prompt">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-4 h-4 text-[#FFE600]" />
                      <h3 className="font-bold text-sm text-white font-prompt">{pkg.name}</h3>
                    </div>

                    <div className="my-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white font-prompt">
                          {totalCoins.toLocaleString()}
                        </span>
                        <span className="text-xs text-neutral-400">เหรียญ</span>
                      </div>
                      {pkg.bonusCoins > 0 && (
                        <p className="text-[11px] text-[#FFE600] mt-0.5 flex items-center gap-1 font-medium">
                          <Zap className="w-3 h-3" />
                          <span>(เหรียญหลัก {pkg.coins} + โบนัส {pkg.bonusCoins})</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] mt-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-neutral-400">ราคา</span>
                      <span className="text-base font-bold text-white font-prompt">
                        ฿{pkg.priceThb.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setSuccessOrder(null);
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition active:scale-[0.99] ${
                        pkg.isPopular
                          ? "bg-[#FFE600] hover:bg-[#F5DC00] text-black"
                          : "bg-white/[0.06] hover:bg-white/[0.1] text-white"
                      }`}
                    >
                      ซื้อแพ็กเกจ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History Ledger */}
      <div className="my-10 pt-6 border-t border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-neutral-400" />
          <h2 className="text-base font-bold text-white font-prompt">ประวัติการทำรายการ</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-neutral-500 text-xs">
            ยังไม่มีประวัติการทำรายการ
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#121215]">
            <div className="divide-y divide-white/[0.06] text-xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white text-xs">{tx.note || tx.type}</p>
                    <p className="text-neutral-500 text-[10px] mt-0.5">
                      {new Date(tx.createdAt).toLocaleString("th-TH")} • ประเภท: {tx.coinType}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold ${
                        tx.amount > 0 ? "text-emerald-400" : "text-neutral-400"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                    </span>
                    <p className="text-[10px] text-neutral-500">คงเหลือ: {tx.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>

            {successOrder ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-prompt">ชำระเงินสำเร็จ!</h3>
                <p className="text-xs text-neutral-300">
                  คุณได้รับเหรียญจำนวน{" "}
                  <strong className="text-[#FFE600] font-bold">
                    +{successOrder.coinsCredited} เหรียญ
                  </strong>{" "}
                  เข้ากระเป๋าเรียบร้อยแล้ว
                </p>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition"
                >
                  เรียบร้อย
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-white font-prompt mb-1">
                  ยืนยันการชำระเงิน
                </h3>
                <p className="text-xs text-neutral-400 mb-5">
                  {selectedPackage.name} • ยอดชำระ ฿{selectedPackage.priceThb}
                </p>

                {/* Payment Method Selector */}
                <div className="space-y-2 mb-5">
                  <label className="text-[11px] font-medium text-neutral-400 block">เลือกช่องทางชำระเงิน</label>

                  <div
                    onClick={() => setPaymentProvider("PROMPTPAY")}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "PROMPTPAY"
                        ? "bg-[#FFE600]/10 border-[#FFE600]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-4 h-4 text-[#FFE600]" />
                      <div>
                        <p className="text-xs font-bold text-white">พร้อมเพย์ (PromptPay QR)</p>
                        <p className="text-[10px] text-neutral-400">สแกนจ่ายผ่านแอปธนาคารทุกแห่ง</p>
                      </div>
                    </div>
                    {paymentProvider === "PROMPTPAY" && <CheckCircle2 className="w-4 h-4 text-[#FFE600]" />}
                  </div>

                  <div
                    onClick={() => setPaymentProvider("CREDIT_CARD")}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "CREDIT_CARD"
                        ? "bg-[#FFE600]/10 border-[#FFE600]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-neutral-300" />
                      <div>
                        <p className="text-xs font-bold text-white">บัตรเครดิต / เดบิต</p>
                        <p className="text-[10px] text-neutral-400">Visa / Mastercard</p>
                      </div>
                    </div>
                    {paymentProvider === "CREDIT_CARD" && <CheckCircle2 className="w-4 h-4 text-[#FFE600]" />}
                  </div>

                  <div
                    onClick={() => setPaymentProvider("TRUEMONEY")}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      paymentProvider === "TRUEMONEY"
                        ? "bg-[#FFE600]/10 border-[#FFE600]"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-neutral-300" />
                      <div>
                        <p className="text-xs font-bold text-white">TrueMoney Wallet</p>
                        <p className="text-[10px] text-neutral-400">กระเป๋าเงินทรูมันนี่</p>
                      </div>
                    </div>
                    {paymentProvider === "TRUEMONEY" && <CheckCircle2 className="w-4 h-4 text-[#FFE600]" />}
                  </div>
                </div>

                {/* PromptPay QR Mock Display */}
                {paymentProvider === "PROMPTPAY" && (
                  <div className="p-3.5 rounded-xl bg-white text-zinc-900 text-center my-3">
                    <p className="text-[10px] font-bold text-neutral-700 mb-1.5">PromptPay QR Code (Sandbox)</p>
                    <div className="w-28 h-28 bg-neutral-100 border border-neutral-300 rounded-lg mx-auto flex items-center justify-center p-1.5">
                      <QrCode className="w-24 h-24 text-black" />
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-1.5 font-medium">ยอดชำระ: ฿{selectedPackage.priceThb}.00</p>
                  </div>
                )}

                <button
                  onClick={handleBuy}
                  disabled={processing}
                  className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#F5DC00] text-black font-bold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
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
