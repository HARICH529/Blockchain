# ReturnChain: Architectural Diagrams & Specifications

This document contains editable Mermaid diagrams illustrating the ReturnChain architecture, lifecycle state transitions, data relationships, and the return inspection sequence.

---

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Application (React + Vite + Tailwind CSS)"]
        UI["SaaS Web Application Shell"]
        Dashboard["Analytics Dashboard (Recharts)"]
        ProductUI["Product Passport Management & QR Generation"]
        VerificationCenter["Return Verification Inspection Wizard"]
        FraudUI["Fraud Cases & Investigation Center"]
        AuditUI["Audit Explorer & Blockchain Tracker"]
        PublicVerify["Public Product Passport (/verify/:id)"]
    end

    subgraph APILayer["Backend Server (Express.js + Node.js)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        Controllers["REST Controllers (Products, Orders, Custody, Returns, Fraud)"]
        FraudEngine["Deterministic Rule-Based Fraud Detection Engine"]
        AuditService["Tamper-Proof Audit Logging Service"]
        BCService["Ethers.js Blockchain Service"]
    end

    subgraph DataLayer["Persistence Layer (MongoDB Atlas / Mongoose)"]
        UserCol[("Users Collection")]
        ProdCol[("Products Collection")]
        OrderCol[("Orders Collection")]
        CustodyCol[("Custody Events Collection")]
        ReturnCol[("Return Requests Collection")]
        FraudCol[("Fraud Cases Collection")]
        AuditCol[("Audit Logs Collection")]
    end

    subgraph BlockchainLayer["Smart Contract Layer (Hardhat EVM / Solidity)"]
        ReturnChainSC["ReturnChain.sol Smart Contract"]
        RBACModule["Role-Based Access Control (Admin, Seller, Courier, Center)"]
        PassportRegistry["Product Digital Identity Whitelist"]
        CustodyLedger["Cryptographic Custody Milestones Ledger"]
        VerificationLogger["Return Verification & Fraud Flag Hashes"]
    end

    UI --> AuthMiddleware
    PublicVerify --> Controllers
    AuthMiddleware --> Controllers
    Controllers --> FraudEngine
    Controllers --> AuditService
    Controllers --> BCService
    Controllers --> DataLayer
    BCService --> BlockchainLayer
```

---

## 2. Use-Case Diagram

```mermaid
flowchart LR
    Admin(["Administrator"])
    Seller(["Authorized Seller"])
    Courier(["Logistics Courier"])
    Customer(["Customer / Buyer"])
    ReturnCenter(["Return Center Inspector"])

    subgraph PlatformFunctions["ReturnChain Platform Functions"]
        UC1["Register Product Passport"]
        UC2["Dispatch Order & Staging"]
        UC3["Pickup & Update Transit Custody"]
        UC4["Confirm Delivery with Electronic Signature"]
        UC5["Request Eligible Return"]
        UC6["Receive Return Package at Intake Bay"]
        UC7["Scan QR & Inspect Physical Condition"]
        UC8["Execute 10-Rule Fraud Detection Engine"]
        UC9["Investigate & Resolve Fraud Case"]
        UC10["Manage User Roles & Access"]
        UC11["Verify Public Product Identity (No PII)"]
    end

    Seller --> UC1
    Seller --> UC2
    Courier --> UC3
    Courier --> UC4
    Customer --> UC5
    Customer --> UC11
    ReturnCenter --> UC6
    ReturnCenter --> UC7
    ReturnCenter --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC8
```

---

## 3. Product Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> REGISTERED: Seller registers product passport on blockchain
    REGISTERED --> ASSIGNED_WAREHOUSE: Product allocated to customer order
    ASSIGNED_WAREHOUSE --> DISPATCHED: Seller dispatches outbound shipment
    DISPATCHED --> IN_TRANSIT: Courier picks up package
    IN_TRANSIT --> DELIVERED: Courier confirms delivery to doorstep
    DELIVERED --> RETURN_REQUESTED: Customer files return request
    RETURN_REQUESTED --> RETURN_IN_TRANSIT: Courier picks up return package
    RETURN_IN_TRANSIT --> RETURN_RECEIVED: Return Center intake reception
    RETURN_RECEIVED --> RETURN_VERIFIED: Physical inspection & FraudEngine pass (GREEN)
    RETURN_RECEIVED --> RETURN_FLAGGED: Substitution / Mismatch detected (RED)
    RETURN_RECEIVED --> MANUAL_REVIEW: Damage / Conflicting record (AMBER)
    RETURN_VERIFIED --> REFUNDED: Refund authorized & finalized
    RETURN_FLAGGED --> REFUND_REJECTED: Administrative fraud resolution
    MANUAL_REVIEW --> REFUNDED: Exception approved after manual audit
    REFUNDED --> [*]
```

---

## 4. Return Verification Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Inspector as Return Center Staff
    participant Frontend as Verification Center UI
    participant Backend as Express Backend API
    participant Engine as FraudEngine
    participant Database as MongoDB
    participant Contract as ReturnChain.sol (Hardhat EVM)

    Inspector->>Frontend: Select Return Request (e.g. RC-RET-8001)
    Inspector->>Frontend: Scan physical product QR tag / Enter serial number
    Inspector->>Frontend: Check physical seals & condition
    Inspector->>Frontend: Click "Execute Verification & Fraud Check"
    
    Frontend->>Backend: POST /api/verification/verify {returnId, scannedProductId, serialNumber, checklist}
    Backend->>Database: Query ReturnRequest, Order, Product, CustodyTimeline
    Backend->>Engine: evaluate({returnId, scannedProductId, serialNumber, checklist})
    
    rect rgb(240, 248, 255)
        note over Engine: Engine evaluates all 10 Fraud Rules:<br/>1. Unregistered ID<br/>2. Product ID Mismatch (Substitution)<br/>3. Serial Number Mismatch<br/>4. Wrong Order Association<br/>5. Duplicate Return<br/>6. Return Before Delivery<br/>7. Invalid Custody Continuity<br/>8. Missing Expected Custody Event<br/>9. Return Already Completed<br/>10. Physical Condition Discrepancy
    end

    alt Genuine Return (Scenario A)
        Engine-->>Backend: Verdict: VERIFIED (GREEN), Risk Score: 0
        Backend->>Contract: verifyReturn(returnId, outcome=1, notesHash)
        Contract-->>Backend: Tx confirmed (txHash, blockNumber)
        Backend->>Database: Update Return status: VERIFIED_GENUINE, Refund: REFUND_APPROVED
        Backend->>Database: Append CustodyEvent: RETURN_VERIFIED_GENUINE
    else Product Substitution Fraud (Scenario B)
        Engine-->>Backend: Verdict: SUSPICIOUS (RED), Risk Score: 95
        Backend->>Contract: verifyReturn(returnId, outcome=2, notesHash)
        Backend->>Contract: flagFraud(caseId, returnId, prodId, rules, riskLevel, reason)
        Contract-->>Backend: Tx confirmed (txHash, blockNumber)
        Backend->>Database: Create FraudCase {caseId, triggeredRules, explanation}
        Backend->>Database: Update Return status: FLAGGED_SUSPICIOUS, Refund: FLAGGED_INVESTIGATION
        Backend->>Database: Append CustodyEvent: RETURN_FLAGGED_SUSPICIOUS
    end

    Backend-->>Frontend: Return verdict, risk level, rule breakdown, txHash
    Frontend-->>Inspector: Render high-contrast VERDICT banner (GREEN or RED)
```

---

## 5. Database Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Product : registers
    User ||--o{ Order : places
    User ||--o{ CustodyEvent : records
    User ||--o{ ReturnRequest : submits
    User ||--o{ FraudCase : investigates
    
    Product ||--o{ Order : contains
    Product ||--o{ CustodyEvent : tracks
    Product ||--o{ ReturnRequest : returned_in
    Product ||--o{ FraudCase : referenced_in

    Order ||--o{ ReturnRequest : associated_with

    User {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string role "ADMIN | SELLER | COURIER | CUSTOMER | RETURN_CENTER"
        string walletAddress
        boolean isActive
    }

    Product {
        ObjectId _id PK
        string productId UK
        string name
        string category
        string manufacturer
        string serialNumber UK
        ObjectId seller FK
        number price
        string status
        string productHash
        string txHash
        number blockNumber
    }

    Order {
        ObjectId _id PK
        string orderId UK
        ObjectId product FK
        ObjectId customer FK
        ObjectId seller FK
        ObjectId courier FK
        string status
        Date dispatchedAt
        Date deliveredAt
    }

    CustodyEvent {
        ObjectId _id PK
        string productId
        string orderId
        string eventType
        ObjectId actor FK
        string actorRole
        string location
        string dataHash
        string txHash
        number blockNumber
        Date timestamp
    }

    ReturnRequest {
        ObjectId _id PK
        string returnId UK
        ObjectId order FK
        ObjectId product FK
        ObjectId customer FK
        string reason
        string status
        string verificationOutcome "PENDING | VERIFIED | SUSPICIOUS | MANUAL_REVIEW"
        string refundStatus
        object physicalInspection
        string txHash
    }

    FraudCase {
        ObjectId _id PK
        string caseId UK
        ObjectId returnRequest FK
        ObjectId product FK
        array triggeredRules
        string riskLevel "LOW | MEDIUM | HIGH | CRITICAL"
        string explanation
        string status "OPEN | UNDER_INVESTIGATION | RESOLVED"
        ObjectId assignedInvestigator FK
        string resolutionNotes
        string txHash
    }

    AuditLog {
        ObjectId _id PK
        string auditId UK
        string action
        ObjectId actor FK
        string targetType
        string targetId
        string txHash
        object details
        string status
        Date timestamp
    }
```
