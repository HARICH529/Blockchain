// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReturnChain
 * @notice Blockchain-Based Product Identity & Chain-of-Custody System for E-Commerce Return Fraud Prevention.
 * @dev Manages product lifecycle, custody milestones, return requests, verification, and fraud detection flags.
 */
contract ReturnChain {
    // --- Roles ---
    address public admin;
    mapping(address => bool) public sellers;
    mapping(address => bool) public couriers;
    mapping(address => bool) public returnCenters;

    // --- Enums ---
    enum ProductStatus {
        REGISTERED,          // 0: Created by seller
        ASSIGNED_WAREHOUSE,  // 1: Allocated to warehouse/seller staging
        DISPATCHED,          // 2: Dispatched for original customer delivery
        IN_TRANSIT,          // 3: In transit by courier
        DELIVERED,           // 4: Successfully delivered to customer
        RETURN_REQUESTED,    // 5: Return requested by customer
        RETURN_IN_TRANSIT,   // 6: Courier picked up return package
        RETURN_RECEIVED,     // 7: Return package received at Return Center
        RETURN_VERIFIED,     // 8: Inspected & verified genuine
        RETURN_FLAGGED,      // 9: Flagged as suspicious / fraud mismatch
        REFUNDED             // 10: Refund authorized and finalized
    }

    enum VerificationResult {
        PENDING,       // 0: Not yet verified
        VERIFIED,      // 1: Genuine match (Green)
        SUSPICIOUS,    // 2: Fraud / Mismatch detected (Red)
        MANUAL_REVIEW  // 3: Inconclusive / Inspection needs manual audit (Amber)
    }

    enum FraudRiskLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    // --- Structs ---
    struct CustodyEvent {
        string eventType;      // e.g. "DISPATCHED", "COURIER_PICKUP", "DELIVERED", etc.
        address actor;         // Address who recorded this event
        string actorRole;      // "SELLER", "COURIER", "RETURN_CENTER", "ADMIN"
        string location;       // City / Hub / Facility reference
        bytes32 dataHash;      // Hash of off-chain metadata (payload hash)
        uint256 timestamp;     // Block timestamp
    }

    struct Product {
        string productId;      // e.g. "RC-PROD-1001"
        string serialNumber;   // Unique manufacturer serial
        bytes32 productHash;   // Keccak256 hash of product specs (name, model, mfg)
        address seller;        // Registered seller address
        ProductStatus status;  // Current lifecycle status
        uint256 registeredAt;  // Registration block timestamp
        bool exists;           // Existence flag
    }

    struct ReturnItem {
        string returnId;              // e.g. "RC-RET-5001"
        string productId;             // Linked product ID
        string orderId;               // Linked order ID
        address customer;             // Initiating customer address or wallet
        string reason;                // Reason for return
        VerificationResult outcome;   // Verification outcome
        bytes32 inspectionNotesHash;  // Hash of physical inspection findings
        uint256 createdAt;            // Return creation timestamp
        uint256 verifiedAt;           // Verification timestamp
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

    // --- State Mappings ---
    mapping(string => Product) private products;
    mapping(string => CustodyEvent[]) private productCustody;
    mapping(string => ReturnItem) private returnItems;
    mapping(string => FraudCase) private fraudCases;
    mapping(string => string) private serialToProductId; // Mapping for duplicate serial prevention

    string[] private allProductIds;
    string[] private allReturnIds;
    string[] private allFraudCaseIds;

    // --- Events ---
    event RoleGranted(string role, address indexed account);
    event RoleRevoked(string role, address indexed account);
    event ProductRegistered(string indexed productId, string serialNumber, address indexed seller, uint256 timestamp);
    event CustodyUpdated(string indexed productId, string eventType, address indexed actor, string actorRole, uint256 timestamp);
    event ProductDelivered(string indexed productId, string orderId, address indexed courier, uint256 timestamp);
    event ReturnCreated(string indexed returnId, string indexed productId, string orderId, address indexed customer, uint256 timestamp);
    event ReturnReceived(string indexed returnId, string indexed productId, address indexed returnCenter, uint256 timestamp);
    event ReturnVerified(string indexed returnId, string indexed productId, VerificationResult outcome, address indexed verifier, uint256 timestamp);
    event FraudFlagged(string indexed caseId, string indexed returnId, string indexed productId, string triggeredRule, FraudRiskLevel riskLevel, uint256 timestamp);
    event FraudCaseResolved(string indexed caseId, string resolutionNotes, address indexed resolver, uint256 timestamp);

    // --- Custom Errors ---
    error Unauthorized(string message);
    error ProductAlreadyExists(string productId);
    error ProductDoesNotExist(string productId);
    error SerialAlreadyRegistered(string serialNumber);
    error InvalidStateTransition(string productId, ProductStatus currentStatus);
    error ReturnAlreadyExists(string returnId);
    error ReturnDoesNotExist(string returnId);
    error FraudCaseAlreadyExists(string caseId);
    error FraudCaseDoesNotExist(string caseId);
    error InvalidInput(string field);

    // --- Modifiers ---
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized("Caller is not admin");
        _;
    }

    modifier onlySeller() {
        if (!sellers[msg.sender] && msg.sender != admin) revert Unauthorized("Caller is not authorized seller");
        _;
    }

    modifier onlyCourier() {
        if (!couriers[msg.sender] && msg.sender != admin) revert Unauthorized("Caller is not authorized courier");
        _;
    }

    modifier onlyReturnCenter() {
        if (!returnCenters[msg.sender] && msg.sender != admin) revert Unauthorized("Caller is not authorized return center");
        _;
    }

    // --- Constructor ---
    constructor() {
        admin = msg.sender;
        sellers[msg.sender] = true;
        couriers[msg.sender] = true;
        returnCenters[msg.sender] = true;
    }

    // --- Role Management ---
    function grantRole(string calldata role, address account) external onlyAdmin {
        if (account == address(0)) revert InvalidInput("account");
        bytes32 roleHash = keccak256(abi.encodePacked(role));
        if (roleHash == keccak256(abi.encodePacked("SELLER"))) {
            sellers[account] = true;
        } else if (roleHash == keccak256(abi.encodePacked("COURIER"))) {
            couriers[account] = true;
        } else if (roleHash == keccak256(abi.encodePacked("RETURN_CENTER"))) {
            returnCenters[account] = true;
        } else {
            revert InvalidInput("role");
        }
        emit RoleGranted(role, account);
    }

    function revokeRole(string calldata role, address account) external onlyAdmin {
        bytes32 roleHash = keccak256(abi.encodePacked(role));
        if (roleHash == keccak256(abi.encodePacked("SELLER"))) {
            sellers[account] = false;
        } else if (roleHash == keccak256(abi.encodePacked("COURIER"))) {
            couriers[account] = false;
        } else if (roleHash == keccak256(abi.encodePacked("RETURN_CENTER"))) {
            returnCenters[account] = false;
        } else {
            revert InvalidInput("role");
        }
        emit RoleRevoked(role, account);
    }

    // --- Product Registration ---
    /**
     * @notice Register a newly minted product identity onto the blockchain.
     */
    function registerProduct(
        string calldata productId,
        string calldata serialNumber,
        bytes32 productHash,
        string calldata location
    ) external onlySeller {
        if (bytes(productId).length == 0) revert InvalidInput("productId");
        if (bytes(serialNumber).length == 0) revert InvalidInput("serialNumber");
        if (products[productId].exists) revert ProductAlreadyExists(productId);
        if (bytes(serialToProductId[serialNumber]).length > 0) revert SerialAlreadyRegistered(serialNumber);

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
        allProductIds.push(productId);

        // Record initial custody milestone
        productCustody[productId].push(CustodyEvent({
            eventType: "PRODUCT_REGISTERED",
            actor: msg.sender,
            actorRole: "SELLER",
            location: location,
            dataHash: productHash,
            timestamp: block.timestamp
        }));

        emit ProductRegistered(productId, serialNumber, msg.sender, block.timestamp);
        emit CustodyUpdated(productId, "PRODUCT_REGISTERED", msg.sender, "SELLER", block.timestamp);
    }

    // --- Custody Updates ---
    /**
     * @notice Records an authorized custody checkpoint in the product's tamper-resistant lifecycle.
     */
    function recordCustody(
        string calldata productId,
        string calldata eventType,
        string calldata actorRole,
        string calldata location,
        bytes32 dataHash,
        ProductStatus newStatus
    ) public {
        if (!products[productId].exists) revert ProductDoesNotExist(productId);

        // Authorization check depending on event role
        bytes32 roleHash = keccak256(abi.encodePacked(actorRole));
        if (roleHash == keccak256(abi.encodePacked("SELLER"))) {
            if (!sellers[msg.sender] && msg.sender != admin) revert Unauthorized("Not seller");
        } else if (roleHash == keccak256(abi.encodePacked("COURIER"))) {
            if (!couriers[msg.sender] && msg.sender != admin) revert Unauthorized("Not courier");
        } else if (roleHash == keccak256(abi.encodePacked("RETURN_CENTER"))) {
            if (!returnCenters[msg.sender] && msg.sender != admin) revert Unauthorized("Not return center");
        } else if (msg.sender != admin) {
            revert Unauthorized("Invalid role actor");
        }

        // Validate state transitions
        Product storage prod = products[productId];
        validateTransition(prod.status, newStatus, productId);

        prod.status = newStatus;
        productCustody[productId].push(CustodyEvent({
            eventType: eventType,
            actor: msg.sender,
            actorRole: actorRole,
            location: location,
            dataHash: dataHash,
            timestamp: block.timestamp
        }));

        emit CustodyUpdated(productId, eventType, msg.sender, actorRole, block.timestamp);
    }

    /**
     * @notice Records delivery to customer. Transition must be legal.
     */
    function recordDelivery(
        string calldata productId,
        string calldata orderId,
        string calldata location,
        bytes32 proofHash
    ) external onlyCourier {
        if (!products[productId].exists) revert ProductDoesNotExist(productId);
        Product storage prod = products[productId];
        
        // Product must be DISPATCHED or IN_TRANSIT to be delivered
        if (prod.status != ProductStatus.DISPATCHED && prod.status != ProductStatus.IN_TRANSIT) {
            revert InvalidStateTransition(productId, prod.status);
        }

        prod.status = ProductStatus.DELIVERED;
        productCustody[productId].push(CustodyEvent({
            eventType: "DELIVERY_CONFIRMED",
            actor: msg.sender,
            actorRole: "COURIER",
            location: location,
            dataHash: proofHash,
            timestamp: block.timestamp
        }));

        emit ProductDelivered(productId, orderId, msg.sender, block.timestamp);
        emit CustodyUpdated(productId, "DELIVERY_CONFIRMED", msg.sender, "COURIER", block.timestamp);
    }

    // --- Return Lifecycle ---
    /**
     * @notice Registers a return request. The product MUST be in DELIVERED state.
     */
    function createReturn(
        string calldata returnId,
        string calldata productId,
        string calldata orderId,
        string calldata reason
    ) external {
        if (bytes(returnId).length == 0) revert InvalidInput("returnId");
        if (returnItems[returnId].exists) revert ReturnAlreadyExists(returnId);
        if (!products[productId].exists) revert ProductDoesNotExist(productId);

        Product storage prod = products[productId];
        if (prod.status != ProductStatus.DELIVERED) {
            revert InvalidStateTransition(productId, prod.status);
        }

        prod.status = ProductStatus.RETURN_REQUESTED;
        returnItems[returnId] = ReturnItem({
            returnId: returnId,
            productId: productId,
            orderId: orderId,
            customer: msg.sender,
            reason: reason,
            outcome: VerificationResult.PENDING,
            inspectionNotesHash: bytes32(0),
            createdAt: block.timestamp,
            verifiedAt: 0,
            exists: true
        });
        allReturnIds.push(returnId);

        productCustody[productId].push(CustodyEvent({
            eventType: "RETURN_REQUESTED",
            actor: msg.sender,
            actorRole: "CUSTOMER",
            location: "CUSTOMER_ORIGIN",
            dataHash: keccak256(abi.encodePacked(returnId, reason)),
            timestamp: block.timestamp
        }));

        emit ReturnCreated(returnId, productId, orderId, msg.sender, block.timestamp);
        emit CustodyUpdated(productId, "RETURN_REQUESTED", msg.sender, "CUSTOMER", block.timestamp);
    }

    /**
     * @notice Return Center confirms physical reception of return parcel.
     */
    function recordReturnReceipt(
        string calldata returnId,
        string calldata location,
        bytes32 receiptHash
    ) external onlyReturnCenter {
        if (!returnItems[returnId].exists) revert ReturnDoesNotExist(returnId);
        ReturnItem storage ret = returnItems[returnId];
        Product storage prod = products[ret.productId];

        prod.status = ProductStatus.RETURN_RECEIVED;

        productCustody[ret.productId].push(CustodyEvent({
            eventType: "RETURN_RECEIVED_AT_CENTER",
            actor: msg.sender,
            actorRole: "RETURN_CENTER",
            location: location,
            dataHash: receiptHash,
            timestamp: block.timestamp
        }));

        emit ReturnReceived(returnId, ret.productId, msg.sender, block.timestamp);
        emit CustodyUpdated(ret.productId, "RETURN_RECEIVED_AT_CENTER", msg.sender, "RETURN_CENTER", block.timestamp);
    }

    /**
     * @notice Performs formal verification outcome recording for a return.
     */
    function verifyReturn(
        string calldata returnId,
        VerificationResult outcome,
        bytes32 inspectionNotesHash
    ) external onlyReturnCenter {
        if (!returnItems[returnId].exists) revert ReturnDoesNotExist(returnId);
        ReturnItem storage ret = returnItems[returnId];
        Product storage prod = products[ret.productId];

        ret.outcome = outcome;
        ret.inspectionNotesHash = inspectionNotesHash;
        ret.verifiedAt = block.timestamp;

        string memory eventType;
        if (outcome == VerificationResult.VERIFIED) {
            prod.status = ProductStatus.RETURN_VERIFIED;
            eventType = "RETURN_VERIFIED_GENUINE";
        } else if (outcome == VerificationResult.SUSPICIOUS) {
            prod.status = ProductStatus.RETURN_FLAGGED;
            eventType = "RETURN_FLAGGED_SUSPICIOUS";
        } else {
            // MANUAL_REVIEW: Keep in current status or custom review state
            eventType = "RETURN_HELD_FOR_MANUAL_REVIEW";
        }

        productCustody[ret.productId].push(CustodyEvent({
            eventType: eventType,
            actor: msg.sender,
            actorRole: "RETURN_CENTER",
            location: "RETURN_CENTER_STATION",
            dataHash: inspectionNotesHash,
            timestamp: block.timestamp
        }));

        emit ReturnVerified(returnId, ret.productId, outcome, msg.sender, block.timestamp);
        emit CustodyUpdated(ret.productId, eventType, msg.sender, "RETURN_CENTER", block.timestamp);
    }

    // --- Fraud Flags & Cases ---
    /**
     * @notice Records an explicit fraud investigation case on-chain.
     */
    function flagFraud(
        string calldata caseId,
        string calldata returnId,
        string calldata productId,
        string calldata triggeredRule,
        FraudRiskLevel riskLevel,
        string calldata reason
    ) external onlyReturnCenter {
        if (bytes(caseId).length == 0) revert InvalidInput("caseId");
        if (fraudCases[caseId].exists) revert FraudCaseAlreadyExists(caseId);

        fraudCases[caseId] = FraudCase({
            caseId: caseId,
            returnId: returnId,
            productId: productId,
            triggeredRule: triggeredRule,
            riskLevel: riskLevel,
            reason: reason,
            isResolved: false,
            resolutionNotes: "",
            timestamp: block.timestamp,
            resolvedAt: 0,
            exists: true
        });
        allFraudCaseIds.push(caseId);

        if (products[productId].exists) {
            products[productId].status = ProductStatus.RETURN_FLAGGED;
            productCustody[productId].push(CustodyEvent({
                eventType: "FRAUD_CASE_FLAGGED",
                actor: msg.sender,
                actorRole: "RETURN_CENTER",
                location: "AUDIT_STATION",
                dataHash: keccak256(abi.encodePacked(caseId, triggeredRule, reason)),
                timestamp: block.timestamp
            }));
        }

        emit FraudFlagged(caseId, returnId, productId, triggeredRule, riskLevel, block.timestamp);
    }

    /**
     * @notice Resolves an open fraud investigation case with audited notes.
     */
    function resolveFraudCase(
        string calldata caseId,
        string calldata resolutionNotes
    ) external onlyAdmin {
        if (!fraudCases[caseId].exists) revert FraudCaseDoesNotExist(caseId);
        FraudCase storage fc = fraudCases[caseId];

        fc.isResolved = true;
        fc.resolutionNotes = resolutionNotes;
        fc.resolvedAt = block.timestamp;

        emit FraudCaseResolved(caseId, resolutionNotes, msg.sender, block.timestamp);
    }

    // --- State Validation Helper ---
    function validateTransition(ProductStatus current, ProductStatus next, string memory prodId) internal pure {
        if (current == ProductStatus.REGISTERED) {
            if (next != ProductStatus.ASSIGNED_WAREHOUSE && next != ProductStatus.DISPATCHED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.ASSIGNED_WAREHOUSE) {
            if (next != ProductStatus.DISPATCHED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.DISPATCHED) {
            if (next != ProductStatus.IN_TRANSIT && next != ProductStatus.DELIVERED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.IN_TRANSIT) {
            if (next != ProductStatus.DELIVERED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.DELIVERED) {
            if (next != ProductStatus.RETURN_REQUESTED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.RETURN_REQUESTED) {
            if (next != ProductStatus.RETURN_IN_TRANSIT && next != ProductStatus.RETURN_RECEIVED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.RETURN_IN_TRANSIT) {
            if (next != ProductStatus.RETURN_RECEIVED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.RETURN_RECEIVED) {
            if (next != ProductStatus.RETURN_VERIFIED && next != ProductStatus.RETURN_FLAGGED) {
                revert InvalidStateTransition(prodId, current);
            }
        } else if (current == ProductStatus.RETURN_VERIFIED) {
            if (next != ProductStatus.REFUNDED) {
                revert InvalidStateTransition(prodId, current);
            }
        }
    }

    // --- View Functions ---
    function getProduct(string calldata productId) external view returns (
        string memory id,
        string memory serialNumber,
        bytes32 productHash,
        address seller,
        ProductStatus status,
        uint256 registeredAt,
        bool exists
    ) {
        Product memory p = products[productId];
        return (p.productId, p.serialNumber, p.productHash, p.seller, p.status, p.registeredAt, p.exists);
    }

    function getReturn(string calldata returnId) external view returns (
        string memory id,
        string memory productId,
        string memory orderId,
        address customer,
        string memory reason,
        VerificationResult outcome,
        bytes32 inspectionNotesHash,
        uint256 createdAt,
        uint256 verifiedAt,
        bool exists
    ) {
        ReturnItem memory r = returnItems[returnId];
        return (r.returnId, r.productId, r.orderId, r.customer, r.reason, r.outcome, r.inspectionNotesHash, r.createdAt, r.verifiedAt, r.exists);
    }

    function getFraudCase(string calldata caseId) external view returns (
        string memory id,
        string memory returnId,
        string memory productId,
        string memory triggeredRule,
        FraudRiskLevel riskLevel,
        string memory reason,
        bool isResolved,
        string memory resolutionNotes,
        uint256 timestamp,
        uint256 resolvedAt,
        bool exists
    ) {
        FraudCase memory f = fraudCases[caseId];
        return (f.caseId, f.returnId, f.productId, f.triggeredRule, f.riskLevel, f.reason, f.isResolved, f.resolutionNotes, f.timestamp, f.resolvedAt, f.exists);
    }

    function getProductHistory(string calldata productId) external view returns (CustodyEvent[] memory) {
        return productCustody[productId];
    }

    function getProductCount() external view returns (uint256) {
        return allProductIds.length;
    }

    function getReturnCount() external view returns (uint256) {
        return allReturnIds.length;
    }

    function getFraudCaseCount() external view returns (uint256) {
        return allFraudCaseIds.length;
    }

    function getProductIdByIndex(uint256 index) external view returns (string memory) {
        return allProductIds[index];
    }

    function getReturnIdByIndex(uint256 index) external view returns (string memory) {
        return allReturnIds[index];
    }

    function getFraudCaseIdByIndex(uint256 index) external view returns (string memory) {
        return allFraudCaseIds[index];
    }

    function getProductIdBySerial(string calldata serialNumber) external view returns (string memory) {
        return serialToProductId[serialNumber];
    }
}
