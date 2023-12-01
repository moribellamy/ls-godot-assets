import { Octokit, App } from "octokit";

const octokit = new Octokit();

function sayHello(world: string) {
    console.log(`Hello, ${world}!`);
}

sayHello("World");

