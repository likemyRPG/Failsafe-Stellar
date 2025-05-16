# Color System and Dark Mode Guidelines

## Color Variables

Our application uses CSS variables for consistent colors throughout the app. When building components, please use these variables instead of hard-coded colors, especially for dark mode.

### CSS Variables

```css
/* Light mode (default) */
--primary-color: #0a66c2;
--secondary-color: #f5f8fa;
--accent-color: #0284c7;
--accent-gradient-from: #0369a1;
--accent-gradient-to: #0ea5e9;
--text-color: #1e293b;
--background-color: #ffffff;
--card-background: #ffffff;
--border-color: #e2e8f0;
--error-color: #dc2626;
--success-color: #16a34a;
--warning-color: #ea580c;

/* Dark mode */
--primary-color: #0ea5e9;
--secondary-color: #1e293b;
--accent-color: #38bdf8;
--accent-gradient-from: #0284c7;
--accent-gradient-to: #38bdf8;
--text-color: #f1f5f9;
--background-color: #0f172a;
--card-background: #1e293b;
--border-color: #334155;
--error-color: #ef4444;
--success-color: #22c55e;
--warning-color: #f97316;
```

## Usage Guidelines

### Using Variables in Tailwind

Instead of hard-coded colors like:
```jsx
<div className="bg-white dark:bg-gray-800">...</div>
```

Use our variable approach:
```jsx
<div className="bg-white dark:bg-[var(--card-background)]">...</div>
```

### Common Utility Classes

We provide utility classes for common dark mode scenarios:

```jsx
// Background colors
<div className="dark-bg-card">...</div>         // Card background
<div className="dark-bg-secondary">...</div>    // Secondary background

// Background colors with opacity
<div className="dark-bg-card-60">...</div>      // Card background with 60% opacity
<div className="dark-bg-secondary-30">...</div> // Secondary background with 30% opacity

// Text colors
<div className="dark-text-primary">...</div>    // Primary text color
<div className="dark-text-secondary">...</div>  // Secondary text color
<div className="dark-text-muted">...</div>      // Muted text color

// Borders
<div className="dark-border">...</div>          // Border color
<div className="dark-border-40">...</div>       // Border with 40% opacity
```

### Special Components

Use our pre-styled components from `StyledComponents.tsx` whenever possible:

- `ActionButton`: For primary actions
- `SecondaryButton`: For secondary actions
- `CardContainer`: For card containers
- `GradientText`: For highlighted text
- `InfoBox`: For information boxes with icons
- `HoverCard`: For cards with hover effects
- `Badge`: For status badges
- `FloatingIcon`: For animated icons
- `DecoratedHeader`: For section headers

## Glass-like Effects

For glass-like panels, use the `glass-card` class:

```jsx
<div className="glass-card p-4">
  Your content here
</div>
```

## Gradient Effects

For buttons with gradients, use the `btn-gradient` class:

```jsx
<button className="btn-gradient text-white px-4 py-2 rounded-lg">
  Click me
</button>
``` 