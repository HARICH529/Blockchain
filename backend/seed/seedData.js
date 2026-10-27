const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { ethers } = require("ethers");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const CustodyEvent = require("../models/CustodyEvent");
const ReturnRequest = require("../models/ReturnRequest");
const FraudCase = require("../models/FraudCase");
const AuditLog = require("../models/AuditLog");

async function seedAndVerifyAllCollections() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("\n=======================================================");
    console.log(">>> RESETTING & POPULATING COMPREHENSIVE RECORDS IN ALL COLLECTIONS <<<");
    console.log("=======================================================\n");

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      CustodyEvent.deleteMany({}),
      ReturnRequest.deleteMany({}),
      FraudCase.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // ---------------------------------------------------------
    // 1. USERS COLLECTION (All 5 roles + secondary accounts)
    // ---------------------------------------------------------
    console.log("1. Creating Users across all 5 roles...");
    const users = await User.create([
      {
        name: "Security Administrator",
        email: "admin@returnchain.io",
        password: "password123",
        role: "ADMIN",
        organization: "ReturnChain Global Security HQ",
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      },
      {
        name: "Apex Electronics (Authorized Seller)",
        email: "seller@apple.com",
        password: "password123",
        role: "SELLER",
        organization: "Apex Electronics Authorized Distributor",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      },
      {
        name: "Horizon Audio & Tech",
        email: "seller2@horizon.com",
        password: "password123",
        role: "SELLER",
        organization: "Horizon Digital Retailers",
        walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      },
      {
        name: "SwiftLogistics Express (Courier)",
        email: "courier@fedex.com",
        password: "password123",
        role: "COURIER",
        organization: "SwiftLogistics Freight Network",
        walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      },
      {
        name: "MetroShip Couriers",
        email: "courier2@metroship.com",
        password: "password123",
        role: "COURIER",
        organization: "MetroShip Local Delivery Services",
        walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      },
      {
        name: "Chicago Return Processing Center",
        email: "inspector@returncenter.com",
        password: "password123",
        role: "RETURN_CENTER",
        organization: "Return Processing Hub #1 (Midwest)",
        walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
      },
      {
        name: "Sarah Jenkins (Buyer)",
        email: "customer@gmail.com",
        password: "password123",
        role: "CUSTOMER",
        organization: "Retail Consumer",
        walletAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      },
      {
        name: "David Miller (Buyer)",
        email: "david@gmail.com",
        password: "password123",
        role: "CUSTOMER",
        organization: "Retail Consumer",
        walletAddress: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      },
      {
        name: "Elena Rostova (Buyer)",
        email: "elena@gmail.com",
        password: "password123",
        role: "CUSTOMER",
        organization: "Retail Consumer",
        walletAddress: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      },
    ]);

    const admin = users[0];
    const seller1 = users[1];
    const seller2 = users[2];
    const courier1 = users[3];
    const courier2 = users[4];
    const returnCenter = users[5];
    const customer1 = users[6];
    const customer2 = users[7];
    const customer3 = users[8];

    // ---------------------------------------------------------
    // 2. PRODUCTS COLLECTION (8 products across diverse categories)
    // ---------------------------------------------------------
    console.log("2. Creating Products with Digital Identity Passports...");
    const productsData = [
      {
        productId: "RC-PROD-1001",
        name: "Apple iPhone 15 Pro 256GB Titanium",
        category: "Electronics",
        manufacturer: "Apple Inc.",
        model: "A3101",
        serialNumber: "SN-IP15-99881",
        seller: seller1._id,
        price: 1099,
        status: "RETURN_RECEIVED",
        txHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
        blockNumber: 12,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-2001",
        name: "Sony WH-1000XM5 Wireless Headphones",
        category: "Audio",
        manufacturer: "Sony Corporation",
        model: "WH-1000XM5/B",
        serialNumber: "SN-SNY-44332",
        seller: seller2._id,
        price: 399,
        status: "RETURN_RECEIVED",
        txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
        blockNumber: 14,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-2002",
        name: "Generic Wired Earbuds (Cheap Substitute Item)",
        category: "Audio",
        manufacturer: "OEM Generic",
        model: "EP-GEN-01",
        serialNumber: "SN-CHEAP-0012",
        seller: seller2._id,
        price: 12,
        status: "REGISTERED",
        txHash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f",
        blockNumber: 15,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-3001",
        name: "Apple MacBook Air 15 M3 512GB",
        category: "Computing",
        manufacturer: "Apple Inc.",
        model: "M3-MBA15",
        serialNumber: "SN-MBA-77661",
        seller: seller1._id,
        price: 1499,
        status: "REFUNDED",
        txHash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
        blockNumber: 18,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-4001",
        name: "Samsung Galaxy Watch 6 Classic 47mm",
        category: "Wearables",
        manufacturer: "Samsung Electronics",
        model: "SM-R960",
        serialNumber: "SN-GW6-55443",
        seller: seller1._id,
        price: 349,
        status: "IN_TRANSIT",
        txHash: "0x3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b",
        blockNumber: 21,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-5001",
        name: "DJI Mini 4 Pro Drone Fly More Combo",
        category: "Electronics",
        manufacturer: "DJI",
        model: "MT4VD",
        serialNumber: "SN-DJI-88990",
        seller: seller2._id,
        price: 959,
        status: "DELIVERED",
        txHash: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
        blockNumber: 24,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-6001",
        name: "Bose QuietComfort Ultra Noise-Canceling Earbuds",
        category: "Audio",
        manufacturer: "Bose",
        model: "QC-ULTRA-01",
        serialNumber: "SN-BOSE-11223",
        seller: seller2._id,
        price: 299,
        status: "DISPATCHED",
        txHash: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
        blockNumber: 26,
        isSyncedOnChain: true,
      },
      {
        productId: "RC-PROD-7001",
        name: "Dell XPS 16 OLED Intel Core Ultra 9",
        category: "Computing",
        manufacturer: "Dell Technologies",
        model: "XPS-9640",
        serialNumber: "SN-DELL-66554",
        seller: seller1._id,
        price: 2199,
        status: "REGISTERED",
        txHash: "0x6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a",
        blockNumber: 28,
        isSyncedOnChain: true,
      },
    ];

    const products = await Product.create(productsData);
    const prod1 = products[0]; // iPhone 15 Pro
    const prod2 = products[1]; // Sony Headphones
    const prod2Sub = products[2]; // Generic Earbuds
    const prod3 = products[3]; // MacBook Air
    const prod4 = products[4]; // Galaxy Watch
    const prod5 = products[5]; // DJI Drone
    const prod6 = products[6]; // Bose Earbuds
    const prod7 = products[7]; // Dell XPS

    // ---------------------------------------------------------
    // 3. ORDERS COLLECTION (6 orders across different stages)
    // ---------------------------------------------------------
    console.log("3. Creating Customer Orders across all fulfillment states...");
    const orders = await Order.create([
      {
        orderId: "RC-ORD-5001",
        product: prod1._id,
        productId: prod1.productId,
        customer: customer1._id,
        seller: seller1._id,
        courier: courier1._id,
        shippingAddress: {
          street: "124 Concord Avenue",
          city: "Boston",
          state: "MA",
          postalCode: "02138",
          country: "USA",
        },
        totalAmount: 1099,
        status: "DELIVERED",
        dispatchedAt: new Date(Date.now() - 5 * 86400000),
        deliveredAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        orderId: "RC-ORD-5002",
        product: prod2._id,
        productId: prod2.productId,
        customer: customer2._id,
        seller: seller2._id,
        courier: courier1._id,
        shippingAddress: {
          street: "888 Michigan Avenue",
          city: "Chicago",
          state: "IL",
          postalCode: "60611",
          country: "USA",
        },
        totalAmount: 399,
        status: "DELIVERED",
        dispatchedAt: new Date(Date.now() - 6 * 86400000),
        deliveredAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        orderId: "RC-ORD-5003",
        product: prod3._id,
        productId: prod3.productId,
        customer: customer1._id,
        seller: seller1._id,
        courier: courier1._id,
        shippingAddress: {
          street: "124 Concord Avenue",
          city: "Boston",
          state: "MA",
          postalCode: "02138",
          country: "USA",
        },
        totalAmount: 1499,
        status: "RETURNED",
        dispatchedAt: new Date(Date.now() - 12 * 86400000),
        deliveredAt: new Date(Date.now() - 9 * 86400000),
      },
      {
        orderId: "RC-ORD-5004",
        product: prod4._id,
        productId: prod4.productId,
        customer: customer2._id,
        seller: seller1._id,
        courier: courier2._id,
        shippingAddress: {
          street: "500 West Madison St",
          city: "Chicago",
          state: "IL",
          postalCode: "60661",
          country: "USA",
        },
        totalAmount: 349,
        status: "IN_TRANSIT",
        dispatchedAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        orderId: "RC-ORD-5005",
        product: prod5._id,
        productId: prod5.productId,
        customer: customer3._id,
        seller: seller2._id,
        courier: courier2._id,
        shippingAddress: {
          street: "350 5th Avenue",
          city: "New York",
          state: "NY",
          postalCode: "10118",
          country: "USA",
        },
        totalAmount: 959,
        status: "DELIVERED",
        dispatchedAt: new Date(Date.now() - 4 * 86400000),
        deliveredAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        orderId: "RC-ORD-5006",
        product: prod6._id,
        productId: prod6.productId,
        customer: customer3._id,
        seller: seller2._id,
        courier: courier1._id,
        shippingAddress: {
          street: "77 Massachusetts Ave",
          city: "Cambridge",
          state: "MA",
          postalCode: "02139",
          country: "USA",
        },
        totalAmount: 299,
        status: "DISPATCHED",
        dispatchedAt: new Date(Date.now() - 1 * 86400000),
      },
    ]);

    // ---------------------------------------------------------
    // 4. CUSTODY EVENTS COLLECTION (Full chronological milestones)
    // ---------------------------------------------------------
    console.log("4. Creating Chronological Custody Milestones...");
    await CustodyEvent.create([
      // Journey for RC-PROD-1001 (iPhone 15 Pro)
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "PRODUCT_REGISTERED",
        actor: seller1._id,
        actorRole: "SELLER",
        location: "Foxconn Zhengzhou Technology Park",
        dataHash: ethers.keccak256(ethers.toUtf8Bytes(prod1.productId + prod1.serialNumber)),
        txHash: prod1.txHash,
        blockNumber: 12,
        isSyncedOnChain: true,
        notes: "Genesis digital identity minted upon OEM quality clearance.",
        timestamp: new Date(Date.now() - 14 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "ASSIGNED_TO_WAREHOUSE",
        actor: seller1._id,
        actorRole: "SELLER",
        location: "Apex Central Fulfillment Warehouse, Boston MA",
        notes: "Allocated to customer order RC-ORD-5001.",
        timestamp: new Date(Date.now() - 7 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "PRODUCT_DISPATCHED",
        actor: seller1._id,
        actorRole: "SELLER",
        location: "Fulfillment Bay Dock #2",
        txHash: "0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
        blockNumber: 13,
        isSyncedOnChain: true,
        notes: "Outbound transfer to SwiftLogistics courier.",
        timestamp: new Date(Date.now() - 5 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "COURIER_PICKUP",
        actor: courier1._id,
        actorRole: "COURIER",
        location: "SwiftLogistics Boston Sort Facility",
        notes: "Carrier custody confirmed. Tracking SL-992288.",
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "DELIVERY_CONFIRMED",
        actor: courier1._id,
        actorRole: "COURIER",
        location: "124 Concord Ave, Boston MA (Recipient Doorstep)",
        dataHash: ethers.keccak256(ethers.toUtf8Bytes("SignatureProof: Sarah Jenkins")),
        txHash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
        blockNumber: 14,
        isSyncedOnChain: true,
        notes: "Delivered to recipient with digital signature proof.",
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "RETURN_REQUESTED",
        actor: customer1._id,
        actorRole: "CUSTOMER",
        location: "Customer Residence",
        txHash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
        blockNumber: 15,
        isSyncedOnChain: true,
        notes: "Customer reported: Intermittent speaker audio crackle.",
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
      {
        productId: prod1.productId,
        orderId: orders[0].orderId,
        eventType: "RETURN_RECEIVED_AT_CENTER",
        actor: returnCenter._id,
        actorRole: "RETURN_CENTER",
        location: "Chicago Return Processing Hub Bay #1",
        txHash: "0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f",
        blockNumber: 16,
        isSyncedOnChain: true,
        notes: "Outer return parcel arrived intact. Ready for physical inspection.",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },

      // Journey for RC-PROD-2001 (Sony Headphones)
      {
        productId: prod2.productId,
        orderId: orders[1].orderId,
        eventType: "PRODUCT_REGISTERED",
        actor: seller2._id,
        actorRole: "SELLER",
        location: "Sony Electronics Distribution Center",
        dataHash: ethers.keccak256(ethers.toUtf8Bytes(prod2.productId + prod2.serialNumber)),
        txHash: prod2.txHash,
        blockNumber: 14,
        isSyncedOnChain: true,
        notes: "Genuine Sony headphone digital passport minted.",
        timestamp: new Date(Date.now() - 15 * 86400000),
      },
      {
        productId: prod2.productId,
        orderId: orders[1].orderId,
        eventType: "PRODUCT_DISPATCHED",
        actor: seller2._id,
        actorRole: "SELLER",
        location: "Horizon Central Distribution Center, Chicago IL",
        notes: "Dispatched for customer delivery.",
        timestamp: new Date(Date.now() - 6 * 86400000),
      },
      {
        productId: prod2.productId,
        orderId: orders[1].orderId,
        eventType: "DELIVERY_CONFIRMED",
        actor: courier1._id,
        actorRole: "COURIER",
        location: "888 Michigan Ave, Chicago IL",
        dataHash: ethers.keccak256(ethers.toUtf8Bytes("SignatureProof: David Miller")),
        txHash: "0x5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
        blockNumber: 17,
        isSyncedOnChain: true,
        notes: "Delivered to customer reception desk.",
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        productId: prod2.productId,
        orderId: orders[1].orderId,
        eventType: "RETURN_REQUESTED",
        actor: customer2._id,
        actorRole: "CUSTOMER",
        location: "Customer Residence",
        txHash: "0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b",
        blockNumber: 18,
        isSyncedOnChain: true,
        notes: "Customer claims: Bluetooth connection drops.",
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
      {
        productId: prod2.productId,
        orderId: orders[1].orderId,
        eventType: "RETURN_RECEIVED_AT_CENTER",
        actor: returnCenter._id,
        actorRole: "RETURN_CENTER",
        location: "Chicago Return Processing Hub Bay #2",
        txHash: "0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c",
        blockNumber: 19,
        isSyncedOnChain: true,
        notes: "Intake carton checked in. Awaiting physical barcode & seal verification.",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },

      // Journey for RC-PROD-3001 (MacBook Air)
      {
        productId: prod3.productId,
        orderId: orders[2].orderId,
        eventType: "PRODUCT_REGISTERED",
        actor: seller1._id,
        actorRole: "SELLER",
        location: "Apple Factory Shanghai",
        txHash: prod3.txHash,
        blockNumber: 18,
        isSyncedOnChain: true,
        timestamp: new Date(Date.now() - 20 * 86400000),
      },
      {
        productId: prod3.productId,
        orderId: orders[2].orderId,
        eventType: "DELIVERY_CONFIRMED",
        actor: courier1._id,
        actorRole: "COURIER",
        location: "124 Concord Ave, Boston MA",
        txHash: "0x8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
        blockNumber: 19,
        isSyncedOnChain: true,
        timestamp: new Date(Date.now() - 9 * 86400000),
      },
      {
        productId: prod3.productId,
        orderId: orders[2].orderId,
        eventType: "RETURN_VERIFIED_GENUINE",
        actor: returnCenter._id,
        actorRole: "RETURN_CENTER",
        location: "Chicago Return Processing Hub",
        txHash: "0x9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e",
        blockNumber: 20,
        isSyncedOnChain: true,
        notes: "Original Apple factory seal intact. Verified genuine return.",
        timestamp: new Date(Date.now() - 6 * 86400000),
      },

      // Journey for RC-PROD-5001 (DJI Drone)
      {
        productId: prod5.productId,
        orderId: orders[4].orderId,
        eventType: "PRODUCT_REGISTERED",
        actor: seller2._id,
        actorRole: "SELLER",
        location: "DJI Shenzhen Facility",
        txHash: prod5.txHash,
        blockNumber: 24,
        isSyncedOnChain: true,
        timestamp: new Date(Date.now() - 10 * 86400000),
      },
      {
        productId: prod5.productId,
        orderId: orders[4].orderId,
        eventType: "DELIVERY_CONFIRMED",
        actor: courier2._id,
        actorRole: "COURIER",
        location: "350 5th Avenue, New York NY",
        txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        blockNumber: 25,
        isSyncedOnChain: true,
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
    ]);

    // ---------------------------------------------------------
    // 5. RETURN REQUESTS COLLECTION (All outcomes represented)
    // ---------------------------------------------------------
    console.log("5. Creating Return Requests with diverse verification outcomes...");
    const returns = await ReturnRequest.create([
      // Return 1: Scenario A (iPhone 15 Pro, Genuine Match)
      {
        returnId: "RC-RET-8001",
        order: orders[0]._id,
        orderId: orders[0].orderId,
        product: prod1._id,
        productId: prod1.productId,
        customer: customer1._id,
        reason: "Speaker distortion during cellular phone calls",
        conditionReported: "Gently used - defective audio",
        status: "RECEIVED_AT_CENTER",
        verificationOutcome: "PENDING",
        refundStatus: "PENDING_VERIFICATION",
        txHash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
        blockNumber: 15,
        isSyncedOnChain: true,
      },
      // Return 2: Scenario B (Sony Headphones, Substituted with Generic Earbuds)
      {
        returnId: "RC-RET-8002",
        order: orders[1]._id,
        orderId: orders[1].orderId,
        product: prod2._id,
        productId: prod2.productId,
        customer: customer2._id,
        reason: "Bluetooth disconnects frequently",
        conditionReported: "Like new in box",
        status: "RECEIVED_AT_CENTER",
        verificationOutcome: "PENDING",
        refundStatus: "PENDING_VERIFICATION",
        txHash: "0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b",
        blockNumber: 18,
        isSyncedOnChain: true,
      },
      // Return 3: Fully verified and refund approved
      {
        returnId: "RC-RET-7001",
        order: orders[2]._id,
        orderId: orders[2].orderId,
        product: prod3._id,
        productId: prod3.productId,
        customer: customer1._id,
        reason: "Customer ordered incorrect keyboard layout",
        conditionReported: "Unopened box",
        status: "VERIFIED_GENUINE",
        verificationOutcome: "VERIFIED",
        refundStatus: "REFUND_APPROVED",
        physicalInspection: {
          serialNumberScanned: prod3.serialNumber,
          sealIntact: true,
          conditionMatched: true,
          packagingIntact: true,
          inspectorNotes: "Original Apple factory seal intact. Verified genuine passport.",
          inspectedBy: returnCenter._id,
          inspectedAt: new Date(Date.now() - 6 * 86400000),
        },
        txHash: "0x8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
        blockNumber: 20,
        isSyncedOnChain: true,
      },
      // Return 4: Newly requested by customer (in transit)
      {
        returnId: "RC-RET-6001",
        order: orders[4]._id,
        orderId: orders[4].orderId,
        product: prod5._id,
        productId: prod5.productId,
        customer: customer3._id,
        reason: "Gimbal camera calibration error",
        conditionReported: "Gently tested once",
        status: "REQUESTED",
        verificationOutcome: "PENDING",
        refundStatus: "PENDING_VERIFICATION",
        txHash: "0x4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a",
        blockNumber: 27,
        isSyncedOnChain: true,
      },
    ]);

    // ---------------------------------------------------------
    // 6. FRAUD CASES COLLECTION (Representing multiple fraud types)
    // ---------------------------------------------------------
    console.log("6. Creating Fraud Investigation Cases...");
    await FraudCase.create([
      {
        caseId: "RC-CASE-9001",
        returnRequest: returns[1]._id,
        returnId: "RC-RET-8002",
        product: prod2._id,
        productId: prod2.productId,
        triggeredRules: ["PRODUCT_ID_MISMATCH", "SERIAL_MISMATCH"],
        riskLevel: "CRITICAL",
        explanation:
          "High-risk substitution detected: Customer returned cheap generic earbuds (RC-PROD-2002) in place of high-value Sony WH-1000XM5 headphones ($399).",
        evidenceReferences: [
          "Intake Inspection Bay #2 photograph",
          "Scanned Tag: RC-PROD-2002 vs Expected: RC-PROD-2001",
          "Inspector: Chicago Return Processing Hub",
        ],
        status: "OPEN",
        assignedInvestigator: admin._id,
        txHash: "0x9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e",
        blockNumber: 22,
        isSyncedOnChain: true,
      },
      {
        caseId: "RC-CASE-9002",
        returnId: "RC-RET-5544",
        productId: "RC-PROD-9999",
        triggeredRules: ["UNREGISTERED_PRODUCT"],
        riskLevel: "CRITICAL",
        explanation:
          "Unregistered hardware tag: Scanned product ID 'RC-PROD-9999' does not exist in ReturnChain genesis blockchain registry. Counterfeit unit.",
        evidenceReferences: [
          "No smart contract genesis record found",
          "Barcode label printed with non-standard font",
        ],
        status: "UNDER_INVESTIGATION",
        assignedInvestigator: admin._id,
        txHash: "0x1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
        blockNumber: 25,
        isSyncedOnChain: true,
      },
      {
        caseId: "RC-CASE-9003",
        returnId: "RC-RET-4411",
        productId: prod4.productId,
        triggeredRules: ["RETURN_BEFORE_DELIVERY"],
        riskLevel: "HIGH",
        explanation:
          "Invalid custody sequence: Customer filed return before the courier recorded authorized doorstep delivery.",
        evidenceReferences: [
          "Custody ledger shows item still IN_TRANSIT with courier SL-8811",
        ],
        status: "RESOLVED_REJECTED",
        assignedInvestigator: admin._id,
        resolutionNotes:
          "Investigation confirmed package was still in transit. Premature return rejected; customer notified to await delivery.",
        resolvedAt: new Date(Date.now() - 1 * 86400000),
        txHash: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
        blockNumber: 27,
        isSyncedOnChain: true,
      },
    ]);

    // ---------------------------------------------------------
    // 7. AUDIT LOGS COLLECTION (Complete immutable audit trail)
    // ---------------------------------------------------------
    console.log("7. Creating Tamper-Proof Audit Trail...");
    await AuditLog.create([
      {
        auditId: "AUD-1001",
        action: "GENESIS_SYSTEM_INIT",
        actor: admin._id,
        actorName: admin.name,
        actorRole: "ADMIN",
        targetType: "SYSTEM",
        targetId: "ReturnChain-V1",
        txHash: prod1.txHash,
        blockNumber: 1,
        details: { description: "Smart contract registry deployed at 0x5FbDB2315678afecb367f032d93F642f64180aa3." },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 15 * 86400000),
      },
      {
        auditId: "AUD-1002",
        action: "PRODUCT_REGISTERED",
        actor: seller1._id,
        actorName: seller1.name,
        actorRole: "SELLER",
        targetType: "PRODUCT",
        targetId: prod1.productId,
        txHash: prod1.txHash,
        blockNumber: 12,
        details: { name: prod1.name, serial: prod1.serialNumber },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 14 * 86400000),
      },
      {
        auditId: "AUD-1003",
        action: "PRODUCT_REGISTERED",
        actor: seller2._id,
        actorName: seller2.name,
        actorRole: "SELLER",
        targetType: "PRODUCT",
        targetId: prod2.productId,
        txHash: prod2.txHash,
        blockNumber: 14,
        details: { name: prod2.name, serial: prod2.serialNumber },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 15 * 86400000),
      },
      {
        auditId: "AUD-1004",
        action: "ORDER_CREATED",
        actor: customer1._id,
        actorName: customer1.name,
        actorRole: "CUSTOMER",
        targetType: "ORDER",
        targetId: orders[0].orderId,
        details: { productId: prod1.productId, amount: 1099 },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 7 * 86400000),
      },
      {
        auditId: "AUD-1005",
        action: "ORDER_DELIVERED",
        actor: courier1._id,
        actorName: courier1.name,
        actorRole: "COURIER",
        targetType: "ORDER",
        targetId: orders[0].orderId,
        txHash: "0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d",
        blockNumber: 14,
        details: { location: "Boston MA", signatureVerified: true },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        auditId: "AUD-1006",
        action: "RETURN_REQUESTED",
        actor: customer1._id,
        actorName: customer1.name,
        actorRole: "CUSTOMER",
        targetType: "RETURN",
        targetId: returns[0].returnId,
        txHash: "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
        blockNumber: 15,
        details: { reason: returns[0].reason },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 2 * 86400000),
      },
      {
        auditId: "AUD-1007",
        action: "RETURN_VERIFIED_GENUINE",
        actor: returnCenter._id,
        actorName: returnCenter.name,
        actorRole: "RETURN_CENTER",
        targetType: "RETURN",
        targetId: returns[2].returnId,
        txHash: returns[2].txHash,
        blockNumber: 20,
        details: { verdict: "VERIFIED", score: 0 },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 6 * 86400000),
      },
      {
        auditId: "AUD-1008",
        action: "FRAUD_CASE_FLAGGED",
        actor: returnCenter._id,
        actorName: returnCenter.name,
        actorRole: "RETURN_CENTER",
        targetType: "FRAUD_CASE",
        targetId: "RC-CASE-9001",
        txHash: "0x9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e",
        blockNumber: 22,
        details: { rules: ["PRODUCT_ID_MISMATCH", "SERIAL_MISMATCH"], risk: "CRITICAL" },
        status: "WARNING",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
      {
        auditId: "AUD-1009",
        action: "FRAUD_CASE_RESOLVED",
        actor: admin._id,
        actorName: admin.name,
        actorRole: "ADMIN",
        targetType: "FRAUD_CASE",
        targetId: "RC-CASE-9003",
        txHash: "0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b",
        blockNumber: 27,
        details: { resolution: "RESOLVED_REJECTED", note: "Premature return rejected" },
        status: "SUCCESS",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
    ]);

    // ---------------------------------------------------------
    // 8. VERIFY ALL COLLECTIONS
    // ---------------------------------------------------------
    console.log("\n=======================================================");
    console.log(">>> MONGODB COLLECTIONS VERIFICATION AUDIT <<<");
    console.log("=======================================================");

    const counts = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      orders: await Order.countDocuments(),
      custodyEvents: await CustodyEvent.countDocuments(),
      returnRequests: await ReturnRequest.countDocuments(),
      fraudCases: await FraudCase.countDocuments(),
      auditLogs: await AuditLog.countDocuments(),
    };

    console.log(`\n  1. Users Collection:          ${counts.users} records`);
    console.log(`  2. Products Collection:       ${counts.products} records`);
    console.log(`  3. Orders Collection:         ${counts.orders} records`);
    console.log(`  4. CustodyEvents Collection:  ${counts.custodyEvents} records`);
    console.log(`  5. ReturnRequests Collection: ${counts.returnRequests} records`);
    console.log(`  6. FraudCases Collection:     ${counts.fraudCases} records`);
    console.log(`  7. AuditLogs Collection:      ${counts.auditLogs} records`);

    console.log("\n=======================================================");
    console.log(">>> ALL COLLECTIONS ARE FULLY POPULATED & VERIFIED! <<<");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Database seed & verification error:", error);
    process.exit(1);
  }
}

seedAndVerifyAllCollections();
