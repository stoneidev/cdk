import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AmplifyL3Construct } from "./amplify-l3-construct";
import { LambdaConstruct } from "./lambda-construct";

export class AmplifyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaConstruct = new LambdaConstruct(this, "lambda");

    const amplifyL3 = new AmplifyL3Construct(this, "stonei-amplify", {
      repositoryName: "stonei-frontend",
      branchName: "main",
      apiUrl: lambdaConstruct.apiUrl,
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
