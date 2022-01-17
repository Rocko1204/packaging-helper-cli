@rocko/packaging-helper
=======================

Provides packaging support

[![Version](https://img.shields.io/npm/v/@rocko/packaging-helper.svg)](https://npmjs.org/package/@rocko/packaging-helper)
[![CircleCI](https://circleci.com/gh/R6736/packaging-helper/tree/master.svg?style=shield)](https://circleci.com/gh/R6736/packaging-helper/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/R6736/packaging-helper?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/packaging-helper/branch/master)
[![Greenkeeper](https://badges.greenkeeper.io/R6736/packaging-helper.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/R6736/packaging-helper/badge.svg)](https://snyk.io/test/github/R6736/packaging-helper)
[![Downloads/week](https://img.shields.io/npm/dw/@rocko/packaging-helper.svg)](https://npmjs.org/package/@rocko/packaging-helper)
[![License](https://img.shields.io/npm/l/@rocko/packaging-helper.svg)](https://github.com/R6736/packaging-helper/blob/master/package.json)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g @rocko/packaging-helper
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
@rocko/packaging-helper/0.0.0 win32-x64 node-v14.17.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx rocko:meta:remove [-p <string>] [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-rockometaremove--p-string--c---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx rocko:project:dep [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-rockoprojectdep--c---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx rocko:project:order [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-rockoprojectorder--c---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx rocko:meta:remove [-p <string>] [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Searches in the default path against the 'src' path for duplicate metadata. Duplicates are displayed in the terminal and can be deleted with the flag. Default path is 'force-app'. With the path flag, however, any paths can be specified.

```
USAGE
  $ sfdx rocko:meta:remove [-p <string>] [-c] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --change                                                                      remove metadata from default/input
                                                                                    path

  -p, --path=path                                                                   custom paths to remove duplicate
                                                                                    metadata.several path possible with
                                                                                    ','delimiter

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx rocko:meta:remove --change,sfdx rocko:meta:remove --patch 'force-app-pre'
```

_See code: [src/commands/rocko/meta/remove.ts](https://github.com/R6736/packaging-helper/blob/v0.0.0/src/commands/rocko/meta/remove.ts)_

## `sfdx rocko:project:dep [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

So that a package can be deployed and validated, the dependencies for the dependencies must also be stored in the sfdx-project.json file. This command checks the dependencies for the dependencies and outputs them in the terminal. The flag can also be used to update the sfdx directly.

```
USAGE
  $ sfdx rocko:project:dep [-c] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --change                                                                      add the missing dependencies of the
                                                                                    packages and updates the
                                                                                    sfdx-project.json

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx rocko:project:dependency
```

_See code: [src/commands/rocko/project/dep.ts](https://github.com/R6736/packaging-helper/blob/v0.0.0/src/commands/rocko/project/dep.ts)_

## `sfdx rocko:project:order [-c] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

The sequence is elementary when deploying and validating a package. The packages from the dependencies of a package must come first in order so that they can be deployed and validated first. This command checks the sfdx-project.json for the correct order and optionally corrects the sfdx-project.json directly.

```
USAGE
  $ sfdx rocko:project:order [-c] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --change                                                                      Corrects the order of the packages
                                                                                    and updates the sfdx-project.json

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  sfdx rocko:project:order --change
```

_See code: [src/commands/rocko/project/order.ts](https://github.com/R6736/packaging-helper/blob/v0.0.0/src/commands/rocko/project/order.ts)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command: 
1. Start the inspector
  
If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch: 
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```
  
Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program. 
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!
