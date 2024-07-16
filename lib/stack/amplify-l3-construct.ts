import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as amplify from "aws-cdk-lib/aws-amplify";
import * as iam from "aws-cdk-lib/aws-iam";
import * as codecommit from "aws-cdk-lib/aws-codecommit";

export interface AmplifyL3Props {
  repositoryName: string;
  branchName: string;
  apiUrl: string;
}

export class AmplifyL3Construct extends Construct {
  public readonly appId: string;
  public readonly repoUrl: string;

  constructor(scope: Construct, id: string, props: AmplifyL3Props) {
    super(scope, id);

    // CodeCommit 리포지토리 생성
    const repo = new codecommit.Repository(this, "AmplifyRepo", {
      repositoryName: props.repositoryName,
      description: "CodeCommit repository for Amplify app",
    });

    // Create an IAM Role that gives Amplify permission to pull from CodeCommit
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
      repository: repo.repositoryCloneUrlHttp,
      platform: "WEB_COMPUTE",
      iamServiceRole: amplifyRole.roleArn,
      environmentVariables: [
        {
          name: "API_GW_URL",
          value: props.apiUrl,
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
                - env | grep -e API_GW_URL >> .env.production
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
    });

    this.appId = amplifyApp.attrAppId;
    this.repoUrl = repo.repositoryCloneUrlHttp;
  }
}
