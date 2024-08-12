import { expect, Locator, Page, TestInfo } from "@playwright/test";
import fs from "fs";
import { AssertionError } from 'assert';

/**
 * Function to make API requests and obtain directly the response body.
 * @param url 
 * @param option 
 * @returns Json response body
 */
export async function apiRequest(url: string, option?: {method?, headers?, body?}) {
    try {
        const response = await fetch(url, {
            method: option?.method,
            headers: option?.headers,
            body: JSON.stringify(option?.body)
        });
        if(!response.ok){
            throw new Error(`API request failed to ${url}. Status Code: ${response.status} Response: ${await response.text()}`);
        }
        const body = await response.json();
        return body;
    } catch (error) {
        console.error('Error in apiRequest:', error);
        throw error;
    }
}

/**
 * Attach the assertion text file to the playwright report.
 */
export async function attachAssertionFileToReport(testInfo: TestInfo, path: string){
    await testInfo.attach('AssertionResults', { contentType: 'text/plain', path: `${path}/AssertionResults.txt` });
}

/**
 * Check if a directory exists, otherwise create the directory.
 * @param path 
 */
export function createDirectory(path: string) {
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * **Description**
 * 
 * Makes the assertion if the input contains the expected value.
 * 
 * @param locator 
 * @param expectedText 
 */
export async function inputValueAssertion(locator: Locator, expectedText: string, logger: fs.WriteStream) {
    const message = `ASSERTION RESULT:\n Expected: ${expectedText} \n Obtained: ${await locator.inputValue()}`;
    writeLog(message, logger);
    await expect(locator).toHaveValue(expectedText);
}

/**
 * Converts a file into a base64 string.
 * @param filePath.
 * @returns base64 string.
 */
export function fileToBase64(filePath: string) {
    const data = fs.readFileSync(filePath);
    return data.toString('base64');
}

/**
 * Return the path for all the files found in a directory.
 * @param path
 * @returns string[] with the found files.
 */
export async function getFiles(path: string): Promise<string[]> {
    return fs.readdirSync(path).filter(
        (file) => fs.lstatSync(`${path}/${file}`).isFile()
    );
}

/**
 * **Description**
 * 
 * Makes an assertion with JSON objects
 * 
 * @param obtainedValue 
 * @param expectedValue 
 */
export function jsonAssertion(obtainedValue: object, expectedValue: object, logger: fs.WriteStream) {
    const message = `ASSERTION RESULT:\n Expected: ${JSON.stringify(expectedValue)} \n Obtained: ${JSON.stringify(obtainedValue)}`
    writeLog(message, logger);
    expect(obtainedValue).toEqual(expectedValue);
}

/**
 * **Description**
 * 
 * Makes an assertion with literal values
 * 
 * @param obtainedValue 
 * @param expectedValue 
 */
export function literalValuesAssertion(obtainedValue: any, expectedValue: any, logger: fs.WriteStream) {
    const message = `ASSERTION RESULT:\n Expected: ${expectedValue} \n Obtained: ${obtainedValue}`
    writeLog(message, logger);
    expect(obtainedValue).toEqual(expectedValue);
}

/**
 * **Description**
 * 
 * Makes the assertion if the locator contains the expected text.
 * 
 * @param locator 
 * @param expectedText 
 */
export async function locatorTextAssertion(locator: Locator, expectedText: string, logger: fs.WriteStream) {
    const message = `ASSERTION RESULT:\n Expected: ${expectedText} \n Obtained: ${await locator.innerText()}`
    writeLog(message, logger);
    await expect(locator).toContainText(expectedText);
}

/**
 * Create the logger: fs.WriteStream in the specified folder.
 * @param path 
 */
export function loggerSetup(path: string) {
    createDirectory(path);
    return fs.createWriteStream(`${path}/AssertionResults.txt`, { flags: 'a' });
}

/**
 * **Description**
 * 
 * Takes a screenshot of the page and attaches it to the report.
 * 
 * @param testInfo 
 * @param page 
 * @param path 
 */
export async function takeScreenshot(testInfo: TestInfo, page: Page, path: string){
    const screenshot = await page.screenshot({ path: path, fullPage: true });
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
}

/**
 * 
 * @param options 
 */
export function throwAssertException(message?: any){
    throw new AssertionError({ 
        message: `Test Failed: ${message}`
    });
}

/**
 * **Description**
 * 
 * Display a log in the console and append it to the log file.
 * 
 * @param message 
 * @param logger 
 */
export function writeLog(message: string, logger: fs.WriteStream) {
    console.log(message);
    logger.write(`${message}\n`);
}
