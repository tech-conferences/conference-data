import { Octokit } from '@octokit/rest';
import * as github from '@actions/github';
import { DuplicateError } from './DuplicateError';

export default async function getDuplicatePr(token: string, duplicateError: DuplicateError): Promise<String | undefined> {
    const { context: eventContext } = github;
    if (!eventContext?.repo?.owner) {
        return undefined;
    }
    const octokit = new Octokit({
        auth: token
    });
    const qPrefix = `is:pr is:merged repo:${eventContext.repo.owner}/${eventContext.repo.repo} `;
    async function searchPrs(query: string): Promise<String | undefined> {
        const prsWithUrl = await octokit.search.issuesAndPullRequests({
            q: qPrefix + query
        });
        if (prsWithUrl.data.items.length > 0) {
            const pr = prsWithUrl.data.items[0];
            return `[#${pr.number} ${pr.title}](${pr.html_url})`;
        }
    }
    const url = new URL(duplicateError.conference.url);
    const baseUrl = url.origin.replace('www.', '').replace('https://', '').replace('http://', '');
    const path = url.pathname.replace(/\/$/, '');
    const prWithUrl = await searchPrs(baseUrl + path);
    if (prWithUrl) {
        return prWithUrl;
    }
    const prWithBaseUrl = await searchPrs(baseUrl);
    if (prWithBaseUrl) {
        return prWithBaseUrl;
    }
    const prWithName = await searchPrs(duplicateError.conference.name);
    if (prWithName) {
        return prWithName;
    }
    return undefined;
}
