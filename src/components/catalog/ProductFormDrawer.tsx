'use client';

import React, { useState, useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Product, Category, Uom, Tax, ProductType } from '@/types/catalog';
import { catalogService } from '@/services/catalog.service';
import { bahtToSatang, satangToBahtNumber } from '@/utils/currency';
import { ImageUploader } from '@/components/catalog/ImageUploader';
import { Icons } from '@/components/ui/Icons';

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

  // Loading & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
  }, [isOpen, product, categories, uoms, taxes]);

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

  // Form Validation
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'กรุณาระบุชื่อสินค้า';
    if (!sku.trim()) errors.sku = 'กรุณาระบุรหัส SKU';
    if (!baseUomId) errors.baseUomId = 'กรุณาเลือกหน่วยนับหลัก';
    const priceNum = parseFloat(priceBaht);
    if (isNaN(priceNum) || priceNum < 0) errors.price = 'ราคาขายต้องเป็นตัวเลขมากกว่าหรือเท่ากับ 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        savedProduct = res.data;

        // ถ้ามีไฟล์รูปภาพที่เลือกไว้ให้อัปโหลดตามหลัง
        if (imageFile) {
          try {
            await catalogService.uploadProductImage(product.id, imageFile);
          } catch {
            // ไม่บล็อกการแก้ไขข้อมูลหลัก
          }
        }
        onSuccess(savedProduct, false);
      } else {
        const res = await catalogService.createProduct(payload);
        savedProduct = res.data;

        // ถ้ามีไฟล์รูปภาพที่เลือกไว้ให้อัปโหลดเข้าสินค้าใหม่
        if (imageFile && savedProduct?.id) {
          try {
            await catalogService.uploadProductImage(savedProduct.id, imageFile);
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
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              ชื่อสินค้า <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้ำแข็งหลอดเล็ก 5kg"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
            {formErrors.name && (
              <span className="text-[11px] text-rose-400">{formErrors.name}</span>
            )}
          </div>

          {/* รหัส SKU */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              รหัส SKU <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="เช่น ICE-001"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none uppercase"
            />
            {formErrors.sku && (
              <span className="text-[11px] text-rose-400">{formErrors.sku}</span>
            )}
          </div>

          {/* บาร์โค้ด + ปุ่มสร้างบาร์โค้ดภายใน */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                บาร์โค้ดสินค้า
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                disabled={isGeneratingBarcode}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Icons.Sparkles className="w-3 h-3" />
                <span>สร้างบาร์โค้ดอัตโนมัติ</span>
              </button>
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
              />
              {isInternalBarcode && (
                <span className="absolute inset-y-0 right-2.5 flex items-center text-[10px] text-cyan-400 font-mono">
                  บาร์โค้ดร้าน
                </span>
              )}
            </div>
          </div>

          {/* หมวดหมู่สินค้า */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              หมวดหมู่สินค้า
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              ชนิดสินค้า
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              <option value="PRICE_PER_UNIT">ขายต่อหน่วย/ชิ้น (PRICE_PER_UNIT)</option>
              <option value="BY_WEIGHT">ขายตามน้ำหนัก (BY_WEIGHT)</option>
            </select>
          </div>

          {/* หน่วยนับหลัก */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              หน่วยนับหลัก <span className="text-rose-400">*</span>
            </label>
            <select
              value={baseUomId}
              onChange={(e) => setBaseUomId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              {uoms.map((uom) => (
                <option key={uom.id} value={uom.id}>
                  {uom.name} ({uom.code})
                </option>
              ))}
            </select>
            {formErrors.baseUomId && (
              <span className="text-[11px] text-rose-400">{formErrors.baseUomId}</span>
            )}
          </div>

          {/* อัตราภาษี */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              อัตราภาษีมูลค่าเพิ่ม
            </label>
            <select
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              ราคาขาย (บาท) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={priceBaht}
              onChange={(e) => setPriceBaht(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-cyan-400 font-bold focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none"
            />
            {formErrors.price && (
              <span className="text-[11px] text-rose-400">{formErrors.price}</span>
            )}
          </div>

          {/* ต้นทุน */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              ต้นทุนสินค้าต่อหน่วย (บาท)
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              value={costBaht}
              onChange={(e) => setCostBaht(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* สต็อกขั้นต่ำ */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              ระดับแจ้งเตือนสต็อกขั้นต่ำ
            </label>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 outline-none"
            />
          </div>

          {/* ตัวเลือกเปิด/ปิดสถานะ & วันหมดอายุ */}
          <div className="flex flex-col justify-center space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded-sm bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-xs text-slate-200">เปิดจำหน่ายสินค้าทันที</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trackExpiry}
                onChange={(e) => setTrackExpiry(e.target.checked)}
                className="w-4 h-4 rounded-sm bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-xs text-slate-400">ติดตามวันหมดอายุของสินค้า (Lot/Expiry)</span>
            </label>
          </div>

          {/* คำอธิบาย */}
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              รายละเอียดเพิ่มเติม
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุข้อความอธิบายสินค้า..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-cyan-400 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-4 h-4" />
                <span>{isEditing ? 'บันทึกการแก้ไข' : 'สร้างสินค้า'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
