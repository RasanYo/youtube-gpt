import 'zeroentropy/shims/node'
import { ZeroEntropy } from 'zeroentropy';

// Singleton ZeroEntropy client instance
let zeroEntropyClient: ZeroEntropy | null = null;

/**
 * Get or create the ZeroEntropy client instance
 * @returns ZeroEntropy client instance
 */
export function getZeroEntropyClient(): ZeroEntropy {
  if (!zeroEntropyClient) {
    const apiKey = process.env.ZEROENTROPY_API_KEY;
    
    if (!apiKey) {
      throw new Error('ZEROENTROPY_API_KEY environment variable is not set');
    }

    zeroEntropyClient = new ZeroEntropy({
      apiKey,
      // Add any additional configuration options here
    });
  }

  return zeroEntropyClient;
}

/**
 * Reset the client instance (useful for testing)
 */
export function resetZeroEntropyClient(): void {
  zeroEntropyClient = null;
}

/**
 * Check if ZeroEntropy is properly configured
 * @returns boolean indicating if ZeroEntropy is ready to use
 */
export function isZeroEntropyConfigured(): boolean {
  try {
    getZeroEntropyClient();
    return true;
  } catch (error) {
    return false;
  }
}
