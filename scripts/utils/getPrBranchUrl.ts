import { Octokit } from '@octokit/rest';
import * as github from '@actions/github';

export default async function getPrBranchUrl(token: string | undefined): Promise<String | undefined> {
    if (token === undefined) {
        return undefined;
    }
    const { context: eventContext } = github;
    if (!eventContext?.repo?.owner) {
        return undefined;
    }
    const octokit = new Octokit({
        auth: token
    });

    const pr = await octokit.pulls.get({
        owner: eventContext.repo.owner,
        repo: eventContext.repo.repo,
        pull_number: eventContext.issue.number
    });

    if (pr?.data?.head?.ref === undefined || pr?.data?.head?.repo?.html_url === undefined) {
        return undefined;
    }
    return `${pr.data.head.repo?.html_url}/tree/${pr.data.head.ref}`;
}
