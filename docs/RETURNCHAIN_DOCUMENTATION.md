# RETURNCHAIN: BLOCKCHAIN-BASED PRODUCT IDENTITY AND CHAIN-OF-CUSTODY SYSTEM FOR E-COMMERCE RETURN FRAUD PREVENTION

**Bachelor of Technology in Computer Science and Engineering**  
**Use Case Report - Assignment 2 (Blockchain Technology - 23CS4701B)**  
**Academic Year:** 2026–2027 (Semester 4-1)  

* **Submitted by:** CHUNDURI HARI KRISHNA (Reg No: 23502A0529)  
* **Under the guidance of:** Mr. A. Prashant, Assistant Professor  
* **Head of the Department:** Dr. A. Jayalakshmi, Professor & Head  
* **Department:** Department of Computer Science and Engineering  
* **Institution:** Prasad V Potluri Siddhartha Institute of Technology (PVPSIT), Kanuru, Vijayawada - 520007  
  *(Permanently affiliated to JNTU-Kakinada, Approved by AICTE, NBA & NAAC accredited, ISO 9001:2015 certified)*  
* **GitHub Repository:** [https://github.com/HARICH529/Blockchain](https://github.com/HARICH529/Blockchain)  
* **Video Presentation Link:** [https://drive.google.com/file/d/15377xtzfBLrpEmr5hEKREk8y44TWsu3U/view?usp=sharing](https://drive.google.com/file/d/15377xtzfBLrpEmr5hEKREk8y44TWsu3U/view?usp=sharing)  

---

## CERTIFICATE

This is to certify that the Use Case report entitled **“ReturnChain: Blockchain-Based Product Identity and Chain-of-Custody System for E-Commerce Return Fraud Prevention”** is being submitted by **CHUNDURI HARI KRISHNA (23502A0529)**, as part of Assignment-2 for the **Blockchain Technology (23CS4701B)** course in 4-1 during the academic year 2026–27 at Prasad V Potluri Siddhartha Institute of Technology, Vijayawada.

\
**Course Coordinator:** Mr. A. Prashant (Assistant Professor, Dept of CSE, PVPSIT)  
**Head of the Department:** Dr. A. Jayalakshmi (Professor and Head, Dept of CSE, PVPSIT)  
**Marks Awarded:** Assignment 2: `[ /5 ]`  

---

## TABLE OF CONTENTS

| S. No. | Chapter Title | Page Reference |
| :---: | :--- | :---: |
| **1** | [Introduction](#1-introduction) | 1 |
| 1.1 | Overview of Blockchain Technology | 1 |
| 1.2 | Relevance of Blockchain in E-Commerce Return Fraud Prevention | 1 |
| **2** | [Background & Problem Statement](#2-background--problem-statement) | 3 |
| 2.1 | Product Substitution and Serial Number Swapping | 3 |
| 2.2 | Counterfeit Knockoff Infiltration | 3 |
| 2.3 | Damaged and Component-Stripped Returns | 3 |
| 2.4 | Duplicate Return Submissions and Double Refunds | 4 |
| 2.5 | Return Requests Prior to Outbound Delivery | 4 |
| 2.6 | Custody Blind Spots Across Carrier Hand-offs | 4 |
| 2.7 | Unauthorized Centralized Database Tampering | 4 |
| 2.8 | Disconnected Manufacturer, Courier, and Warehouse Systems | 4 |
| 2.9 | Inadequate Physical Inspection Criteria | 4 |
| 2.10 | Absence of Zero-PII Public Verifiable Provenance | 4 |
| **3** | [Blockchain Basics & Cryptographic Foundations](#3-blockchain-basics) | 6 |
| 3.1 | Distributed Ledger Architecture | 6 |
| 3.2 | Cryptographic Immutability and Keccak-256 Hashing | 6 |
| 3.3 | Verifiable Transparency and Event Auditing | 6 |
| 3.4 | Smart Contracts | 6 |
| 3.5 | Consensus Mechanisms and Hardhat Network Execution | 7 |
| 3.6 | Role-Based Access Control and Digital Signatures | 7 |
| 3.7 | Hybrid Architecture: On-Chain Anchors and Off-Chain Storage | 7 |
| **4** | [Use Case Overview & Architecture](#4-use-case-overview) | 8 |
| 4.1 | Objectives | 8 |
| 4.2 | Scope of the System & Stakeholder Personas | 8 |
| 4.3 | System Architecture (4 Tiers) | 8 |
| 4.4 | The Deterministic 10-Rule Fraud Detection Engine | 9 |
| 4.5 | The 11-Milestone Chain-of-Custody State Machine | 10 |
| **5** | [Implementation & Engineering Details](#5-implementation) | 13 |
| 5.1 | Setting Up the Development Environment | 13 |
| 5.2 | Defining Smart Contracts (`ReturnChain.sol`) | 13 |
| 5.3 | Backend Orchestration and Ethers.js Blockchain Service | 16 |
| 5.4 | Frontend Web Application and Verification Center | 17 |
| 5.5 | Deploying and Integrating the Complete System | 18 |
| 5.6 | Workflow | 18 |
| **6** | [Benefits](#6-benefits) | 20 |
| **7** | [Challenges & Mitigation Strategies](#7-challenges) | 22 |
| **8** | [Conclusion & Future Outlook](#8-conclusion) | 24 |
| **9** | [SDGs Addressed](#9-sdgs-addressed) | 25 |
| **10** | [References](#10-references) | 26 |
| **11** | [Appendix A: Verification Video & Links](#11-appendix-a) | 27 |

---

# 1. INTRODUCTION

### 1.1. Overview of Blockchain Technology
Blockchain technology is an append-only, distributed ledger system that records transactions across a peer-to-peer network of computers without requiring a centralized clearinghouse. Transactions are grouped into cryptographically verified blocks, and each block contains the cryptographic hash of the previous block, forming an unbroken, tamper-evident chain of records.

Unlike a conventional relational database, where administrative accounts can update or delete records, a blockchain provides immutability, distributed consensus, and cryptographic provenance. Smart contracts, which are programs executed uniformly by every node of the network, enforce business rules and state transitions automatically. In the ReturnChain project, blockchain is used to record the identity of each physical product and every custody hand-off that the product undergoes, so that the product’s journey from seller to customer and back to a return center can be verified independently.

### 1.2. Relevance of Blockchain in E-Commerce Return Fraud Prevention
The rapid growth of e-commerce has been accompanied by a large increase in return fraud and retail abuse, costing retailers heavy financial losses every year. Common fraud patterns include:
* **Product substitution (“brick-in-the-box”):** A customer buys an authentic high-value item, such as a phone, graphics card, or watch, and returns an older model, a broken replica, or a weighted placeholder inside the original packaging.
* **Counterfeit swapping:** Authentic components or whole units are replaced with counterfeit alternatives before the item is returned for a full refund.
* **Duplicate return claims:** Delays between courier systems and merchant databases are exploited to claim multiple refunds for a single order.

Traditional return logistics rely on separate, centralized databases managed by merchants, third-party couriers, and return processing centers. These systems suffer from record alteration by malicious insiders or compromised API tokens, incomplete audit logs that cannot show where a product was substituted, and an over-reliance on visual inspection by warehouse staff who have no cryptographic means of verifying the authenticity of a serialized item.

**ReturnChain** addresses these weaknesses by changing what is verified:
> **Core Principle:** *Verify the physical product and its immutable chain of custody, not just the order number or external package barcode.*

Each physical unit receives a unique digital product passport that is anchored to a Solidity smart contract when the seller registers it. All eleven custody milestones of the outbound delivery and the inbound return are committed to the ledger. When a returned item reaches the intake bay, a deterministic 10-rule fraud detection engine compares its physical serial number, product identity, and recorded custody states against the blockchain record before any refund is authorized.

Detailed records such as inspection photographs, shipping manifests, and user credentials are stored in an off-chain database, while only identities, status values, actor addresses, timestamps, and Keccak-256 hashes are written on-chain. This hybrid approach keeps transaction costs low while still making any later modification of off-chain data detectable.

---

# 2. BACKGROUND & PROBLEM STATEMENT

Traditional e-commerce return handling depends on siloed databases, barcode-based tracking, and manual inspection performed under time pressure. These characteristics create opportunities for fraud, weaken accountability between the parties involved, and lead to financial losses for merchants.

```
+-----------------------------------------------------------------------------------------+
|                               LEGACY RETURN INFRASTRUCTURE                              |
+-----------------------------------------------------------------------------------------+
|  [Seller DB]            [Courier Carrier DB]          [Return Warehouse DB]             |
|   - Order #8021          - Tracking #SW-101            - Return Intake #R-99            |
|   - Internal SKU         - Status: "Delivered"         - Status: "Received"             |
|         |                        |                             |                        |
|         +------------> [MUTABLE SILOED DATABASES] <------------+                        |
|                                  |                                                      |
|         × Open to unauthorized administrator edits and injection attacks                |
|         × No cryptographic proof of serial number or custody continuity                 |
|         × Scanned package barcode is disconnected from the physical item inside         |
+-----------------------------------------------------------------------------------------+
```

### 2.1. Product Substitution and Serial Number Swapping
In legacy systems, return approval is tied to the tracking barcode of the return package rather than to the serialized identity of the product inside. Bad actors exploit this gap by purchasing a genuine electronic item and placing an identical counterfeit, or an older defective model, inside the retail box before returning it for a full refund.

### 2.2. Counterfeit Knockoff Infiltration
Counterfeiters can manufacture packaging that is identical to the original. Centralized systems lack a unified, non-reproducible cryptographic whitelist, so when intake staff scan the external UPC/EAN barcode the database validates only the general SKU. Knockoff units can therefore enter secondary resale inventories without being noticed.

### 2.3. Damaged and Component-Stripped Returns
Products from which internal parts have been removed, such as RAM modules, optical lenses, or GPU heatsinks, are often returned as “defective out of the box”. Without baseline specification hashes recorded at the factory, return centers cannot prove whether the item arrived defective or was stripped after delivery.

### 2.4. Duplicate Return Submissions and Double Refunds
Centralized databases often operate asynchronously. Gaps between customer-service ticket queues, warehouse management systems (WMS), and enterprise resource planning (ERP) software allow dishonest buyers to submit duplicate return requests or trigger refunds through several channels for the same item.

### 2.5. Return Requests Prior to Outbound Delivery
Fraudulent accounts exploit API delays to file return and refund requests while a shipment is still in transit, claiming non-delivery while the physical parcel is intercepted at the delivery point.

### 2.6. Custody Blind Spots Across Carrier Hand-offs
When an item moves between suppliers, line-haul carriers, local couriers, and return hubs, custody logs are kept in proprietary carrier systems. If an item is damaged or swapped, the merchant cannot identify whether the compromise occurred under courier custody or at the warehouse intake dock.

### 2.7. Unauthorized Centralized Database Tampering
Database administrators, compromised support accounts, or other actors with direct database access can modify order statuses, erase fraud flags, or mark returned items as “inspected” without any physical verification having been carried out.

### 2.8. Disconnected Manufacturer, Courier, and Warehouse Systems
Logistics stakeholders use isolated technology stacks such as EDI, proprietary REST APIs, and legacy SOAP endpoints. This fragmentation prevents real-time synchronization of serial-level custody transitions between organizations.

### 2.9. Inadequate Physical Inspection Criteria
Warehouse intake workers process hundreds of return packages per hour under strict performance quotas. Without a standardized, rule-based verification protocol linked to recorded custody milestones, inspections are subjective and error-prone.

### 2.10. Absence of Zero-PII Public Verifiable Provenance
Buyers in secondary markets, such as refurbished goods and peer-to-peer exchanges, cannot verify whether an item was legally acquired, previously repaired, or involved in return fraud. Exposing order histories in centralized systems would violate data privacy regulations such as GDPR and CCPA, so no public verification is offered at all.

---

# 3. BLOCKCHAIN BASICS & CRYPTOGRAPHIC FOUNDATIONS

Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-evident recording of transactions without relying entirely on a central authority. Records are linked using cryptographic hashes, which makes the technology suitable for logistics, where trustworthy records of product identity and custody are essential.

### 3.1. Distributed Ledger Architecture
ReturnChain replaces isolated databases with a shared state machine running on the Ethereum Virtual Machine (EVM). Every node maintains an identical, cryptographically synchronized state, which removes single points of failure and gives the seller, courier, and return center one common source of truth.

### 3.2. Cryptographic Immutability and Keccak-256 Hashing
Every data payload, such as product metadata, courier location data, or inspection results, can be converted into a deterministic 256-bit fingerprint using the Keccak-256 algorithm:

$$\text{ProductHash} = \text{Keccak-256}(\text{ProductId} \parallel \text{SerialNumber} \parallel \text{ManufacturerData})$$

Once this hash is stored in the smart contract’s state, it cannot be altered, overwritten, or erased by any network participant. A change of even one character in the source data produces a completely different hash.

### 3.3. Verifiable Transparency and Event Auditing
Smart contracts emit events such as `ProductRegistered`, `CustodyUpdated`, `ReturnVerified`, and `FraudFlagged`. These events are written to the transaction receipts of the blockchain and form an immutable audit log that can be indexed and queried using Ethers.js.

### 3.4. Smart Contracts
ReturnChain uses smart contracts written in Solidity (`^0.8.24`) to enforce business rules directly on the blockchain. A state change, such as marking a return as verified, is executed only if its prerequisites are satisfied. For example, the verdict can be recorded only for an existing return that is still in the `PENDING` state and only by an authorized return center.

### 3.5. Consensus Mechanisms and Hardhat Network Execution
Consensus mechanisms allow network participants to agree on the order of valid transactions. For enterprise logistics, models such as Proof of Authority (PoA) or Proof of Stake (PoS) provide fast finality without the energy cost of Proof of Work. The ReturnChain prototype runs on a local Hardhat EVM node, which provides sub-second block times and deterministic state transitions for integration testing.

### 3.6. Role-Based Access Control and Digital Signatures
Every state-changing contract method requires a transaction signed with the Elliptic Curve Digital Signature Algorithm (ECDSA, secp256k1). Access is restricted using Solidity modifiers:
* `onlyAdmin`: contract configuration, fraud resolution, and role governance.
* `onlySeller`: product passport registration and initial dispatch.
* `onlyCourier`: transit milestone updates and delivery confirmation.
* `onlyReturnCenter`: intake check-in, inspection, and verification verdicts.

### 3.7. Hybrid Architecture: On-Chain Anchors and Off-Chain Storage
To optimize gas cost while preserving integrity, ReturnChain splits data between two stores:
* **Off-chain (MongoDB Atlas):** large JSON payloads, high-resolution inspection photographs, detailed shipping manifests, and user credentials.
* **On-chain (Solidity contract):** unique identity strings, status enums, actor Ethereum addresses, block timestamps, and Keccak-256 hashes of the off-chain records.

---

# 4. USE CASE OVERVIEW & ARCHITECTURE

The use case for ReturnChain is to transform e-commerce return handling by using blockchain technology. The system gives merchants, couriers, return centers, and customers a secure, transparent, and fraud-resistant way to register products, track custody, inspect returns, and settle refunds.

### 4.1. Objectives
* **Anchor product identity:** Mint an immutable on-chain digital passport for every physical unit, preventing counterfeit duplication.
* **Track custody transitions:** Log all 11 lifecycle milestones across the outbound and inbound logistics legs.
* **Automate fraud detection:** Execute an automated 10-rule verification engine at return intake before any refund is processed.
* **Enforce role-based governance:** Restrict each action to authorized actors through smart contract modifiers.
* **Protect user privacy:** Offer public QR-code verification with zero exposure of personally identifiable information (PII).

### 4.2. Scope of the System & Stakeholder Personas
The system coordinates five stakeholder personas:

| Persona | System Role | Primary Permissions and Responsibilities |
| :--- | :--- | :--- |
| **Administrator** | `ADMIN` | Oversees platform governance, authorizes seller, courier, and return-center addresses, resolves flagged fraud cases, and audits contract transactions. |
| **Authorized Seller** | `SELLER` | Mints digital product passports, registers manufacturer serials, binds products to orders, and dispatches outbound inventory. |
| **Logistics Courier** | `COURIER` | Logs shipment pickups, updates transit checkpoints with location data, and submits electronic delivery confirmations. |
| **Return Inspector** | `RETURN_CENTER` | Performs intake check-in, scans QR codes and serials, runs the 10-rule fraud engine, and records verification verdicts. |
| **Customer / Buyer** | `CUSTOMER` | Views purchased items, submits return requests with reasons, tracks refund status, and scans public product passports. |

### 4.3. System Architecture (4 Tiers)
The architecture of ReturnChain consists of four tiers:

```
+-----------------------------------------------------------------------------------+
|             1. Presentation and Client Layer (React 18 + Vite + Tailwind CSS)      |
|  [Role Switcher]  [Passport Minting + QR]  [Custody Timeline]  [Verification Center]  |
|  [Fraud Console]  [Blockchain Explorer]    [Public Gateway /verify/:id]           |
+-----------------------------------------------------------------------------------+
                                         │ REST + JWT
                                         ▼
+-----------------------------------------------------------------------------------+
|               2. Application and Middleware Layer (Node.js + Express.js)           |
|  [JWT Auth + RBAC]  [REST Controllers]  [Deterministic 10-Rule Fraud Engine]       |
|  [Audit Logging Service]                 [Ethers.js Blockchain Service]            |
+-----------------------------------------------------------------------------------+
                     │ Mongoose                             │ Ethers.js (signed tx)
                     ▼                                      ▼
+-----------------------------------------+  +--------------------------------------+
|       3. Off-Chain Persistence          |  |         4. Smart Contract Layer      |
|        (MongoDB Atlas / Mongoose)       |  |     (Solidity ^0.8.24 / Hardhat EVM) |
|  - Users Collection                     |  |  ReturnChain.sol:                    |
|  - Products Collection                  |  |  - Role Mappings (Admin/Seller/etc)  |
|  - Orders Collection                    |  |  - Product Registry Whitelist        |
|  - Custody Events Collection            |  |  - Sequential Custody Ledger         |
|  - Return Requests Collection           |  |  - Return Registry & Verification    |
|  - Fraud Cases Collection               |  |  - Fraud Case Storage                |
|  - Audit Logs Collection                |  |                                      |
+-----------------------------------------+  +--------------------------------------+
```

### 4.4. The Deterministic 10-Rule Fraud Detection Engine
When an item arrives at a return processing center, the inspector scans its QR tag and physical serial number, and the engine evaluates the package against ten deterministic rules in order. The first failed rule determines the flag and risk level; a package passing all ten rules receives the `VERIFIED` verdict and the refund is authorized.

| Rule Identifier | Failure Condition | Risk | Operational Meaning |
| :--- | :--- | :--- | :--- |
| **`UNREGISTERED_PRODUCT`** | Scanned ID does not exist in contract storage. | **CRITICAL** | Item was never registered or sold through the platform. |
| **`PRODUCT_ID_MISMATCH`** | Scanned product ID differs from the return request. | **CRITICAL** | **Substitution fraud:** a different item was placed in the package. |
| **`SERIAL_MISMATCH`** | Physical serial differs from the genesis passport. | **CRITICAL** | **Counterfeit swap:** knockoff unit placed in authentic packaging. |
| **`WRONG_ORDER_ASSOCIATION`** | Product is bound to a different customer order. | **HIGH** | Item was swapped with a product from another order. |
| **`DUPLICATE_RETURN_REQUEST`** | An approved or active return already exists for this unit. | **HIGH** | Attempt to claim multiple refunds for one purchase. |
| **`RETURN_BEFORE_DELIVERY`** | Custody timeline lacks a verified `DELIVERED` milestone. | **CRITICAL** | Return attempted while the item is still in transit. |
| **`INVALID_CUSTODY_TRANSITION`**| Custody sequence violates the lifecycle state machine. | **MEDIUM** | A state transition bypassed normal carrier checkpoints. |
| **`MISSING_EXPECTED_CUSTODY`** | Mandatory pickup or transit checkpoints are missing. | **MEDIUM** | Missing hand-off scans suggest shipment tampering. |
| **`RETURN_ALREADY_COMPLETED`** | Linked return request is already `REFUNDED`. | **HIGH** | Attempt to process a previously closed return. |
| **`PHYSICAL_INSPECTION_CONFLICT`**| Physical condition contradicts customer claim (broken seals, etc.).| **MEDIUM (AMBER)**| Item returned damaged, missing parts, or stripped internally. |

### 4.5. The 11-Milestone Chain-of-Custody State Machine
ReturnChain enforces an 11-stage finite state machine (FSM). Each stage corresponds to a value of the `ProductStatus` enum in the smart contract, and the fraud engine rejects a return whose recorded custody sequence bypasses a required milestone.

```
[0: REGISTERED] ──> [1: ASSIGNED_WAREHOUSE] ──> [2: DISPATCHED] ──> [3: IN_TRANSIT] ──> [4: DELIVERED]
                                                                                              │
                                                                                              ▼
[8: RETURN_VERIFIED] <── [Intake & 10-Rule Fraud Engine] <── [7: RETURN_RECEIVED] <── [6: RETURN_IN_TRANSIT] <── [5: RETURN_REQUESTED]
         │                               │                               │
         ▼                               ▼                               ▼
   [10: REFUNDED]              [9: RETURN_FLAGGED]                [MANUAL_REVIEW]
  (Refund Settled)             (Fraud Investigation)           (Admin Arbitration)
```

---

# 5. IMPLEMENTATION & ENGINEERING DETAILS

### 5.1. Setting Up the Development Environment
ReturnChain is implemented with Ethereum-compatible blockchain tools and a standard web stack:
* **Smart Contracts:** Solidity (`^0.8.24`) compiled and deployed using Hardhat (`v2.22.x`).
* **Blockchain Client:** Ethers.js (`v6.13.x`) connecting backend and frontend to the local EVM node.
* **Backend Runtime:** Node.js (`v20.x`) with Express.js (`v4.19.x`) and Mongoose (`v8.x`).
* **Database:** MongoDB Atlas (or local MongoDB server) storing rich metadata off-chain.
* **Frontend Web Stack:** React (`v18.3.x`), Vite (`v5.x`), Tailwind CSS (`v3.4.x`), Lucide React, and Recharts.
* **Testing:** Mocha and Chai with 20 automated passing smart contract test assertions.

### 5.2. Defining Smart Contracts (`ReturnChain.sol`)

The complete business logic is implemented in [`blockchain/contracts/ReturnChain.sol`](file:///c:/Users/harik/OneDrive/Desktop/blockchain/blockchain/contracts/ReturnChain.sol).

#### 5.2.1. Data Structures, Enums, and State Storage
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ReturnChain {
    address public admin;
    mapping(address => bool) public sellers; 
    mapping(address => bool) public couriers; 
    mapping(address => bool) public returnCenters;

    enum ProductStatus {
        REGISTERED,          // 0: Created by seller 
        ASSIGNED_WAREHOUSE,  // 1: Allocated to warehouse staging 
        DISPATCHED,          // 2: Dispatched for outbound delivery 
        IN_TRANSIT,          // 3: In transit by courier
        DELIVERED,           // 4: Delivered to customer 
        RETURN_REQUESTED,    // 5: Return filed by customer 
        RETURN_IN_TRANSIT,   // 6: Return parcel in transit 
        RETURN_RECEIVED,     // 7: Intake bay receipt at Return Center 
        RETURN_VERIFIED,     // 8: Inspected and verified genuine 
        RETURN_FLAGGED,      // 9: Flagged as fraud / mismatch
        REFUNDED             // 10: Refund authorized and settled
    }

    enum VerificationResult { PENDING, VERIFIED, SUSPICIOUS, MANUAL_REVIEW }
    enum FraudRiskLevel { LOW, MEDIUM, HIGH, CRITICAL }

    struct CustodyEvent {
        string eventType;
        address actor;
        string actorRole;
        string location;
        bytes32 dataHash;
        uint256 timestamp;
    }

    struct Product {
        string productId;
        string serialNumber;
        bytes32 productHash;
        address seller;
        ProductStatus status;
        uint256 registeredAt;
        bool exists;
    }

    struct ReturnItem {
        string returnId;
        string productId;
        string orderId;
        address customer;
        string reason;
        VerificationResult outcome;
        bytes32 inspectionNotesHash;
        uint256 createdAt;
        uint256 verifiedAt;
        bool exists;
    }

    struct FraudCase {
        string caseId;
        string returnId;
        string productId;
        string triggeredRule;
        FraudRiskLevel riskLevel;
        string reason;
        bool isResolved;
        string resolutionNotes;
        uint256 timestamp;
        uint256 resolvedAt;
        bool exists;
    }

    mapping(string => Product) private products; 
    mapping(string => CustodyEvent[]) private productCustody; 
    mapping(string => ReturnItem) private returnItems; 
    mapping(string => FraudCase) private fraudCases; 
    mapping(string => string) private serialToProductId;
}
```

#### 5.2.2. Role Authorization Modifiers
```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "ReturnChain: Caller is not Admin");
    _;
}

modifier onlySeller() {
    require(sellers[msg.sender] || msg.sender == admin, "ReturnChain: Caller is not an authorized Seller");
    _;
}

modifier onlyCourier() {
    require(couriers[msg.sender] || msg.sender == admin, "ReturnChain: Caller is not an authorized Courier");
    _;
}

modifier onlyReturnCenter() {
    require(returnCenters[msg.sender] || msg.sender == admin, "ReturnChain: Caller is not an authorized Return Center");
    _;
}
```

#### 5.2.3. Digital Product Passport Registration
```solidity
function registerProduct(
    string calldata productId, 
    string calldata serialNumber, 
    bytes32 productHash,
    string calldata initialLocation
) external onlySeller {
    require(!products[productId].exists, "ReturnChain: Product already registered");
    require(bytes(serialToProductId[serialNumber]).length == 0, "ReturnChain: Serial number already registered");

    products[productId] = Product({
        productId: productId,
        serialNumber: serialNumber, 
        productHash: productHash,
        seller: msg.sender, 
        status: ProductStatus.REGISTERED,
        registeredAt: block.timestamp,
        exists: true
    });

    serialToProductId[serialNumber] = productId;

    // Record genesis custody event
    productCustody[productId].push(CustodyEvent({
        eventType: "REGISTERED",
        actor: msg.sender,
        actorRole: "SELLER", 
        location: initialLocation,
        dataHash: productHash,
        timestamp: block.timestamp
    }));

    emit ProductRegistered(productId, serialNumber, msg.sender, block.timestamp);
}
```

#### 5.2.4. Cryptographic Milestone Logging
```solidity
function recordCustodyEvent(
    string calldata productId,
    string calldata eventType, 
    string calldata actorRole,
    string calldata location, 
    bytes32 dataHash,
    ProductStatus newStatus
) external {
    require(products[productId].exists, "ReturnChain: Product does not exist");

    // Invariant: only couriers can log transit and delivery transitions
    if (newStatus == ProductStatus.IN_TRANSIT || newStatus == ProductStatus.DELIVERED) {
        require(couriers[msg.sender] || msg.sender == admin, "Unauthorized: Courier only");
    }

    products[productId].status = newStatus; 
    productCustody[productId].push(CustodyEvent({
        eventType: eventType,
        actor: msg.sender,
        actorRole: actorRole, 
        location: location,
        dataHash: dataHash,
        timestamp: block.timestamp
    }));

    emit CustodyUpdated(productId, eventType, msg.sender, newStatus, block.timestamp);
}
```

#### 5.2.5. Verification Verdict and Fraud Flagging
```solidity
function verifyReturn(
    string calldata returnId, 
    VerificationResult outcome, 
    bytes32 inspectionNotesHash
) external onlyReturnCenter {
    require(returnItems[returnId].exists, "ReturnChain: Return request not found"); 
    ReturnItem storage ret = returnItems[returnId];
    require(ret.outcome == VerificationResult.PENDING, "ReturnChain: Return already evaluated");

    ret.outcome = outcome;
    ret.inspectionNotesHash = inspectionNotesHash; 
    ret.verifiedAt = block.timestamp;

    if (outcome == VerificationResult.VERIFIED) { 
        products[ret.productId].status = ProductStatus.RETURN_VERIFIED;
    } else if (outcome == VerificationResult.SUSPICIOUS) { 
        products[ret.productId].status = ProductStatus.RETURN_FLAGGED;
    }

    emit ReturnVerified(returnId, ret.productId, outcome, block.timestamp);
}
```

---

### 5.3. Backend Orchestration and Ethers.js Blockchain Service

The backend communicates with the deployed contract through a centralized service class, [`backend/services/blockchainService.js`](file:///c:/Users/harik/OneDrive/Desktop/blockchain/backend/services/blockchainService.js):

```javascript
// backend/services/blockchainService.js (excerpt)
const { ethers } = require("ethers"); 
const fs = require("fs");
const path = require("path");

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl); 
    this.contractConfigPath = path.join(__dirname, "../config/contractConfig.json"); 
    this.initContract();
  }

  initContract() {
    if (fs.existsSync(this.contractConfigPath)) {
      const config = JSON.parse(fs.readFileSync(this.contractConfigPath, "utf8"));
      this.contractAddress = config.address;
      this.abi = config.abi;
      // Wallet used for Return Center inspections
      this.returnCenterWallet = new ethers.Wallet(process.env.RETURN_CENTER_PRIVATE_KEY, this.provider); 
      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.returnCenterWallet);
    }
  }

  async verifyReturn(returnId, outcomeCode, inspectionHash) {
    const tx = await this.contract.verifyReturn(returnId, outcomeCode, inspectionHash);
    const receipt = await tx.wait();
    return {
      transactionHash: receipt.hash, 
      blockNumber: receipt.blockNumber, 
      gasUsed: receipt.gasUsed.toString()
    };
  }
}

module.exports = new BlockchainService();
```

---

### 5.4. Frontend Web Application and Verification Center
The frontend is built with React and communicates with the backend through REST endpoints protected by JWT:
* **Sellers:** Mint product passports and print QR codes for packaging.
* **Couriers & Return Centers:** Update the custody timeline through dedicated action modals.
* **Customers:** View order history, submit returns, and track refund approval.
* **Verification Center:** Guides inspectors through scanning the QR tag, entering the physical serial number, and completing the condition checklist.
* **Public Gateway (`/verify/:id`):** Displays verified history without any personal data.

---

### 5.5. End-to-End Workflow Diagram

```
+----------+      +---------+      +----------------+      +-----------------+      +--------------------+      +------------------+
| Customer |      | Courier |      | Return Center  |      | Express Backend |      | 10-Rule Fraud Eng. |      | ReturnChain.sol  |
+----+-----+      +----+----+      +-------+--------+      +--------+--------+      +---------+----------+      +--------+---------+
     |                 |                   |                        |                         |                          |
     | POST /api/returns                   |                        |                         |                          |
     |─────────────────────────────────────────────────────────────>| requestReturn()         |                          |
     |                 |                   |                        |───────────────────────────────────────────────────>|
     |                 |                   |                        |                         |                          |
     |                 | PUT /custody/event (RETURN_IN_TRANSIT)     |                         |                          |
     |                 |───────────────────────────────────────────>| recordCustodyEvent()    |                          |
     |                 |                   |                        |───────────────────────────────────────────────────>|
     |                 |                   |                        |                         |                          |
     |                 |                   | Scan QR & Serial       |                         |                          |
     |                 |                   | POST /verify           |                         |                          |
     |                 |                   |───────────────────────>| evaluate()              |                          |
     |                 |                   |                        |────────────────────────>|                          |
     |                 |                   |                        |<────────────────────────|                          |
     |                 |                   |                        | Verdict: VERIFIED/SUSP  |                          |
     |                 |                   |                        |                         |                          |
     |                 |                   |                        | verifyReturn(outcome)   |                          |
     |                 |                   |                        |───────────────────────────────────────────────────>|
     |                 |                   |                        |                         |  Emit ReturnVerified     |
     |                 |                   |<───────────────────────|                         |                          |
     | Refund Approved |                   | UI Display Verdict     |                         |                          |
     |<────────────────────────────────────|                        |                         |                          |
```

---

# 6. BENEFITS & STRATEGIC ADVANTAGES

1. **Elimination of Product Substitution Fraud:** By checking the physical serial number against the genesis passport stored in the smart contract, the system immediately flags swapped or counterfeit items.
2. **Cryptographic Chain-of-Custody Continuity:** Tracking all 11 lifecycle milestones creates an auditable chain of custody. If a product is stolen or swapped in transit, the system shows the carrier and custody window where the discrepancy occurred.
3. **Automated Rule-Based Decision Making:** The 10-rule fraud detection engine automates intake decisions and removes subjective judgment from the process.
4. **Complete Customer Privacy Preservation (Zero-PII):** Public product passports are resolved through a public gateway without exposing customer names, delivery addresses, or payment details, complying with GDPR and CCPA.
5. **Mitigation of Internal Database Tampering:** Verification verdicts and fraud flags are committed to the blockchain, so an insider cannot silently change return records in the database.
6. **Streamlined Second-Hand Market Trust:** Buyers in secondary markets can scan an item’s QR code to verify its registered seller, registration date, and recorded custody history before purchase.
7. **Accelerated Legitimate Refund Processing:** Genuine returns that pass all ten rules are cleared immediately, so honest customers receive automated refunds without manual review delays.
8. **Operational Cost Reduction and Paperless Workflow:** Digital records reduce return packing slips, paper warranty cards, and manual return logging.
9. **Comprehensive Audit Logging for Loss Prevention Teams:** Loss-prevention personnel can use an indexed audit explorer that links transaction receipts, block numbers, and intake inspection records.
10. **Single Unified Multi-Stakeholder Ecosystem:** Merchants, couriers, return centers, and customers coordinate on one verifiable platform without needing access to each other’s private internal databases.

---

# 7. CHALLENGES & MITIGATION STRATEGIES

| No. | Challenge | ReturnChain Mitigation Strategy |
| :---: | :--- | :--- |
| **1** | **Physical-to-digital tampering** *(tag peeling or duplication)* | Use serialized, tamper-evident QR tags, embedded NFC microchips, or RFID hardware threads. |
| **2** | **EVM gas cost and scalability** | Use Layer-2 rollups (Polygon, Arbitrum) or enterprise Proof-of-Authority networks with very low gas fees. |
| **3** | **Enterprise ERP integration** *(legacy SAP / Oracle)* | Provide bi-directional REST webhooks and message queues (RabbitMQ / Kafka) to synchronize events with legacy platforms. |
| **4** | **Private key security** *(risk of leaked credentials)* | Use AWS KMS or HashiCorp Vault hardware security modules with multi-signature governance (e.g., Gnosis Safe). |
| **5** | **Offline intake buffer** *(warehouse connectivity drops)* | Cache scans locally in the browser (IndexedDB) and commit them on-chain when connectivity is restored. |
| **6** | **Subjective physical condition assessment** *(disputed cosmetic wear)* | Combine standardized checklist enums with hashes of high-resolution intake inspection photographs. |
| **7** | **Return dispute arbitration** *(customer appeals)* | Built-in administrative fraud-resolution workflow with tamper-evident audit logs and clear evidence packages. |

---

# 8. CONCLUSION & FUTURE OUTLOOK

### 8.1. Summary of Achievements
This report presented **ReturnChain**, a blockchain-based system for preventing e-commerce return fraud. By combining a Solidity smart contract (`ReturnChain.sol`), an Express and Node.js backend with Ethers.js, a MongoDB off-chain store, and a React frontend, the platform verifies the physical product and its recorded custody instead of relying only on order numbers. In summary, the system:
* Replaces mutable database records with immutable on-chain digital product passports;
* Enforces custody integrity across an 11-milestone state machine;
* Automates intake inspection through a deterministic 10-rule fraud detection engine;
* Restricts every action to authorized roles through smart contract modifiers;
* Protects customer privacy through zero-PII public verification; and
* Has been validated with an automated test suite for the contract logic and fraud rules.

### 8.2. Future Outlook for Enhancements
* **Computer-vision inspection:** Automated image classification to detect cosmetic defects and verify serial-number typography before contract calls are made.
* **NFC / RFID silicon tagging:** Replacing printed QR stickers with encrypted NFC chips embedded in product enclosures during manufacturing.
* **Layer-2 rollups and zero-knowledge proofs:** Deployment on zk-rollups for high throughput, using zk-SNARKs to prove genuine ownership without revealing merchant identities.
* **Cross-border customs integration:** Linking product passports with international shipping manifests to automate customs clearance and duty drawbacks on returned imports.

---

# 9. SDGS ADDRESSED

ReturnChain supports several United Nations Sustainable Development Goals (SDGs) by improving transparency, accountability, and digital innovation in retail logistics:

* **SDG 12: Responsible Consumption and Production (Target 12.5):** Return fraud and the cost of verifying authenticity push retailers to discard returned goods. Instant provenance verification makes refurbishment, resale, and reuse easier, extending product lifetimes and reducing retail waste.
* **SDG 9: Industry, Innovation, and Infrastructure (Targets 9.1 and 9.b):** The system upgrades logistics infrastructure by bringing blockchain ledgers and smart contract automation into supply chains, promoting secure and efficient digital infrastructure.
* **SDG 16: Peace, Justice, and Strong Institutions (Targets 16.5 and 16.6):** Tamper-evident audit trails of custody hand-offs reduce commercial fraud, help counter organized retail crime, and build trust among consumers, merchants, and carriers.

---

# 10. REFERENCES

1. **Wood, G. (2014).** *Ethereum: A Secure Decentralised Generalised Transaction Ledger (Yellow Paper).* Available at: [https://ethereum.github.io/yellowpaper/paper.pdf](https://ethereum.github.io/yellowpaper/paper.pdf)
2. **Solidity Documentation.** *Solidity Language Documentation (v0.8.24).* Available at: [https://docs.soliditylang.org/](https://docs.soliditylang.org/)
3. **Hardhat.** *Hardhat Documentation, Nomic Foundation.* Available at: [https://hardhat.org/docs](https://hardhat.org/docs)
4. **Ethers.js.** *Ethers.js Documentation (v6).* Available at: [https://docs.ethers.org/](https://docs.ethers.org/)
5. **MongoDB.** *MongoDB Atlas and Mongoose Documentation.* Available at: [https://www.mongodb.com/docs/](https://www.mongodb.com/docs/)
6. **React.** *React Documentation.* Available at: [https://react.dev/](https://react.dev/)
7. **Express.js.** *Express.js Documentation.* Available at: [https://expressjs.com/](https://expressjs.com/)
8. **Tailwind CSS.** *Tailwind CSS Documentation.* Available at: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
9. **OpenZeppelin.** *Smart Contract Security and Access Control Documentation.* Available at: [https://docs.openzeppelin.com/](https://docs.openzeppelin.com/)
10. **National Retail Federation (NRF) and Appriss Retail.** *Consumer Returns in the Retail Industry (2023 report on return fraud).*
11. **NIST.** *Special Publication 800-207: Zero Trust Architecture. National Institute of Standards and Technology.* Available at: [https://csrc.nist.gov/publications/detail/sp/800-207/final](https://csrc.nist.gov/publications/detail/sp/800-207/final)
12. **United Nations.** *The 17 Sustainable Development Goals.* Available at: [https://sdgs.un.org/goals](https://sdgs.un.org/goals)

---

# 11. APPENDIX A: PROJECT LINKS & PRESENTATION

* **Project GitHub Repository:** [https://github.com/HARICH529/Blockchain](https://github.com/HARICH529/Blockchain)
* **Video Presentation of the Project:** [https://drive.google.com/file/d/15377xtzfBLrpEmr5hEKREk8y44TWsu3U/view?usp=sharing](https://drive.google.com/file/d/15377xtzfBLrpEmr5hEKREk8y44TWsu3U/view?usp=sharing)
