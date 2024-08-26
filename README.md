# Serverless Admin CDK

## Prerequisite

AWS Cli는 사전에 설치하도록 합니다. 이를 이용하여 SSO를 구성한 경우에는 아래와 같이 명령어를 입력하여 Profile을 설정하도록 합니다.

```bash
> aws configure sso
SSO start URL [None]: [None]: https://my-sso-portal.awsapps.com/start
SSO region [None]:us-east-1

CLI default client Region [None]: us-west-2<ENTER>
CLI default output format [None]: json<ENTER>
CLI profile name [123456789011_ReadOnly]: my-dev-profile<ENTER>

# Profile 생성을 확인합니다.
> cat ~/.aws/config
[profile my-dev-profile]
sso_start_url = https://my-sso-portal.awsapps.com/start
sso_region = us-east-1
sso_account_id = 123456789011
sso_role_name = readOnly
region = us-west-2
output = json
```

## Install

```bash
# 소스 Clone
> git clone https://github.com/stoneidev/cdk.git

> cd cdk

# Package 설치
> npm i 

# CDK 배포
> cdk bootstrap
> cdk deploy
```

## Folder Structure

```bash
.
├── README.md
├── bin
│   └── serverless.ts
├── cdk.json
├── jest.config.js
├── lib
│   ├── construct
│   │   ├── authenticate.ts
│   │   ├── backend.ts
│   │   ├── frontend.ts
│   │   └── repository.ts
│   ├── pipeline
│   │   ├── application-stage.ts
│   │   └── pipeline-stack.ts
│   └── serverless-stack.ts
├── package-lock.json
├── package.json
├── src
│   ├── cognito
│   │   └── index.js
│   ├── frontend
│   ├── lambda
│   │   ├── kanban.js
│   │   ├── public.js
│   │   └── serverless.js
│   └── layer
│       ├── layer.zip
│       └── nodejs
├── test
│   └── serverless.test.ts
└── tsconfig.json
```

- lib/construct/* 밑에는 Stack을 구성할 수 있는 생성자들을 모아놓았습니다. 현재는 4개의 파일로 구성되어 있습니다.
  - authenticate.ts : AWS Cognito를 비롯하여 인증에 관련한 소스들이 작성되어 있습니다.
  - backend.ts : Amazon API Gateway, AWS Lambda를 비롯하여 Backend를 만들 수 있는 소스들이 작성되어 있습니다.
  - frontend.ts : AWS Amplify를 이용한 Frontend 소스들이 작성되어 있습니다. 특히 nextjs를 지원하도록 설정이 되어 있습니다.
  - repository.ts : 추후에 Amazon Dynamodb를 사용할 수 있도록 저장소에 관련된 소스들이 작성되어 있습니다.
- lib/pipeline/* : CDK로 작성된 인프라 소스에 대한 CI/CD Pipeline을 구성하고 소스가 변경이 되면 해당 소스가 자동적으로 배포되도록 구성하는 소스들이 들어 있습니다.
  - pipeline-stack.ts : Github을 소스로 한 빌드 파이프 라인을 구성합니다.
  - application-stage.ts : CICD Pipeline 중에 실제 Stack에 대한 배포를 수행하는 Stage를 구성합니다.
- lib/serverless-stack.ts : L3 Construct(lib/construct/*)를 이용하여 우리가 배포할 Stack을 구성합니다. 이는 이후에 application-stage.ts에서 수행되어 Stack을 배포합니다.

- src/* : 실제 Backend를 구성하는 비즈니스 소스 및 설정 소스들을 포합니다.
  - src/cognito/index.js : AWS Cognito에서 Sign Up 수행시 간단한 절차를 수행할 수 있도록 비밀번호 설정시 자동으로 confirm 하게 합니다.
  - src/lambda/kanban.js : 칸반 그래프를 그리는 Backend 로직을 구성합니다.
  - src/lambda/public.js : "Say Hello" 모든 사람에게 public에게 보여지는 소스를 작성합니다.
  - src/lambda/serverless.js : Sale 그래프를 그리는 소스를 반환합니다. 그래프를 그리는 Random 값을 반환합니다.
  - src/lambda/layer/* : 람다가 사용한 Third Party Library에 대한 Package가 포함되어 있습니다.
- test/serverless.test.ts : 인프라에 대한 테스트 파일이 작성되어 있습니다.

## Serverless Stack

### Backend

```typescript
    // Lambda 레이어 생성
    const lambdaLayer = new lambda.LayerVersion(this, "AWSSDK-Layer", {
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "src", "layer", "layer.zip")
      ),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: "A layer for using AWS SDK in  Lambda function",
    });

    // Lambda 함수 생성
    const salesLambda = new lambda.Function(this, "SalesLambda", {
      functionName: "SalesLambda",
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "..", "..", "src", "lambda")
      ),
      handler: "serverless.handler",
      layers: [lambdaLayer],
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_119_0, // Lambda Insights 활성화
      memorySize: 512,
    });

    salesLambda.addToRolePolicy(insightsPolicy);
```

설명해야 하는 부분만 설명하자면 AWS SDK를 사용하기 위해서는 위와 같이 Layer를 구성하여 Lambda에 입력하도록 합니다. 그리고 Handler를 위와 같이 해준다면 ../../src/lambda/serverless.js의 handler method를 이벤트를 수신하면 실행하게 됩니다. 또한 insightVersion 을 위와 같이 입력하면 추가적인 모니터링을 위한 insight가 설정됩니다.

```typescript
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [props.userPool],
      }
    );

    const salesResource = api.root.addResource("sales");
    salesResource.addMethod("GET", salesIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const publicResource = api.root.addResource("public");
    publicResource.addMethod("GET", publicIntegration);
```

그리고 위와 같이 인증이 필요한 경우는 위와 같이 authorizer 를 설정하여 인증을 수행하도록 합니다. 하지만 만들다 보면 모든 사람들에게 오픈되어야 하는 API가 필요합니다. 이런 경우는 위의 publicResource 와 같이 설정하도록 합니다. API에 대한 인증은 Backend에서 처리하지 않고 API Gateway에서 처리하도록 합니다.

```javascript
const AWS = require("aws-sdk");

exports.handler = async function (event, context) {

  // CORS 헤더 설정
  const headers = {
    "Access-Control-Allow-Origin": "*", // 또는 특정 도메인
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: headers,
      body: "",
    };
  }

  // 실제 요청 처리
  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sales: {
        eanings: Array.from(
          { length: 8 },
          () => Math.floor(Math.random() * (500 - 150 + 1)) + 150
        ),
        expense: Array.from(
          { length: 8 },
          () => Math.floor(Math.random() * (500 - 150 + 1)) + 150
        ),
      },
    }),
  };
};

```

CORS 설정을 위한 Header를 설정하도록 합니다.

exports.handler = async function (event, context)의 구문은 이벤트를 수신할 경우 해당 메소드가 이를 처리한다는 의미입니다. 이후 return에서 Frontend를 위한 데이터를 만들어줍니다.

### Frontend

```typescript
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";

export interface AmplifyL3Props {
  repositoryName: string;
  branchName: string;
  apiUrl: string;
  userPoolId: string;
  userPoolWebClient: string;
}

export class FrontendConstruct extends Construct {
  public readonly appId: string;
  public readonly repoUrl: string;

  constructor(scope: Construct, id: string, props: AmplifyL3Props) {
    super(scope, id);

    // Create an IAM Role that gives Amplify permission to pull
    const amplifyRole = new iam.Role(this, "AmplifyRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      inlinePolicies: {
        CodeCommit: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["codecommit:GitPull"],
              effect: iam.Effect.ALLOW,
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    // Amplify 앱 생성
    const amplifyApp = new amplify.CfnApp(this, "AmplifyL3App", {
      name: "stonei-web",
      accessToken: cdk.SecretValue.secretsManager("GithubToken").unsafeUnwrap(),
      repository: "https://github.com/stoneidev/serverless-admin",
      platform: "WEB_COMPUTE",
      iamServiceRole: amplifyRole.roleArn,
      environmentVariables: [
        {
          name: "NEXT_PUBLIC_API_GW_URL",
          value: props.apiUrl,
        },
        {
          name: "NEXT_PUBLIC_USER_POOL_ID",
          value: props.userPoolId,
        },
        {
          name: "NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID",
          value: props.userPoolWebClient,
        },
        {
          name: "NEXT_PUBLIC_REGION",
          value: "ap-northeast-2",
        },
        {
          name: "NEXT_PUBLIC_AUTHENTICATION_FLOW_TYPE",
          value: "USER_SRP_AUTH",
        },
      ],
      buildSpec: cdk.Fn.sub(`
        version: 1.0
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
                - env | grep -e NEXT_PUBLIC_ >> .env.production
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
                `),
    });

    // 브랜치 추가
    const mainBranch = new amplify.CfnBranch(this, "MainBranch", {
      appId: amplifyApp.attrAppId,
      branchName: props.branchName,
      stage: "PRODUCTION",
    });

    this.appId = amplifyApp.attrAppId;
    this.repoUrl = "https://github.com/stoneidev/serverless-admin";
  }
}
```

AWS Cognito를 만드는 CustomUserpool, Amazon Dynamodb 를 생성하는 Repository 이 두개는 별도의 dependency가 없이 리소스를 생성하게 됩니다.

이후 Backend를 구성할 때에는 앞에서 생성한 인증에 대한 리소스와 데이터 저장을 위한 리소스를 파라미터로 받아 벡엔드를 구성하게 됩니다.

Frontend의 경우는 주로 Amplify 리소스를 구성하게 됩니다. 위 소스를 간다하게 본다면 입력 받은, API Gateway, User Pool ID등을 입력 받아 Frontend를 구성하게 됩니다. 환경변수를 주입을 받고 해당 환경 변수를 .env.production에 넣어 주어 nextjs는 이를 가지고 기동하게 됩니다.

React(nextjs) 소스에 대해서는 여기서는 별도로 설명하지 않습니다.

## TODO

- .env/config 등을 이용한 Resoruce Name / Tag 구성
- Lambda Power Tool 을 이용한 모니터링/로깅/성능 튜닝(https://docs.powertools.aws.dev/lambda/typescript/latest/)
- Node.js Pattern 적용
- AWS Cognito 인증에 대해서는 일부 이중인증을 예제를 위해서 풀어놓았습니다.
- Infrastructure에 대한 단위 테스트 적용
- React(nextjs)에 대해서는 학습이 필요합니다.
