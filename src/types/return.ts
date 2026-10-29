/**
 * ประเภทข้อมูลสำหรับการรับคืนสินค้าและคืนเงิน (Return & Refund Types)
 * อ้างอิงตาม Swagger: POST /api/v1/returns
 * โครงการ ice-pos-web
 */

export type RefundMethod = 'CASH' | 'CARD' | 'QR_PROMPTPAY' | 'WALLET' | 'CREDIT' | 'TRANSFER';

export interface CreateReturnLineItem {
  productId: string;
  qty: number;
  saleLineId: string;
  unitAmount: number; // หน่วยสตางค์ (integer)
}

export interface CreateReturnRequest {
  branchId?: string;
  saleId: string;
  reason: string;
  refundMethod: RefundMethod;
  returnsStock?: boolean;
  lines: CreateReturnLineItem[];
}

export interface ReturnResponse {
  id: string;
  returnNo: string;
  saleId: string;
  reason: string;
  refundMethod: RefundMethod;
  returnsStock: boolean;
  totalRefund: number; // หน่วยสตางค์ (integer)
  status: string;
  createdAt?: string;
}

