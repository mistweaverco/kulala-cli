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

Run a `.http` file and print human-readable output:

```sh
kulala run file.http
```

Run a `.http` file and print the raw kulala-core JSON output:

```sh
kulala run --json file.http
```

Run a `.http` file and print a report:

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

Only print output when a request fails:

```sh
kulala run --quiet ./requests
```

Stop after the first failing request or file:

```sh
kulala run --halt ./requests
```

Select an environment for variable resolution:

```sh
kulala run --report --env=production file.http
```

Run a single request by block name (`###` name):

```sh
kulala run file.http --name MyRequest
```

Run the request at a cursor location (1-based line and column, same as kulala.nvim):

```sh
kulala run file.http --line 17
kulala run file.http --line 19 --column 1
```

When using `--name`, `--line`,
or `--column`, `<path>` must be a single `.http` or
`.rest` file.

### Exit behaviour

kulala-cli exits with code `1` when any request fails. By default, all requests
in a file and all files in a directory are run even when failures occur. Pass
`--halt` to stop after the first failing request within a file and skip remaining
files in a directory.

Success is determined by kulala-core's `success` flag, so operators such as
`// @kulala-expect-status-code` are respected (for example, an expected `404` is
treated as a pass).

### Development

```sh
pnpm install
pnpm run build
pnpm run lint
node dist/cli.cjs --help
```

To use a locally built kulala-core binary during development:

```sh
export KULALA_CORE_PATH=/path/to/kulala-core/dist/kulala-core
node dist/cli.cjs run file.http
```

## Docker

### Run docker interactively and pseudo-TTY:

Run interactively with a mounted `.http` file:

```sh
docker run -it \
  -v ${PWD}/test.http:/app/test.http \
  ghcr.io/mistweaverco/kulala-cli:latest \
  run test.http \
 --name
```

### Run docker non-interactively, but with a pseudo-TTY:

Run one request by block name (`###` name) with
a mounted `.http` file and pseudo-TTY:

```sh
docker run -t \
  -v ${PWD}/test.http:/app/test.http \
  ghcr.io/mistweaverco/kulala-cli:latest \
  run test.http \
 --name "My Request Name"
```

### Run docker non-interactively and without a pseudo-TTY; all requests in a directory:

Run all requests in a directory without
a pseudo-TTY (for example, in CI):

```sh
docker run \
  -v ${PWD}/http-files-dir:/app/http-files-dir \
  ghcr.io/mistweaverco/kulala-cli:latest \
  run ./http-files-dir
```

### Build docker and push to GitHub Container Registry:

#### Build and push to GitHub Container Registry:

```sh
docker buildx build --push \
  -t ghcr.io/mistweaverco/kulala-cli:latest \
  -f Dockerfile .
```

#### Build and push to Docker Hub:

```sh
docker buildx build --push \
  -t mistweaverco/kulala-cli:latest \
  -f Dockerfile .
```

[logo]: https://raw.githubusercontent.com/mistweaverco/kulala-cli/main/assets/logo.svg
[discord]: https://mistweaverco.com/discord
[badge-discord]: https://mistweaverco.com/assets/badges/discord.svg
[badge-github]: https://img.shields.io/github/v/release/mistweaverco/kulala-cli?style=for-the-badge
[link-github]: https://github.com/mistweaverco/kulala-cli/releases/latest
[badge-npm]: https://img.shields.io/npm/v/@mistweaverco/kulala-cli?style=for-the-badge
[link-npm]: https://www.npmjs.com/package/@mistweaverco/kulala-cli
