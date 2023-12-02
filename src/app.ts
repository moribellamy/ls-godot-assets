import {Octokit} from "octokit";
import {writeFile} from "fs";
import {MultiBar, Presets} from "cli-progress";
import {number, boolean, command, flag, option, run, string} from "cmd-ts";
import {PaginatedGodotAssets, parse_github, ParsedGithub} from "./godot_assets";


type GithubRepoSummary = {
    repo_url: string,
    stargazers: number
}

async function repo_summary(parsed_github: ParsedGithub, octokit: Octokit): Promise<GithubRepoSummary> {
    try {
        const repo_info = await octokit.rest.repos.get(
            {
                owner: parsed_github.author,
                repo: parsed_github.repo
            }
        );
        return {
            repo_url: `https://github.com/${parsed_github.author}/${parsed_github.repo}`,
            stargazers: repo_info.data.stargazers_count
        };
    } catch (error) {
        return null;
    }
}

const app = command({
    name: "ls-godot-assets",
    args: {
        check_rate: flag({
            type: boolean,
            long: "check_rate",
            short: "r",
            description: "Check the remaining rate limit for the given <gh_api_key>."
        }),
        out: option({
            type: string,
            long: "out",
            short: "o",
            defaultValue: () => "",
            description: "If given, write the output to the given file as JSON."
        }),
        gh_api_key: option({
            type: string,
            long: "github_api_key",
            short: "k",
            defaultValue: () => "",
            description: "If given, use as the github API key for star-getting requests."
        }),
        limit: option({
            type: number,
            long: "limit",
            short: "l",
            defaultValue: () => -1,
            description: "Stop scraping projects after this many. <0 means infinity."
        }),
        page_size: option({
            type: number,
            long: "page_size",
            short: "p",
            defaultValue: () => 200,
            description: "How many godot assets to GET in one batch."
        })
    },
    handler: async ({
        out,
        check_rate,
        gh_api_key,
        limit,
        page_size
    }) => {
        const octokit = new Octokit({auth: gh_api_key});

        if (check_rate) {
            const rate_limit = await octokit.rest.rateLimit.get();
            const rate = rate_limit.data.rate;
            const resetDate = new Date(rate.reset * 1000);
            const resetDateString = resetDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
            console.log(`${rate.remaining}/${rate.limit} core requests remaining (reset ${resetDateString})`);
            return;
        }

        // Godot Phase
        const multibar = new MultiBar({format: "{bar} | {value}/{total} | {name}"}, Presets.shades_grey);
        const paginated = new PaginatedGodotAssets(page_size);
        const parsed_github_promises: Promise<ParsedGithub>[] = [];
        let godot_bar;

        for (let asset_idx = 0; limit < 0 || asset_idx < limit; asset_idx++) {
            const asset = await paginated.next();
            if (asset == null) {
                break;
            }
            if (asset_idx == 0) {
                godot_bar = multibar.create(limit < 0 ? paginated.get_total() : Math.min(limit, paginated.get_total()), 0);
                godot_bar.update(0, {name: "godot"});
            }
            parsed_github_promises.push(parse_github(asset).then(gh => {
                godot_bar.increment();
                return gh;
            }));
        }
        const parsed_github_results = await Promise.all(parsed_github_promises);
        const parsed_githubs = parsed_github_results.filter(gh => gh != null);

        // Github Phase
        const github_repo_promises: Promise<GithubRepoSummary>[] = [];
        const github_bar = multibar.create(parsed_githubs.length, 0);
        github_bar.update(0, {name: "github"});

        for (const parsed_github of parsed_githubs) {
            github_repo_promises.push(repo_summary(parsed_github, octokit).then(summ => {
                github_bar.increment();
                return summ;
            }));
        }

        const resolved = await Promise.all(github_repo_promises);
        const result = resolved.filter(r => r != null);
        multibar.stop();

        // Finish Phase
        if (out == "") {
            console.log(result);
        } else {
            writeFile(out, JSON.stringify(result), err => {
                if (err) {
                    console.error("Cannot write file", err);
                }
            });
        }
    },  // main handler
});  // app def

run(app, process.argv.slice(2)).then();