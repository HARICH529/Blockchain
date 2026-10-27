const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.contractConfigPath = path.join(__dirname, "../config/contractConfig.json");
    this.contract = null;
    this.contractAddress = null;
    this.abi = null;
    this.isConnected = false;

    // Standard Hardhat development private keys
    this.privateKeys = {
      ADMIN: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      SELLER: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      COURIER: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      RETURN_CENTER: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
      CUSTOMER: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    };

    this.wallets = {};
    for (const [role, key] of Object.entries(this.privateKeys)) {
      this.wallets[role] = new ethers.Wallet(key, this.provider);
    }

    this.initContract();
  }

  initContract() {
    try {
      if (fs.existsSync(this.contractConfigPath)) {
        const config = JSON.parse(fs.readFileSync(this.contractConfigPath, "utf8"));
        this.contractAddress = config.address;
        this.abi = config.abi;
        if (this.contractAddress && this.abi) {
          this.contract = new ethers.Contract(this.contractAddress, this.abi, this.wallets.ADMIN);
          console.log(`>>> BlockchainService initialized for contract at: ${this.contractAddress}`);
        }
      } else {
        console.warn(">>> Contract config not found at:", this.contractConfigPath);
      }
    } catch (error) {
      console.warn(">>> Contract initialization warning:", error.message);
    }
  }

  async checkConnection() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      this.isConnected = true;
      return {
        connected: true,
        chainId: Number(network.chainId),
        blockNumber,
        contractAddress: this.contractAddress,
      };
    } catch (error) {
      this.isConnected = false;
      return {
        connected: false,
        error: error.message,
        contractAddress: this.contractAddress,
      };
    }
  }

  getSigner(role = "ADMIN") {
    const normalized = role.toUpperCase();
    return this.wallets[normalized] || this.wallets.ADMIN;
  }

  async registerProduct(productId, serialNumber, productHash, location, role = "SELLER") {
    this.initContract();
    const hash = productHash || ethers.keccak256(ethers.toUtf8Bytes(productId + serialNumber));

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.registerProduct(productId, serialNumber, hash, location || "Factory");
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("registerProduct on-chain failed:", err.message);
        throw err;
      }
    }

    // Fallback if node not connected
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`local_prod_${productId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async recordCustody(productId, eventType, actorRole, location, dataHash, newStatusCode = 1) {
    this.initContract();
    const dHash = dataHash || ethers.ZeroHash;

    if (this.contract) {
      try {
        const signer = this.getSigner(actorRole);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.recordCustody(
          productId,
          eventType,
          actorRole,
          location || "Transit Hub",
          dHash,
          newStatusCode
        );
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("recordCustody on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`custody_${productId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async recordDelivery(productId, orderId, location, proofHash, role = "COURIER") {
    this.initContract();
    const pHash = proofHash || ethers.keccak256(ethers.toUtf8Bytes(`delivery_proof_${orderId}`));

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.recordDelivery(productId, orderId, location || "Customer Address", pHash);
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("recordDelivery on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`delivery_${orderId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async createReturn(returnId, productId, orderId, reason, role = "CUSTOMER") {
    this.initContract();

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.createReturn(returnId, productId, orderId, reason);
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("createReturn on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`return_${returnId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async recordReturnReceipt(returnId, location, receiptHash, role = "RETURN_CENTER") {
    this.initContract();
    const rHash = receiptHash || ethers.ZeroHash;

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.recordReturnReceipt(returnId, location || "Return Processing Center", rHash);
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("recordReturnReceipt on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`return_receipt_${returnId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async verifyReturn(returnId, outcomeCode, notesHash, role = "RETURN_CENTER") {
    this.initContract();
    const nHash = notesHash || ethers.ZeroHash;

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.verifyReturn(returnId, outcomeCode, nHash);
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("verifyReturn on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`return_verify_${returnId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async flagFraud(caseId, returnId, productId, triggeredRule, riskLevelCode, reason, role = "RETURN_CENTER") {
    this.initContract();

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.flagFraud(
          caseId,
          returnId,
          productId,
          triggeredRule,
          riskLevelCode,
          reason
        );
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("flagFraud on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`fraud_${caseId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async resolveFraudCase(caseId, resolutionNotes, role = "ADMIN") {
    this.initContract();

    if (this.contract) {
      try {
        const signer = this.getSigner(role);
        const contractWithSigner = this.contract.connect(signer);
        const tx = await contractWithSigner.resolveFraudCase(caseId, resolutionNotes);
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          isSyncedOnChain: true,
        };
      } catch (err) {
        console.error("resolveFraudCase on-chain failed:", err.message);
        throw err;
      }
    }

    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(`resolve_${caseId}_${Date.now()}`));
    return { success: true, txHash: fakeHash, blockNumber: 1, isSyncedOnChain: false };
  }

  async getProductHistory(productId) {
    this.initContract();
    if (this.contract) {
      try {
        const history = await this.contract.getProductHistory(productId);
        return history.map((e) => ({
          eventType: e.eventType,
          actor: e.actor,
          actorRole: e.actorRole,
          location: e.location,
          dataHash: e.dataHash,
          timestamp: Number(e.timestamp),
        }));
      } catch (err) {
        console.warn("getProductHistory on-chain error:", err.message);
      }
    }
    return [];
  }

  async getContractEvents(fromBlock = 0) {
    this.initContract();
    if (this.contract) {
      try {
        const filter = {
          address: this.contractAddress,
          fromBlock: fromBlock,
          toBlock: "latest",
        };
        const logs = await this.provider.getLogs(filter);
        const parsedLogs = logs.map((log) => {
          try {
            const parsed = this.contract.interface.parseLog(log);
            const cleanArgs = {};
            if (parsed.args) {
              for (const [k, v] of Object.entries(parsed.args)) {
                if (isNaN(k)) {
                  cleanArgs[k] = typeof v === "bigint" ? Number(v) : v;
                }
              }
            }
            return {
              eventName: parsed.name,
              args: cleanArgs,
              blockNumber: log.blockNumber,
              txHash: log.transactionHash,
            };
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
        return parsedLogs;
      } catch (err) {
        console.warn("getContractEvents error:", err.message);
      }
    }
    return [];
  }
}

module.exports = new BlockchainService();
