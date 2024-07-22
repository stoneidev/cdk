import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ServerlessStack } from "../serverless-stack";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new ServerlessStack(this, "ServerlessStack", props);
  }
}
