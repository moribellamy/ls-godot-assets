import {Octokit} from "octokit";
import {default as axios} from "axios";
import {myflag} from "./flags";

// https://godotengine.org/asset-library/api/asset?godot_version=any&type=any&max_results=1
async function main() {
    const octokit = new Octokit();
    const repo = await octokit.rest.repos.get(
        {
            owner: "moribellamy",
            repo: "porygon"
        }
    );
    console.log(repo.data.stargazers_count);

    const asset_search_response = await axios.get("https://godotengine.org/asset-library/api/asset", {
        params: {
            godot_version: "any",
            type: "any",
            max_results: "1"
        }
    });

    console.log(asset_search_response.data);

    // const asset_id = asset_search_response.data.result["id"];

    // const asset = await axios.get(`https://godotengine.org/asset-library/api/asset/${asset_id}`);
    const asset = await axios.get("https://godotengine.org/asset-library/api/asset/2089");

    console.log(asset.data);

    console.log(myflag);
}

main();
