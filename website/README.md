# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ cd website
$ npm install
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Deployment

Using SSH:

```
$ USE_SSH=true npm run docusaurus deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm run docusaurus deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
