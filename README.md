# UESP Gamemap

The UESP Gamemap is web app for displaying Elder Scrolls games' maps. It is designed for the **Unofficial Elder Scrolls Pages** (www.uesp.net).

While primarily designed for TES games, it supports a variety of other map formats, and can be modified to support other games if desired.

Under the hood, it uses a modified version of [Leaflet](https://leafletjs.com/) for the map, and [Svelte](https://svelte.dev/) for the interface.

## Vality

Vality is an in-development overhaul of the gamemap system, focusing on usability and performance. It is named after Vality7, the mod author that overhauled the TES3's Project Tamriel mod's heightmap.
## Getting started

Clone this repo:

```bash
git clone https://github.com/uesp/uesp-gamemap.git
```

Install [Node.js](https://nodejs.org) dependencies:

```bash
cd uesp-gamemap
npm install
```

Then run in browser:

```bash
npm run dev
```

The gamemap should now be running on [localhost:8080](http://localhost:8080). Any code changes will be reflected in the browser automatically.

To load a map on localhost, add the game parameter after the port number, like so:

```bash
http://localhost:8080/?eso
```

On the hosted version, the format is:

```bash
https://gamemap.uesp.net/eso
```

## Release

To create a release optimised version:

```bash
npm run build
```

To run the release build in your browser:

```bash
npm run start
```

## Licensing

Source code is released under the MIT by Dave Humphrey (dave@uesp.net).