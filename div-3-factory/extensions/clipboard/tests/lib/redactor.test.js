import { describe, test, expect } from 'vitest';
import { redact, restore } from '../../lib/redactor.js';

describe('redactor', () => {
  describe('redact()', () => {
    test('strips email addresses', () => {
      const { redactedText } = redact('Contact me at john@example.com please');
      expect(redactedText).toContain('[EMAIL_REDACTED]');
      expect(redactedText).not.toContain('john@example.com');
    });

    test('strips phone numbers', () => {
      const { redactedText } = redact('Call me at 555-123-4567');
      expect(redactedText).toContain('[PHONE_REDACTED]');
      expect(redactedText).not.toContain('555-123-4567');
    });

    test('strips SSN patterns', () => {
      const { redactedText } = redact('My SSN is 123-45-6789');
      expect(redactedText).toContain('[SSN_REDACTED]');
    });

    test('strips credit card numbers', () => {
      // Use spaced format to avoid phone regex collision
      const { redactedText } = redact('Card: 4111 1111 1111 1111');
      expect(redactedText).toContain('[CC_REDACTED]');
    });

    test('strips IP addresses', () => {
      const { redactedText } = redact('Server IP: 192.168.1.1');
      expect(redactedText).toContain('[IP_REDACTED]');
    });

    test('strips street addresses', () => {
      const { redactedText } = redact('Located at 123 Main Street');
      expect(redactedText).toContain('[ADDRESS_REDACTED]');
    });

    test('strips multiple PPI types in one pass', () => {
      const input = 'Email john@test.com, call 555-000-1234, SSN 111-22-3333';
      const { redactedText, redactions } = redact(input);
      expect(redactions.length).toBe(3);
      expect(redactedText).not.toContain('john@test.com');
      expect(redactedText).not.toContain('555-000-1234');
      expect(redactedText).not.toContain('111-22-3333');
    });

    test('returns empty redactions for clean text', () => {
      const { redactedText, redactions } = redact('Just a normal sentence.');
      expect(redactedText).toBe('Just a normal sentence.');
      expect(redactions).toHaveLength(0);
    });

    test('handles empty string', () => {
      const { redactedText, redactions } = redact('');
      expect(redactedText).toBe('');
      expect(redactions).toHaveLength(0);
    });

    test('handles null input', () => {
      const { redactedText, redactions } = redact(null);
      expect(redactedText).toBe('');
      expect(redactions).toHaveLength(0);
    });

    test('handles undefined input', () => {
      const { redactedText, redactions } = redact(undefined);
      expect(redactedText).toBe('');
      expect(redactions).toHaveLength(0);
    });
  });

  describe('restore()', () => {
    test('restores redacted values', () => {
      const original = 'Email me at john@example.com';
      const { redactedText, redactions } = redact(original);
      const restored = restore(redactedText, redactions);
      expect(restored).toBe(original);
    });

    test('restores multiple redacted values', () => {
      const original = 'Call john@test.com at 555-123-4567';
      const { redactedText, redactions } = redact(original);
      const restored = restore(redactedText, redactions);
      expect(restored).toBe(original);
    });

    test('returns original text when no redactions', () => {
      const text = 'Normal text without PPI';
      const restored = restore(text, []);
      expect(restored).toBe(text);
    });

    test('handles null redactions', () => {
      const text = 'Some text';
      const restored = restore(text, null);
      expect(restored).toBe(text);
    });
  });
});
