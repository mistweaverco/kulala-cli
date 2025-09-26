<div align="center">

![Kulala Logo](assets/logo.svg)

# Kulala CLI

[![Made with love](assets/badge-made-with-love.svg)](https://github.com/mistweaverco/kulala-cli/graphs/contributors)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/mistweaverco/kulala-cli?style=for-the-badge)](https://github.com/mistweaverco/kulala-cli/releases/latest)
[![Discord](assets/badge-discord.svg)](https://discord.gg/QyVQmfY4Rt)

[![Status](https://img.shields.io/github/actions/workflow/status/mistweaverco/kulala-cli/tests.yml?label=main&branch=main&style=for-the-badge)](https://github.com/mistweaverco/kulala-cli/actions/workflows/tests.yml)

<p></p>

A work-in-progess, standalone REST Client for your CLI.

Kulala is swahili for "rest" or "relax."

It allows you to make HTTP requests from within your terminal.

If you need a already working solution,
check out [kulala.nvim CLI](https://neovim.getkulala.net/docs/usage/cli-ci#kulala-cli).

This project aims to replace the neovim requirement
with a standalone CLI tool.

<p></p>

## Features

Protocols: HTTP, GraphQL

Variables: Environment, Document, Request, Dynamic, Prompt, `http-client.env` files

JS scripting: Pre-request, Post-request, Conditional, Inline, External

Authentication: Basic, Bearer

Assertions, automated testing and reporting

Compatibility with IntelliJ HTTP Client

</div>

## Install

You can install the Kulala CLI via the installer script:

For Unix-based systems (Linux, macOS, WSL):

```sh
# sh
curl -sSL https://cli.getkulala.net/install.sh | sh
# bash
curl -sSL https://cli.getkulala.net/install.sh | bash
# zsh
curl -sSL https://cli.getkulala.net/install.sh | zsh
```

For Windows (PowerShell):

```powershell
irm https://cli.getkulala.net/install.ps1 | iex
```
