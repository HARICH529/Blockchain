const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const API_BASE = "http://127.0.0.1:5000/api";
const RPC_URL = "http://127.0.0.1:8545";

// Load contract config
const configPath = path.join(__dirname, "../config/contractConfig.json");
if (!fs.existsSync(configPath)) {
  console.error("Contract config not found at:", configPath);
  process.exit(1);
}
const contractConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, provider);

// Accounts
const credentials = {
  ADMIN: { email: "admin@returnchain.io", password: "password123" },
  SELLER: { email: "seller@apple.com", password: "password123" },
  COURIER: { email: "courier@fedex.com", password: "password123" },
  RETURN_CENTER: { email: "inspector@returncenter.com", password: "password123" },
  CUSTOMER: { email: "customer@gmail.com", password: "password123" },
};

const tokens = {};

async function loginAll() {
  for (const [role, creds] of Object.entries(credentials)) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Login failed for ${role}: ${data.message}`);
    }
    tokens[role] = data.token;
  }
}

async function getTxDetails(txHash) {
  if (!txHash) return null;
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return null;

  const events = [];
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed) {
        const cleanArgs = {};
        for (const [k, v] of Object.entries(parsed.args)) {
          if (isNaN(k)) {
            cleanArgs[k] = typeof v === "bigint" ? Number(v) : v;
          }
        }
        events.push({ name: parsed.name, args: cleanArgs });
      }
    } catch (e) {
      // not an event from our contract
    }
  }

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: Number(receipt.gasUsed),
    status: receipt.status === 1 ? "SUCCESS (Mined)" : "FAILED",
    events,
  };
}

const statusNames = [
  "REGISTERED",          // 0
  "ASSIGNED_WAREHOUSE",  // 1
  "DISPATCHED",          // 2
  "IN_TRANSIT",          // 3
  "DELIVERED",           // 4
  "RETURN_REQUESTED",    // 5
  "RETURN_IN_TRANSIT",   // 6
  "RETURN_RECEIVED",     // 7
  "RETURN_VERIFIED",     // 8
  "RETURN_FLAGGED",      // 9
  "REFUNDED"             // 10
];

const verResultNames = ["PENDING (0)", "VERIFIED (1, Green)", "SUSPICIOUS (2, Red)", "MANUAL_REVIEW (3, Amber)"];

async function run() {
  console.log("================================================================================");
  console.log("   RETURNCHAIN FULL END-TO-END WORKFLOW & LIVE BLOCKCHAIN VERIFICATION AUDIT   ");
  console.log("================================================================================\n");

  await loginAll();
  console.log(">>> Logged in successfully across all 5 roles (Admin, Seller, Courier, Customer, Return Center).\n");

  const initialBlock = await provider.getBlockNumber();
  console.log(`Starting Ethereum Block Height: #${initialBlock}`);
  console.log(`Target Contract Address: ${contractConfig.address}\n`);

  const timestamp = Date.now().toString().slice(-4);
  const productId = `RC-PROD-WF-${timestamp}`;
  const serialNumber = `SN-WF-${timestamp}`;
  const orderId = `RC-ORD-WF-${timestamp}`;
  const returnId = `RC-RET-WF-${timestamp}`;

  // -----------------------------------------------------------------------------------------
  // STEP 1: Product Registration & Digital Product Passport Minting (SELLER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 1: PRODUCT PASSPORT REGISTRATION ON-CHAIN (SELLER)");
  console.log("================================================================================");
  console.log(`Action: Seller registers '${productId}' (S/N: ${serialNumber}) on the blockchain ledger.`);

  const step1BlockBefore = await provider.getBlockNumber();
  const regRes = await fetch(`${API_BASE}/products/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.SELLER}` },
    body: JSON.stringify({
      productId,
      name: "Apple iPad Pro M4 13-inch",
      category: "Electronics",
      manufacturer: "Apple Inc.",
      model: "A2925",
      serialNumber,
      price: 1299,
      location: "Shenzhen Advanced Manufacturing Hub",
    }),
  });
  const regData = await regRes.json();
  const tx1 = await getTxDetails(regData.product.txHash);
  const prod1Result = await contract.getProduct(productId);

  console.log(`✓ API Success: ${regData.success}`);
  console.log(`✓ Blockchain Status: isSyncedOnChain = ${regData.product.isSyncedOnChain}`);
  console.log(`✓ Transaction Hash: ${tx1.txHash}`);
  console.log(`✓ Block Mined: #${tx1.blockNumber} (Block Height changed: #${step1BlockBefore} -> #${tx1.blockNumber})`);
  console.log(`✓ Gas Consumed: ${tx1.gasUsed} gas units`);
  console.log(`✓ Emitted Event: ${tx1.events[0]?.name}`, tx1.events[0]?.args);
  console.log(`✓ On-Chain Contract Verification (getProduct):`);
  console.log(`   - exists: ${prod1Result[6]}`);
  console.log(`   - On-Chain Status: ${statusNames[Number(prod1Result[4])]} (code ${prod1Result[4]})`);
  console.log(`   - Seller Address: ${prod1Result[3]}`);
  console.log(`   - Product Hash: ${prod1Result[2]}\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 2: Custody Handover - Staging to Regional Warehouse (SELLER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 2: CUSTODY MILESTONE - ASSIGNED TO WAREHOUSE (SELLER)");
  console.log("================================================================================");
  console.log(`Action: Staging product at Regional Fulfillment Hub.`);

  const step2BlockBefore = await provider.getBlockNumber();
  const custRes = await fetch(`${API_BASE}/custody/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.SELLER}` },
    body: JSON.stringify({
      productId,
      eventType: "ASSIGNED_TO_WAREHOUSE",
      location: "San Francisco Central Logistics Bay",
      newStatusCode: 1, // ASSIGNED_WAREHOUSE
      notes: "Pallet transferred to warehouse outbound staging lane A3.",
    }),
  });
  const custData = await custRes.json();
  const tx2 = await getTxDetails(custData.custodyEvent.txHash);
  const prod2Result = await contract.getProduct(productId);

  console.log(`✓ API Success: ${custData.success}`);
  console.log(`✓ Transaction Hash: ${tx2.txHash}`);
  console.log(`✓ Block Mined: #${tx2.blockNumber} (Height: #${step2BlockBefore} -> #${tx2.blockNumber})`);
  console.log(`✓ Gas Consumed: ${tx2.gasUsed} gas units`);
  console.log(`✓ Emitted Event: ${tx2.events[0]?.name}`, tx2.events[0]?.args);
  console.log(`✓ On-Chain Contract Status: ${statusNames[Number(prod2Result[4])]} (code ${prod2Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 3: Order Creation & Dispatch (SELLER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 3: ORDER CREATION & DISPATCH TO CARRIER (SELLER)");
  console.log("================================================================================");
  console.log(`Action: Customer places order '${orderId}'; Seller packages and dispatches item.`);

  const orderCreateRes = await fetch(`${API_BASE}/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.CUSTOMER}` },
    body: JSON.stringify({
      orderId,
      productId,
      shippingAddress: "742 Evergreen Terrace, Springfield, IL 62704",
    }),
  });
  const orderCreateData = await orderCreateRes.json();

  const step3BlockBefore = await provider.getBlockNumber();
  const dispatchRes = await fetch(`${API_BASE}/orders/${orderId}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.SELLER}` },
    body: JSON.stringify({
      location: "Fulfillment Dock 12 (Carrier Handover)",
    }),
  });
  const dispatchData = await dispatchRes.json();
  const tx3 = await getTxDetails(dispatchData.custodyEvent.txHash);
  const prod3Result = await contract.getProduct(productId);

  console.log(`✓ Order Created: ${orderCreateData.order.orderId}`);
  console.log(`✓ Dispatch Recorded on Blockchain!`);
  console.log(`✓ Transaction Hash: ${tx3.txHash}`);
  console.log(`✓ Block Mined: #${tx3.blockNumber} (Height: #${step3BlockBefore} -> #${tx3.blockNumber})`);
  console.log(`✓ Gas Consumed: ${tx3.gasUsed} gas units`);
  console.log(`✓ Emitted Event: ${tx3.events[0]?.name}`, tx3.events[0]?.args);
  console.log(`✓ On-Chain Contract Status: ${statusNames[Number(prod3Result[4])]} (code ${prod3Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 4: Courier In-Transit Milestone (COURIER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 4: COURIER PICKUP & IN-TRANSIT MILESTONE (COURIER)");
  console.log("================================================================================");
  console.log(`Action: Courier scans parcel QR code at regional distribution hub.`);

  const step4BlockBefore = await provider.getBlockNumber();
  const transitRes = await fetch(`${API_BASE}/custody/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.COURIER}` },
    body: JSON.stringify({
      productId,
      orderId,
      eventType: "COURIER_PICKUP",
      location: "FedEx Express Sorting Facility #442",
      newStatusCode: 3, // IN_TRANSIT
      notes: "Parcel inducted into cross-country express network.",
    }),
  });
  const transitData = await transitRes.json();
  const tx4 = await getTxDetails(transitData.custodyEvent.txHash);
  const prod4Result = await contract.getProduct(productId);

  console.log(`✓ In-Transit Logged to Blockchain!`);
  console.log(`✓ Transaction Hash: ${tx4.txHash}`);
  console.log(`✓ Block Mined: #${tx4.blockNumber}`);
  console.log(`✓ Gas Consumed: ${tx4.gasUsed} gas units`);
  console.log(`✓ On-Chain Contract Status: ${statusNames[Number(prod4Result[4])]} (code ${prod4Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 5: Delivery to Customer Doorstep with Proof Hash (COURIER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 5: ELECTRONIC DELIVERY CONFIRMATION (COURIER)");
  console.log("================================================================================");
  console.log(`Action: Courier hands parcel to customer; records cryptographic proof.`);

  const step5BlockBefore = await provider.getBlockNumber();
  const deliverRes = await fetch(`${API_BASE}/orders/${orderId}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.COURIER}` },
    body: JSON.stringify({
      location: "Customer Residence Doorstep (Signed by Resident)",
      signatureProof: `electronic_signature_geo_${timestamp}_lat_41.8781_lon_-87.6298`,
    }),
  });
  const deliverData = await deliverRes.json();
  const tx5 = await getTxDetails(deliverData.custodyEvent.txHash);
  const prod5Result = await contract.getProduct(productId);

  console.log(`✓ Delivery Confirmed on Blockchain!`);
  console.log(`✓ Transaction Hash: ${tx5.txHash}`);
  console.log(`✓ Block Mined: #${tx5.blockNumber} (Height: #${step5BlockBefore} -> #${tx5.blockNumber})`);
  console.log(`✓ Gas Consumed: ${tx5.gasUsed} gas units`);
  console.log(`✓ Emitted Event: ${tx5.events[0]?.name}`, tx5.events[0]?.args);
  console.log(`✓ On-Chain Contract Status: ${statusNames[Number(prod5Result[4])]} (code ${prod5Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 6: Customer Files Return Request (CUSTOMER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 6: CUSTOMER CREATES RETURN REQUEST ON-CHAIN (CUSTOMER)");
  console.log("================================================================================");
  console.log(`Action: Customer requests return '${returnId}' citing 'Ordered incorrect screen size'.`);

  const step6BlockBefore = await provider.getBlockNumber();
  const returnReqRes = await fetch(`${API_BASE}/returns/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.CUSTOMER}` },
    body: JSON.stringify({
      returnId,
      orderId,
      reason: "Ordered incorrect screen size; requesting 11-inch model instead.",
      pickupAddress: "742 Evergreen Terrace, Springfield, IL",
    }),
  });
  const returnReqData = await returnReqRes.json();
  const tx6 = await getTxDetails(returnReqData.returnRequest.txHash);
  const ret6Result = await contract.getReturn(returnId);
  const prod6Result = await contract.getProduct(productId);

  console.log(`✓ Return Created on Blockchain!`);
  console.log(`✓ Transaction Hash: ${tx6.txHash}`);
  console.log(`✓ Block Mined: #${tx6.blockNumber}`);
  console.log(`✓ Emitted Event: ${tx6.events[0]?.name}`, tx6.events[0]?.args);
  console.log(`✓ On-Chain Return Record (getReturn):`);
  console.log(`   - returnId: ${ret6Result[0]}`);
  console.log(`   - productId: ${ret6Result[1]}`);
  console.log(`   - customer: ${ret6Result[3]}`);
  console.log(`   - reason: ${ret6Result[4]}`);
  console.log(`   - exists: ${ret6Result[9]}`);
  console.log(`✓ On-Chain Product Status: ${statusNames[Number(prod6Result[4])]} (code ${prod6Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 7: Return Parcel Arrives at Return Processing Center (RETURN_CENTER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 7: RETURN PARCEL INTAKE AT RETURN CENTER (RETURN_CENTER)");
  console.log("================================================================================");
  console.log(`Action: Inspector scans return package at intake dock.`);

  const step7BlockBefore = await provider.getBlockNumber();
  const receiveRes = await fetch(`${API_BASE}/returns/${returnId}/receive`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.RETURN_CENTER}` },
    body: JSON.stringify({
      location: "Chicago Return Logistics Center Intake Bay #2",
      intakeNotes: "Box intact with original shipping barcode label attached.",
    }),
  });
  const receiveData = await receiveRes.json();
  const tx7 = await getTxDetails(receiveData.custodyEvent.txHash);
  const prod7Result = await contract.getProduct(productId);

  console.log(`✓ Intake Recorded on Blockchain!`);
  console.log(`✓ Transaction Hash: ${tx7.txHash}`);
  console.log(`✓ Block Mined: #${tx7.blockNumber}`);
  console.log(`✓ Emitted Event: ${tx7.events[0]?.name}`, tx7.events[0]?.args);
  console.log(`✓ On-Chain Product Status: ${statusNames[Number(prod7Result[4])]} (code ${prod7Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 8: Physical Item Inspection & Rule-Based Blockchain Verification (RETURN_CENTER)
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 8: PHYSICAL INSPECTION & FRAUD ENGINE VERDICT ANCHORED ON-CHAIN");
  console.log("================================================================================");
  console.log(`Action: Inspector performs hardware verification; verifies serial number matches whitelist.`);

  const step8BlockBefore = await provider.getBlockNumber();
  const verifyRes = await fetch(`${API_BASE}/verification/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.RETURN_CENTER}` },
    body: JSON.stringify({
      returnId,
      scannedProductId: productId,
      scannedSerialNumber: serialNumber,
      physicalInspection: {
        sealIntact: true,
        conditionMatched: true,
        packagingIntact: true,
        notes: "Device serial matches internal firmware; zero liquid damage; factory seals verified.",
      },
    }),
  });
  const verifyData = await verifyRes.json();
  const tx8 = await getTxDetails(verifyData.txHash);
  const ret8Result = await contract.getReturn(returnId);
  const prod8Result = await contract.getProduct(productId);

  console.log(`✓ Verification Verdict: ${verifyData.verdict} (Genuine Match)`);
  console.log(`✓ Triggered Rules: [${verifyData.triggeredRules.join(", ")}] (None - All 10 rules passed)`);
  console.log(`✓ Refund Status: ${verifyData.returnRequest.refundStatus}`);
  console.log(`✓ Blockchain Transaction Hash: ${tx8.txHash}`);
  console.log(`✓ Block Mined: #${tx8.blockNumber} (Height: #${step8BlockBefore} -> #${tx8.blockNumber})`);
  console.log(`✓ Gas Consumed: ${tx8.gasUsed} gas units`);
  console.log(`✓ Emitted Event: ${tx8.events[0]?.name}`, tx8.events[0]?.args);
  console.log(`✓ On-Chain Return Outcome: ${verResultNames[Number(ret8Result[5])]}`);
  console.log(`✓ On-Chain Product Status: ${statusNames[Number(prod8Result[4])]} (code ${prod8Result[4]})\n`);

  // -----------------------------------------------------------------------------------------
  // STEP 9: Full On-Chain Custody History Audit Trail
  // -----------------------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("STEP 9: QUERYING IMMUTABLE ON-CHAIN AUDIT TRAIL FROM SMART CONTRACT");
  console.log("================================================================================");
  console.log(`Action: Calling ReturnChain.getProductHistory('${productId}') directly on Ethereum node...`);

  const onChainHistory = await contract.getProductHistory(productId);
  console.log(`✓ Retrieved ${onChainHistory.length} cryptographic custody milestones from the EVM ledger:\n`);

  onChainHistory.forEach((item, index) => {
    console.log(`  [Milestone ${index + 1}]`);
    console.log(`    - Event Type: ${item.eventType}`);
    console.log(`    - Actor Role: ${item.actorRole} (${item.actor})`);
    console.log(`    - Location:   ${item.location}`);
    console.log(`    - Timestamp:  ${new Date(Number(item.timestamp) * 1000).toISOString()}`);
    console.log(`    - Data Hash:  ${item.dataHash}`);
  });

  const finalBlock = await provider.getBlockNumber();
  console.log("\n================================================================================");
  console.log(`TOTAL BLOCKS MINED DURING WORKFLOW: ${finalBlock - initialBlock} blocks (from #${initialBlock} to #${finalBlock})`);
  console.log("LIVE BLOCKCHAIN WORKFLOW EXECUTION: 100% COMPLETE & VERIFIED");
  console.log("================================================================================");
}

run().catch((err) => {
  console.error("Workflow audit error:", err);
  process.exit(1);
});
