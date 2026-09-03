# Development Guidelines

## Docker Usage
- Always use Docker commands for development, testing, and execution.
- Do not run applications directly on the local machine unless explicitly instructed.
- Use existing Docker containers whenever possible.

## Build Process
- Do not execute any build commands unless explicitly requested.
- Avoid unnecessary builds during code changes, debugging, or analysis.
- Validate code changes through code review and static analysis before building.

## Shared Components
- Reuse existing shared components, utilities, helpers, and common services whenever applicable.
- Do not create duplicate components when equivalent shared functionality already exists.
- Keep shared logic centralized to improve maintainability and consistency.

## Code Changes
- Make the smallest possible change required to satisfy the requirement.
- Follow the existing project structure and coding conventions.
- Avoid introducing new dependencies unless absolutely necessary.

## Verification
- Before implementing new functionality, check for existing reusable solutions in the codebase.
- Confirm whether a shared utility, hook, service, or component already fulfills the requirement.
- Document any exceptions to these guidelines in the pull request or change summary.

## Data Migration

- Ensure migration table data is always aligned with the latest feature implementation.
- Remove or update legacy records, configurations, and mappings that are no longer applicable.
- Do not retain deprecated, obsolete, or unused legacy data unless explicitly required for backward compatibility.
- When introducing new features, update corresponding migration scripts and seed data accordingly.
- Verify that migrated data accurately reflects the current business requirements and application behavior.
- Maintain migration scripts as the single source of truth for environment setup and data initialization.