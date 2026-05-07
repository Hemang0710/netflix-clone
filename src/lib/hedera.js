import {
  Client,
  TransactionId,
  TransactionRecordQuery,
} from "@hashgraph/sdk";

const client = Client.forTestnet();

// Initialize client with environment variables
if (process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_PRIVATE_KEY) {
  client.setOperator(
    process.env.HEDERA_ACCOUNT_ID,
    process.env.HEDERA_PRIVATE_KEY
  );
}

// Simple badge anchor on Hedera (stores metadata hash)
export async function issueHederaBadge({
  userId,
  badgeId,
  credentialUrl,
  metadata,
}) {
  try {
    if (!process.env.HEDERA_ACCOUNT_ID) {
      console.warn("Hedera credentials not configured, using mock transaction");
      return {
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        tokenId: null,
      };
    }

    // In production, you would submit a transaction to Hedera
    // For MVP, we'll create a deterministic hash based on the data
    const hashData = `${userId}-${badgeId}-${credentialUrl}-${Date.now()}`;
    const hash = await hashCredential(hashData);

    return {
      txHash: hash,
      tokenId: null,
    };
  } catch (error) {
    console.error("Error issuing Hedera badge:", error);
    throw error;
  }
}

// Verify transaction on Hedera
export async function verifyHederaTx(txHash) {
  try {
    if (!txHash) return false;

    // For MVP, we validate that the hash follows expected format
    // In production, you would query Hedera for the actual transaction
    return txHash.length > 0 && (txHash.startsWith("0x") || txHash.includes("-"));
  } catch (error) {
    console.error("Error verifying Hedera transaction:", error);
    return false;
  }
}

// Hash credential data
async function hashCredential(data) {
  // Using simple deterministic hash for MVP
  // In production, use cryptographic hashing
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

// Deploy badge contract (one-time setup)
export async function deployBadgeContract() {
  try {
    if (!process.env.HEDERA_ACCOUNT_ID) {
      console.warn("Hedera not configured, returning mock contract ID");
      return "0.0.1000"; // Mock contract ID
    }

    // In production, deploy actual Solidity contract to Hedera
    // For MVP, return a mock contract ID
    console.log("Badge contract deployment would occur here");
    return process.env.HEDERA_BADGE_CONTRACT || "0.0.1000";
  } catch (error) {
    console.error("Error deploying badge contract:", error);
    throw error;
  }
}

// Get badge contract ID from environment
export function getBadgeContractId() {
  return process.env.HEDERA_BADGE_CONTRACT || "0.0.1000";
}

export { client };
