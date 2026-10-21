import React, { useState, useEffect, useCallback } from 'react';
import { catalogService } from '@/services/catalog.service';
import { metadataService } from '@/services/metadata.service';
import { Product, Category, Uom, Tax } from '@/types/catalog';
import { Tabs } from '@/components/ui/Tabs';
import { ProductToolbar } from '@/components/catalog/ProductToolbar';
import { ProductTable } from '@/components/catalog/ProductTable';
import { ProductFormDrawer } from '@/components/catalog/ProductFormDrawer';
import { Pagination } from '@/components/ui/Pagination';
import { Icons } from '@/components/ui/Icons';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

  // ข้อมูลสินค้าและสถานะโหลด
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Drawer Create / Edit State
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);

  // Pagination & ตัวกรองสินค้า
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // แจ้งเตือน Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ดึงรายการหมวดหมู่ และ Metadata (Taxes, UOMs)
  const fetchMetadataAndCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const [catRes, taxRes, uomRes] = await Promise.allSettled([
        catalogService.getCategories({ page: 1, pageSize: 100 }),
        metadataService.getTaxes(),
        metadataService.getUoms(),
      ]);

      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategories(catRes.value.data);
      }
      if (taxRes.status === 'fulfilled' && taxRes.value?.data) {
        setTaxes(taxRes.value.data);
      }
      if (uomRes.status === 'fulfilled' && uomRes.value?.data) {
        setUoms(uomRes.value.data);
      }
    } catch {
      // ดึงข้อมูลล้มเหลว
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // ดึงรายการสินค้า
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const isActiveParam =
        selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined;

      const res = await catalogService.getProducts({
        search: search.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        isActive: isActiveParam,
        page,
        pageSize,
      });

      if (res && res.data) {
        setProducts(res.data);
        if (res.meta) {
          setTotalItems(res.meta.totalItems || res.data.length);
          setTotalPages(res.meta.totalPages || 1);
        } else {
          setTotalItems(res.data.length);
          setTotalPages(1);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'ไม่สามารถโหลดรายการสินค้าได้', 'error');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [search, selectedCategoryId, selectedStatus, page, pageSize]);

  // Initial load
  useEffect(() => {
    fetchMetadataAndCategories();
  }, [fetchMetadataAndCategories]);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, fetchProducts]);

  // สลับสถานะเปิด/ปิดขายสินค้า (Toggle Active)
  const handleToggleProductStatus = async (product: Product) => {
    try {
      const updatedStatus = !product.isActive;
      await catalogService.updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        baseUomId: product.baseUomId,
        price: product.price,
        productType: product.productType,
        isActive: updatedStatus,
      });
      // อัปเดตใน state ทันที
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: updatedStatus } : p))
      );
      showToast(
        updatedStatus ? `เปิดจำหน่าย "${product.name}" เรียบร้อยแล้ว` : `ปิดจำหน่าย "${product.name}" ชั่วคราวแล้ว`,
        'success'
      );
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'ไม่สามารถเปลี่ยนสถานะสินค้าได้', 'error');
    }
  };

  const tabsConfig = [
    {
      id: 'products',
      label: 'รายการสินค้า (Products)',
      icon: <Icons.Package className="w-4 h-4" />,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      id: 'categories',
      label: 'หมวดหมู่สินค้า (Categories)',
      icon: <Icons.Boxes className="w-4 h-4" />,
      badge: categories.length > 0 ? categories.length : undefined,
    },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Icons.Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Icons.AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header ส่วนหัวของหน้า */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Icons.Package className="w-6 h-6 text-cyan-400" />
            จัดการแคตตาล็อกสินค้า (Product Catalog)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            บริหารจัดการรายการสินค้า บาร์โค้ด ราคาขาย และโครงสร้างหมวดหมู่สินค้า
          </p>
        </div>
      </div>

      {/* แท็บสลับหน้าจอ (สินค้า / หมวดหมู่) */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'products' | 'categories')}
      />

      {/* เนื้อหาในแท็บสินค้า */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <ProductToolbar
            categories={categories}
            search={search}
            selectedCategoryId={selectedCategoryId}
            selectedStatus={selectedStatus}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            onCategoryChange={(val) => {
              setSelectedCategoryId(val);
              setPage(1);
            }}
            onStatusChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
            onAddNewProduct={() => {
              setSelectedProductForEdit(null);
              setIsProductDrawerOpen(true);
            }}
            onRefresh={fetchProducts}
            isLoading={isLoadingProducts}
          />

          <ProductTable
            products={products}
            isLoading={isLoadingProducts}
            onEditProduct={(prod) => {
              setSelectedProductForEdit(prod);
              setIsProductDrawerOpen(true);
            }}
            onDeleteProduct={(prod) => {
              // จะเชื่อมกับ DeleteConfirmModal ใน Phase 8 (US6)
              const event = new CustomEvent('open-delete-modal', { detail: { product: prod } });
              window.dispatchEvent(event);
            }}
            onToggleStatus={handleToggleProductStatus}
            onResetSearch={() => {
              setSearch('');
              setSelectedCategoryId('');
              setSelectedStatus('all');
              setPage(1);
            }}
          />

          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Drawer สำหรับเพิ่ม / แก้ไขสินค้า */}
      <ProductFormDrawer
        isOpen={isProductDrawerOpen}
        onClose={() => setIsProductDrawerOpen(false)}
        product={selectedProductForEdit}
        categories={categories}
        uoms={uoms}
        taxes={taxes}
        onSuccess={(savedProduct, isNew) => {
          if (isNew) {
            setProducts((prev) => [savedProduct, ...prev]);
            setTotalItems((prev) => prev + 1);
            showToast(`สร้างสินค้า "${savedProduct.name}" สำเร็จ`, 'success');
          } else {
            setProducts((prev) =>
              prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
            );
            showToast(`แก้ไขข้อมูลสินค้า "${savedProduct.name}" สำเร็จ`, 'success');
          }
        }}
      />

      {/* เนื้อหาในแท็บหมวดหมู่สินค้า (จะถูกขยายสมบูรณ์ใน Phase 6) */}
      {activeTab === 'categories' && (
        <div id="category-tab-content" className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
            <Icons.Boxes className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-slate-200 font-medium">กำลังเตรียมพร้อมแท็บหมวดหมู่สินค้า</p>
            <p className="text-xs text-slate-500 mt-1">โมดูลหมวดหมู่สินค้าจะเชื่อมต่ออย่างสมบูรณ์ในขั้นตอนถัดไป</p>
          </div>
        </div>
      )}
    </div>
  );
}
