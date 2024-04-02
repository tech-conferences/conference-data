const github = require('@actions/github');
const { Octokit } = require('@octokit/rest');

module.exports = async function commentPullRequest(token, allErrors) {
    const { context: eventContext } = github;
    if (!eventContext.issue || !eventContext.issue.number) {
        return;
    }
    const octokit = new Octokit({
        auth: token
    });
    const prNumber = eventContext.issue.number;
    const comments = allErrors.map(error => {
        return {
            path: error.fileName,
            line: error.lineNumber,
            body: error.message
        };
    });
    try {
        const review = {
            owner: eventContext.repo.owner,
            repo: eventContext.repo.repo,
            pull_number: prNumber,
            event: 'COMMENT',
            body: 'Errors in PR',
            comments: comments
        };
        console.log(`Review: ${JSON.stringify(review)}`);
        await octokit.pulls.createReview(review);
    } catch (error) {
        console.error(`Unable to comment on Pull Request: ${error} with comments: ${JSON.stringify(comments)}`);
    } finally {
        process.exitCode = 1;
        process.exit(1);
    }
};
