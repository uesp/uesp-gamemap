/**
Truncate a semver version: `1.2.3` → `1.2.0`.

@param version - Semver version.
@param type - Version type to truncate to.

@example
```
import semverTruncate = require('semver-truncate');

semverTruncate('1.2.3-foo', 'patch');
//=> '1.2.3'

semverTruncate('1.2.3', 'minor');
//=> '1.2.0'

semverTruncate('1.2.3', 'major');
//=> '1.0.0'
```
*/
declare function semverTruncate(version: string, type: 'patch' | 'minor' | 'major'): string;

export = semverTruncate;
