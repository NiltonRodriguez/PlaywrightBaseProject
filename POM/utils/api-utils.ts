import { APIRequestContext, APIResponse } from "@playwright/test";

/**
 * Check if the status code is 2xx otherwise throw an exeption with the status code and the descrition.
 * @param response 
 */
async function checkStatusCode(response: APIResponse) {
    const receivedStatus = response.status()
    if(!response.ok()){
        throw new Error(`API request failed. Status Code: ${receivedStatus} Response: ${await response.text()}`)
    }
    console.log(`HTTP Status: ${receivedStatus}`)
}

/**
 * **Description**
 * 
 * Sends HTTP(S) DELETE request, check if the response is OK and returns its response.
 * 
 * 
 * @param context 
 * @param resource 
 * @param options 
 * @returns 
 */
export async function doDelete(context:APIRequestContext, resource: string, options?: {headers? , form?, data?}) {
    const response = await context.delete(resource,  {headers: options?.headers, form: options?.form, data: options?.data});
    checkStatusCode(response);
    return response;
}

/**
 * **Description**
 * 
 * Sends HTTP(S) GET request, check if the response is OK and returns its response.
 * 
 * **Usage**
 * 
 * JSON objects can be passed directly to the request options:
 * 
 * ```js
 * await doGet(apiRequestContext, 'https://example.com/api/createBook', {
 *   data: {
 *     isbn: '1234',
 *     page: 23,
 *   }
 * });
 * ```
 * 
 * @param context
 * @param resource
 * @param options
 * @returns Promise APIResponse 
 */
export async function doGet(context:APIRequestContext, resource: string, options?: {headers? , form?, data?}) {
    const response = await context.get(resource, {headers: options?.headers, form: options?.form, data: options?.data});
    checkStatusCode(response);
    return response;
};

/**
 * **Description**
 * 
 * Sends HTTP(S) PATCH request, check if the response is OK and returns its response.
 * 
 * 
 * @param context 
 * @param resource 
 * @param options 
 * @returns 
 */
export async function doPatch(context:APIRequestContext, resource: string, options?: {headers? , form?, data?}) {
    const response = await context.patch(resource,  {headers: options?.headers, form: options?.form, data: options?.data});
    checkStatusCode(response);
    return response;
}

/**
 * **Description**
 * 
 * Sends HTTP(S) POST request, check if the response is OK and returns its response.
 * 
 * **Usage**
 * 
 * JSON objects can be passed directly to the request options:
 * 
 * ```js
 * await doPost(apiRequestContext, 'https://example.com/api/createBook', {
 *   data: {
 *     title: 'Book Title',
 *     author: 'John Doe',
 *   }
 * });
 * ```
 * 
 * @param context 
 * @param resource 
 * @param options 
 * @returns 
 */
export async function doPost(context:APIRequestContext, resource: string, options?: {headers? , form?, data?}) {
    const response = await context.post(resource,  {headers: options?.headers, form: options?.form, data: options?.data});
    checkStatusCode(response);
    return response;
}

/**
 * **Description**
 * 
 * Sends HTTP(S) PUT request, check if the response is OK and returns its response.
 * 
 * 
 * @param context 
 * @param resource 
 * @param options 
 * @returns 
 */
export async function doPut(context:APIRequestContext, resource: string, options?: {headers? , form?, data?}) {
    const response = await context.put(resource,  {headers: options?.headers, form: options?.form, data: options?.data});
    checkStatusCode(response);
    return response;
}
