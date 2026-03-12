/**
 * Unit tests for lib/prescriptions.service.ts
 *
 * All HTTP calls are intercepted by mocking global.fetch – no real server needed.
 * These tests verify:
 *   • correct data is returned on success
 *   • correct query-string parameters are sent
 *   • AuthError is thrown on 401
 *   • generic Error is thrown with the server message on other failures
 */

import {
  getPrescriptions,
  consumePrescription,
  AuthError,
} from '../lib/prescriptions.service';

// ─── fetch mock setup ─────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

/** Build a minimal Response-like object */
function makeResponse(data: object, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

// ─── Shared fake data ─────────────────────────────────────────────────────────

const mockMeta = { total: 3, page: 1, limit: 10, totalPages: 1 };

const mockPrescription = {
  id: 'rx-1',
  code: 'RX-TEST-0001',
  status: 'pending' as const,
  notes: null,
  createdAt: '2026-01-15T10:00:00.000Z',
  consumedAt: null,
  items: [
    {
      id: 'item-1',
      name: 'Ibuprofen',
      dosage: '400mg',
      quantity: 30,
      instructions: 'Take with food',
    },
  ],
  author: { specialty: 'Cardiología', user: { name: 'Dr. Smith' } },
};

const successPayload = { data: [mockPrescription], meta: mockMeta };

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('prescriptions.service', () => {
  beforeEach(() => mockFetch.mockReset());

  // ─── getPrescriptions ─────────────────────────────────────────────────────

  describe('getPrescriptions', () => {
    it('returns the prescription list and pagination meta on success', async () => {
      mockFetch.mockResolvedValue(makeResponse(successPayload));

      const result = await getPrescriptions({ page: 1 });

      expect(result.data).toEqual([mockPrescription]);
      expect(result.meta).toEqual(mockMeta);
    });

    it('includes the page number in the request URL', async () => {
      mockFetch.mockResolvedValue(makeResponse(successPayload));

      await getPrescriptions({ page: 3 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=3'),
      );
    });

    it('includes status filter in the URL when provided', async () => {
      mockFetch.mockResolvedValue(makeResponse(successPayload));

      await getPrescriptions({ page: 1, status: 'pending' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=pending'),
      );
    });

    it('does NOT include status param when status is omitted', async () => {
      mockFetch.mockResolvedValue(makeResponse(successPayload));

      await getPrescriptions({ page: 1 });

      const calledUrl: string = mockFetch.mock.calls[0][0];
      expect(calledUrl).not.toContain('status=');
    });

    it('throws AuthError on 401 response', async () => {
      mockFetch.mockResolvedValue(makeResponse({}, 401));

      await expect(getPrescriptions({ page: 1 })).rejects.toThrow(AuthError);
    });

    it('throws Error with the server message on non-ok response', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ message: 'Internal server error' }, 500),
      );

      await expect(getPrescriptions({ page: 1 })).rejects.toThrow(
        'Internal server error',
      );
    });

    it('handles array error messages from class-validator (takes first item)', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ message: ['field is required', 'must be a number'] }, 400),
      );

      await expect(getPrescriptions({ page: 1 })).rejects.toThrow(
        'field is required',
      );
    });
  });

  // ─── consumePrescription ──────────────────────────────────────────────────

  describe('consumePrescription', () => {
    const consumed = {
      ...mockPrescription,
      status: 'consumed' as const,
      consumedAt: '2026-01-16T08:00:00.000Z',
    };

    it('sends a PUT request to the correct endpoint', async () => {
      mockFetch.mockResolvedValue(makeResponse(consumed));

      await consumePrescription('rx-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/prescriptions/rx-1/consume',
        { method: 'PUT' },
      );
    });

    it('returns the updated prescription with consumed status', async () => {
      mockFetch.mockResolvedValue(makeResponse(consumed));

      const result = await consumePrescription('rx-1');

      expect(result.status).toBe('consumed');
      expect(result.consumedAt).toBe('2026-01-16T08:00:00.000Z');
    });

    it('throws AuthError on 401 response', async () => {
      mockFetch.mockResolvedValue(makeResponse({}, 401));

      await expect(consumePrescription('rx-1')).rejects.toThrow(AuthError);
    });

    it('throws Error with server message on non-ok response', async () => {
      mockFetch.mockResolvedValue(
        makeResponse({ message: 'Prescription not found' }, 404),
      );

      await expect(consumePrescription('rx-1')).rejects.toThrow(
        'Prescription not found',
      );
    });
  });
});
