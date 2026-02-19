
# 🚀 DynamoDB Stream Audit Logger

> A production-style, serverless audit logging system built using AWS Lambda, DynamoDB Streams, S3, and SQS to capture and process real-time database mutation events with structured diff tracking and time-range query support.

---

## 👩‍💻 Author

**Sahithya Lakku**
B.Tech Computer Science, VIT-AP University (2023–2027)
Former Software Development Engineer Intern at Amazon

* 🔗 GitHub: [https://github.com/sahithya-lakku](https://github.com/sahithya-lakku)
* 💼 LinkedIn: [https://www.linkedin.com/in/sahithya-lakku-023802248/](https://www.linkedin.com/in/sahithya-lakku-023802248/)
* 🧠 LeetCode: [https://leetcode.com/u/sahithya1234/](https://leetcode.com/u/sahithya1234/)

This project reflects hands-on experience with event-driven backend systems and AWS-based distributed architectures.

---

## 📌 Overview

This project implements a **cloud-native audit logging system** that automatically captures `INSERT`, `MODIFY`, and `REMOVE` events from a primary DynamoDB table.

It:

* Processes real-time DynamoDB Stream events
* Computes field-level diffs for MODIFY operations
* Stores structured audit records in a dedicated table
* Uploads full audit payloads to S3
* Emits lightweight notifications to SQS
* Exposes a query API with time-range filtering via DynamoDB GSI

The audit API reads from a DynamoDB GSI (`LogTypeOccurredAtIndex`) so time-range filtering avoids full table scans.

---

## 🏗 Architecture

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

---

## 🎯 Key Features

✅ Real-time audit logging via DynamoDB Streams
✅ INSERT / MODIFY / REMOVE event handling
✅ Field-level diff detection for MODIFY operations
✅ Structured JSON audit events
✅ Dual persistence (DynamoDB + S3)
✅ SQS event fan-out for downstream consumers
✅ Time-range filtering using DynamoDB GSI
✅ Serverless deployment using AWS SAM
✅ Local testing support via LocalStack

---

## 🛠 Tech Stack

* Node.js 20+
* AWS Lambda
* DynamoDB + Streams
* S3
* SQS
* API Gateway
* AWS SAM
* LocalStack (for local development)

---

## 📁 Project Structure

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

---

## ⚙️ Setup

### Prerequisites

* AWS SAM CLI
* Docker
* Node.js 20+
* AWS credentials configured (`aws configure`)

---

## 📦 Install Dependencies

```bash
npm install
```

---

## 🚀 Deploy with AWS SAM (Cloud)

```bash
sam build
sam deploy --guided
```

Suggested guided inputs:

* Stack Name: `dynamodb-audit-logger`
* Region: your AWS region
* Confirm changes: `Y`
* Allow IAM role creation: `Y`

---

## 🧪 Local Development with LocalStack

### 1️⃣ Start LocalStack

```bash
docker run --rm -it -p 4566:4566 \
  -e SERVICES=dynamodb,s3,sqs,lambda,apigateway \
  localstack/localstack
```

### 2️⃣ Build the app

```bash
sam build
```

### 3️⃣ Invoke Lambda locally

```bash
sam local invoke ProcessStreamLambda -e events/dynamodb-stream-event.json
```

---

## 🔍 Example DynamoDB Stream Events

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
      "status": { "S": "active" }
    },
    "NewImage": {
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

---

## 🌐 API Usage

### Get all audits (default limit 25)

```bash
curl "https://<api-id>.execute-api.<region>.amazonaws.com/Prod/audits"
```

### With limit and date range

```bash
curl "https://<api-id>.execute-api.<region>.amazonaws.com/Prod/audits?limit=50&dateRange=2025-01-01T00:00:00.000Z,2025-12-31T23:59:59.000Z"
```

---

## 📊 Example Audit Record

```json
{
  "auditId": "b13a9d72-5a64",
  "eventType": "MODIFY",
  "occurredAt": "2026-02-19T10:30:00Z",
  "diff": {
    "status": {
      "old": "active",
      "new": "suspended"
    }
  }
}
```

---

## 🧠 Engineering Highlights

* Designed event-driven processing pipeline
* Implemented efficient diff computation logic
* Avoided full table scans via GSI-based time filtering
* Followed serverless infrastructure best practices
* Structured for modular, testable Lambda functions

---

## 🔮 Future Enhancements

* Add pagination tokens instead of scan
* Add authentication (Cognito / JWT)
* Add CloudWatch metrics & alarms
* Add CI/CD with GitHub Actions
* Add OpenSearch analytics integration

---

## 📜 License

MIT License

---

