import { apiRequest, fileToBase64, getFiles } from "./general-utils";

interface TestCasesInfo {
    [testCaseId: string]: TestCaseData;
}

interface TestCaseData{
    pointId?: number;
    testResultData?: TestResultData;
}

interface TestResultData {
    id?: number;
    state?: string;
    outcome?: string;
    comment?: string;
    iterationDetails?: IterationDetail[];
}

interface IterationDetail {
    id?: number;
    outcome?: string;
    startedDate?: Date;
    completedDate?: Date;
    actionResults?: ActionResult[];
}

interface ActionResult {
    actionPath?: string;
    iterationId?: number;
    stepIdentifier?: string;
    outcome?: string;
    startedDate?: Date;
    completedDate?: Date;
}

interface AttachmentData {
    stream: string;
    fileName: string;
    comment: string;
    attachmentType: string;
}

export class AzureUtils {

    private readonly organization: string;
    private readonly project: string;
    private readonly pat: string;
    private readonly planId: number;
    private readonly suiteId: number;
    private readonly testCases: string[];
    private runId: number;
    private testCasesInfo: TestCasesInfo = {};
    private readonly headers: {};
    private readonly azureBaseUrl: string;
    private runAttatchments: AttachmentData[];

    constructor(planId: number, suiteId: number, testCasesId: string[]){
        this.organization = `${process.env.AZURE_ORGANIZATION}`;
        this.project = `${process.env.AZURE_PROJECT}`;
        this.pat = `Basic ${Buffer.from(`:${process.env.AZURE_PAT}`).toString('base64')}`;
        this.planId = planId;
        this.suiteId = suiteId;
        this.testCases = testCasesId;
        this.testCasesInfo = {};
        this.azureBaseUrl = `https://dev.azure.com/${this.organization}/${this.project}/_apis`
        this.headers = {
            'Content-Type': 'application/json',
            Authorization: this.pat,
        };
        this.runAttatchments = [];
    };

    private getTestCaseResultData(testCaseId: string){
        const testCaseResultData = this.testCasesInfo[testCaseId].testResultData;
        if (!testCaseResultData){
            throw new ReferenceError(`Test case data for ID ${testCaseId} does not exist.`);
        }
        return testCaseResultData
    }

    private getIterationDetail(testCaseId: string){
        const iterationDetail = this.getTestCaseResultData(testCaseId).iterationDetails;
        if (!iterationDetail){
            throw new ReferenceError(`Iteration data for ID ${testCaseId} does not exist.`);
        }
        return iterationDetail
    }

    /**
     * Make a request to the Azure DevOps Run API to obtain the run results details.
     * Then assign the result details to the testResultData attribute of each test case in te property testCasesInfo.
     */
    private async assignResultFromRun(){
        const url = `${this.azureBaseUrl}/test/Runs/${this.runId}/results?detailsToInclude=WorkItems&$top=100&api-version=7.1-preview.6`;
        const body = await apiRequest(url, {
            method: 'GET',
            headers: this.headers
        });
        try {
            body.value.forEach(value => {
                const testCaseId = value.testCase.id;
                const testResultData: TestResultData = {
                    id: value.id,
                    state: value.state,
                    comment: 'Automated run with Playwright',
                    iterationDetails: [
                        {
                            id: 1,
                            startedDate: new Date(value.startedDate),
                            completedDate: new Date(value.completedDate),
                            actionResults: []
                        }
                    ]
                };
                if (!this.testCasesInfo[testCaseId]){
                    throw new ReferenceError(`Iteration data for ID ${testCaseId} does not exist.`);
                }
                this.testCasesInfo[testCaseId].testResultData = testResultData;
            });
        } catch (error) {
            throw new TypeError(`Error in the assignment of the test result data: ${error}`);
        }
    }

    /**
     * Cast the attachments to base64 and the format tor the attachment request.
     * @param testCaseId Convert 
     * @param path 
     * @returns Array with the attachment data.
     */
    private async convertAttachmentsToBase64(testCaseId: string, path: string){
        let attachmentFiles: AttachmentData[] = [];
        const filesFound = await getFiles(path)
        filesFound.forEach(file => {
            let attachment: AttachmentData = {
                stream: fileToBase64(`${path}/${file}`),
                fileName: `${testCaseId} - ${file}`,
                comment: 'Playwright automation attachment',
                attachmentType: 'GeneralAttachment'
            }
            attachmentFiles.push(attachment);
            this.runAttatchments.push(attachment);
        });
        return attachmentFiles;
    }
    
    /**
     * Create Test Run:
     * To execute a test case the Azure DevOps Service will create a test run which acts as a container for all the test results. 
     * The test run is generated using test points which is obtained from the getPointsId call. 
     * The API will create a test run and will return the test run id as a parameter in the JSON response.
     */
    async createTestRun() {
        await this.getPointsId();
        const pointIds = Object.values(this.testCasesInfo).map(testCaseData => testCaseData.pointId);
        const requestBody = {'name': 'Playwright automated test run','plan': {'id': String(this.planId)}, 'pointIds': pointIds};
        const url = `${this.azureBaseUrl}/test/runs?api-version=7.1-preview.2`;
        try {
            const body = await apiRequest(url, {
                method: 'POST',
                headers: this.headers,
                body: requestBody
            });
            this.runId = body.id;
            console.log(`Test Run ${this.runId} succesfully created...`);
            await this.assignResultFromRun();
        } catch (error) {
            throw new TypeError(`Error fetching data for test run creation ${error}`);
        }
    }

    /**
     * Test Point:
     * A test point is a unique combination of test case, test suite, configuration, and tester and is used to create a Test Run.
     * This function get the pointId for the given test cases.
     */
    private async getPointsId() {
        for (const testCase of this.testCases) {
            const url = `${this.azureBaseUrl}/test/Plans/${this.planId}/suites/${this.suiteId}/points?api-version=7.1-preview.2&testCaseId=${testCase}&$top=1`;
            try {
                // Make the request to obtain the point ID of each given test case.
                const body  = await apiRequest(url, {
                    method: 'GET',
                    headers: this.headers
                });
                // Assign the pointId to the test case info.
                if (body?.value?.length > 0) {
                    this.testCasesInfo[testCase] = {
                        pointId: body.value[0].id,
                        testResultData: {}
                     };
                } else {
                    throw new ReferenceError(`Error in the asignment of pointId for test case ${testCase}`);
                }
            } catch (error) {
                throw new TypeError(`Error fetching data for test case ${testCase}: ${error}`);
            }
        }  
    }

    /**
     * Send the attach files request to the given test result.
     * @param url 
     * @param attachmentsPath
     */
    private async sendTestResultAttachments(testCaseId: string, attachmentsPath: string){
        const attachments = await this.convertAttachmentsToBase64(testCaseId, attachmentsPath);
        const url = `${this.azureBaseUrl}/test/Runs/${this.runId}/Results/${this.testCasesInfo[testCaseId].testResultData?.id}/attachments?api-version=7.1-preview.1`
        for await (const attachment of attachments) {
            await apiRequest(url, {
                method: 'POST',
                headers: this.headers,
                body: attachment
            });
        }
    }

    /**
     * Send the attach files request to the test run.
     * @param url 
     * @param attachments 
     */
    private async sendTestRunAttachments(){
        const url = `${this.azureBaseUrl}/test/Runs/${this.runId}/attachments?api-version=7.1-preview.1`
        for await (const attachment of this.runAttatchments) {
            await apiRequest(url, {
                method: 'POST',
                headers: this.headers,
                body: attachment
            });
        }
    }

    /**
     * Convert Test to Action Path.
     * @param testStep 
     * @returns 
     */
    private testStepToActionPath(testStep: number){
        let actionPath = 1 + testStep;    
        let newActionPath = actionPath.toString();
        while (newActionPath.length < 8) {
            newActionPath = '0' + newActionPath;
        }  
        return newActionPath;
    }

    /**
     * Update the test case Work Item to state Ready and reason Completed if the test result is passed
     * @param testCaseId 
     * @param outcome 
     */
    private async updateTestCaseBacklogStatus(testCaseId: string, outcome: string){
        const url = `${this.azureBaseUrl}/wit/workitems/${testCaseId}?api-version=7.1-preview.3`
        let state: string = "Design";
        let history: string = "Playwright automation failed for this test case";
        if (outcome === 'passed'){
            state = "Ready";
            history = "Playwright automation execution finished succesfully";
        }
        const headers = {
            'Content-Type': 'application/json-patch+json',
            Authorization: this.pat
        };
        await apiRequest(url, {
            method: 'PATCH',
            headers: headers,
            body: [
                {
                    "op": "replace",
                    "path": "/fields/System.State",
                    "value": state
                },
                {
                    "op": "add",
                    "path": "/fields/System.History",
                    "value": history
                }
            ]
        });
    }
    
    /**
     * Update Test Result:
     * This API will allow us to update the test outcome for a test case. The valid values for the Test Outcome are: 
     * Unspecified, None, Passed, Failed, Inconclusive, Timeout, Aborted, Blocked, NotExecuted, Warning, Error, NotApplicable, Paused, InProgress, NotImpacted. 
     * In common scenarios we will only be using “Passed”, “Failed” or “Blocked”. 
     * This API will use the Run created in the previous API and will update the test result based on the input parameters. 
     * The input parameters (Request body) will contain a key as “outcome” which should be updated based on the test result.
     * Update the test case result in Azure DevOps including the iteration and test steps.
     * @param testCaseId 
     * @param outcome 
     */
    async updateTestCaseResult(testCaseId: string, outcome: string, path: string){
        const testCaseResultData = this.getTestCaseResultData(testCaseId);
        const iterationDetail = this.getIterationDetail(testCaseId);
        testCaseResultData.state = "Completed";
        testCaseResultData.outcome = outcome;
        iterationDetail[0].outcome = outcome;
        const url = `${this.azureBaseUrl}/test/Runs/${this.runId}/results?api-version=7.1-preview.6`;
        await apiRequest(url, {
            method: 'PATCH',
            headers: this.headers,
            body: [testCaseResultData]
        });
        await this.sendTestResultAttachments(testCaseId, path)
        await this.updateTestCaseBacklogStatus(testCaseId, outcome);
    }

    /**
     * Update the test step outcome.
     * @param testCaseId 
     * @param testStep 
     * @param outcome 
     */
    updateTestStepResult(testCaseId: string, testStep: number, outcome: string){
        const actionPath = this.testStepToActionPath(testStep);
        const iterationDetail = this.getIterationDetail(testCaseId)[0];
        if (!iterationDetail) {
            throw new ReferenceError(`Action result with actionPath ${actionPath} not found.`);
        }
        let actionResults: ActionResult = { 
            actionPath: actionPath,
            iterationId: iterationDetail.id,
            stepIdentifier: String(testStep),
            outcome: outcome,
            startedDate: iterationDetail.startedDate,
            completedDate: iterationDetail.completedDate  
        };
        iterationDetail.actionResults?.push(actionResults)
    }

    /**
     * Update the test run state in Azure DevOps to "Completed".
     */
    async updateTestRunResult(){
        const url = `${this.azureBaseUrl}/test/runs/${this.runId}?api-version=7.1-preview.3`
        await apiRequest(url, {
            method: 'Patch',
            headers: this.headers,
            body: {
                "state": "Completed", //NotStarted, InProgress, Completed, Aborted, Waiting
                "comment": "Playwright automation finished"
            }
        })
        await this.sendTestRunAttachments()
    }
}