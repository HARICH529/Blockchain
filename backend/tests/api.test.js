const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const assert = require("assert");
const FraudEngine = require("../services/fraudEngine");
const connectDB = require("../config/db");
const mongoose = require("mongoose");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const ReturnRequest = require("../models/ReturnRequest");
const CustodyEvent = require("../models/CustodyEvent");
const FraudCase = require("../models/FraudCase");

async function runApiAndEngineTests() {
  console.log("\n=======================================================");
  console.log(">>> RUNNING RETURNCHAIN BACKEND & VERIFICATION TESTS <<<");
  console.log("=======================================================\n");

  await connectDB();

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  √ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  X FAIL: ${name}`);
      console.error(`    -> ${err.message}`);
      failedCount++;
    }
  }

  // --- Test 1: User Model Password Hashing ---
  await test("1. User password hashing and verification", async () => {
    const user = new User({
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      password: "password123",
      role: "CUSTOMER",
    });
    await user.save();
    assert.strictEqual(await user.comparePassword("password123"), true);
    assert.strictEqual(await user.comparePassword("wrongpass"), false);
    await User.findByIdAndDelete(user._id);
  });

  // --- Test 2: Product Unique ID & Serial Enforcement ---
  await test("2. Product unique ID validation", async () => {
    const pId = `TEST-PROD-${Date.now()}`;
    const p1 = new Product({
      productId: pId,
      name: "Test Phone",
      category: "Electronics",
      manufacturer: "OEM",
      model: "V1",
      serialNumber: `SN-${Date.now()}-A`,
      seller: new mongoose.Types.ObjectId(),
      price: 500,
    });
    await p1.save();

    let threw = false;
    try {
      const p2 = new Product({
        productId: pId,
        name: "Duplicate Phone",
        category: "Electronics",
        manufacturer: "OEM",
        model: "V1",
        serialNumber: `SN-${Date.now()}-B`,
        seller: new mongoose.Types.ObjectId(),
        price: 500,
      });
      await p2.save();
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, true, "Duplicate productId should be rejected");
    await Product.findByIdAndDelete(p1._id);
  });

  // --- Test 3: Custody Event Persistence ---
  await test("3. Custody event record and retrieval", async () => {
    const pId = `TEST-CUSTODY-${Date.now()}`;
    const event = new CustodyEvent({
      productId: pId,
      eventType: "PRODUCT_REGISTERED",
      actorRole: "SELLER",
      location: "Factory Plant #1",
      notes: "Unit inspected and passport generated",
    });
    await event.save();

    const retrieved = await CustodyEvent.findOne({ productId: pId });
    assert.strictEqual(retrieved.eventType, "PRODUCT_REGISTERED");
    assert.strictEqual(retrieved.location, "Factory Plant #1");
    await CustodyEvent.findByIdAndDelete(event._id);
  });

  // --- Test 4: Scenario A - Legitimate Return Verification (GREEN) ---
  await test("4. FraudEngine: Scenario A - Legitimate return matches perfectly (GREEN)", async () => {
    const pId = `RC-PROD-LEGIT-${Date.now()}`;
    const sNum = `SN-LEGIT-${Date.now()}`;
    const retId = `RC-RET-LEGIT-${Date.now()}`;
    const ordId = `RC-ORD-LEGIT-${Date.now()}`;

    const prod = await Product.create({
      productId: pId,
      name: "Genuine Apple iPhone",
      category: "Electronics",
      manufacturer: "Apple Inc.",
      model: "A3101",
      serialNumber: sNum,
      seller: new mongoose.Types.ObjectId(),
      price: 999,
      status: "RETURN_RECEIVED",
    });

    const order = await Order.create({
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: new mongoose.Types.ObjectId(),
      seller: prod.seller,
      totalAmount: 999,
      status: "DELIVERED",
    });

    // Create genesis and delivery custody milestones
    await CustodyEvent.create({
      productId: pId,
      orderId: ordId,
      eventType: "PRODUCT_REGISTERED",
      actorRole: "SELLER",
      location: "Factory Plant #1",
    });

    await CustodyEvent.create({
      productId: pId,
      orderId: ordId,
      eventType: "DELIVERY_CONFIRMED",
      actorRole: "COURIER",
      location: "Customer Residence",
    });

    const returnReq = await ReturnRequest.create({
      returnId: retId,
      order: order._id,
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: order.customer,
      reason: "Defective screen",
      status: "RECEIVED_AT_CENTER",
      verificationOutcome: "PENDING",
      refundStatus: "PENDING_VERIFICATION",
    });

    const evaluation = await FraudEngine.evaluate({
      returnId: retId,
      scannedProductId: pId, // Matching ID
      scannedSerialNumber: sNum, // Matching Serial
      physicalInspection: { sealIntact: true, conditionMatched: true, packagingIntact: true },
    });

    assert.strictEqual(evaluation.verdict, "VERIFIED", "Legitimate return must produce VERIFIED (GREEN)");
    assert.strictEqual(evaluation.riskLevel, "LOW");
    assert.strictEqual(evaluation.triggeredRules.length, 0);

    // Clean up
    await Promise.all([
      Product.findByIdAndDelete(prod._id),
      Order.findByIdAndDelete(order._id),
      ReturnRequest.findByIdAndDelete(returnReq._id),
      CustodyEvent.deleteMany({ productId: pId }),
    ]);
  });

  // --- Test 5: Scenario B - Product Substitution Fraud (RED) ---
  await test("5. FraudEngine: Scenario B - Product substitution detected (RED)", async () => {
    const expectedPId = `RC-PROD-EXP-${Date.now()}`;
    const substitutedPId = `RC-PROD-SUB-${Date.now()}`;
    const retId = `RC-RET-SUB-${Date.now()}`;
    const ordId = `RC-ORD-SUB-${Date.now()}`;

    const expectedProd = await Product.create({
      productId: expectedPId,
      name: "High Value Laptop",
      category: "Computing",
      manufacturer: "Apple",
      model: "MacBook",
      serialNumber: `SN-EXP-${Date.now()}`,
      seller: new mongoose.Types.ObjectId(),
      price: 2000,
      status: "RETURN_RECEIVED",
    });

    const subProd = await Product.create({
      productId: substitutedPId,
      name: "Cheap Substitute Unit",
      category: "Computing",
      manufacturer: "Generic",
      model: "CheapBook",
      serialNumber: `SN-SUB-${Date.now()}`,
      seller: new mongoose.Types.ObjectId(),
      price: 50,
      status: "REGISTERED",
    });

    const order = await Order.create({
      orderId: ordId,
      product: expectedProd._id,
      productId: expectedPId,
      customer: new mongoose.Types.ObjectId(),
      seller: expectedProd.seller,
      totalAmount: 2000,
      status: "DELIVERED",
    });

    await CustodyEvent.create({
      productId: expectedPId,
      orderId: ordId,
      eventType: "DELIVERY_CONFIRMED",
      actorRole: "COURIER",
      location: "Customer Residence",
    });

    const returnReq = await ReturnRequest.create({
      returnId: retId,
      order: order._id,
      orderId: ordId,
      product: expectedProd._id,
      productId: expectedPId,
      customer: order.customer,
      reason: "Defective touchpad",
      status: "RECEIVED_AT_CENTER",
      verificationOutcome: "PENDING",
      refundStatus: "PENDING_VERIFICATION",
    });

    // Scanner scans the substituted product!
    const evaluation = await FraudEngine.evaluate({
      returnId: retId,
      scannedProductId: substitutedPId,
      scannedSerialNumber: subProd.serialNumber,
    });

    assert.strictEqual(evaluation.verdict, "SUSPICIOUS", "Substitution must produce SUSPICIOUS (RED)");
    assert.strictEqual(evaluation.triggeredRules.includes("PRODUCT_ID_MISMATCH"), true);
    assert.strictEqual(evaluation.riskLevel, "CRITICAL");

    // Clean up
    await Promise.all([
      Product.findByIdAndDelete(expectedProd._id),
      Product.findByIdAndDelete(subProd._id),
      Order.findByIdAndDelete(order._id),
      ReturnRequest.findByIdAndDelete(returnReq._id),
      CustodyEvent.deleteMany({ productId: expectedPId }),
    ]);
  });

  // --- Test 6: Serial Number Mismatch Detection ---
  await test("6. FraudEngine: Serial number mismatch flagged as SUSPICIOUS", async () => {
    const pId = `RC-PROD-SN-${Date.now()}`;
    const realSerial = `SN-REAL-${Date.now()}`;
    const fakeSerial = `SN-COUNTERFEIT-${Date.now()}`;
    const retId = `RC-RET-SN-${Date.now()}`;
    const ordId = `RC-ORD-SN-${Date.now()}`;

    const prod = await Product.create({
      productId: pId,
      name: "Flagship Smartphone",
      category: "Electronics",
      manufacturer: "Samsung",
      model: "S24",
      serialNumber: realSerial,
      seller: new mongoose.Types.ObjectId(),
      price: 1100,
      status: "RETURN_RECEIVED",
    });

    const order = await Order.create({
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: new mongoose.Types.ObjectId(),
      seller: prod.seller,
      totalAmount: 1100,
      status: "DELIVERED",
    });

    await CustodyEvent.create({
      productId: pId,
      orderId: ordId,
      eventType: "DELIVERY_CONFIRMED",
      actorRole: "COURIER",
      location: "Customer Residence",
    });

    const returnReq = await ReturnRequest.create({
      returnId: retId,
      order: order._id,
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: order.customer,
      reason: "Overheating",
      status: "RECEIVED_AT_CENTER",
      verificationOutcome: "PENDING",
      refundStatus: "PENDING_VERIFICATION",
    });

    // Scanner passes real productId but scanned physical serial on label is counterfeit!
    const evaluation = await FraudEngine.evaluate({
      returnId: retId,
      scannedProductId: pId,
      scannedSerialNumber: fakeSerial,
    });

    assert.strictEqual(evaluation.verdict, "SUSPICIOUS");
    assert.strictEqual(evaluation.triggeredRules.includes("SERIAL_MISMATCH"), true);

    await Promise.all([
      Product.findByIdAndDelete(prod._id),
      Order.findByIdAndDelete(order._id),
      ReturnRequest.findByIdAndDelete(returnReq._id),
      CustodyEvent.deleteMany({ productId: pId }),
    ]);
  });

  // --- Test 7: Return Before Delivery Flag ---
  await test("7. FraudEngine: Return attempt before delivery milestone flagged", async () => {
    const pId = `RC-PROD-NODELIV-${Date.now()}`;
    const sNum = `SN-NODELIV-${Date.now()}`;
    const retId = `RC-RET-NODELIV-${Date.now()}`;
    const ordId = `RC-ORD-NODELIV-${Date.now()}`;

    const prod = await Product.create({
      productId: pId,
      name: "Tablet Unit",
      category: "Electronics",
      manufacturer: "OEM",
      model: "Tab4",
      serialNumber: sNum,
      seller: new mongoose.Types.ObjectId(),
      price: 300,
      status: "IN_TRANSIT",
    });

    const order = await Order.create({
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: new mongoose.Types.ObjectId(),
      seller: prod.seller,
      totalAmount: 300,
      status: "IN_TRANSIT",
    });

    const returnReq = await ReturnRequest.create({
      returnId: retId,
      order: order._id,
      orderId: ordId,
      product: prod._id,
      productId: pId,
      customer: order.customer,
      reason: "Late shipment",
      status: "REQUESTED",
      verificationOutcome: "PENDING",
      refundStatus: "PENDING_VERIFICATION",
    });

    // Notice: NO DELIVERY_CONFIRMED event was saved!
    const evaluation = await FraudEngine.evaluate({
      returnId: retId,
      scannedProductId: pId,
      scannedSerialNumber: sNum,
    });

    assert.strictEqual(evaluation.triggeredRules.includes("RETURN_BEFORE_DELIVERY"), true);

    await Promise.all([
      Product.findByIdAndDelete(prod._id),
      Order.findByIdAndDelete(order._id),
      ReturnRequest.findByIdAndDelete(returnReq._id),
    ]);
  });

  console.log("\n=======================================================");
  console.log(`>>> TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED <<<`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiAndEngineTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
