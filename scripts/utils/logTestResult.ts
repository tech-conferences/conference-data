import chalk from 'chalk';
import { isEqual, sortBy, uniqWith } from 'lodash';
import { Conference } from './Conference';
import { DuplicateType } from './DuplicateType';
import { ErrorDetail } from './ErrorDetail';
import { MergedConference } from './MergedConference';
import { TestResult } from './TestResult';
import commentPullRequest from './commentPullRequest';
import findLineNumber from './findLineNumber';
import getDuplicatePr from './getDuplicatePr';
import getPrBranchUrl from './getPrBranchUrl';

export default async function logTestResult(testResult: TestResult) {
    const allErrors: ErrorDetail[] = [];
    const token = process.env['GITHUB_TOKEN'];
    const prBranchUrl = await getPrBranchUrl(token);
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

    const duplicateErrorMessages: string[] = [];
    function logDifferences(conference: Conference, duplicate: Conference) {
        for (const field of Object.keys(conference)) {
            if (field == 'startDateParsed' || field == 'stacks' || field == 'endDateParsed' || field == 'cfpEndDateParsed') {
                continue;
            }
            const value = conference[field as keyof Conference];
            const duplicateValue = duplicate[field as keyof Conference];
            if (value !== duplicateValue) {
                duplicateErrorMessages.push(`  Difference in field ${field}: "${value}" vs "${duplicateValue}"`);
            }
        }
    }
    function logDuplicateFileName(conference: MergedConference) {
        for (const stack of conference.stacks) {
            const fileName = `conferences/${conference.startDateParsed.getFullYear()}/${stack}.json`;
            const lineNumber = findLineNumber(conference, 'name', fileName);
            const fileNameWithNumber = `${fileName}:${lineNumber}`;
            if (prBranchUrl) {
                duplicateErrorMessages.push(`  File: [${fileNameWithNumber}](${prBranchUrl}/${fileName}#L${lineNumber})`);
            } else {
                duplicateErrorMessages.push(`  File: ${fileNameWithNumber}`);
            }
        }
    }
    function getDuplicateDescription(type: DuplicateType) {
        switch (type) {
            case DuplicateType.Duplicate:
                return 'duplicate conferences';
            case DuplicateType.AlmostIdentical:
                return 'almost identical conferences';
            case DuplicateType.NotOnlyGeneral:
                return 'general conference with other stack';
            case DuplicateType.TooManyStacks:
                return 'conference with too many stacks';
        }
    }
    for (const duplicateError of testResult.duplicateErrors) {
        duplicateErrorMessages.push(`Error: Found ${getDuplicateDescription(duplicateError.type)}: ${duplicateError.conference.name}`);
        logDuplicateFileName(duplicateError.conference);
        logDuplicateFileName(duplicateError.duplicate);
        logDifferences(duplicateError.conference, duplicateError.duplicate);
        if (token) {
            const prUrl = await getDuplicatePr(token, duplicateError);
            if (prUrl) {
                duplicateErrorMessages.push(`  Potential Duplicate PR: ${prUrl}`);
            }
        }
    }
    for (const duplicateErrorMessage of duplicateErrorMessages) {
        console.log(chalk.red.bold(duplicateErrorMessage));
    }

    if (allErrors.length !== 0 || testResult.duplicateErrors.length !== 0 || testResult.error) {
        console.log(chalk.red.bold('Error: Tests failed'));
        if (token) {
            commentPullRequest(token, allErrors, duplicateErrorMessages, testResult.error);
        } else {
            if (testResult.error) {
                console.error(`Error: ${testResult.error}`);
            }
            process.exitCode = 1;
            process.exit(1);
        }
    } else {
        console.log(chalk.green(`✓ Checks for all ${testResult.conferenceCounter} conferences have passed successfully`));
    }
}
