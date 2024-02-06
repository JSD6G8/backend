# LogLife APIs

## Overview

APIs for accessing database of LogLife web application.

Access via <https://jsd6-loglife-backend.onrender.com>

## API Endpoints

| HTTP Verbs | Endpoints                | Action                                    |
| ---------- | ------------------------ | ----------------------------------------- |
| **GET**    | /activities/user/:userId | To **retrieve all activities** of a user  |
| **GET**    | /activities/:activityId  | To **retrieve each activity** information |
| **POST**   | /activities              | To create a new activity                  |
| **PUT**    | /activities/:activityId  | To edit information on each activity      |
| **DELETE** | /activities/:activityId  | To delete a single activity               |

## Query Parameters

for `GET` on `/activities/user/:userId`

| Query Params | Value                                                     | Action                                                        |
| ------------ | --------------------------------------------------------- | ------------------------------------------------------------- |
| **?type**    | `null`                                                    | To retrieve activities **from all types**                     |
|              | `Running`, `Cycling`, `Swimming`, `Walking`, `Hiking`, `Other` | To retrieve activities **from each type**                     |
| **?sort**    | `null`   / `date-desc`                                                  | To retrieve all activities **descending by date + startTime** |
|              | `date-asc`                                                | To retrieve all activities **ascending by date + startTime** |
| **?skip**    | `null`                                                    | To skip 0 entry
|              | *number*                                                  | To skip *[number]* of entries                                      |
| **?take**    | `null`                                                    | To take *20* entries                          |
|              | *number*                                                  | To take *[number]* of entries                          |

## Request Body

for `POST` and `PUT` endpoints

```
{
  "userId": string
  "title": string,
  "description": string,
  "type": string,
  "startTime": string,
  "endTime": string,
  "date": string,
  "duration": {
    "hour": number,
    "minute": number
  },
  "barometer": string
}
```

## Response Body

### GET
>
> #### All Activities
>
> ```
> [
>  {
>    "activityId": string,
>    "userId": string
>    "title": string,
>    "description": string,
>    "type": string,
>    "startTime": string,
>    "endTime": string,
>    "date": string,
>    "duration": {
>      "hour": number,
>      "minute": number
>    },
>    "barometer": string
> },
>  {
>    ...
>  }
>]
>```

> #### Single Activity
>
> ```
>  {
>    "activityId": string,
>    "userId": string
>    "title": string,
>    "description": string,
>    "type": string,
>    "startTime": string,
>    "endTime": string,
>    "date": string,
>    "duration": {
>      "hour": number,
>      "minute": number
>    },
>    "barometer": string
> }
>```
>
### POST
>
>```
>{
>  "result": {
>    "acknowledged": boolean,
>    "insertedId": string
>  }
>}
>```

### PUT
>
>```
>{
>"result": {
>    "acknowledged": boolean,
>    "modifiedCount": int,
>    "upsertedId": string | null,
>    "upsertedCount": int,
>    "matchedCount": int
>  }
>}
>```
>
### DELETE
>
>```
>{
>  "result": {
>    "acknowledged": boolean,
>    "deletedCount": int
>  }
>}
>```

## Response Code

| HTML Code | Explaination | Included Message |
|------|-------|------|
| **200** | OK | *Response body* |
|**201** | Entry Created | *Response body* |
| **400** | Entries Not Found | `Invalid userId`, `Invalid activityId`, *Missing field details* |
| **500** | Internal Error | Backend error message(s)
