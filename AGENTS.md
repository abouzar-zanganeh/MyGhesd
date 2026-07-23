# AI Agent Instructions for Versioning & Project Maintenance

## Interactive Semantic Versioning Directive (PROPOSE & CONFIRM)

To give the user full control over release cycles and avoid unnecessary changelog churn during iterative changes or potential rollbacks, follow this interactive versioning workflow:

### Standard Iterative Workflow:

1. **Implement & Verify Changes**:
   - Focus on implementing the user's requested features or fixes cleanly.
   - Run `compile_applet` to ensure there are no compilation errors.

2. **Propose Version Bump**:
   - In your final response after completing a task, **propose** the appropriate version bump based on Semantic Versioning:
     - **PATCH** (`1.2.0` → `1.2.1`): Bug fixes, minor UI tweaks, or small performance improvements.
     - **MINOR** (`1.2.0` → `1.3.0`): New features, new interactive components, or significant functional additions.
     - **MAJOR** (`1.2.0` → `2.0.0`): Breaking changes or major architectural overhauls.
   - Present a short draft summary of the proposed release notes in Persian (Title, Highlights, and Changes).
   - Explicitly ask the user for confirmation to apply the version bump (or allow them to accumulate more changes first).

3. **Apply Release (Upon User Confirmation)**:
   - When the user confirms (e.g. "yes", "تایید", "ثبت نسخه", "bump version"):
     - Update `export const CURRENT_VERSION = 'X.Y.Z';` in `src/data/changelog.ts`.
     - Prepend the new release object to the top of `CHANGELOG_RELEASES` in `src/data/changelog.ts`.
     - Update `"version": "X.Y.Z"` in `package.json`.
     - Run `compile_applet` to verify the build.

This ensures clean code changes, user control over release milestones, and zero changelog clutter.
