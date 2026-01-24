/**
 * Check if a password has been exposed in known data breaches
 * using the Have I Been Pwned API with k-anonymity (only first 5 chars of hash sent)
 */
export async function isPasswordBreached(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    // Create SHA-1 hash of password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    
    // Split hash: first 5 chars (prefix) and rest (suffix)
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    
    // Query HIBP API with k-anonymity (only sends prefix)
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Prevents response length timing attacks
      },
    });
    
    if (!response.ok) {
      console.warn('HIBP API unavailable, skipping breach check');
      return { breached: false, count: 0 };
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // Check if our suffix is in the response
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix?.trim() === suffix) {
        const count = parseInt(countStr?.trim() || '0', 10);
        return { breached: true, count };
      }
    }
    
    return { breached: false, count: 0 };
  } catch (error) {
    // If check fails, don't block signup but log warning
    console.warn('Password breach check failed:', error);
    return { breached: false, count: 0 };
  }
}

/**
 * Format breach count for user-friendly display
 */
export function formatBreachCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}
