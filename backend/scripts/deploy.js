const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniziando deployment del WTW Token...");

  // Deploy del contratto WTWToken
  const WTWToken = await hre.ethers.getContractFactory("WTWToken");
  const wtwToken = await WTWToken.deploy();

  await wtwToken.waitForDeployment();

  const address = await wtwToken.getAddress();
  console.log(`✅ WTW Token deployato su: ${address}`);

  // Verifica il contratto su Polygonscan (se siamo su una rete pubblica)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("⏳ Aspettando 30 secondi per la verifica...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contratto verificato su Polygonscan!");
    } catch (error) {
      console.log("⚠️ Errore nella verifica:", error.message);
    }
  }

  // Salva l'indirizzo del contratto
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: address,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    `deployment-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Informazioni di deployment salvate!");
  console.log("🎯 Deployment completato con successo!");
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore durante il deployment:", error);
    process.exit(1);
  }); 