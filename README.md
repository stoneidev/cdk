# Serverless Admin CDK

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