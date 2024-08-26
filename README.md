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

```typescript
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendConstruct } from "./construct/backend";
import { FrontendConstruct } from "./construct/frontend";
import { CustomUserPool } from "./construct/authenticate";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Repository } from "./construct/repository";

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito UserPool 생성
    const cognitoUserPool = new CustomUserPool(this, "StoneiUserPool", {
      userPoolName: "admin-user-pool",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cdk.aws_cognito.Mfa.OPTIONAL,
    });

    const repository = new Repository(this, "kanbanRepository");

    const lambdaConstruct = new BackendConstruct(this, "lambda", {
      userPool: cognitoUserPool.userPool,
      table: repository.table,
    });

    const amplifyL3 = new FrontendConstruct(this, "stonei-amplify", {
      repositoryName: "stonei-frontend",
      branchName: "main",
      apiUrl: lambdaConstruct.apiUrl,
      userPoolId: cognitoUserPool.userPool.userPoolId,
      userPoolWebClient: cognitoUserPool.userPoolClient.userPoolClientId,
    });

    // 출력
    new cdk.CfnOutput(this, "AmplifyAppId", {
      value: amplifyL3.appId,
      description: "Amplify App ID",
    });

    new cdk.CfnOutput(this, "CodeCommitRepoUrl", {
      value: amplifyL3.repoUrl,
      description: "CodeCommit Repository URL",
    });

    new cdk.CfnOutput(this, "LambdaApiUrl", {
      value: lambdaConstruct.apiUrl,
      description: "Lambda API URL",
    });
  }
}
```
AWS Cognito를 만드는 CustomUserpool, Amazon Dynamodb 를 생성하는 Repository 이 두개는 별도의 dependency가 없이 리소스를 생성하게 됩니다. 

이후 Backend를 구성할 때에는 앞에서 생성한 인증에 대한 리소스와 데이터 저장을 위한 리소스를 파라미터로 받아 벡엔드를 구성하게 됩니다. 

Frontend의 경우는 