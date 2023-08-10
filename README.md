# UESP Gamemap

The UESP Gamemap is web app for displaying Elder Scrolls games' maps. Whilst primarily designed for the **Unofficial Elder Scrolls Pages** (www.uesp.net), it supports a variety of other map formats, and can be modified to support other games/sites if desired.

Under the hood, it uses a modified version of [Leaflet](https://leafletjs.com/) for the map, and [Svelte](https://svelte.dev/) for the interface.
## Getting started

### Prerequisites

- Install [PHP](https://www.php.net/)
- Install [Node.js](https://nodejs.org)
### Server setup

The PHP server needs to be configured before getting the gamemap running:
- Enable ``mysqli`` extension in ``php.ini``:

Go to ``php.ini`` config file location (On Linux it's ``/etc/php/php.ini``) and uncomment the ``;extension=mysqli`` line.

```php
...
;extension=ldap
extension=mysqli // <-- uncomment this one
;extension=odbc
...
```
- Install [Memcache](https://pecl.php.net/package-search.php?pkg_name=memcache) php extension

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; • Add line ``extension=/path/to/php/modules/memcache.so`` to ``php.ini`` to enable it.

- Enable zlib compression in ``php.ini`` to fix content encoding errors:
```php
zlib.output_compression = On
```

Done!

### Gamemap setup

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