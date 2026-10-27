'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Product, Category, Uom, Tax, ProductType } from '@/types/catalog';
import { catalogService } from '@/services/catalog.service';
import { bahtToSatang, satangToBahtNumber } from '@/utils/currency';
import { ImageUploader } from '@/components/catalog/ImageUploader';
import { Icons } from '@/components/ui/Icons';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { BarcodeCaptureModal } from '@/components/shared/BarcodeCaptureModal';

export interface ProductFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Category[];
  uoms: Uom[];
  taxes: Tax[];
  onSuccess: (savedProduct: Product, isNew: boolean) => void;
}

export function ProductFormDrawer({
  isOpen,
  onClose,
  product,
  categories,
  uoms,
  taxes,
  onSuccess,
}: ProductFormDrawerProps) {
  const isEditing = !!product;

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isInternalBarcode, setIsInternalBarcode] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [baseUomId, setBaseUomId] = useState('');
  const [productType, setProductType] = useState<ProductType>('PRICE_PER_UNIT');
  const [priceBaht, setPriceBaht] = useState<string>('0.00');
  const [costBaht, setCostBaht] = useState<string>('0.00');
  const [taxId, setTaxId] = useState('');
  const [minStock, setMinStock] = useState('0');
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Keypad State for Elderly & Touchscreen POS
  const [keypadField, setKeypadField] = useState<'price' | 'cost' | 'minStock' | null>(null);

  // Loading & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const lastSubmitTimeRef = useRef<number>(0);

  // SKU Duplicate Check State
  const [skuCheckStatus, setSkuCheckStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate'>('idle');
  const [duplicateSkuProduct, setDuplicateSkuProduct] = useState<{ id: string; name: string; sku: string } | null>(null);

  // Reset or Populate form on open/change
  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setIsInternalBarcode(!!product.isInternalBarcode);
      setCategoryId(product.categoryId || '');
      setBaseUomId(product.baseUomId || (uoms[0]?.id ?? ''));
      setProductType(product.productType || 'PRICE_PER_UNIT');
      setPriceBaht(satangToBahtNumber(product.price).toFixed(2));
      setCostBaht(product.costPerBaseUnit ? satangToBahtNumber(product.costPerBaseUnit).toFixed(2) : '0.00');
      setTaxId(product.taxId || '');
      setMinStock(String(product.minStock ?? 0));
      setTrackExpiry(!!product.trackExpiry);
      setIsActive(product.isActive !== undefined ? product.isActive : true);
      setDescription(product.description || '');
      setImageUrl(product.imageUrl || '');
      setImagePreview(product.imageUrl || '');
    } else {
      // Default Values for New Product
      setName('');
      setSku('');
      setBarcode('');
      setIsInternalBarcode(false);
      setCategoryId(categories[0]?.id || '');
      setBaseUomId(uoms[0]?.id || '');
      setProductType('PRICE_PER_UNIT');
      setPriceBaht('0.00');
      setCostBaht('0.00');
      setTaxId(taxes[0]?.id || '');
      setMinStock('0');
      setTrackExpiry(false);
      setIsActive(true);
      setDescription('');
      setImageUrl('');
      setImagePreview('');
    }
    setImageFile(null);
    setFormErrors({});
    setSkuCheckStatus('idle');
    setDuplicateSkuProduct(null);
    setIsBarcodeScanOpen(false);
  }, [isOpen, product, categories, uoms, taxes]);

  // ตรวจสอบความซ้ำซ้อนของรหัส SKU แบบ Real-time ผ่าน /api/v1/products/sku?sku={sku}
  useEffect(() => {
    if (!isOpen) return;

    const trimmedSku = sku.trim();

    // 1. ถ้าเว้นว่าง ให้กลับสถานะเป็น idle
    if (!trimmedSku) {
      setSkuCheckStatus('idle');
      setDuplicateSkuProduct(null);
      return;
    }

    // 2. กรณีแก้ไขสินค้าเดิม และ SKU ตรงกับเดิม ถือว่าใช้ได้ ไม่ต้องเตือนซ้ำ
    if (isEditing && product?.sku && trimmedSku.toUpperCase() === product.sku.trim().toUpperCase()) {
      setSkuCheckStatus('available');
      setDuplicateSkuProduct(null);
      return;
    }

    setSkuCheckStatus('checking');
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await catalogService.searchProductsBySku(trimmedSku, {
          signal: controller.signal,
        });

        if (res && Array.isArray(res.data)) {
          // ค้นหาตัวที่ Exact Match (Case-insensitive) และไม่ใช่ตัวมันเอง
          const matched = res.data.find(
            (p) =>
              p.sku &&
              p.sku.trim().toUpperCase() === trimmedSku.toUpperCase() &&
              (!isEditing || p.id !== product?.id)
          );

          if (matched) {
            setSkuCheckStatus('duplicate');
            setDuplicateSkuProduct({
              id: matched.id,
              name: matched.name,
              sku: matched.sku,
            });
          } else {
            setSkuCheckStatus('available');
            setDuplicateSkuProduct(null);
          }
        } else {
          setSkuCheckStatus('available');
          setDuplicateSkuProduct(null);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        setSkuCheckStatus('idle');
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [sku, isOpen, isEditing, product?.id, product?.sku]);

  // Handle Internal Barcode generation
  const handleGenerateBarcode = async () => {
    if (isEditing && product?.id) {
      try {
        setIsGeneratingBarcode(true);
        const res = await catalogService.generateInternalBarcode(product.id);
        if (res && res.data && res.data.barcode) {
          setBarcode(res.data.barcode);
          setIsInternalBarcode(true);
        }
      } catch {
        // Fallback local barcode
        const localBarcode = `INT${Date.now().toString().slice(-9)}`;
        setBarcode(localBarcode);
        setIsInternalBarcode(true);
      } finally {
        setIsGeneratingBarcode(false);
      }
    } else {
      // สำหรับสินค้าใหม่ สุ่มรหัสบาร์โค้ดภายในแบบชั่วคราว
      const localBarcode = `INT${Date.now().toString().slice(-9)}`;
      setBarcode(localBarcode);
      setIsInternalBarcode(true);
    }
  };

  // Handler จับบาร์โค้ดจากกล้อง (Single-Capture)
  const handleBarcodeCapture = (scannedCode: string) => {
    setBarcode(scannedCode);
    setIsInternalBarcode(false);
    setIsBarcodeScanOpen(false);
  };

  // Form Validation
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'กรุณาระบุชื่อสินค้า';
    if (!sku.trim()) {
      errors.sku = 'กรุณาระบุรหัส SKU';
    } else if (skuCheckStatus === 'duplicate') {
      errors.sku = `รหัส SKU นี้มีอยู่ในระบบแล้ว (สินค้า: ${duplicateSkuProduct?.name || ''})`;
    } else if (skuCheckStatus === 'checking') {
      errors.sku = 'กำลังตรวจสอบรหัส SKU กรุณารอสักครู่...';
    }
    if (!baseUomId) errors.baseUomId = 'กรุณาเลือกหน่วยนับหลัก';
    const priceNum = parseFloat(priceBaht);
    if (isNaN(priceNum) || priceNum < 0) errors.price = 'ราคาขายต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (isSubmitting || now - lastSubmitTimeRef.current < 800) {
      return;
    }
    lastSubmitTimeRef.current = now;

    if (!validate()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        isInternalBarcode,
        categoryId: categoryId || null,
        baseUomId,
        productType,
        price: bahtToSatang(priceBaht),
        costPerBaseUnit: bahtToSatang(costBaht),
        taxId: taxId || null,
        minStock: parseFloat(minStock) || 0,
        trackExpiry,
        isActive,
        description: description.trim() || undefined,
        imageUrl: imageUrl || undefined,
      };

      let savedProduct: Product;

      if (isEditing && product?.id) {
        const res = await catalogService.updateProduct(product.id, payload);
        savedProduct = { ...res.data };

        // ถ้ามีไฟล์รูปภาพที่เลือกไว้ให้อัปโหลดตามหลัง
        if (imageFile) {
          try {
            const uploadRes = await catalogService.uploadProductImage(product.id, imageFile);
            const uploadData = uploadRes.data as unknown as Record<string, unknown> | null;
            const newImageUrl = (uploadData?.imageUrl as string) || (uploadData?.image_url as string);
            savedProduct = {
              ...savedProduct,
              imageUrl: newImageUrl || savedProduct.imageUrl || imagePreview,
              imageTimestamp: Date.now(),
            };
          } catch {
            if (imagePreview) {
              savedProduct = {
                ...savedProduct,
                imageUrl: imagePreview,
                imageTimestamp: Date.now(),
              };
            }
          }
        } else if (!imageUrl) {
          savedProduct = {
            ...savedProduct,
            imageUrl: '',
            imageTimestamp: Date.now(),
          };
        }
        onSuccess(savedProduct, false);
      } else {
        const res = await catalogService.createProduct(payload);
        savedProduct = { ...res.data };

        // ถ้ามีไฟล์รูปภาพที่เลือกไว้ให้อัปโหลดเข้าสินค้าใหม่
        if (imageFile && savedProduct?.id) {
          try {
            const uploadRes = await catalogService.uploadProductImage(savedProduct.id, imageFile);
            const uploadData = uploadRes.data as unknown as Record<string, unknown> | null;
            const newImageUrl = (uploadData?.imageUrl as string) || (uploadData?.image_url as string);
            savedProduct = {
              ...savedProduct,
              imageUrl: newImageUrl || savedProduct.imageUrl || imagePreview,
              imageTimestamp: Date.now(),
            };
          } catch {
            // ไม่บล็อกการสร้างสินค้า
          }
        }
        onSuccess(savedProduct, true);
      }

      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
      description={isEditing ? `รหัสสินค้า: ${product?.sku}` : 'กรอกรายละเอียดเพื่อสร้างสินค้าเข้าสู่ระบบแคตตาล็อก'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* รูปภาพสินค้า */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            รูปภาพสินค้า
          </label>
          <ImageUploader
            key={`uploader-${product?.id || 'new'}`}
            currentImageUrl={imagePreview || imageUrl}
            onImageSelected={(file) => {
              setImageFile(file);
              if (file) {
                const objectUrl = URL.createObjectURL(file);
                setImagePreview(objectUrl);
              } else {
                setImagePreview('');
                setImageUrl('');
              }
            }}
          />
        </div>

        {/* ข้อมูลพื้นฐาน */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ชื่อสินค้า */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              ชื่อสินค้า <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้ำแข็งหลอดเล็ก 5kg"
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
            />
            {formErrors.name && (
              <span className="text-sm text-rose-400 block font-medium">{formErrors.name}</span>
            )}
          </div>

          {/* รหัส SKU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-base font-semibold text-slate-200">
                รหัส SKU <span className="text-rose-400">*</span>
              </label>
              {skuCheckStatus === 'checking' && (
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 animate-pulse">
                  <Icons.Refresh className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </span>
              )}
              {skuCheckStatus === 'available' && sku.trim() && (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <Icons.Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>รหัสนี้ใช้ได้</span>
                </span>
              )}
              {skuCheckStatus === 'duplicate' && (
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <Icons.AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>รหัสซ้ำในระบบ</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  if (formErrors.sku) {
                    setFormErrors((prev) => {
                      const next = { ...prev };
                      delete next.sku;
                      return next;
                    });
                  }
                }}
                placeholder="เช่น ICE-001"
                className={`w-full min-h-[48px] px-4 pr-11 py-2.5 bg-slate-950 border-2 rounded-xl text-base text-slate-100 font-mono outline-none uppercase transition-colors ${
                  skuCheckStatus === 'duplicate'
                    ? 'border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20'
                    : skuCheckStatus === 'available' && sku.trim()
                    ? 'border-emerald-500/80 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                    : 'border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
                }`}
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                {skuCheckStatus === 'checking' && (
                  <Icons.Refresh className="w-5 h-5 text-cyan-400 animate-spin" />
                )}
                {skuCheckStatus === 'available' && sku.trim() && (
                  <Icons.Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                )}
                {skuCheckStatus === 'duplicate' && (
                  <Icons.AlertCircle className="w-5 h-5 text-rose-400 stroke-[2.5]" />
                )}
              </div>
            </div>
            {skuCheckStatus === 'duplicate' && duplicateSkuProduct && (
              <span className="text-xs font-semibold text-rose-400 block bg-rose-950/40 border border-rose-800/60 rounded-lg px-2.5 py-1.5 mt-1">
                ⚠️ รหัส SKU นี้ถูกใช้งานแล้วโดยสินค้า: <strong className="text-rose-300 font-bold">{duplicateSkuProduct.name}</strong>
              </span>
            )}
            {formErrors.sku && skuCheckStatus !== 'duplicate' && (
              <span className="text-sm text-rose-400 block font-medium">{formErrors.sku}</span>
            )}
          </div>

          {/* บาร์โค้ด + ปุ่มสร้างบาร์โค้ดภายใน & สแกนบาร์โค้ด */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-base font-semibold text-slate-200">
                บาร์โค้ดสินค้า
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodeScanOpen(true)}
                  className="min-h-[44px] px-3 py-1.5 text-sm font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 active:scale-95 border border-cyan-500/50 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Icons.Camera className="w-4 h-4" />
                  <span>สแกนบาร์โค้ด</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  disabled={isGeneratingBarcode}
                  className="min-h-[44px] px-3 py-1.5 text-sm font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 active:scale-95 border border-cyan-500/50 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Icons.Sparkles className="w-4 h-4" />
                  <span>สร้างบาร์โค้ดอัตโนมัติ</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setIsInternalBarcode(false);
                }}
                placeholder="ระบุหรือสร้างอัตโนมัติ"
                className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 font-mono focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none"
              />
              {isInternalBarcode && (
                <span className="absolute inset-y-0 right-3 flex items-center text-xs text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded-md my-auto h-7 border border-cyan-500/40">
                  บาร์โค้ดร้าน
                </span>
              )}
            </div>
          </div>

          {/* หมวดหมู่สินค้า */}
          <div className="space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              หมวดหมู่สินค้า
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              <option value="">-- ไม่ระบุหมวดหมู่ --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* ชนิดสินค้า */}
          <div className="space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              ชนิดสินค้า
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              <option value="PRICE_PER_UNIT">ขายต่อหน่วย/ชิ้น (PRICE_PER_UNIT)</option>
              <option value="BY_WEIGHT">ขายตามน้ำหนัก (BY_WEIGHT)</option>
            </select>
          </div>

          {/* หน่วยนับหลัก */}
          <div className="space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              หน่วยนับหลัก <span className="text-rose-400">*</span>
            </label>
            <select
              value={baseUomId}
              onChange={(e) => setBaseUomId(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              {uoms.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.code})
                </option>
              ))}
            </select>
            {formErrors.baseUomId && (
              <span className="text-sm text-rose-400 block font-medium">{formErrors.baseUomId}</span>
            )}
          </div>

          {/* อัตราภาษี */}
          <div className="space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              อัตราภาษีมูลค่าเพิ่ม
            </label>
            <select
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              <option value="">-- ไม่ระบุภาษี --</option>
              {taxes.map((tax) => (
                <option key={tax.id} value={tax.id}>
                  {tax.name} ({tax.rate * 100}%)
                </option>
              ))}
            </select>
          </div>

          {/* ราคาขาย */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-base font-semibold text-slate-200">
                ราคาขาย (บาท) <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setKeypadField('price')}
                className="min-h-[48px] px-3.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 active:scale-95 border-2 border-cyan-500/50 rounded-xl text-cyan-300 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                aria-label="เปิดแป้นตัวเลขสำหรับราคาขาย"
              >
                <Icons.Calculator className="w-5 h-5" />
                <span>แป้นตัวเลข</span>
              </button>
            </div>
            <input
              type="number"
              step="0.25"
              min="0"
              value={priceBaht}
              onChange={(e) => setPriceBaht(e.target.value)}
              onClick={() => setKeypadField('price')}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-2xl text-cyan-400 font-extrabold focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none cursor-pointer"
            />
            {formErrors.price && (
              <span className="text-sm text-rose-400 block font-medium">{formErrors.price}</span>
            )}
          </div>

          {/* ต้นทุน */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-base font-semibold text-slate-200">
                ต้นทุนสินค้าต่อหน่วย (บาท)
              </label>
              <button
                type="button"
                onClick={() => setKeypadField('cost')}
                className="min-h-[48px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-slate-600 rounded-xl text-slate-200 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                aria-label="เปิดแป้นตัวเลขสำหรับต้นทุน"
              >
                <Icons.Calculator className="w-5 h-5" />
                <span>แป้นตัวเลข</span>
              </button>
            </div>
            <input
              type="number"
              step="0.25"
              min="0"
              value={costBaht}
              onChange={(e) => setCostBaht(e.target.value)}
              onClick={() => setKeypadField('cost')}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xl text-slate-100 font-bold focus:border-cyan-400 outline-none cursor-pointer"
            />
          </div>

          {/* สต็อกขั้นต่ำ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-base font-semibold text-slate-200">
                ระดับแจ้งเตือนสต็อกขั้นต่ำ
              </label>
              <button
                type="button"
                onClick={() => setKeypadField('minStock')}
                className="min-h-[48px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-slate-600 rounded-xl text-slate-200 text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                aria-label="เปิดแป้นตัวเลขสำหรับสต็อกขั้นต่ำ"
              >
                <Icons.Calculator className="w-5 h-5" />
                <span>แป้นตัวเลข</span>
              </button>
            </div>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              onClick={() => setKeypadField('minStock')}
              className="w-full min-h-[48px] px-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xl text-slate-100 font-bold focus:border-cyan-400 outline-none cursor-pointer"
            />
          </div>

          {/* ตัวเลือกเปิด/ปิดสถานะ & วันหมดอายุ */}
          <div className="flex flex-col justify-center space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer min-h-[48px] px-2 rounded-xl hover:bg-slate-900/60 transition">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-6 h-6 rounded-md bg-slate-950 border-2 border-slate-600 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-base text-slate-100 font-medium">เปิดจำหน่ายสินค้าทันที</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer min-h-[48px] px-2 rounded-xl hover:bg-slate-900/60 transition">
              <input
                type="checkbox"
                checked={trackExpiry}
                onChange={(e) => setTrackExpiry(e.target.checked)}
                className="w-6 h-6 rounded-md bg-slate-950 border-2 border-slate-600 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-base text-slate-300 font-medium">ติดตามวันหมดอายุของสินค้า (Lot/Expiry)</span>
            </label>
          </div>

          {/* คำอธิบาย */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-base font-semibold text-slate-200">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุข้อความอธิบายสินค้า..."
              className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-200 focus:border-cyan-400 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-base font-bold border-2 border-slate-700 transition-all cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[48px] flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-base shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-5 h-5 stroke-[2.5]" />
                <span>{isEditing ? 'บันทึกการแก้ไข' : 'สร้างสินค้า'}</span>
              </>
            )}
          </button>
        </div>

        {/* Virtual Numeric Keypad Overlay Dialog */}
        {keypadField && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
              <VirtualNumericKeypad
                label={
                  keypadField === 'price'
                    ? 'ระบุราคาขาย (บาท)'
                    : keypadField === 'cost'
                    ? 'ระบุต้นทุนสินค้า (บาท)'
                    : 'ระบุสต็อกขั้นต่ำ'
                }
                value={
                  keypadField === 'price'
                    ? priceBaht
                    : keypadField === 'cost'
                    ? costBaht
                    : minStock
                }
                onChange={(val) => {
                  if (keypadField === 'price') setPriceBaht(val);
                  else if (keypadField === 'cost') setCostBaht(val);
                  else if (keypadField === 'minStock') setMinStock(val);
                }}
                onClose={() => setKeypadField(null)}
                onConfirm={() => setKeypadField(null)}
                allowDecimal={keypadField !== 'minStock'}
              />
            </div>
          </div>
        )}
        {/* Modal สแกนบาร์โค้ดด้วยกล้องแบบ Single-Capture */}
        <BarcodeCaptureModal
          isOpen={isBarcodeScanOpen}
          onClose={() => setIsBarcodeScanOpen(false)}
          onCapture={handleBarcodeCapture}
        />
      </form>
    </Drawer>
  );
}

