const { ethers } = require("ethers");
const mnemonic = "test test test test test test test test test test test junk";
for (let i = 0; i < 5; i++) {
  const w = ethers.HDNodeWallet.fromPhrase(mnemonic, "", `m/44'/60'/0'/0/${i}`);
  console.log(`Index ${i}: address: ${w.address} | privateKey: ${w.privateKey}`);
}
