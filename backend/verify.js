const { ethers } = require("ethers")

/**
 * Verifies an EVM (Ethereum) signature
 * @param {string} address The expected signer address
 * @param {string} message The message that was signed
 * @param {string} signature The hex-encoded signature
 * @returns {boolean} True if the signature is valid
 */
async function verifyEVMSignature(address, message, signature) {
  try {
    // In EVM, the signature is a hex string
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error("EVM Signature verification failed:", error)
    return false
  }
}

module.exports = { verifyEVMSignature }
