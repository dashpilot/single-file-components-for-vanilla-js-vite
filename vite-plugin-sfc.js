/**
 * Vite plugin for single-file components
 * Matches the original build.js behavior exactly:
 * - Combines all scripts into app.min.js (no wrapping)
 * - Combines all styles into app.min.css (minified)
 * - Generates template injection code for DOM elements
 * - Dev mode: JS not minified, Production: JS minified
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import { parse } from 'node-html-parser';
import CleanCSS from 'clean-css';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function sfcPlugin() {
	const data = {
		script: '',
		style: '',
		template: ''
	};

	let isDev = true;

	return {
		name: 'vite-plugin-sfc',
		enforce: 'pre',

		// Build start - read all components
		buildStart() {
			isDev = false; // Production build
			const componentsDir = path.resolve(process.cwd(), 'src/components');

			if (!fs.existsSync(componentsDir)) {
				return;
			}

			const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.html'));

			files.forEach((file) => {
				const filepath = path.join(componentsDir, file);
				extractTags(filepath, data);
			});
		},

		// Write bundle - output combined files (production build)
		async writeBundle(options) {
			const outDir = options.dir || 'dist';
			const assetsDir = path.join(outDir, 'assets');

			// Ensure assets directory exists
			if (!fs.existsSync(assetsDir)) {
				fs.mkdirSync(assetsDir, { recursive: true });
			}

			// Minify and write CSS (always minified)
			if (data.style) {
				const cssOutput = new CleanCSS().minify(data.style);
				fs.writeFileSync(path.join(assetsDir, 'app.min.css'), cssOutput.styles, 'utf8');
			}

			// Combine template and script code
			const combined = data.template + ' ' + data.script;

			// Minify JS in production (matches original build.js with sourceMap: true)
			const jsResult = await minify(combined, {
				sourceMap: true
			});
			fs.writeFileSync(path.join(assetsDir, 'app.min.js'), jsResult.code, 'utf8');
		},

		// Dev mode - write files to public/assets
		configureServer(server) {
			isDev = true; // Dev mode
			const componentsDir = path.resolve(process.cwd(), 'src/components');
			const publicDir = path.resolve(process.cwd(), 'public');
			const assetsDir = path.join(publicDir, 'assets');
			const srcIndex = path.resolve(process.cwd(), 'src/index.html');
			const publicIndex = path.join(publicDir, 'index.html');

			// Ensure directories exist
			if (!fs.existsSync(publicDir)) {
				fs.mkdirSync(publicDir, { recursive: true });
			}
			if (!fs.existsSync(assetsDir)) {
				fs.mkdirSync(assetsDir, { recursive: true });
			}

			// Extract components (in case buildStart didn't run)
			if (fs.existsSync(componentsDir)) {
				const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.html'));
				files.forEach((file) => {
					const filepath = path.join(componentsDir, file);
					extractTags(filepath, data);
				});
			}

			// Copy index.html from src to public (matching original behavior)
			if (fs.existsSync(srcIndex)) {
				const indexContent = fs.readFileSync(srcIndex, 'utf8');
				fs.writeFileSync(publicIndex, indexContent, 'utf8');
			}

			// Write files on server start (async)
			writeDevFiles(assetsDir, data, isDev).catch((err) => {
				console.error('Error writing dev files:', err);
			});

			// Watch component files for changes
			if (fs.existsSync(componentsDir)) {
				server.watcher.add(componentsDir);
				server.watcher.on('change', (file) => {
					if (file.includes('/components/') && file.endsWith('.html')) {
						// Reset data and re-extract
						data.script = '';
						data.style = '';
						data.template = '';

						const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.html'));
						files.forEach((f) => {
							const filepath = path.join(componentsDir, f);
							extractTags(filepath, data);
						});

						writeDevFiles(assetsDir, data, isDev).catch((err) => {
							console.error('Error writing dev files:', err);
						});

						// Trigger reload
						server.ws.send({
							type: 'full-reload'
						});
					}
				});
			}
		}
	};
}

/**
 * Extract tags from component file (matches original build.js exactly)
 */
function extractTags(filepath, data) {
	const file = fs.readFileSync(filepath, 'utf8');
	const filename = path.basename(filepath, '.html');

	const root = parse(file);

	// Generate template injection code (matches original)
	if (root.querySelector('template')) {
		data.template +=
			'document.querySelectorAll("' +
			filename +
			'").forEach(function(e){' +
			'e.innerHTML = `' +
			root.querySelector('template').innerHTML.replace(/\s\s+/g, ' ') +
			'`' +
			'})\n';
	}

	// Scripts run globally (no wrapping) - matches original build.js
	if (root.querySelector('script')) {
		data.script += root.querySelector('script').text + '\n';
	}

	// Styles combined
	if (root.querySelector('style')) {
		data.style += root.querySelector('style').text;
	}
}

/**
 * Write dev files (matches original build.js behavior)
 */
async function writeDevFiles(assetsDir, data, isDev) {
	// Write CSS (always minified)
	if (data.style) {
		const cssOutput = new CleanCSS().minify(data.style);
		fs.writeFileSync(path.join(assetsDir, 'app.min.css'), cssOutput.styles, 'utf8');
	}

	// Write JS (not minified in dev mode, matches original)
	const combined = data.template + ' ' + data.script;
	if (isDev) {
		fs.writeFileSync(path.join(assetsDir, 'app.min.js'), combined, 'utf8');
	} else {
		const jsResult = await minify(combined, {
			sourceMap: true
		});
		fs.writeFileSync(path.join(assetsDir, 'app.min.js'), jsResult.code, 'utf8');
	}
}
