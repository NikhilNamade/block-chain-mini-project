async function main() {

  const Certificate = await ethers.getContractFactory("Certificate");

  const certificate = await Certificate.deploy();

  await certificate.waitForDeployment();

  console.log("Contract deployed at:", certificate.target);

}

main();