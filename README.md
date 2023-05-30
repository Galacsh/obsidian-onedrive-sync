# OneDrive Sync

This is a simple plugin that enables syncing your Obsidian vault with [OneDrive](https://onedrive.live.com/), 
inspired by [remotely-save](https://github.com/remotely-save/remotely-save). 
However, it differs from [remotely-save](https://github.com/remotely-save/remotely-save) in that it does not support advanced features. 
It solely allows you to **pull** from and **push** to OneDrive.

> As this plugin is currently intended for personal use, I do not have plans to publish it to the community plugins.
> However, if you find it useful, please consider giving a star to this repository.
> I will consider publishing the plugin with further improvements.

## Caution

- Create backup before using this plugin.
- Periodically create backups of your vault while using this plugin.

## Installation

By using [Obsidian42-BRAT](https://obsidian.md/plugins?id=obsidian42-brat), you could easily install & update this plugin.

1. Install **Obsidian42-BRAT**
2. Enable Obsidian42-BRAT
3. Go to Obsidian42-BRAT options page
4. Beta plugins list > `Add Beta plugin`
5. Paste this `https://github.com/Galacsh/obsidian-onedrive-sync`
6. After installation is done, go to `Settings > Community Plugins > Installed plugins`
7. Refresh the list
8. Turn on the switch of "OneDrive Sync" to enable this plugin

## Features

- Ignoring files
- Syncing
  - Pull from OneDrive
  - Push to OneDrive
- Clone OneDrive → local
- Clone local → OneDrive

### Ignoring files

You can specify files to ignore in the plugin settings. 
Currently, only regex patterns are supported.

Any files that match the specified patterns will be excluded from syncing.

> Note that some regex patterns, such as lookbehind, may cause errors on certain devices.  
> https://marcus.se.net/obsidian-plugin-docs/testing/mobile-devices#lookbehind-in-regular-expressions

### Syncing

Synchronization is just a process of pulling changes from OneDrive 
and then pushing local changes to OneDrive.

#### Pull from OneDrive

Downloads or deletes files of your local vault if there have been 
any changes on OneDrive since the last sync(pull).

> ❗️Note that this will overwrite your local files regardless of 
> whether they have been modified or not.
> This plugin does not support merging changes.

#### Push to OneDrive

Uploads or deletes files on OneDrive based on the changes in your local files since the last sync(pull).

### Clone OneDrive → Local

Downloads all files from OneDrive to your local vault, excluding the ignored files.

> This does not delete any files in your local vault, 
> but files will be overwritten if there are files with the same name on OneDrive.

### Clone Local → OneDrive

Uploads all files from your local vault to OneDrive, excluding the ignored files.

> Unlike `Clone OneDrive → Local`, this will **delete all files on OneDrive**.

## Roadmap

- [x] Ignoring files
- [x] Syncing
  - [x] Pull from OneDrive
  - [x] Push to OneDrive
- [x] Clone OneDrive → local
- [x] Clone local → OneDrive
- [x] Support for iPhone (May work on all iOS devices)
- [ ] Better maintainability
  - Better ESLint, Prettier configuration
  - Commit convention check
  - Code refactoring
  - Release automation
- [ ] Auto syncing
  - [ ] On file change
  - [ ] By interval
- [ ] Stashing
- [ ] Better notification
  - e.g. silent mode, notification level
- [ ] Status bar for indexing information
- [ ] Ignore files by glob pattern
- [ ] Panel for partial syncing
  - Pushing/pulling specific files
