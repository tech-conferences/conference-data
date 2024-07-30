import chalk from 'chalk';
import commentPullRequest from './commentPullRequest';
import { sortBy, uniqWith, isEqual } from 'lodash';
import { TestResult } from './TestResult';
import { ErrorDetail } from './ErrorDetail';

export default function logTestResult(testResult: TestResult) {
    const allErrors: ErrorDetail[] = [];
    for (const year of Object.keys(testResult.errors)) {
        const errorsOfYear: ErrorDetail[] = [];
        process.stdout.write(chalk.gray(`${year}: `));
        const topics = Object.keys(testResult.errors[year]);
        topics.forEach((topic, i) => {
            const errors = testResult.errors[year][topic];
            if (errors.length >= 1) {
                for (const error of errors) {
                    errorsOfYear.push(error);
                    allErrors.push(error);
                }
                process.stdout.write(chalk.red(`x ${topic}`));
            } else {
                process.stdout.write(chalk.green(`✓ ${topic}`));
            }
            if (i < topics.length - 1) {
                process.stdout.write(chalk.gray(', '));
            }
        });
        process.stdout.write(chalk.black('\n'));
        const sortedErrorsOfYear = sortBy(errorsOfYear, ['value', 'fileName', 'lineNumber']);
        const uniqSortedErrorsOfYear = uniqWith(sortedErrorsOfYear, isEqual);
        for (const error of uniqSortedErrorsOfYear) {
            const value = error.value ? ` - got "${error.value}"` : '';
            console.log(chalk.red(` - Error: ${error.message}${value} in file: ${error.fileName}:${error.lineNumber}`));
        }
    }

    if (allErrors.length !== 0) {
        console.log(chalk.red('Tests failed'));
        const token = process.env['GITHUB_TOKEN'];
        if (token) {
            commentPullRequest(token, allErrors);
        } else {
            process.exitCode = 1;
            process.exit(1);
        }
    } else {
        console.log(chalk.green(`✓ Checks for all ${testResult.conferenceCounter} conferences have passed successfully`));
    }
}
