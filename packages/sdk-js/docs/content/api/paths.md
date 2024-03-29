# Paths

## POST /v2/registrations 

> Register a device for notifications with APNs or FCM.

**Summary**: Register Device

**Security**: 
[Jwt-Consumer](/content/api/components?id=securityJwt-Consumer)
#### Query Parameters

| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| preserve | <code>String</code> | false | false | When "true" any existing registrations for the same device/bundle (or token/package) will be preserved. Otherwise, registrations for the same device/bundle (or token/package) will be overwritten. This allows for a case when multiple users are simultaneously logged into an app (e.g. a messaging app might allow multiple accounts simultaneously). |

#### Request Body
**One of:**

- [ApnsRegistration](/content/api/components?id=schemasapnsregistration)

- [FcmRegistration](/content/api/components?id=schemasfcmregistration)


#### Responses

**Status Code**: 200

> Device has been registered.

**One of:**

- [ApnsRegistration](/content/api/components?id=schemasapnsregistration)

- [FcmRegistration](/content/api/components?id=schemasfcmregistration)


* * *

**Status Code**: 400 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 403 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 500 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

## DELETE /v2/registrations 

> Deletes registrations for a device.

**Summary**: Unregister Device

**Security**: 
[Jwt-Consumer](/content/api/components?id=securityJwt-Consumer)
#### Request Body
**One of:**

- [ApnsRegistration](/content/api/components?id=schemasapnsregistration)

- [FcmRegistration](/content/api/components?id=schemasfcmregistration)

- [UnregisterRequest](/content/api/components?id=schemasunregisterrequest)


#### Responses

**Status Code**: 200

> Device has been unregistered.

**Content Type**: <code>application/json</code>

**Response Type:** <code>Object</code>
    
| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| message | <code>String</code> | false | false |  |

**Example**:

```json
{
  "message": "successfully"
}
```

* * *

**Status Code**: 400 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 403 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 500 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

## POST /v2/send 

> Starts a job to transmit push notification(s) via APNs and/or FCM.

**Summary**: Send push notification(s)

**Security**: 
[Jwt-Admin](/content/api/components?id=securityJwt-Admin)
#### Request Body
**One of:**

- [NotificationForUser](/content/api/components?id=schemasnotificationforuser)

- [NotificationForDevice](/content/api/components?id=schemasnotificationfordevice)

- [NotificationForBundle](/content/api/components?id=schemasnotificationforbundle)


#### Responses

**Status Code**: 200

> The notification has been scheduled for transmission.

**Content Type**: <code>application/json</code>

**Response Type:** <code>Object</code>
    
| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| id | <code>String</code> | false | false | The identifier of the job responsible for sending the push notification. |

**Example**:

```json
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08"
}
```

* * *

**Status Code**: 400 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 403 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 500 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

## GET /v2/job/{id} 

> Retrieves status of a job to send notification(s).

**Summary**: Retrieves status of a job to send notification(s).

**Security**: 
[Jwt-Admin](/content/api/components?id=securityJwt-Admin)
#### Path Parameters

| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| id | <code>String</code> | true | false | The identifier of the job to query. |

#### Responses

**Status Code**: 200

> An object with job information.

**Content Type**: <code>application/json</code>

**Response Type:** [<code>JobInfo</code>](/content/api/components?id=schemasJobInfo)

**Example**:

```
{
  "id": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
  "status": "string",
  "request": "string",
  "scan": {
    "last": "string"
  },
  "system": {
    "created": 0,
    "updated": 0,
    "finished": 0
  }
}
```

* * *

**Status Code**: 404 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

**Status Code**: 500 - [ErrorResponse](/content/api/components?id=responseserrorresponse)

* * *

## GET /v2/service/read 

> Retrieves the version of the Barchart Push Notification Service and other metadata.

**Summary**: Retrieves metadata regarding the Barchart Push Notification Service.

#### Responses

**Status Code**: 200

> Version of the Barchart Push Notification Service and other metadata.

**Content Type**: <code>application/json</code>

**Response Type:** <code>Object</code>
    
| Name | Type | Required | Nullable | Description |
| ---- | ---- | -------- | -------- | ----------- |
| service | <code>Object</code> | false | false |  |
| service.name | <code>String</code> | false | false | The name of the remote service. |
| service.environment | <code>String</code> | false | false | The name of the enviroment (e.g. stage or prod). |
| service.version | <code>String</code> | false | false | The version of the remote service. |
| service.description | <code>String</code> | false | false | A description of the remote service. |

**Example**:

```json
{
  "service": {
    "name": "serverless-push-gateway",
    "environment": "prod",
    "version": "v2.3.0",
    "description": "Barchart Push Notification Service"
  }
}
```

* * *

