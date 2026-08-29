# E-commerce & Online Store
## Module 7: Online Security & Fraud Awareness
### Lesson 2: Passwords, Multi-factor Authentication & Access Control

**Estimated study time:** 40–45 minutes

## Learning Outcomes
By the end of this lesson, you should be able to:
1. Explain why unique, strong passwords matter in e-commerce operations.
2. Describe the value and limitations of multi-factor authentication (MFA).
3. Apply least-privilege and role-based access principles.
4. Identify risks caused by shared, dormant and over-privileged accounts.
5. Apply a joiner-mover-leaver access process and basic access reviews.
6. Recognise suspicious authentication events that require escalation.

## Why This Lesson Matters
Administrator and staff accounts can change prices, issue refunds, access customer information, export order records, alter payment settings and install integrations. If these accounts are poorly protected, a single stolen credential can become a business-wide incident. Good access security therefore combines strong authentication, limited permissions, individual accountability and prompt removal of access that is no longer required.

Security is not achieved by one complicated password alone. It depends on several controls working together.

## Key Terms / Vocabulary
- **Authentication** — Verifying that a user is who they claim to be.
- **MFA** — Requiring more than one factor to verify access.
- **Least privilege** — Giving a user only the access necessary for authorised work.
- **Role-based access** — Assigning permissions according to defined job responsibilities.
- **Shared account** — One login used by more than one person.
- **Dormant account** — An account that remains active despite no longer being regularly required.
- **Access review** — A periodic check that users and permissions remain appropriate.
- **Credential** — Information or a mechanism used to authenticate a user.

## Main Lesson Content
### 1. Use unique credentials
Password reuse creates chain risk. If credentials are exposed at one service, criminals may try the same combination against email, social media, store administration and other services. Each important account should therefore use a unique password or passphrase.

Where the organisation permits it, an approved password manager can help staff generate and store unique credentials rather than relying on predictable patterns or written lists. Passwords should never be sent through insecure group chats or stored in publicly accessible documents.

### 2. Add MFA wherever supported
MFA requires another verification factor in addition to a password. This makes a stolen password less useful to an attacker. High-impact systems such as primary business email, store administration, payment dashboards, domain management, advertising accounts and cloud services should receive strong MFA protection wherever supported.

MFA is not magic. Users can still be deceived into approving fraudulent prompts or disclosing codes. Staff should treat unexpected MFA prompts as suspicious rather than approving them simply to make the notification disappear.

### 3. Apply least privilege
Not every employee needs administrator rights. Permissions should reflect the work the person is authorised to perform.

For example:
- a warehouse picker may need order and fulfilment details but not payment settings;
- a marketer may need campaign and catalogue access but not refund authority;
- a customer-service agent may need order history and approved refund tools but not domain administration;
- an owner or senior administrator may require broader rights but should still use them carefully.

Least privilege reduces the impact of mistakes, compromised accounts and deliberate misuse.

### 4. Use individual accounts instead of shared logins
Shared credentials weaken accountability. If five people use the same administrator login, an audit log showing that account changed bank details does not clearly identify the person who performed the action.

Individual accounts create stronger traceability and allow one person's access to be disabled without changing credentials for an entire team. Where a platform offers role-based access, it should be used instead of distributing an owner's password.

### 5. Control privileged actions
Some actions deserve stronger control because they can cause financial or security harm. Examples include changing payout bank details, adding administrators, issuing unusually large refunds, exporting customer data or installing applications with broad permissions.

A business can require additional approval, verification or review for such actions. The exact control should match the size and risk of the organisation.

### 6. Manage joiners, movers and leavers
Access should change with the employment or contractor lifecycle.

**Joiner:** Create an individual account with only the permissions required for the role.

**Mover:** When a person changes duties, remove old permissions that are no longer needed before or while adding the new ones.

**Leaver:** Disable or remove access promptly, recover business devices or credentials where applicable, and review important accounts or integrations the person controlled.

Temporary access should also have an end point. A contractor who needed catalogue access for two weeks should not retain it six months later.

### 7. Perform access reviews
Even a good onboarding process can drift over time. Periodic access reviews should ask:
- Does this person still work with the business?
- Does the role still require this permission?
- Are there dormant administrator accounts?
- Are third-party integrations still required?
- Are recovery email addresses and phone numbers still controlled by the business?

Unnecessary access should be removed rather than retained “just in case.”

### 8. Protect account recovery
Attackers may target password-reset processes rather than the password itself. Recovery email accounts, phone numbers and backup codes are therefore sensitive security assets. Recovery methods should be current, controlled and stored securely.

A business should avoid leaving critical recovery tied to a former employee's personal email address or telephone number.

### 9. Recognise suspicious access events
Warning signs can include an unexpected password-reset email, an MFA prompt the user did not initiate, a new administrator account, a login from an unusual location or device, unexplained permission changes, or notifications that recovery details were modified.

Staff should follow the incident procedure rather than investigating recklessly. Appropriate actions may include reporting the event, using a known safe device to review account activity, revoking suspicious sessions, changing compromised credentials and preserving relevant records.

## Worked Example / Demonstration
A temporary contractor needs to update product images for two weeks. Instead of sharing the owner's administrator password, the store creates an individual account limited to catalogue work, enables appropriate authentication controls and records the expected end date. When the project ends, the account is disabled. During the next access review, the business confirms that no unnecessary contractor permissions remain.

In a second scenario, the owner receives an MFA approval request while not logging in. Rather than approving it, the owner treats the prompt as suspicious and follows the incident process. This prevents convenience from overriding security.

## Practical Activity
Create an access-control matrix for an online store with these roles: owner, customer-service agent, warehouse picker, marketer and temporary contractor. For each role, identify:
1. information the role needs;
2. actions it may perform;
3. actions it must not perform;
4. whether MFA should be required where supported;
5. who approves access;
6. when access must be reviewed or removed.

Then identify three high-risk actions that should receive additional approval or monitoring.

## Knowledge Check
1. Why is password reuse risky?
2. What protection does MFA add, and why should unexpected MFA prompts not be approved?
3. What does least privilege mean?
4. Why are individual accounts preferable to shared administrator logins?
5. What should happen to permissions when an employee changes role?
6. Give two examples of privileged actions that may justify stronger controls.
7. Why are account-recovery methods security-sensitive?
8. Name two suspicious authentication events that should be escalated.

## Feedback / Explanation
1. A credential exposed at one service may be tested against other services.
2. MFA adds another verification factor; an unexpected prompt may indicate someone else is attempting access.
3. Users receive only the access necessary for authorised duties.
4. Individual accounts improve accountability, auditability and selective removal of access.
5. Old permissions should be reviewed and removed when they are no longer required.
6. Examples include changing payout details, adding administrators, large refunds or customer-data exports.
7. An attacker who controls recovery mechanisms may be able to reset credentials and take over the account.
8. Examples include unexpected password resets, unexplained MFA prompts, unknown logins or unauthorised administrator creation.

## Key Takeaways
- Use unique credentials and secure password-management practices.
- MFA materially strengthens account security but users must still resist fraudulent prompts.
- Permissions should follow least privilege and defined roles.
- Individual accounts provide stronger accountability than shared credentials.
- Joiner-mover-leaver controls prevent access from accumulating indefinitely.
- Recovery methods, privileged actions and dormant accounts require deliberate control.
- Suspicious access events should be escalated through an incident process.

## Visual Learning Guidance
**Recommended visual:** Individual User → Unique Credential → MFA → Role Permission → Privileged-action Control → Audit Log → Periodic Review → Removal.

**Caption:** “Secure access is a lifecycle: authenticate strongly, grant only what is needed, monitor important actions and remove access when it is no longer justified.”