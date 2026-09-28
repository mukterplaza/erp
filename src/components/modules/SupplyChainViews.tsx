"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  HardHat,
  AlertTriangle,
  Printer,
} from "lucide-react";
import { exportToCSV, exportToPDFPrint } from "@/lib/export-utils";

 

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
  const [unit, setUnit] = useState("Bag");
  const [warehouse, setWarehouse] = useState("Central Warehouse");
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            মালামাল ও ইনভেন্টরি নিয়ন্ত্রণ
          </h1>
          <p className="text-xs text-slate-500">
            Formula: বর্তমান স্টক = Opening + Purchase + Transfer In + Return - Issue - Transfer Out - Consumption ± Adjustment • Negative Stock Blocked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 font-medium">Total Valuation: </span>
            <strong className="text-emerald-900 text-sm">
              ৳{totalInventoryValuation.toLocaleString()}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => exportToCSV("INSAF_Inventory", data.materials || [])}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
          >
            CSV এক্সপোর্ট
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Forms: Add Material + Record Stock Movement */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleStockMovement}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> স্টক লেনদেন রেকর্ড
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Material
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {(data.materials || []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.materialCode} — {m.name} (Stock: {m.currentStock} {m.unit})
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option>Consumption</option>
                  <option>Issue</option>
                  <option>Purchase</option>
                  <option>Transfer In</option>
                  <option>Transfer Out</option>
                  <option>Return</option>
                  <option>Adjustment</option>
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রজেক্ট লিংক
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  সাইট লিংক
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  {(data.sites || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.siteCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={recordAsProjectExpense}
                onChange={(e) => setRecordAsProjectExpense(e.target.checked)}
              />
              Auto-post to Project Material Cost if Issue/Consumption
            </label>
            <input
              type="text"
              placeholder="Challan / Reference Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
            >
              স্টক মুভমেন্ট কার্যকর
            </button>
          </form>

          <form
            onSubmit={handleCreateMaterial}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-800" /> নতুন মালামাল নিবন্ধন
            </h2>
            <input
              type="text"
              required
              placeholder="Material Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option>Cement</option>
                <option>Steel/Rod</option>
                <option>Brick/Sand</option>
                <option>Electrical</option>
                <option>Plumbing</option>
              </select>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (Bag/Ton)"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="text"
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                placeholder="Warehouse"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                placeholder="Opening"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="Unit Cost"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="Reorder"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              মালামাল যোগ করুন
            </button>
          </form>
        </div>

        {/* Right: Formula Breakdown Table + Stock Ledger */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Live Stock Balance & Formula Breakdown ({(data.materials || []).length} items)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5">কোড ও নাম</th>
                    <th className="p-2.5">ওপেনিং</th>
                    <th className="p-2.5">+Pur</th>
                    <th className="p-2.5">+TrfIn</th>
                    <th className="p-2.5">-Iss</th>
                    <th className="p-2.5">-TrfOut</th>
                    <th className="p-2.5">-Con</th>
                    <th className="p-2.5">বর্তমান স্টক</th>
                    <th className="p-2.5">মূল্যায়ন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.materials || []).map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">
                          {m.materialCode} — {m.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.warehouse} • Rate: ৳{Number(m.unitCost).toLocaleString()}/{m.unit}
                        </div>
                      </td>
                      <td className="p-2.5 font-mono">{Number(m.openingStock)}</td>
                      <td className="p-2.5 font-mono text-emerald-600">
                        +{Number(m.purchaseReceived)}
                      </td>
                      <td className="p-2.5 font-mono text-emerald-600">
                        +{Number(m.transferIn)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600">
                        -{Number(m.issueQty)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600">
                        -{Number(m.transferOut)}
                      </td>
                      <td className="p-2.5 font-mono text-rose-600">
                        -{Number(m.consumptionQty)}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            m.isLowStock
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {Number(m.currentStock)} {m.unit}
                        </span>
                        {m.isLowStock && (
                          <span className="ml-1 text-[10px] text-rose-600 font-bold">
                            LOW!
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

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                স্টক মুভমেন্ট লেজার ({(data.stockMovements || []).length})
              </h3>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-2.5">তারিখ</th>
                    <th className="p-2.5">মালামাল আইডি</th>
                    <th className="p-2.5">ধরন</th>
                    <th className="p-2.5">পরিমাণ</th>
                    <th className="p-2.5">মূল্য (৳)</th>
                    <th className="p-2.5">রেফ / নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.stockMovements || []).map((sm: any) => (
                    <tr key={sm.id}>
                      <td className="p-2.5">{sm.date}</td>
                      <td className="p-2.5 font-mono">MAT #{sm.materialId}</td>
                      <td className="p-2.5 font-bold">{sm.movementType}</td>
                      <td className="p-2.5 font-mono font-bold">{sm.quantity}</td>
                      <td className="p-2.5">৳{Number(sm.totalValue).toLocaleString()}</td>
                      <td className="p-2.5 text-slate-500">
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
// PROCUREMENT & SUPPLIERS VIEW (/purchase-orders and /suppliers)
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
          materialName: mat?.name || "Construction Material",
          orderedQty: Number(orderedQty),
          unit: mat?.unit || "Bag",
          rate: Number(rate),
        },
      ],
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Procurement (PR → PO → GRN Receive) & Supplier Payable Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Receiving a PO automatically updates Material Inventory, generates Supplier Bill, updates Supplier Payable & posts Double-Entry Journal
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            exportToPDFPrint(
              "Suppliers & Purchase Orders",
              "Procurement Ledger",
              data.suppliers || []
            )
          }
          className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1"
        >
          <Printer className="w-3.5 h-3.5" /> Print Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleCreatePO}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> ক্রয় অর্ডার ইস্যু
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                অর্ডারের মালামাল
              </label>
              <select
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  অর্ডার পরিমাণ
                </label>
                <input
                  type="number"
                  value={orderedQty}
                  onChange={(e) => setOrderedQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
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
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
            >
              অনুমোদিত PO তৈরি
            </button>
          </form>

          <form
            onSubmit={handleCreateSupplier}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-800" /> নতুন সাপ্লায়ার
            </h2>
            <input
              type="text"
              required
              placeholder="Supplier Company Name *"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Phone Number *"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              placeholder="Materials Supplied (e.g. Cement, Steel)"
              value={productsProvided}
              onChange={(e) => setProductsProvided(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              সাপ্লায়ার নিবন্ধন
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* Suppliers Payable Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Suppliers & Real Payable Calculation (Bill - Paid = বকেয়া পরিশোধযোগ্য)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="p-3">কোড</th>
                    <th className="p-3">সাপ্লায়ারের নাম</th>
                    <th className="p-3">পণ্য</th>
                    <th className="p-3">মোট বিল</th>
                    <th className="p-3">মোট পরিশোধ</th>
                    <th className="p-3">বকেয়া পরিশোধযোগ্য</th>
                    <th className="p-3">দ্রুত পরিশোধ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.suppliers || []).map((s: any) => (
                    <tr key={s.id}>
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
                                `Enter payment amount for ${s.name} (Due: ৳${s.outstandingPayable}):`,
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
                            className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
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

          {/* Purchase Orders & GRN Receive */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Purchase Orders (PO-0001) & GRN Stock Receive
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {(data.purchaseOrders || []).map((po: any) => (
                <div
                  key={po.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                      {po.poCode}
                    </span>
                    <span className="ml-2 font-bold text-slate-800">
                      Total: ৳{Number(po.totalAmount).toLocaleString()} (Received: ৳
                      {Number(po.receivedAmount).toLocaleString()})
                    </span>
                    <div className="text-slate-500 mt-1">
                      {(po.items || []).map((it: any, idx: number) => (
                        <span key={idx} className="mr-3">
                          • {it.materialName}: Ordered {it.orderedQty} {it.unit} (Rec:{" "}
                          {it.receivedQty}) @ ৳{it.rate}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        po.status === "Received"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {po.status}
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
                          className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold"
                        >
                          আংশিক GRN (৫০%)
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
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          Full GRN Receive → Stock & AP
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
// LABOUR & CONTRACTOR VIEW (/labour)
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
  const [specialty, setSpecialty] = useState("RCC & Shuttering Work");
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
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">
          Site Labour Muster Roll & Sub-Contractor Bill Management
        </h1>
        <p className="text-xs text-slate-500">
          Real Calculation: Contractor অনুমোদিত বিল - পরিশোধিত = বকেয়া
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleAddContractor}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-emerald-600" /> ঠিকাদার ও অনুমোদিত বিল
            </h2>
            <input
              type="text"
              required
              placeholder="Contractor Name *"
              value={conName}
              onChange={(e) => setConName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="text"
              required
              placeholder="Specialty (e.g. Piling, Tiles)"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="number"
              required
              placeholder="অনুমোদিত বিল Amount (৳)"
              value={approvedBillAmount}
              onChange={(e) => setApprovedBillAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs"
            >
              ঠিকাদার নিবন্ধন
            </button>
          </form>

          <form
            onSubmit={handleAddLabour}
            className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3"
          >
            <h2 className="text-sm font-bold text-slate-900">সাইট শ্রমিক যোগ</h2>
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
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="Daily Rate"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <input
                type="number"
                value={workDays}
                onChange={(e) => setWorkDays(e.target.value)}
                placeholder="Work Days"
                className="px-2 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <input
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs"
            >
              শ্রমিক রেকর্ড যোগ
            </button>
          </form>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Sub-Contractors (অনুমোদিত বিল vs Paid vs বকেয়া)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">ঠিকাদার</th>
                  <th className="p-3">অনুমোদিত বিল</th>
                  <th className="p-3">পরিশোধিত</th>
                  <th className="p-3">বকেয়া</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.contractors || []).map((c: any) => (
                  <tr key={c.id}>
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
                              `ঠিকাদারকে পরিশোধ ${c.name} (Due: ৳${c.outstandingDue}):`,
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
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          ঠিকাদারকে পরিশোধ
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Site Labour Roll (Rate × Work Days = Earned - Paid = Due)
              </h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="p-3">কোড</th>
                  <th className="p-3">শ্রমিকের নাম</th>
                  <th className="p-3">হার × দিন</th>
                  <th className="p-3">মোট প্রাপ্য</th>
                  <th className="p-3">পরিশোধ</th>
                  <th className="p-3">বকেয়া</th>
                  <th className="p-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.labours || []).map((l: any) => (
                  <tr key={l.id}>
                    <td className="p-3 font-mono font-bold">{l.labourCode}</td>
                    <td className="p-3 font-bold">
                      {l.name} ({l.category})
                    </td>
                    <td className="p-3">
                      ৳{Number(l.dailyRate)} × {Number(l.totalWorkDays)}d
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
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
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
void AlertTriangle;
