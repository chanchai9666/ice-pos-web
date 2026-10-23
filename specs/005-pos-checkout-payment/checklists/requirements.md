# Specification Quality Checklist: ระบบชำระเงินหน้าร้าน (POS Checkout & Payment)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-23
**Feature**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/005-pos-checkout-payment/spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
  - Note: API endpoints mentioned but they are the contracts (not implementation); the spec focuses on user outcomes
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders (primarily in Thai for the cashier/business audience)
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified (ตะกร้าว่าง, ยังไม่เปิดกะ, API timeout, network error, out-of-stock, idempotency)
- [x] Scope is clearly bounded (Phase 1: CASH P1, QR P2, CREDIT P3; CARD/WALLET deferred)
- [x] Dependencies and assumptions identified (uomId, price unit in satang, receipt printing scope)

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows (cash payment, shift state consolidation, QR, credit)
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Validation Results

### Iteration 1 (2026-10-23)

All items passed. Key decisions documented in Assumptions:
- `uomId` availability in Product data confirmed from PosCartContext code analysis
- `CartItem.price` confirmed to be in satang from PosCartContext (lineTotal = price * quantity, stored and retrieved correctly)
- Idempotency-Key header confirmed in Swagger spec for `POST /api/v1/sales`
- Receipt printing (hardware) is explicitly out of scope

### Iteration 2 (2026-10-23) — Post-Clarify Session

All 5 clarifications integrated. Checklist re-validated: **14/14 → 14/14** (no regressions).

Clarifications applied:
- Q1 (uomId): FR-012 added, CartItem Key Entity updated with `uomId` field and storage rule
- Q2 (Post-checkout flow): User Story 1 Acceptance Scenarios updated; FR-007 & FR-011 updated with Success Overlay + "เริ่มบิลใหม่" button
- Q3 (QR Polling): User Story 3 updated with Auto-polling every 3s, timeout 5min, manual fallback; FR-004 updated; SC-006 added for Memory Leak prevention; Edge Case added
- Q4 (Discount deferred): FR-006 updated with `billDiscount: 0`/`lineDiscount: 0` explicit note; Assumptions updated
- Q5 (Close Shift): Explicitly declared out of scope in Assumptions; separate spec `006-pos-close-shift` noted

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`
- This spec directly addresses two discovered bugs: (1) Duplicate Shift State and (2) Missing Checkout Implementation
- FR-001 (State consolidation) should be implemented as Phase 0 before implementing Checkout UI
