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
    const url = new URL(duplicateError.conference.url);
    const baseUrl = url.origin.replace('www.', '').replace('https://', '').replace('http://', '');
    const path = url.pathname.replace(/\/$/, '');
    const prsWithUrl = await octokit.search.issuesAndPullRequests({
        q: qPrefix + baseUrl + path
    });
    if (prsWithUrl.data.items.length > 0) {
        return prsWithUrl.data.items[0].html_url;
    }
    const prsWithBaseUrl = await octokit.search.issuesAndPullRequests({
        q: qPrefix + baseUrl
    });
    if (prsWithBaseUrl.data.items.length > 0) {
        return prsWithUrl.data.items[0].html_url;
    }
    const prsWithName = await octokit.search.issuesAndPullRequests({
        q: qPrefix + duplicateError.conference.name
    });
    if (prsWithName.data.items.length > 0) {
        return prsWithUrl.data.items[0].html_url;
    }
    return undefined;
}
