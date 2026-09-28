"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  HardHat,
  Printer,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

 

// ============================================================================
// কাঁচামাল ও ইনভেন্টরি স্টক নিয়ন্ত্রণ (/materials and /inventory - 100% BANGLA)
// ============================================================================
export function MaterialsAndInventoryView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  // New Material form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cement");
  const [unit, setUnit] = useState("ব্যাগ");
  const [warehouse, setWarehouse] = useState("সেন্ট্রাল ওয়্যারহাউস");
  const [openingStock, setOpeningStock] = useState("50");
  const [unitCost, setUnitCost] = useState("550");
  const [reorderLevel, setReorderLevel] = useState("25");

  // Stock Movement form
  const [materialId, setMaterialId] = useState(
    String(data.materials?.[0]?.id || 1)
  );
  const [movementType, setMovementType] = useState("Consumption");
  const [quantity, setQuantity] = useState("5");
  const [projectId, setProjectId] = useState(
    String(data.projects?.[0]?.id || 1)
  );
  const [siteId, setSiteId] = useState(String(data.sites?.[0]?.id || 1));
  const [notes, setNotes] = useState("");
  const [recordAsProjectExpense, setRecordAsProjectExpense] = useState(true);

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createMaterial",
      name,
      category,
      unit,
      warehouse,
      openingStock: Number(openingStock),
      unitCost: Number(unitCost),
      reorderLevel: Number(reorderLevel),
    });
    setName("");
  }

  async function handleStockMovement(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "recordStockMovement",
      materialId: Number(materialId),
      movementType,
      quantity: Number(quantity),
      projectId: projectId ? Number(projectId) : null,
      siteId: siteId ? Number(siteId) : null,
      notes,
      recordAsProjectExpense,
    });
    setNotes("");
  }

  const totalInventoryValuation = (data.materials || []).reduce(
    (s: number, m: any) => s + Number(m.stockValuation || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            কাঁচামাল ও ইনভেন্টরি স্টক নিয়ন্ত্রণ ইঞ্জিন (MAT-0001)
          </h1>
          <p className="text-xs text-slate-500">
            সূত্র: বর্তমান মজুদ = প্রারম্ভিক + ক্রয় + স্থানান্তর (আগত) + ফেরত - ইস্যু - স্থানান্তর (বহির্গমন) - ব্যবহার ± সমন্বয়
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 font-medium">স্টকের মোট মূল্যমান: </span>
            <strong className="text-emerald-900 text-sm">
              ৳{totalInventoryValuation.toLocaleString()}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Inventory", data.materials || [])}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ফর্মসমূহ: স্টক লেনদেন ও নতুন মালামাল সংযোজন */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleStockMovement}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> স্টক আদান-প্রদান লেনদেন দাখিল
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                মালামাল নির্বাচন
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.materials || []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.materialCode} — {m.name} (মজুদ: {m.currentStock} {m.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  লেনদেনের ধরন
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="Consumption">ব্যবহার / ভোগ (Consumption)</option>
                  <option value="Issue">সাইটে ইস্যু (Issue)</option>
                  <option value="Purchase">ক্রয় / প্রাপ্তি (Purchase)</option>
                  <option value="Transfer In">স্থানান্তর আগত (Transfer In)</option>
                  <option value="Transfer Out">স্থানান্তর বহির্গমন (Transfer Out)</option>
                  <option value="Return">ফেরত (Return)</option>
                  <option value="Adjustment">সমন্বয় (Adjustment)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  পরিমাণ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সংশ্লিষ্ট প্রজেক্ট
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  {(data.projects || []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.projectCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  সংশ্লিষ্ট সাইট
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  {(data.sites || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.siteCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={recordAsProjectExpense}
                onChange={(e) => setRecordAsProjectExpense(e.target.checked)}
              />
              সাইটে ব্যবহার বা ইস্যুর ক্ষেত্রে স্বয়ংক্রিয় প্রজেক্ট ব্যয়ে যুক্ত করুন
            </label>
            <input
              type="text"
              placeholder="চালান নম্বর / রেফারেন্স নোট"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              স্টক মুভমেন্ট নিশ্চিত করুন
            </button>
          </form>

          <form
            onSubmit={handleCreateMaterial}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-800" /> নতুন মালামাল আইটেম নিবন্ধন
            </h2>
            <input
              type="text"
              required
              placeholder="মালামালের নাম *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                <option value="Cement">সিমেন্ট</option>
                <option value="Steel/Rod">রড/স্টিল</option>
                <option value="Brick/Sand">ইট/বালু</option>
                <option value="Electrical">বৈদ্যুতিক</option>
                <option value="Plumbing">প্লাম্বিং</option>
              </select>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="একক (ব্যাগ/টন)"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder="গুদাম"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                placeholder="প্রারম্ভিক"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="একক দর"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="রিঅর্ডার লেভেল"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              নতুন মালামাল আইটেম সংরক্ষণ
            </button>
          </form>
        </div>

        {/* ডান পাশ: স্টক রেজিস্টার ও মুভমেন্ট লেজার */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                লাইভ স্টক ব্যালেন্স ও সূত্র বিশ্লেষণ (মোট {(data.materials || []).length} টি আইটেম)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5 font-semibold">কোড ও পণ্যের নাম</th>
                    <th className="p-2.5 font-semibold">প্রারম্ভিক</th>
                    <th className="p-2.5 font-semibold">+ক্রয়</th>
                    <th className="p-2.5 font-semibold">+স্থানান্তর আগত</th>
                    <th className="p-2.5 font-semibold">-ইস্যু</th>
                    <th className="p-2.5 font-semibold">-স্থানান্তর বহির্গমন</th>
                    <th className="p-2.5 font-semibold">-ব্যবহার</th>
                    <th className="p-2.5 font-semibold">বর্তমান মজুদ</th>
                    <th className="p-2.5 font-semibold">মোট মূল্যমান</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.materials || []).map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">
                          {m.materialCode} — {m.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.warehouse} • দর: ৳{Number(m.unitCost).toLocaleString()}/{m.unit}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono">{Number(m.openingStock)}</td>
                      <td className="p-2.5 font-mono text-emerald-600 font-bold">
                        +{Number(m.purchaseReceived)}
                      </td>
                      <td className="p-2.5 font-mono text-emerald-600 font-bold">
                        +{Number(m.transferIn)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600 font-bold">
                        -{Number(m.issueQty)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600 font-bold">
                        -{Number(m.transferOut)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600 font-bold">
                        -{Number(m.consumptionQty)}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold ${
                            m.isLowStock
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {Number(m.currentStock)} {m.unit}
                        </span>
                        {m.isLowStock && (
                          <span className="ml-1 text-[10px] text-rose-600 font-bold">
                            মজুদ কম!
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        ৳{Number(m.stockValuation).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                স্টক মুভমেন্ট লেনদেন লেজার (মোট {(data.stockMovements || []).length} টি এন্ট্রি)
              </h3>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5 font-semibold">তারিখ</th>
                    <th className="p-2.5 font-semibold">মালামাল কোড</th>
                    <th className="p-2.5 font-semibold">লেনদেনের ধরন</th>
                    <th className="p-2.5 font-semibold">পরিমাণ</th>
                    <th className="p-2.5 font-semibold">মূল্যমান (৳)</th>
                    <th className="p-2.5 font-semibold">চালান / মন্তব্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.stockMovements || []).map((sm: any) => (
                    <tr key={sm.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5">{sm.date}</td>
                      <td className="p-2.5 font-mono font-bold">MAT #{sm.materialId}</td>
                      <td className="p-2.5 font-bold">{sm.movementType}</td>
                      <td className="p-2.5 font-mono font-bold">{sm.quantity}</td>
                      <td className="p-2.5">৳{Number(sm.totalValue).toLocaleString()}</td>
                      <td className="p-2.5 text-slate-600">
                        {sm.referenceCode} — {sm.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// প্রকিউরমেন্ট ও সরবরাহকারী ব্যবস্থাপনা (/purchase-orders and /suppliers)
// ============================================================================
export function ProcurementAndSuppliersView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [productsProvided, setProductsProvided] = useState("");

  // PO Creation state
  const [supplierId, setSupplierId] = useState(
    String(data.suppliers?.[0]?.id || 1)
  );
  const [projectId, setProjectId] = useState(
    String(data.projects?.[0]?.id || 1)
  );
  const [siteId, setSiteId] = useState(String(data.sites?.[0]?.id || 1));
  const [materialId, setMaterialId] = useState(
    String(data.materials?.[0]?.id || 1)
  );
  const [orderedQty, setOrderedQty] = useState("20");
  const [rate, setRate] = useState("550");

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createSupplier",
      name: supplierName,
      phone: supplierPhone,
      productsProvided,
    });
    setSupplierName("");
    setSupplierPhone("");
    setProductsProvided("");
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    const mat = (data.materials || []).find(
      (m: any) => m.id === Number(materialId)
    );
    await onMutate({
      action: "createPurchaseOrder",
      supplierId: Number(supplierId),
      projectId: Number(projectId),
      siteId: Number(siteId),
      items: [
        {
          materialId: Number(materialId),
          materialName: mat?.name || "নির্মাণ কাঁচামাল",
          orderedQty: Number(orderedQty),
          unit: mat?.unit || "ব্যাগ",
          rate: Number(rate),
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            প্রকিউরমেন্ট ও সরবরাহকারী দেনা খতিয়ান (PO &amp; Supplier AP)
          </h1>
          <p className="text-xs text-slate-500">
            পারচেজ অর্ডার রিসিভ (GRN) করার সাথে সাথে মালামাল স্টকে যুক্ত হয় এবং ডাবল-এন্ট্রি হিসাব স্বয়ংক্রিয়ভাবে আপডেট হয়
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToPDFPrint(
              "সরবরাহকারী খতিয়ান ও পারচেজ অর্ডার",
              "প্রকিউরমেন্ট হিসাব লেজার",
              data.suppliers || []
            )
          }
          className="px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Printer className="w-3.5 h-3.5" /> খতিয়ান PDF প্রিন্ট
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreatePO}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> নতুন পারচেজ অর্ডার ইস্যু করুন (PO-0001)
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                সরবরাহকারী নির্বাচন
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.suppliers || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierCode} — {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                মালামাল আইটেম
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.materials || []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.materialCode} — {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  অর্ডারের পরিমাণ
                </label>
                <input
                  type="number"
                  value={orderedQty}
                  onChange={(e) => setOrderedQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  একক দর (৳)
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.projects || []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode}
                  </option>
                ))}
              </select>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              >
                {(data.sites || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.siteCode}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              অনুমোদিত পারচেজ অর্ডার তৈরি করুন
            </button>
          </form>

          <form
            onSubmit={handleCreateSupplier}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-800" /> নতুন সরবরাহকারী প্রতিষ্ঠান যোগ করুন
            </h2>
            <input
              type="text"
              required
              placeholder="সরবরাহকারী প্রতিষ্ঠানের নাম *"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="ফোন নম্বর *"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
            />
            <input
              type="text"
              placeholder="সরবরাহকৃত মালামাল (যেমন: সিমেন্ট, রড)"
              value={productsProvided}
              onChange={(e) => setProductsProvided(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              সরবরাহকারী নিবন্ধন করুন
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* সরবরাহকারী দেনা হিসাব টেবিল */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                সরবরাহকারী দেনা হিসাব (মোট বিল - পরিশোধ = বকেয়া দেনা)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3 font-semibold">কোড</th>
                    <th className="p-3 font-semibold">সরবরাহকারীর নাম</th>
                    <th className="p-3 font-semibold">পণ্যসমূহ</th>
                    <th className="p-3 font-semibold">মোট বিলকৃত</th>
                    <th className="p-3 font-semibold">মোট পরিশোধিত</th>
                    <th className="p-3 font-semibold">বকেয়া দেনা (AP)</th>
                    <th className="p-3 font-semibold">পেমেন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.suppliers || []).map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold">{s.supplierCode}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {s.name}
                        <div className="text-[11px] font-normal text-slate-500">
                          {s.phone}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{s.productsProvided}</td>
                      <td className="p-3 font-semibold">
                        ৳{Number(s.totalBilled).toLocaleString()}
                      </td>
                      <td className="p-3 text-emerald-600 font-semibold">
                        ৳{Number(s.totalPaid).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-rose-600 text-sm">
                        ৳{Number(s.outstandingPayable).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {Number(s.outstandingPayable) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const amt = prompt(
                                `${s.name}-কে পেমেন্ট প্রদান করুন (বকেয়া: ৳${s.outstandingPayable}):`,
                                "50000"
                              );
                              if (!amt) return;
                              onMutate({
                                action: "recordPayment",
                                paymentType: "Supplier Payment",
                                supplierId: s.id,
                                amount: Number(amt),
                                method: "Bank",
                              });
                            }}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs text-[11px]"
                          >
                            বিল পরিশোধ
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* পারচেজ অর্ডার ও জিআরএন স্টক রিসিভ */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                পারচেজ অর্ডার তালিকা (PO-0001) ও গুদাম রিসিভ (GRN)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.purchaseOrders || []).map((po: any) => (
                <div
                  key={po.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-slate-50 transition"
                >
                  <div>
                    <span className="font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-900">
                      {po.poCode}
                    </span>
                    <span className="ml-2 font-bold text-slate-800">
                      মোট বিল: ৳{Number(po.totalAmount).toLocaleString()} (রিসিভ: ৳
                      {Number(po.receivedAmount).toLocaleString()})
                    </span>
                    <div className="text-slate-500 mt-1">
                      {(po.items || []).map((it: any, idx: number) => (
                        <span key={idx} className="mr-3">
                          • {it.materialName}: অর্ডার {it.orderedQty} {it.unit} (রিসিভ:{" "}
                          {it.receivedQty}) @ ৳{it.rate}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        po.status === "Received"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {po.status === "Received" ? "সম্পূর্ণ রিসিভ" : "অনুমোদিত"}
                    </span>
                    {po.status !== "Received" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "receivePurchaseOrder",
                              poId: po.id,
                              receiveRatio: 0.5,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition text-[11px]"
                        >
                          আংশিক রিসিভ (৫০%)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "receivePurchaseOrder",
                              poId: po.id,
                              receiveRatio: 1,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition text-[11px]"
                        >
                          সম্পূর্ণ রিসিভ → স্টক ও দেনা
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// সাইট শ্রমিক ও সাব-ঠিকাদার বিল ব্যবস্থাপনা (/labour - 100% BANGLA)
// ============================================================================
export function LabourAndContractorsView({
  data,
  onMutate,
}: {
  data: any;
  onMutate: (payload: Record<string, unknown>) => Promise<any>;
}) {
  const [labourName, setLabourName] = useState("");
  const [category, setCategory] = useState("Mason");
  const [dailyRate, setDailyRate] = useState("1000");
  const [workDays, setWorkDays] = useState("15");
  const [phone, setPhone] = useState("");

  const [conName, setConName] = useState("");
  const [specialty, setSpecialty] = useState("আরসিসি ও শাটারিং কাজ");
  const [approvedBillAmount, setApprovedBillAmount] = useState("400000");

  async function handleAddLabour(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createLabour",
      name: labourName,
      category,
      dailyRate: Number(dailyRate),
      workDays: Number(workDays),
      phone,
      projectId: data.projects?.[0]?.id || 1,
      assignedSiteId: data.sites?.[0]?.id || 1,
    });
    setLabourName("");
    setPhone("");
  }

  async function handleAddContractor(e: React.FormEvent) {
    e.preventDefault();
    await onMutate({
      action: "createContractor",
      name: conName,
      specialty,
      approvedBillAmount: Number(approvedBillAmount),
      contractAmount: Number(approvedBillAmount),
      projectId: data.projects?.[0]?.id || 1,
      siteId: data.sites?.[0]?.id || 1,
    });
    setConName("");
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">
          সাইট শ্রমিক মাস্টার রোল ও সাব-ঠিকাদার বিল ব্যবস্থাপনা
        </h1>
        <p className="text-xs text-slate-500">
          প্রকৃত হিসাব: ঠিকাদারের অনুমোদিত বিল - পরিশোধিত অর্থ = বকেয়া দেনা
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleAddContractor}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-emerald-600" /> সাব-ঠিকাদার ও অনুমোদিত বিল যোগ করুন
            </h2>
            <input
              type="text"
              required
              placeholder="ঠিকাদারের নাম লিখুন *"
              value={conName}
              onChange={(e) => setConName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="কাজের ধরন (যেমন: পাইলিং, টাইলস, স্যানিটারি)"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="number"
              required
              placeholder="অনুমোদিত বিলের পরিমাণ (৳)"
              value={approvedBillAmount}
              onChange={(e) => setApprovedBillAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
            >
              ঠিকাদার বিল সংরক্ষণ
            </button>
          </form>

          <form
            onSubmit={handleAddLabour}
            className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3.5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900">সাইট শ্রমিক যোগ করুন</h2>
            <input
              type="text"
              required
              placeholder="শ্রমিকের নাম *"
              value={labourName}
              onChange={(e) => setLabourName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ক্যাটাগরি"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="দৈনিক মজুরি"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
              <input
                type="number"
                value={workDays}
                onChange={(e) => setWorkDays(e.target.value)}
                placeholder="কাজের দিন"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="ফোন নম্বর"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
            >
              শ্রমিক রেকর্ড সংরক্ষণ করুন
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                সাব-ঠিকাদার বিল খতিয়ান (অনুমোদিত বিল বনাম পরিশোধিত বনাম বকেয়া)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">কোড</th>
                  <th className="p-3 font-semibold">ঠিকাদার</th>
                  <th className="p-3 font-semibold">অনুমোদিত বিল</th>
                  <th className="p-3 font-semibold">পরিশোধিত অর্থ</th>
                  <th className="p-3 font-semibold">বকেয়া দেনা</th>
                  <th className="p-3 font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.contractors || []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold">{c.contractorCode}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500">{c.specialty}</div>
                    </td>
                    <td className="p-3 font-semibold">
                      ৳{Number(c.approvedBillAmount).toLocaleString()}
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      ৳{Number(c.paidAmount).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-rose-600 text-sm">
                      ৳{Number(c.outstandingDue).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {Number(c.outstandingDue) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const amt = prompt(
                              `${c.name}-কে পরিশোধ করুন (বকেয়া: ৳${c.outstandingDue}):`,
                              "50000"
                            );
                            if (!amt) return;
                            onMutate({
                              action: "recordPayment",
                              paymentType: "Contractor Payment",
                              contractorId: c.id,
                              amount: Number(amt),
                              method: "Bank",
                            });
                          }}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs text-[11px]"
                        >
                          বিল পরিশোধ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                সাইট শ্রমিক মাস্টার রোল (দৈনিক রেট × কাজের দিন = অর্জিত - পরিশোধ = বকেয়া)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3 font-semibold">কোড</th>
                  <th className="p-3 font-semibold">শ্রমিকের নাম</th>
                  <th className="p-3 font-semibold">রেট × দিন</th>
                  <th className="p-3 font-semibold">মোট অর্জিত</th>
                  <th className="p-3 font-semibold">পরিশোধিত</th>
                  <th className="p-3 font-semibold">বকেয়া</th>
                  <th className="p-3 font-semibold">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.labours || []).map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold">{l.labourCode}</td>
                    <td className="p-3 font-bold">
                      {l.name} ({l.category})
                    </td>
                    <td className="p-3">
                      ৳{Number(l.dailyRate)} × {Number(l.totalWorkDays)} দিন
                    </td>
                    <td className="p-3 font-semibold">
                      ৳{Number(l.totalEarned).toLocaleString()}
                    </td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      ৳{Number(l.totalPaid).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      ৳{Number(l.dueAmount).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {Number(l.dueAmount) > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            onMutate({
                              action: "recordPayment",
                              paymentType: "Labour Payment",
                              labourId: l.id,
                              amount: Number(l.dueAmount),
                              method: "Cash",
                            })
                          }
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs text-[11px]"
                        >
                          নগদ পরিশোধ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

void Package;
