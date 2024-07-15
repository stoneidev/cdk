import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AmplifyStack } from "../stack/amplify-stack";

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new AmplifyStack(this, "AmplifyStack", props);
  }
}
