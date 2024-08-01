import chalk from 'chalk';
import commentPullRequest from './commentPullRequest';
import { sortBy, uniqWith, isEqual } from 'lodash';
import { TestResult } from './TestResult';
import { ErrorDetail } from './ErrorDetail';
import { MergedConference } from './MergedConference';
import findLineNumber from './findLineNumber';
import { Conference } from './Conference';
import { DuplicateType } from './DuplicateType';

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
            duplicateErrorMessages.push(`  File: ${fileName}:${lineNumber}`);
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
    }
    for (const duplicateErrorMessage of duplicateErrorMessages) {
        console.log(chalk.red.bold(duplicateErrorMessage));
    }

    if (allErrors.length !== 0 || testResult.duplicateErrors.length !== 0) {
        console.log(chalk.red.bold('Error: Tests failed'));
        const token = process.env['GITHUB_TOKEN'];
        if (token) {
            commentPullRequest(token, allErrors, duplicateErrorMessages);
        } else {
            process.exitCode = 1;
            process.exit(1);
        }
    } else {
        console.log(chalk.green(`✓ Checks for all ${testResult.conferenceCounter} conferences have passed successfully`));
    }
}
