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
import { UserProfileDto, UserProfileDtoFromJSON, UserProfileDtoFromJSONTyped, UserProfileDtoToJSON } from './';

/**
 *
 * @export
 * @interface AuthedSessionDto
 */
export interface AuthedSessionDto {
  /**
   *
   * @type {string}
   * @memberof AuthedSessionDto
   */
  jwtToken: string;
  /**
   *
   * @type {UserProfileDto}
   * @memberof AuthedSessionDto
   */
  user: UserProfileDto;
}

export function AuthedSessionDtoFromJSON(json: any): AuthedSessionDto {
  return AuthedSessionDtoFromJSONTyped(json, false);
}

export function AuthedSessionDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): AuthedSessionDto {
  if (json === undefined || json === null) {
    return json;
  }
  return {
    jwtToken: json['jwtToken'],
    user: UserProfileDtoFromJSON(json['user']),
  };
}

export function AuthedSessionDtoToJSON(value?: AuthedSessionDto | null): any {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return {
    jwtToken: value.jwtToken,
    user: UserProfileDtoToJSON(value.user),
  };
}
