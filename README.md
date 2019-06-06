# brave-site-specific-scripts
a.k.a. Greaselion

Site-specific scripts for Brave

This repository provides content scripts that—depending on your browser settings—may be injected into specific sites while you browse the web with Brave. This allows Brave to provide functionality like "tip this tweet" on `twitter.com`.

You can view the [`Greaselion.json`](https://github.com/brave/brave-site-specific-scripts/blob/master/data/Greaselion.json) master configuration file or view the individual scripts elsewhere in this repository.

The rest of this README is primarily for Brave developers who need to work with this code.

## Configuration file format

The `Greaselion.json` file controls which scripts are injected on which sites, under which conditions. It is in `JSON` format. The root element is a `JSON` array whose elements are `JSON` objects. Each object is a "Greaselion rule." Greaselion rules are self-contained and independent of each other; no rule affects any other rule. All Greaselion rules are considered on all URL requests. Multiple rules may end up "matching" a single URL request, and depending on browser settings, injecting one or more scripts into the web page that the end user is navigating.

Every Greaselion rule must contain 2 required keys and may contain 1 optional key (listed below). Keys must not be duplicated within a single Greaselion rule. Keys may appear in any order. All keys are case-sensitive.

### `preconditions` key

`preconditions` is an optional key whose value is a `JSON` object. Its role is to specify the environment in which this Greaselion rule applies. These roughly correspond to per-profile browser settings.

There can be multiple preconditions in this object. **All preconditions must be fulfilled** in order for a Greaselion rule to "match." If any precondition is not fulfilled, the entire rule is ignored and none of its scripts will be injected.

These `preconditions` keys are supported:

 - `rewards-enabled` may be `true` or `false`. Corresponds to whether "Brave Rewards" is enabled in this profile.
 - `twitter-tips` may be `true` or `false`. Corresponds to whether "Twitter tips" is enabled in this profile.

This list is exhaustive. No other preconditions are supported.

### `urls` key

`urls` is a required key whose value is a `JSON` array. Its role is to specify the URLs for which this Greaselion rule applies.

Each item in the array is a [`URLPattern`](https://cs.chromium.org/chromium/src/extensions/common/url_pattern.h), which is a datatype defined by Chromium that allows you to specify URLs with wildcards in certain places. It intelligently handles variations that can occur in URLs and strange edge cases that you probably would never have considered.

Each URL pattern must be use either the `http:` or `https:` scheme.

Each URL pattern is parsed with the `ALLOW_WILDCARD_FOR_EFFECTIVE_TLD` flag, which allows you to wildcard the top-level domain without introducing security risks from phishing domains. For example, the URL pattern `https://www.example.*/` would match `https://www.example.com/` and `https://www.example.org/` but would not match `https://www.example.evil.phishing.site.com/`.

There can be multiple URL patterns in this array. If all preconditions are fulfilled and **if any URL pattern matches**, all scripts in the Greaselion rule will be injected.

### `scripts` key

`scripts` is a required key whose value is a `JSON` array. Its role is to specify the actual script files to be injected into the page.

Each item in this array is a partial pathname and filename. The path is relative to the directory where the `Greaselion.json` configuration file resides.

## Troubleshooting

The `Greaselion.json` file is parsed once at startup. (It will be re-parsed if the Local Data Files Updater component is updated while Brave is running.) If you are developing a new Greaselion rule, you can directly edit your local `Greaselion.json` file, which is in a platform-specific location. On a Mac, it should be somewhere like

`~/Library/Application Support/BraveSoftware/Brave-Browser-Development/afalakplffnnnlkncjhbmahjfjhmlkal/VERSION/1/Greaselion.json`

where `VERSION` varies.

Running a debug build, if something goes catastrophically wrong, there may be error messages printed in the debug log. Search for `greaselion_download_service` to find them.

 - `Malformed pattern in Greaselion configuration`: one of the URL patterns is not valid `URLPattern` syntax.
 - `Malformed filename in Greaselion configuration`: one of the script paths is not valid, perhaps because it points to an absolute pathname or tries to use `../..` notation to point to a file outside the root directory where `Greaselion.json` resides.
 - `Could not load Greaselion script`: the script path itself is valid but the file was not found.
 - `Could not obtain Greaselion configuration`: the `Greaselion.json` file was not found.
 - `Failed to parse Greaselion configuration`: the `Greaselion.json` file was found but could not be parsed as `JSON`. You probably have a stray comma at the end of a list. Chromium's `JSON` parser is strict and will not allow this. The last Greaselion rule must not have a comma after it. The last script in the `scripts` list must not have a comma after it. The last URL pattern in the `urls` list must not have a comma after it. The last precondition in the `preconditions` object must not have a comma after it. Ask me how I know so much about commas.
