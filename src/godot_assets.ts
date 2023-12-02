import {default as axios} from "axios";
import {Octokit} from "octokit";
import {AxiosResponse} from "axios/index";
import {string} from "cmd-ts";

export type AssetResult = {
    asset_id: string
    title: string
    author: string
    author_id: string
    category: string
    category_id: string
    godot_version: string
    rating: string
    cost: string
    support_level: string
    icon_url: string
    version: string
    version_string: string
    modify_date: string
}

export type ParsedGithub = {
    author: string,
    repo: string
}

export async function parse_github(asset: AssetResult): Promise<ParsedGithub> {
    let asset_response: AxiosResponse;
    try {
        asset_response = await axios.get(`https://godotengine.org/asset-library/api/asset/${asset.asset_id}`);
    } catch (error) {
        // console.error(`error: ${asset.asset_id} -> ${error.response.status}`);
        return null;
    }
    const browse_url: string = asset_response.data.browse_url;
    const parts = browse_url.split("/");
    const found = parts.findIndex(x => x == "github.com");
    if (found < 0 || parts.length < found + 3) {
        // console.error(`error: ${asset.asset_id} -> ${browse_url}`);
        return null;
    }
    return {
        author: parts[found + 1],
        repo: parts[found + 2]
    };
}

export class PaginatedGodotAssets {
    private page_size: number;
    private page: number;
    private buffer: AssetResult[];
    private total: number;

    constructor(page_size: number) {
        this.page_size = page_size;
        this.page = 0;
        this.buffer = [];
        this.total = 0;
    }

    /**
     * If next() has been called once, this returns how many results the paginator will visit.
     */
    get_total(): number {
        return this.total;
    }

    /**
     * Throws if GET on godotengine.org/asset-library is not 2xx.
     *
     * Returns the next AssetResult, or null if we have seen them all.
     */
    async next(): Promise<AssetResult> {
        if (this.buffer.length == 0) {
            const asset_search_response = await axios.get("https://godotengine.org/asset-library/api/asset", {
                params: {
                    godot_version: "any",
                    type: "any",
                    max_results: this.page_size,
                    page: this.page++
                }
            });
            this.buffer = asset_search_response.data.result;
            this.total = asset_search_response.data.total_items;
            if (this.buffer.length == 0) {
                return null;
            }
        }
        return this.buffer.shift();
    }
}