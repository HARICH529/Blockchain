# ReturnChain: Comprehensive System Architecture & Engineering Report

## 1. Project Overview & Problem Statement
E-commerce platforms face significant financial losses due to return fraud:
- **Product Substitution**: Customers return a cheap or counterfeit item while keeping the genuine high-value product.
- **Counterfeit Returns**: Knockoffs or modified hardware returned with authentic packaging.
- **Damaged & Incomplete Items**: Items stripped of parts and returned as "defective".
- **Duplicate Return Attempts**: Resubmitting returns for already refunded items.
- **Inconsistent Custody Records**: Disputes over whether an item was tampered with before courier dispatch or during transit.

Traditional systems rely on centralized order databases and superficial manual inspection. **ReturnChain** introduces an immutable, verifiable product digital identity passport and tamper-resistant chain-of-custody ledger.

**Core Principle**: *Verify the product and its recorded cryptographic history, not just the centralized order number.*

---

## 2. Key Objectives
1. **Verifiable Digital Identity**: Every product receives an immutable digital identity anchored to a Solidity smart contract upon factory production.
2. **Chain-of-Custody Tracking**: All 11 lifecycle milestones (Registration -> Warehouse -> Outbound Dispatch -> Courier Pickup -> Transit -> Customer Delivery -> Return Request -> Return Pickup -> Return Center Intake -> Physical Inspection -> Verification Verdict) are recorded on-chain.
3. **Deterministic Rule-Based Fraud Detection**: A 10-rule verification engine evaluates incoming physical parcels against registered records.
4. **Role-Based Access Control (RBAC)**: Smart contract and backend API enforce strict separation of duties between Admins, Sellers, Couriers, Return Center Inspectors, and Customers.
5. **Privacy-Preserving Public Lookup**: Public QR code resolution verifies authenticity without exposing customer names, home addresses, or financial data.

---

## 3. Existing System vs. Proposed System

| Dimension | Traditional Centralized System | ReturnChain Blockchain System |
| :--- | :--- | :--- |
| **Identity Anchor** | Centralized Order ID in mutable SQL DB | Immutable on-chain Product Passport (Keccak256 hash) |
| **Custody Continuity** | Siloed carrier tracking, easily overwritten | Cryptographic, sequential milestone ledger |
| **Substitution Detection** | Manual inspection without digital whitelist | Automated comparison between scanned tag and genesis record |
| **Return State Validation** | Order marked "Returned" by warehouse staff | Smart contract enforces legal state transitions (e.g., must be DELIVERED first) |
| **Auditability** | Internal logs subject to database tampering | Immutable smart contract event logs + cryptographically hashed audit trail |
| **Counterfeit Protection** | Easily faked order receipt | Whitelisted manufacturer serial and spec hash verification |

---

## 4. 10-Rule Fraud Detection Engine

1. `UNREGISTERED_PRODUCT`: The scanned product ID does not exist on the smart contract or registry.
2. `PRODUCT_ID_MISMATCH`: The scanned product ID does not match the item tied to the return request (Substitution fraud).
3. `SERIAL_MISMATCH`: Physical manufacturer serial number differs from the genesis passport serial.
4. `WRONG_ORDER_ASSOCIATION`: Return request references an order that does not contain this product identity.
5. `DUPLICATE_RETURN_REQUEST`: The product already has an active, approved, or refunded return.
6. `RETURN_BEFORE_DELIVERY`: Return attempted on an item that was never recorded as `DELIVERED` on the custody ledger.
7. `INVALID_CUSTODY_TRANSITION`: Gaps or illegal state jumps in the custody timeline.
8. `MISSING_EXPECTED_CUSTODY_EVENT`: Missing critical delivery confirmation or intake receipt.
9. `RETURN_ALREADY_COMPLETED`: Return was previously finalized and refunded.
10. `PHYSICAL_INSPECTION_CONFLICT`: Broken warranty seals, missing barcodes, or physical damage conflicting with reported condition.

---

## 5. Security Architecture
- **Cryptographic Hashing**: Keccak-256 for product specs, delivery proofs, and inspection logs.
- **Session Authentication**: JSON Web Tokens (JWT) with bcrypt salt rounds for password storage.
- **Contract Access Control**: Custom modifiers (`onlyAdmin`, `onlySeller`, `onlyCourier`, `onlyReturnCenter`) and custom Solidity errors.
- **Zero PII On-Chain**: No personal names, home addresses, or phone numbers are stored on the blockchain or exposed on the public QR page.
- **Defense in Depth**: Permissions enforced in both backend middleware and Solidity contract execution.

---

## 6. Limitations & Real-World Considerations
- **Physical-to-Digital Bridge**: Blockchain guarantees the integrity of recorded history; physical verification seals, tamper-evident tags, or RFID hardware are still essential to ensure the physical item matches its digital passport.
- **Simulated Scanners**: In a local development environment, camera barcode scanning and manual barcode entry are provided as fallbacks for testing.
