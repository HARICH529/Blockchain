const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting ReturnChain deployment in JavaScript...");
  const [deployer, seller, courier, returnCenter] = await hre.ethers.getSigners();

  console.log(`Deploying ReturnChain with admin account: ${deployer.address}`);

  const ReturnChain = await hre.ethers.getContractFactory("ReturnChain");
  const returnChain = await ReturnChain.deploy();
  await returnChain.waitForDeployment();

  const contractAddress = await returnChain.getAddress();
  console.log(`>>> ReturnChain deployed successfully at: ${contractAddress}`);

  // Authorize test accounts for local development
  if (seller) {
    await returnChain.grantRole("SELLER", seller.address);
    console.log(`Granted SELLER role to ${seller.address}`);
  }
  if (courier) {
    await returnChain.grantRole("COURIER", courier.address);
    console.log(`Granted COURIER role to ${courier.address}`);
  }
  if (returnCenter) {
    await returnChain.grantRole("RETURN_CENTER", returnCenter.address);
    console.log(`Granted RETURN_CENTER role to ${returnCenter.address}`);
  }

  // Read artifact ABI
  const artifactPath = path.join(__dirname, "../artifacts/contracts/ReturnChain.sol/ReturnChain.json");
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const exportData = {
    address: contractAddress,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    admin: deployer.address,
    abi: abi
  };

  // 1. Save in blockchain dir
  const blockchainOut = path.join(__dirname, "../deployedAddress.json");
  fs.writeFileSync(blockchainOut, JSON.stringify(exportData, null, 2));
  console.log(`Saved deployment info to: ${blockchainOut}`);

  // 2. Save in backend config dir
  const backendConfigDir = path.join(__dirname, "../../backend/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }
  fs.writeFileSync(path.join(backendConfigDir, "contractConfig.json"), JSON.stringify(exportData, null, 2));
  console.log(`Saved deployment info to backend/config/contractConfig.json`);

  // 3. Save in frontend config dir
  const frontendConfigDir = path.join(__dirname, "../../frontend/src/config");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendConfigDir, "contractConfig.json"), JSON.stringify(exportData, null, 2));
  console.log(`Saved deployment info to frontend/src/config/contractConfig.json`);

  console.log("Deployment and configuration sync completed!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
