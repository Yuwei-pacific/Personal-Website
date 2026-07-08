# Vendor Components

These files are low-touch local adaptations of third-party React Bits visual components. They stay in JavaScript only while their behavior is mostly decorative and their public API is narrow.

Before changing a vendor component:

1. Update the file header comment with any behavior that diverges from upstream.
2. Keep TypeScript callers protected with a narrow wrapper or a matching declaration if the component is imported directly.
3. Run `npm run typecheck` so TypeScript callers still match the declared contract.
4. Run `npm run lint` because implementation files are not protected by TypeScript.

If a component starts owning core product behavior, migrate it to TSX instead of expanding this adapter layer.

`StaggeredMenu` and `Masonry` crossed that line and now live as owned TSX components:

- `components/layout/staggered-menu.tsx`
- `components/projects/masonry.tsx`
