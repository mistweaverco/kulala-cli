<div align="center">

![kulala-cli Logo][logo]

# kulala-cli

[![npm][badge-npm]][link-npm]
[![latest release][badge-github]][link-github]
[![Discord][badge-discord]][discord]

[Install](#install) •
[Usage](#usage)

<p></p>

A fully-featured 🤏 HTTP/GraphQL/gRPC/Websocket-client 🐼
interface 🖥️ for your command-line ❤️,
that supports the Jetbrains .http spec (with full scripting support).

<p></p>

</div>

## Install

You can install kulala-cli globally using `npm`, `bun`, `yarn` or `pnpm`:

```sh
npm install -g @mistweaverco/kulala-cli
bun add -g @mistweaverco/kulala-cli
yarn global add @mistweaverco/kulala-cli
pnpm add -g @mistweaverco/kulala-cli
```

You can also run it directly without installation using

`npx`, `bunx`, `yarn dlx` or `pnpx`:

```sh
npx @mistweaverco/kulala-cli run --report file.http
bunx @mistweaverco/kulala-cli run --report file.http
yarn dlx @mistweaverco/kulala-cli run --report file.http
pnpx @mistweaverco/kulala-cli run --report file.http
```

On install, kulala-cli downloads a matching
[kulala-core](https://github.com/mistweaverco/kulala-core)
binary automatically.

If install scripts are disabled
(for example `npm install --ignore-scripts`),
the binary is downloaded on first use instead.

To use your own kulala-core binary, set `KULALA_CORE_PATH`:

```sh
export KULALA_CORE_PATH=/path/to/kulala-core
```

### Usage

Run a .http file and and print a report:

```sh
kulala run --report file.http
```

Run all files in a directory and print a report:

```sh
kulala run --report ./requests
```

Run all files in a directory (in random order) and print a report:

```sh
kulala run --report --shuffle ./requests
```

Run a .http file and print the raw kulala-core JSON output:

```sh
kulala run --json file.http
```

Run a .http file and print human readable output:

```sh
kulala run file.http
```

If you want to select a specific environemt, use `--env`:

```sh
kulala run --report --env=production file.http
```



[logo]: https://raw.githubusercontent.com/mistweaverco/kulala-cli/main/assets/logo.svg
[discord]: https://mistweaverco.com/discord
[badge-discord]: https://mistweaverco.com/assets/badges/discord.svg
[badge-github]: https://img.shields.io/github/v/release/mistweaverco/kulala-cli?style=for-the-badge
[link-github]: https://github.com/mistweaverco/kulala-cli/releases/latest
[badge-npm]: https://img.shields.io/npm/v/@mistweaverco/kulala-cli?style=for-the-badge
[link-npm]: https://www.npmjs.com/package/@mistweaverco/kulala-cli
