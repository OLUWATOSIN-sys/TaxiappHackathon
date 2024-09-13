const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Your 24-word mnemonic (recovery phrase)
const mnemonic = "whip gauge group aunt rookie squeeze ensure click glass economy energy orchard area flat sure task horror nut perfect pass custom liberty anger tourist";

// Connect to the Celo Alfajores Testnet via Forno
const provider = new HDWalletProvider({
  mnemonic: {
    phrase: mnemonic
  },
  providerOrUrl: "https://alfajores-forno.celo-testnet.org",
  numberOfAddresses: 1, // Only retrieve one address
});

const web3 = new Web3(provider);

const main = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log("Address:", accounts[0]);

    // Directly get the private key for the first account from the provider
    const privateKey = provider.wallets[accounts[0].toLowerCase()].getPrivateKeyString();
    console.log("Private Key:", privateKey);
};

main().catch((err) => {
    console.error("Error:", err);
});
