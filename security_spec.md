# Firestore Security Specification

This specification documents the data invariants, threat payloads, and security structure for the ShivAI application Firestore integration.

## 1. Data Invariants
- A user state entry can only be created or modified by the authenticated user whose ID matches the document ID.
- Relational operations (such as syncing state) must always verify the caller's login status.
- State documents are private: direct reading is restricted strictly to the document owner.

## 2. Threat Vector Payloads ("Dirty Dozen")
To secure our single-user state sync collection (`/user_states/{userId}`), we must block these payloads:

1. **Unauthenticated Read**: Attempt to read `/user_states/someUserId` anonymous or null auth.
2. **Unauthenticated Write**: Attempt to write/create `/user_states/someUserId` anonymous or null auth.
3. **Identity Impersonation (Cross-User Read)**: Signed in as `userA`, attempting to read `/user_states/userB`.
4. **Identity Impersonation (Cross-User Write)**: Signed in as `userA`, attempting to overwrite `/user_states/userB`.
5. **Junk Character ID (ID Poisoning)**: Attempt to write to `/user_states/invalid$$id_too_long$$` where ID is malicious.
6. **Shadow Fields Inject**: Adding undocumented high-level permission attributes during profile state upload.
7. **Role Spoofing / System Privilege Bypass**: Writing an admin flag directly through local client SDKs.
8. **Invalid Format updatedAt**: Attempting to upload client-side manual timestamps instead of verifying values.
9. **Zero-Byte Name Inject**: Attempting to bypass limits with blank properties.
10. **Terminal State Lockdown Override**: If the status is locked, attempt to bypass updates.
11. **Client-Delegated Collection Scraping**: Requesting blanket listing without specific document identity key query limit.
12. **Denial of Wallet (DoW) ID Flood**: Spamming requests with extremely long and bulky document identifiers.

## 3. Test Runner structure
The rules are validated through direct testing which ensures unauthorized access is restricted with `PERMISSION_DENIED`.
