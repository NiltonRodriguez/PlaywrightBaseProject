import { APIRequestContext, APIResponse, test, Page } from '@playwright/test';
import { doDelete, doGet, doPost, doPut } from '../POM/utils/api-utils';
import { attachAssertionFileToReport, jsonAssertion, literalValuesAssertion, loggerSetup, writeLog } from '../POM/utils/general-utils';
import fs from 'fs';
import { AzureUtils } from '../POM/utils/azure-utils';
import oracledb from "oracledb";
import { connectToOracleDB } from '../POM/utils/database-utils';

let azureUtils: AzureUtils;
let apiContext: APIRequestContext;
let logger: fs.WriteStream;
let oracleDBConnection: oracledb.Connection;
let resultPath: string;
let page: Page;
let step: number;
let testCaseId: string;

test.beforeAll(async ({ browser, playwright }) => {
  // Initialize APIRequestContext if needed.
  apiContext = await playwright.request.newContext({baseURL: `${process.env.API_BASE_URL}`});
  // Initialize a Page if needed.
  page = await browser.newPage();
  // Initialize the connection to a database if needed.
  oracleDBConnection = await connectToOracleDB(`${process.env.DB_USER}`, `${process.env.DB_PASSWORD}`, `${process.env.DB_CONNECT_STRING}`);
  // Initialize Azure DevOps utils with the test plan ID, test suite ID and an array with the test case ID that will be part of the run.
  azureUtils = new AzureUtils(AzureTestPlanID,AzureTestSuiteID,["AzureTestCaseID_1", "AzureTestCaseID_1"]);
  // Create the test run for the given test plan, test suite and test cases.
  await azureUtils.createTestRun();
})

test.beforeEach(async ({}, testInfo) => {
  // Test name should start with the test case ID to track and update each test case in Azure DevOps
  const testName = testInfo.title.split(' ');
  testCaseId = testName[0];
  // Assing a string with the path to save the test results.
  resultPath = `./test-results/test-file-name-Test-Suite-Name-${testName.join('-')}-browser`;
  // Initialize a logger to save logs and assertion results.
  logger = await loggerSetup(resultPath);
  // Initialize the test steps at 1. If its used in a test.step in the beforeEach, the following steps should continue the sequence.
  step = 1;
})

test.afterEach(async ({}, testInfo) => {
  // Finish the writestream of the txt log file.
  logger.end();
  // Attach the assertions txt file to playwright report.
  attachAssertionFileToReport(testInfo, resultPath);
  // Update the test results to each test case asociated to the Azure DevOps Test Run created in the beforAll hook.
  await azureUtils.updateTestCaseResult(testCaseId, `${testInfo.status}`, resultPath);
})

test.afterAll(async () => {
  // Update the test results to each test Run created in the beforAll hook.
  await azureUtils.updateTestRunResult();
  // Clear the api context.
  await apiContext.dispose();
})

test.describe('Test Suite Name', async () => {
  test('TestCaseID - Test case name', async ({}, testInfo) => {
    // Write test steps in the try block, that way, if there is an error will be catched and sets the test step result to false.
    try{
      await test.step('Test step name / description', async () => {
        // Test code block.
        // Write in te log file if needed.
        writeLog(JSON.stringify(getResponse), logger);
        // Update the test step result for each iteration in the rest result.
        azureUtils.updateTestStepResult(testCaseId, step, `${testInfo.status}`)
      })
      await test.step('Test step name / description', async () => {
        // Change the test step identifier to the next in the sequence.
        step = 2
        // Test code block.
        // You can write/use custom functions to reuse assertions while writing in the txt log file.
        jsonAssertion(currentValue, expectedValue, logger)
        // Update the test step result for each iteration in the rest result.
        azureUtils.updateTestStepResult(testCaseId, step, `${testInfo.status}`)
      })
    } catch (error) {
      // Update the test step result to failed.
      azureUtils.updateTestStepResult(testCaseId, step, 'failed');
      throw error;
    }
  })

  test('TestCaseID - Next test case name', async ({}, testInfo) => {
    // Write test steps in the try block, that way, if there is an error will be catched and sets the test step result to false.
    try{
      await test.step('Test step name / description', async () => {
        // Test code block.
        // Write in te log file if needed.
        writeLog(JSON.stringify(getResponse), logger);
        // Update the test step result for each iteration in the rest result.
        azureUtils.updateTestStepResult(testCaseId, step, `${testInfo.status}`)
      })
      await test.step('Test step name / description', async () => {
        // Change the test step identifier to the next in the sequence.
        step = 2
        // Test code block.
        // You can write/use custom functions to reuse assertions while writing in the txt log file.
        jsonAssertion(currentValue, expectedValue, logger)
        // Update the test step result for each iteration in the rest result.
        azureUtils.updateTestStepResult(testCaseId, step, `${testInfo.status}`)
      })
    } catch (error) {
      // Update the test step result to failed.
      azureUtils.updateTestStepResult(testCaseId, step, 'failed');
      throw error;
    }
  })
})
