# brave-site-specific-scripts
a.k.a. Greaselion

Site-specific scripts for Brave

This repository provides content scripts that—depending on your browser settings—may be injected into specific sites while you browse the web with Brave. This allows Brave to provide functionality like "tip this tweet" on `twitter.com`.

You can view the [`Greaselion.json`](https://github.com/brave/brave-site-specific-scripts/blob/master/Greaselion.json) master configuration file or view the individual scripts elsewhere in this repository.

The rest of this README is primarily for Brave developers who need to work with this code.

---

Table of contents:

 - [Developing new Greaselion scripts](#developing-new-greaselion-scripts)
 - [Script capabilities](#script-capabilities)
 - [Configuration file format](#configuration-file-format)
   - [`preconditions` key](#preconditions-key)
   - [`urls` key](#urls-key)
   - [`scripts` key](#scripts-key)
 - [Pushing to production](#pushing-to-production)
 - [Troubleshooting](#troubleshooting)

## Developing new Greaselion scripts

Greaselion supports an arbitrary number of rules. All rules are listed in the `Greaselion.json` file, which is parsed once at startup. (In release builds, it is re-parsed if the Local Data Files Updater component is updated while Brave is running, but that should not affect you during development.)

If you are developing a new Greaselion rule, you can directly edit your local `Greaselion.json` file, which is in a platform-specific location. On a Mac, it should be somewhere like

`~/Library/Application Support/BraveSoftware/Brave-Browser-Development/afalakplffnnnlkncjhbmahjfjhmlkal/VERSION/1/Greaselion.json`

where `VERSION` varies.

Add your new rule in the `Greaselion.json` file, then create your script file inside the `scripts/` subdirectory. Most Greaselion rules will only need one script file, but if you need more than one, you can list multiple files in a single Greaselion rule. They will be injected in the order listed in the `Greaselion.json` file.

## Script capabilities

You can think of Greaselion scripts as single-file Chromium extensions. In fact, they are treated internally as component extensions, although this is an implementation detail that should not affect you during development. All of the [Chromium APIs](https://developer.chrome.com/extensions/content_scripts#capabilities) are available to Greaselion scripts, including [`chrome.runtime`](https://developer.chrome.com/extensions/runtime).

Greaselion scripts are executed as soon as the page DOM is available, but before images have loaded. This is equivalent to an extension that specifies `"run_at": "document_end"` in its manifest.

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

Each item in the array is a [URL match pattern](https://developer.chrome.com/extensions/match_patterns), which is a datatype defined by Chromium that allows you to specify URLs with wildcards in certain places. It intelligently handles variations that can occur in URLs and strange edge cases that you probably would never have considered.

Each match pattern must be use either the `http:` or `https:` scheme. There is no support for `file:` URLs.

There can be multiple URL match patterns in this array. If all preconditions are fulfilled and **if any URL pattern matches**, all scripts in the Greaselion rule will be injected.

### `scripts` key

`scripts` is a required key whose value is a `JSON` array. Its role is to specify the actual script files to be injected into the page.

Each item in this array is a partial pathname and filename. The path is relative to the directory where the `Greaselion.json` configuration file resides.

## Pushing to production

Like tracking lists or adblocking lists, Greaselion scripts can be updated an dpushed to users outside of a full application update. On the client side, this is managed by the (Local Data Files service)[https://github.com/brave/brave-core/blob/master/components/brave_component_updater/browser/local_data_files_service.cc]. On the server side, it is managed by uploading a new version of the (Local Data Files Updater component)[https://github.com/brave/brave-core-crx-packager]. In between is this repository.

Thus:

 1. [Create a pull request](https://github.com/brave/brave-site-specific-scripts/pull/new/master) in this repository with your new Greaselion script files and an updated `Greaselion.json` file.
 2. Once your pull request has been approved and merged, run the [`brave-core-crx-packager`](https://github.com/brave/brave-core-crx-packager) `package-local-data-files` script to create a new version of the Local Data Files Updater component. The new version will include all the Greaselion scripts from this repository.
 3. Run the `brave-core-crx-packager` `upload-local-data-files` script to upload the newly packaged Local Data Files Updater component to the Brave extension server.
 4. To test that the process worked, open a release build of Brave and navigate to `brave://components/`. Under `Brave Local Data Updater`, click the `Check for update` button. It should find and download the newly uploaded component.

Brave automatically checks for updates to its components, so most Brave users should receive your updated Greaselion script within 24 hours. The client-side Greaselion service is designed to refresh itself without relaunching Brave, so changes will go live even if a user is already running Brave at the time. Open tabs will not be refreshed, but the new Greaselion scripts will be active once the user manually refreshes the tab, or when they open a new tab.

## Troubleshooting

Running a debug build, if something goes catastrophically wrong, there may be error messages printed in the debug log. Search for `greaselion_` to find them.

 - `Malformed pattern in Greaselion configuration`: one of the URL patterns is not valid URL match pattern syntax, or it uses some URL scheme other than `http:` or `https:`.
 - `Malformed filename in Greaselion configuration`: one of the script paths is not valid, perhaps because it points to an absolute pathname or tries to use `../..` notation to point to a file outside the root directory where `Greaselion.json` resides.
 - `Could not load Greaselion script`: the script path itself is valid but the file was not found.
 - `Could not obtain Greaselion configuration`: the `Greaselion.json` file was not found.
 - `Failed to parse Greaselion configuration`: the `Greaselion.json` file was found but could not be parsed as `JSON`. You probably have a stray comma at the end of a list. Chromium's `JSON` parser is strict and will not allow this. The last Greaselion rule must not have a comma after it. The last script in the `scripts` list must not have a comma after it. The last URL pattern in the `urls` list must not have a comma after it. The last precondition in the `preconditions` object must not have a comma after it. Ask me how I know so much about commas.
 - Any other log message from a `greaselion_*` source file indicates a bug in Greaselion itself, for which you should file a bug. Examples include, but are not limited to, `Could not create Greaselion temp directory`, `Could not write Greaselion manifest`, `Could not copy Greaselion script`, `Could not load Greaselion extension`, and similar messages.
