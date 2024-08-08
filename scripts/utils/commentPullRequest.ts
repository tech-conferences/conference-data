import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { ErrorDetail } from './ErrorDetail';
import getPrBranchUrl from './getPrBranchUrl';

export default async function commentPullRequest(token: string, allErrors: ErrorDetail[], duplicateErrorMessages: string[]) {
    const { context: eventContext } = github;
    if (!eventContext.issue || !eventContext.issue.number) {
        return;
    }
    const octokit = new Octokit({
        auth: token
    });
    const prNumber = eventContext.issue.number;
    const prBranchUrl = await getPrBranchUrl(token);
    const comments = allErrors.map(error => {
        return {
            path: error.fileName,
            line: error.lineNumber,
            body: error.message.replace('scripts/config/validLocations.ts', `[scripts/config/validLocations.ts](${prBranchUrl}/scripts/config/validLocations.ts)`)
        };
    });

    try {
        if (comments.length != 0) {
            await octokit.pulls.createReview({
                owner: eventContext.repo.owner,
                repo: eventContext.repo.repo,
                pull_number: prNumber,
                event: 'COMMENT',
                comments: comments
            });
        }
        if (duplicateErrorMessages.length != 0) {
            await octokit.issues.createComment({
                owner: eventContext.repo.owner,
                repo: eventContext.repo.repo,
                issue_number: prNumber,
                body: `### Duplicate Conferences\n${duplicateErrorMessages.join('\n')}`
            });
        }
    } catch (error) {
        console.error(`Unable to comment on Pull Request: ${error}`);
    } finally {
        process.exitCode = 1;
        process.exit(1);
    }
}
