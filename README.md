# dynamodb-audit-logger

A serverless DynamoDB Stream audit logging system that captures `INSERT`, `MODIFY`, and `REMOVE` events from a primary DynamoDB table, stores structured audit records in a dedicated audit table, uploads full event JSON to S3, and emits lightweight notifications to SQS.

The audit API reads from a DynamoDB GSI (`LogTypeOccurredAtIndex`) so time-range filtering avoids full table scans.

## Architecture

```text
+------------------+          DynamoDB Streams         +------------------------+
|    MainTable     | --------------------------------> |   ProcessStreamLambda  |
| (business data)  |                                   |  (stream processor)    |
+------------------+                                   +-----------+------------+
                                                                    |
                                     +------------------------------+------------------------------+
                                     |                              |                              |
                                     v                              v                              v
                           +------------------+            +------------------+           +------------------+
                           |  AuditLogsTable  |            |    S3 Bucket     |           |    AuditQueue    |
                           | (queryable logs) |            | (raw JSON audit) |           | (event fan-out)  |
                           +------------------+            +------------------+           +------------------+
                                                                    |
                                                                    v
                                                         +----------------------+
                                                         |   GetAuditLogsLambda |
                                                         |    API GET /audits   |
                                                         +----------+-----------+
                                                                    |
                                                                    v
                                                           +------------------+
                                                           | API Gateway      |
                                                           +------------------+
```

## Project structure

```text
.
├── template.yml
├── package.json
├── src
│   ├── handlers
│   │   ├── processStream.js
│   │   └── getAudits.js
│   ├── libs
│   │   └── auditLogic.js
│   └── utils
│       ├── db.js
│       └── s3.js
└── tests
    ├── auditLogic.test.js
    └── handlers.test.js
```

## Setup

### Prerequisites

- AWS SAM CLI
- Docker (for LocalStack)
- Node.js 20+
- AWS credentials configured (`aws configure`) for cloud deployment

### Install dependencies

```bash
npm install
```

## Deploy with AWS SAM

```bash
sam build
sam deploy --guided
```

Suggested `--guided` values:
- Stack Name: `dynamodb-audit-logger`
- AWS Region: your target region
- Confirm changes before deploy: `Y`
- Allow SAM IAM role creation: `Y`

## Local development with LocalStack

1. Start LocalStack:

```bash
docker run --rm -it -p 4566:4566 -e SERVICES=dynamodb,s3,sqs,lambda,apigateway localstack/localstack
```

2. Build SAM app:

```bash
sam build
```

3. Invoke Lambda locally (sample):

```bash
sam local invoke ProcessStreamLambda -e events/dynamodb-stream-event.json
```

## Example DynamoDB Stream payloads

### INSERT

```json
{
  "eventName": "INSERT",
  "dynamodb": {
    "Keys": { "pk": { "S": "USER#1" } },
    "NewImage": {
      "pk": { "S": "USER#1" },
      "name": { "S": "Ada" },
      "status": { "S": "active" }
    }
  }
}
```

### MODIFY

```json
{
  "eventName": "MODIFY",
  "dynamodb": {
    "Keys": { "pk": { "S": "USER#1" } },
    "OldImage": {
      "pk": { "S": "USER#1" },
      "status": { "S": "active" }
    },
    "NewImage": {
      "pk": { "S": "USER#1" },
      "status": { "S": "suspended" }
    }
  }
}
```

### REMOVE

```json
{
  "eventName": "REMOVE",
  "dynamodb": {
    "Keys": { "pk": { "S": "USER#1" } },
    "OldImage": {
      "pk": { "S": "USER#1" },
      "name": { "S": "Ada" }
    }
  }
}
```

## API usage

Get all audits (default limit 25):

```bash
curl "https://<api-id>.execute-api.<region>.amazonaws.com/Prod/audits"
```

Get with limit and date range (`from,to` in ISO format):

```bash
curl "https://<api-id>.execute-api.<region>.amazonaws.com/Prod/audits?limit=50&dateRange=2025-01-01T00:00:00.000Z,2025-12-31T23:59:59.000Z"
```
