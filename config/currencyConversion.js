const axios = require('axios');

async function convertCeloToZAR(amountInCelo) {
    try {
        const response = await axios.get(`https://api.exchangeratesapi.io/latest?base=USD&symbols=ZAR`);
        const zarRate = response.data.rates.ZAR;
        const amountInZAR = amountInCelo * zarRate;
        return amountInZAR;
    } catch (error) {
        console.error("Error converting Celo to ZAR:", error);
        return null;
    }
}

module.exports = convertCeloToZAR;
