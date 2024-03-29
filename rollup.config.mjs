import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';
import replace from '@rollup/plugin-replace';
import sveltePreprocess from 'svelte-preprocess';
import phpServer from 'php-server';

// create require
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// define is production or not
const production = !process.env.ROLLUP_WATCH;

// set up local php server
const phpServ = await phpServer({ port : 2500, base : "public/" });
console.log(`PHP server running at ${phpServ.url}`);

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
		if (phpServ) phpServ.stop();
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'public/mount.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/build/bundle.js'
	},
	onwarn(warning, warn) {
		// suppress eval warnings
		if (warning.code === 'EVAL') return
		warn(warning)
	},
	plugins: [
		svelte({
			onwarn: (warning, handler) => {
				const { code, frame } = warning;
				if (code === "css-unused-selector") return;
				if (code === 'a11y-click-events-have-key-events') return;
				if (code === 'missing-declaration') return;
				if (code === 'a11y-missing-attribute') return;
				handler(warning);
			},
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production,
				accessors: true,
			},
			preprocess: sveltePreprocess({ markupTagName : "markup" }),
		}),
		replace({
			preventAssignment: true,
			isRelease: production,
			isDebug: !production,
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'bundle.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};