# ls-godot-assets

A quick and easy command line tool for scraping the godot addon database,
sorting the results by github stars. Presently, only github projects are parseable by the tool.

## Generate usage instructions

The API call to get the stars for a given project is rate limited. With no auth, you only get 60 calls per hour.
So you really need to use the `-k` flag for this script to work.

```bash
$ npm run app -- -h
```

```
> ls-godot-assets@1.0.0 app
> tsc && node dist/app.js -h

ls-godot-assets

FLAGS:
  --check_rate, -r - Check the remaining rate limit for the given <gh_api_key>.
  --help, -h       - show help

OPTIONS:
  --out, -o <str>            - If given, write the output to the given file as JSON. [optional]
  --github_api_key, -k <str> - If given, use as the github API key for star-getting requests. [optional]
  --limit, -l <number>       - Stop scraping projects after this many. <0 means infinity. [optional]
  --page_size, -p <number>   - How many godot assets to GET in one batch. [optional]
```

## Sample usage

```bash
$ npm run app -- -o results.json -k <my_github_key>
$ jq -r '.[] | "* \(.stargazers) \(.repo_url)"' results.json > results.md
```

## Sample output
Example output (generated in December 2023) is saved in `out/`.