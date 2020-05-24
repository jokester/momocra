/* tslint:disable */
/* eslint-disable */
/**
 * Momocraft Api
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface EmailAuthRequestDto
 */
export interface EmailAuthRequestDto {
    /**
     * 
     * @type {string}
     * @memberof EmailAuthRequestDto
     */
    email: string;
    /**
     * 
     * @type {string}
     * @memberof EmailAuthRequestDto
     */
    password: string;
}

export function EmailAuthRequestDtoFromJSON(json: any): EmailAuthRequestDto {
    return EmailAuthRequestDtoFromJSONTyped(json, false);
}

export function EmailAuthRequestDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): EmailAuthRequestDto {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'email': json['email'],
        'password': json['password'],
    };
}

export function EmailAuthRequestDtoToJSON(value?: EmailAuthRequestDto | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'email': value.email,
        'password': value.password,
    };
}


