import { describe, expect, it } from 'vitest';
import { hashVoteToken, proofOfWork, sha256Hex, verifyProof } from '../src/lib/crypto';

describe('preuve de travail et empreintes', () => {
  it('produit une empreinte stable', async () => {
    expect(await sha256Hex('union')).toBe(
      'ef3ff703d7565ab5215cdbe043858f2b8a0415b2b35dd17a3da1354f86009b98',
    );
  });

  it('trouve un nonce avec deux zéros et le vérifie', async () => {
    const result = await proofOfWork('suggestion', 2);
    expect(result.hash.startsWith('00')).toBe(true);
    expect(await verifyProof('suggestion', result.nonce, result.hash, 2)).toBe(true);
    expect(await verifyProof('autre', result.nonce, result.hash, 2)).toBe(false);
  });

  it('dérive une empreinte de vote déterministe', async () => {
    const first = await hashVoteToken('jeton');
    const second = await hashVoteToken('jeton');
    expect(first).toBe(second);
    expect(first).not.toBe('jeton');
  });
});
