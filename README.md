# Single-File Components for Vanilla JS - Vite Plugin Version

This is a Vite plugin version of the [single-file-components-for-vanilla-js](https://github.com/dashpilot/single-file-components-for-vanilla-js) project. It provides the same single-file component experience but leverages Vite's powerful build system.

## Philosophy: Low-Level vs Modern Tooling

There's value in both approaches:

**Low-level build scripts** (like the original):

- Simple and transparent - you can see exactly what's happening
- Minimal dependencies
- Great for learning and understanding the build process
- Perfect for small projects that don't need the full power of modern tooling

**Modern tooling** (like this Vite version):

- Hot Module Replacement (HMR) out of the box
- Fast development server with optimized builds
- Rich plugin ecosystem
- Better integration with modern workflows
- Production optimizations (code splitting, tree shaking, etc.)

Both have their place! This Vite plugin version is a proof-of-concept showing how the same concept can work within a modern build system.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts the Vite dev server. The plugin:

- Reads all `.html` files from `src/components/`
- Combines scripts into `public/assets/app.min.js`
- Combines styles into `public/assets/app.min.css`
- Copies `src/index.html` to `public/index.html`
- Watches for changes and rebuilds automatically

## Build

```bash
npm run build
```

Builds the project for production to the `dist` directory with minified assets.

## How It Works

### Creating Components

Create `.html` files in `src/components/` with the following structure:

```html
<template>
	<!-- Your HTML template -->
	<div class="my-component">
		<h1>Hello</h1>
	</div>
</template>

<script>
	// Your component logic
	// The build script automatically wraps this with:
	// document.querySelectorAll('mywidget').forEach(function(mywidget) { ... })
	// So you can use the component name (filename) as the element variable
	const innerEl = mywidget.querySelector('.my-component');
	// ... your logic
</script>

<style>
	/* Your component styles */
	mywidget {
		display: block;
	}

	.my-component {
		padding: 20px;
	}
</style>
```

### Using Components

1. Add custom elements to your HTML (matching the component filename):

```html
<card title="Hello" content="World"></card> <counter></counter>
```

2. The plugin automatically:
   - Injects template HTML into matching elements
   - Runs scripts globally
   - Applies styles globally

### Component Name Mapping

- `card.html` → `<card>` elements
- `counter.html` → `<counter>` elements
- `my-widget.html` → `<my-widget>` elements

The template injection code looks like:

```javascript
document.querySelectorAll('card').forEach(function (e) {
	e.innerHTML = `<div class="card">...</div>`;
});
```

## How the Plugin Works

The Vite plugin (`vite-plugin-sfc.js`) does the following:

1. **Build Start**: Reads all `.html` files from `src/components/`
2. **Extracts**: Parses each file to extract `<template>`, `<script>`, and `<style>` sections
3. **Combines**:
   - All scripts → `app.min.js`
   - All styles → `app.min.css` (minified with clean-css)
   - Templates → JavaScript code that injects HTML into matching DOM elements
4. **Outputs**:
   - Dev mode: writes to `public/assets/`
   - Build mode: writes to `dist/assets/`

## Differences from Original

The original build script:

- Processes all components at build time
- Outputs separate JS, CSS files
- Requires manual build command

This Vite plugin:

- Processes components on server start and file changes
- Provides HMR for instant feedback
- Integrates with Vite's build pipeline
- Same output format and behavior

## Project Structure

```
.
├── src/
│   ├── components/     # Component files (.html)
│   └── index.html      # Source HTML (copied to public/)
├── public/              # Dev output directory
│   ├── assets/
│   │   ├── app.min.js
│   │   └── app.min.css
│   └── index.html
└── dist/                # Production build output
```
