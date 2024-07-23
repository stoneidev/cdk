import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendConstruct } from "./construct/backend";
import { FrontendConstruct } from "./construct/frontend";
import { CustomUserPool } from "./construct/authenticate";
import * as cognito from "aws-cdk-lib/aws-cognito";

export class ServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito UserPool 생성
    const cognitoUserPool = new CustomUserPool(this, "StoneiUserPool", {
      userPoolName: "stonei-user-pool",
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

    const lambdaConstruct = new BackendConstruct(this, "lambda", {
      userPool: cognitoUserPool.userPool,
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
