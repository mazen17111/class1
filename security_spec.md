# Firestore Security Specification — أبطال الصف الأول (المعلم وائل حمدي)

## 1. Data Invariants (Direct Classroom Access Without Login)
1. **Zero PII Storage**: No user profiles, email addresses, or personal contact details are stored in Firestore.
2. **Teacher-Controlled Student Records**: Student documents under `/students/{studentId}` persist permanently across reloads and are only deleted manually by the teacher with valid `isValidId(studentId)` checks.
3. **Teacher-Controlled Certificate Archive**: Issued certificate documents under `/certificates/{certId}` allow teacher deletion only with valid `isValidId(certId)` checks, and scores/student identity fields are immutable after creation (only `themeId` and `updatedAt` may be updated).
4. **Strict Schema & Size Enforcement**: Every collection validates exact required and allowed keys (`keys().hasAll(...) && keys().hasOnly(...)`), strict regex path IDs (`isValidId()`), bounded string `.size()` limits, numeric bounds, and `request.time` server timestamps.
5. **Default-Deny Catch-All**: Any unlisted collection or path is strictly denied (`match /{document=**} { allow read, write: if false; }`).
