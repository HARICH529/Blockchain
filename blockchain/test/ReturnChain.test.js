const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReturnChain Smart Contract Suite (JavaScript)", function () {
  let returnChain;
  let admin, seller, courier, returnCenter, customer, unauthorizedUser;

  beforeEach(async function () {
    [admin, seller, courier, returnCenter, customer, unauthorizedUser] = await ethers.getSigners();

    const ReturnChainFactory = await ethers.getContractFactory("ReturnChain");
    returnChain = await ReturnChainFactory.deploy();
    await returnChain.waitForDeployment();

    // Grant roles
    await returnChain.grantRole("SELLER", seller.address);
    await returnChain.grantRole("COURIER", courier.address);
    await returnChain.grantRole("RETURN_CENTER", returnCenter.address);
  });

  describe("Role-Based Access Control", function () {
    it("1. Should deploy with admin having initial roles", async function () {
      expect(await returnChain.admin()).to.equal(admin.address);
      expect(await returnChain.sellers(seller.address)).to.be.true;
      expect(await returnChain.couriers(courier.address)).to.be.true;
      expect(await returnChain.returnCenters(returnCenter.address)).to.be.true;
    });

    it("2. Should reject role granting by non-admin", async function () {
      await expect(
        returnChain.connect(unauthorizedUser).grantRole("SELLER", unauthorizedUser.address)
      ).to.be.revertedWithCustomError(returnChain, "Unauthorized");
    });

    it("3. Should revoke role successfully", async function () {
      await returnChain.revokeRole("SELLER", seller.address);
      expect(await returnChain.sellers(seller.address)).to.be.false;
    });
  });

  describe("Product Registration", function () {
    const prodId = "RC-PROD-1001";
    const serial = "SN-IP15-99881";
    const prodHash = ethers.keccak256(ethers.toUtf8Bytes("iPhone 15 Pro 256GB Titanium"));

    it("4. Successful product registration by authorized seller", async function () {
      await expect(
        returnChain.connect(seller).registerProduct(prodId, serial, prodHash, "Foxconn Factory")
      ).to.emit(returnChain, "ProductRegistered");

      const prod = await returnChain.getProduct(prodId);
      expect(prod.id).to.equal(prodId);
      expect(prod.serialNumber).to.equal(serial);
      expect(prod.seller).to.equal(seller.address);
      expect(prod.status).to.equal(0n); // REGISTERED
      expect(prod.exists).to.be.true;
    });

    it("5. Duplicate product registration rejection", async function () {
      await returnChain.connect(seller).registerProduct(prodId, serial, prodHash, "Foxconn Factory");
      await expect(
        returnChain.connect(seller).registerProduct(prodId, "SN-NEW-1234", prodHash, "Factory 2")
      ).to.be.revertedWithCustomError(returnChain, "ProductAlreadyExists");
    });

    it("6. Duplicate serial number rejection", async function () {
      await returnChain.connect(seller).registerProduct(prodId, serial, prodHash, "Factory 1");
      await expect(
        returnChain.connect(seller).registerProduct("RC-PROD-1002", serial, prodHash, "Factory 2")
      ).to.be.revertedWithCustomError(returnChain, "SerialAlreadyRegistered");
    });

    it("7. Unauthorized caller cannot register product", async function () {
      await expect(
        returnChain.connect(unauthorizedUser).registerProduct(prodId, serial, prodHash, "Unknown")
      ).to.be.revertedWithCustomError(returnChain, "Unauthorized");
    });
  });

  describe("Custody Transitions & Delivery", function () {
    const prodId = "RC-PROD-2001";
    const serial = "SN-SAMS-44332";
    const prodHash = ethers.keccak256(ethers.toUtf8Bytes("Samsung Galaxy S24 Ultra"));

    beforeEach(async function () {
      await returnChain.connect(seller).registerProduct(prodId, serial, prodHash, "Samsung Vietnam Plant");
    });

    it("8. Valid custody transition from REGISTERED to ASSIGNED_WAREHOUSE", async function () {
      await expect(
        returnChain.connect(seller).recordCustody(
          prodId,
          "ASSIGNED_TO_WAREHOUSE",
          "SELLER",
          "Main Fulfillment Center NYC",
          ethers.ZeroHash,
          1 // ASSIGNED_WAREHOUSE
        )
      ).to.emit(returnChain, "CustodyUpdated");

      const prod = await returnChain.getProduct(prodId);
      expect(prod.status).to.equal(1n);
    });

    it("9. Invalid custody transition rejection (skipping straight to DELIVERED)", async function () {
      await expect(
        returnChain.connect(seller).recordCustody(
          prodId,
          "JUMP_TO_DELIVERED",
          "SELLER",
          "Customer House",
          ethers.ZeroHash,
          4 // DELIVERED directly from REGISTERED
        )
      ).to.be.revertedWithCustomError(returnChain, "InvalidStateTransition");
    });

    it("10. Successful delivery recording by courier", async function () {
      await returnChain.connect(seller).recordCustody(
        prodId,
        "PRODUCT_DISPATCHED",
        "SELLER",
        "Warehouse NYC",
        ethers.ZeroHash,
        2 // DISPATCHED
      );

      await returnChain.connect(courier).recordCustody(
        prodId,
        "IN_TRANSIT",
        "COURIER",
        "FedEx Hub NJ",
        ethers.ZeroHash,
        3 // IN_TRANSIT
      );

      await expect(
        returnChain.connect(courier).recordDelivery(
          prodId,
          "RC-ORD-9001",
          "Customer Doorstep Brooklyn",
          ethers.keccak256(ethers.toUtf8Bytes("Customer Signature Proof"))
        )
      ).to.emit(returnChain, "ProductDelivered");

      const prod = await returnChain.getProduct(prodId);
      expect(prod.status).to.equal(4n); // DELIVERED
    });

    it("11. Unauthorized courier cannot record delivery", async function () {
      await returnChain.connect(seller).recordCustody(
        prodId,
        "PRODUCT_DISPATCHED",
        "SELLER",
        "Warehouse NYC",
        ethers.ZeroHash,
        2 // DISPATCHED
      );

      await expect(
        returnChain.connect(unauthorizedUser).recordDelivery(
          prodId,
          "RC-ORD-9001",
          "Doorstep",
          ethers.ZeroHash
        )
      ).to.be.revertedWithCustomError(returnChain, "Unauthorized");
    });
  });

  describe("Return Lifecycle & Verification", function () {
    const prodId = "RC-PROD-3001";
    const serial = "SN-SONY-77112";
    const prodHash = ethers.keccak256(ethers.toUtf8Bytes("Sony WH-1000XM5 Headphones"));
    const returnId = "RC-RET-8001";

    beforeEach(async function () {
      await returnChain.connect(seller).registerProduct(prodId, serial, prodHash, "Sony Distribution Center");
      await returnChain.connect(seller).recordCustody(prodId, "DISPATCHED", "SELLER", "Warehouse", ethers.ZeroHash, 2);
      await returnChain.connect(courier).recordDelivery(prodId, "RC-ORD-5001", "Customer Apt", ethers.ZeroHash);
    });

    it("12. Valid return creation for delivered product", async function () {
      await expect(
        returnChain.connect(customer).createReturn(returnId, prodId, "RC-ORD-5001", "Sound distortion on left earcup")
      ).to.emit(returnChain, "ReturnCreated");

      const ret = await returnChain.getReturn(returnId);
      expect(ret.id).to.equal(returnId);
      expect(ret.productId).to.equal(prodId);
      expect(ret.outcome).to.equal(0n); // PENDING
    });

    it("13. Rejection of return creation if product not yet delivered", async function () {
      const prodId2 = "RC-PROD-3002";
      await returnChain.connect(seller).registerProduct(prodId2, "SN-SONY-77113", prodHash, "Warehouse");

      await expect(
        returnChain.connect(customer).createReturn("RC-RET-8002", prodId2, "RC-ORD-5002", "Changed mind")
      ).to.be.revertedWithCustomError(returnChain, "InvalidStateTransition");
    });

    it("14. Duplicate return rejection", async function () {
      await returnChain.connect(customer).createReturn(returnId, prodId, "RC-ORD-5001", "Defective");
      await expect(
        returnChain.connect(customer).createReturn(returnId, prodId, "RC-ORD-5001", "Duplicate attempt")
      ).to.be.revertedWithCustomError(returnChain, "ReturnAlreadyExists");
    });

    it("15. Return center receives package and verifies as genuine (GREEN)", async function () {
      await returnChain.connect(customer).createReturn(returnId, prodId, "RC-ORD-5001", "Defective");
      
      await returnChain.connect(returnCenter).recordReturnReceipt(
        returnId,
        "Return Processing Hub Chicago",
        ethers.keccak256(ethers.toUtf8Bytes("Intake Scan #1"))
      );

      const notesHash = ethers.keccak256(ethers.toUtf8Bytes("Physical serial matched SN-SONY-77112. Seal intact."));
      await expect(
        returnChain.connect(returnCenter).verifyReturn(returnId, 1, notesHash) // 1 = VERIFIED
      ).to.emit(returnChain, "ReturnVerified");

      const ret = await returnChain.getReturn(returnId);
      expect(ret.outcome).to.equal(1n); // VERIFIED
      const prod = await returnChain.getProduct(prodId);
      expect(prod.status).to.equal(8n); // RETURN_VERIFIED
    });

    it("16. Return center flags suspicious return (RED)", async function () {
      await returnChain.connect(customer).createReturn(returnId, prodId, "RC-ORD-5001", "Defective");
      await returnChain.connect(returnCenter).recordReturnReceipt(returnId, "Return Center", ethers.ZeroHash);

      const notesHash = ethers.keccak256(ethers.toUtf8Bytes("Received different model. Serial mismatch."));
      await returnChain.connect(returnCenter).verifyReturn(returnId, 2, notesHash); // 2 = SUSPICIOUS

      const ret = await returnChain.getReturn(returnId);
      expect(ret.outcome).to.equal(2n); // SUSPICIOUS
      const prod = await returnChain.getProduct(prodId);
      expect(prod.status).to.equal(9n); // RETURN_FLAGGED
    });
  });

  describe("Fraud Flags and Resolution", function () {
    const caseId = "RC-CASE-1001";
    const returnId = "RC-RET-9999";
    const prodId = "RC-PROD-4001";

    it("17. Authorized return center flags fraud case", async function () {
      await expect(
        returnChain.connect(returnCenter).flagFraud(
          caseId,
          returnId,
          prodId,
          "PRODUCT_SUBSTITUTION",
          2, // HIGH risk
          "Customer returned a counterfeit item"
        )
      ).to.emit(returnChain, "FraudFlagged");

      const fc = await returnChain.getFraudCase(caseId);
      expect(fc.id).to.equal(caseId);
      expect(fc.triggeredRule).to.equal("PRODUCT_SUBSTITUTION");
      expect(fc.isResolved).to.be.false;
    });

    it("18. Duplicate fraud case ID is rejected", async function () {
      await returnChain.connect(returnCenter).flagFraud(caseId, returnId, prodId, "RULE_A", 1, "Reason A");
      await expect(
        returnChain.connect(returnCenter).flagFraud(caseId, returnId, prodId, "RULE_B", 1, "Reason B")
      ).to.be.revertedWithCustomError(returnChain, "FraudCaseAlreadyExists");
    });

    it("19. Admin resolves fraud case with audited findings", async function () {
      await returnChain.connect(returnCenter).flagFraud(caseId, returnId, prodId, "RULE_A", 1, "Reason A");
      
      await expect(
        returnChain.connect(admin).resolveFraudCase(caseId, "Investigation confirmed fraudulent package. Account suspended.")
      ).to.emit(returnChain, "FraudCaseResolved");

      const fc = await returnChain.getFraudCase(caseId);
      expect(fc.isResolved).to.be.true;
      expect(fc.resolutionNotes).to.include("Account suspended");
    });

    it("20. Non-admin cannot resolve fraud case", async function () {
      await returnChain.connect(returnCenter).flagFraud(caseId, returnId, prodId, "RULE_A", 1, "Reason A");
      await expect(
        returnChain.connect(seller).resolveFraudCase(caseId, "Unauthorized resolution")
      ).to.be.revertedWithCustomError(returnChain, "Unauthorized");
    });
  });
});
