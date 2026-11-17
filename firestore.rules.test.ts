/**
 * Adversarial Security Rules Verification Suite
 * Verifies that invalid, oversized, shadow-field, or destructive payloads
 * targeting /students, /certificates, and /customWords return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Student Deletion With Invalid ID Forbidden',
    collectionPath: `/students/${'x'.repeat(200)}`,
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Issued Certificate Deletion Forbidden',
    collectionPath: '/certificates/cert_1',
    operation: 'delete',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Student',
    collectionPath: '/students/stu_2',
    operation: 'create',
    payload: { id: 'stu_2', name: 'سارة', avatarColor: '#EC4899', isAdmin: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'ID Poisoning (Oversized Invalid Document ID)',
    collectionPath: `/students/${'a'.repeat(200)}`,
    operation: 'create',
    payload: { id: 'bad', name: 'طالب', avatarColor: '#3B82F6' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Client Timestamp Forgery on Certificate',
    collectionPath: '/certificates/cert_2',
    operation: 'create',
    payload: {
      id: 'cert_2',
      studentId: 'stu_1',
      studentName: 'زياد',
      studentAvatarColor: '#3B82F6',
      letterId: 'ba',
      letterChar: 'ب',
      letterName: 'الباء',
      score: 5,
      total: 5,
      percentage: 100,
      themeId: 'gold',
      issuedDateLabel: '2026',
      createdAt: '1999-01-01T00:00:00Z',
      updatedAt: '1999-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immutable Score Tampering on Certificate Update',
    collectionPath: '/certificates/cert_1',
    operation: 'update',
    payload: { score: 999, themeId: 'navy' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Oversized String Exhaustion on Student Name',
    collectionPath: '/students/stu_3',
    operation: 'create',
    payload: { id: 'stu_3', name: 'x'.repeat(300), avatarColor: '#3B82F6' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Type Poisoning on Certificate Theme Update',
    collectionPath: '/certificates/cert_1',
    operation: 'update',
    payload: { themeId: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unlisted Collection Access Denied (Default-Deny Catch-All)',
    collectionPath: '/users/u1',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Custom Word Invalid Position Enum',
    collectionPath: '/customWords/word_1',
    operation: 'create',
    payload: { id: 'word_1', word: 'بطة', cleanWord: 'بطة', targetLetter: 'ب', position: 'invalid', maddType: 'none', image: '', isCustom: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Custom Word Update Forbidden',
    collectionPath: '/customWords/word_1',
    operation: 'update',
    payload: { word: 'تعديل' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Student Immutable ID Tampering on Update',
    collectionPath: '/students/stu_1',
    operation: 'update',
    payload: { id: 'stu_hacked', name: 'زياد' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
