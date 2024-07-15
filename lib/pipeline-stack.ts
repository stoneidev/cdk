import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import { ApplicationStage } from "./stage/application-stage";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CodeCommit 리포지토리 생성
    const repo = new codecommit.Repository(this, "AmplifyRepo", {
      repositoryName: "amplify-stonei-repo",
      description: "CodeCommit repository for Amplify CDK project",
    });

    // 파이프라인 생성
    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.codeCommit(repo, "main"),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // 스테이징 환경에 AmplifyStack 배포
    const stagingStage = pipeline.addStage(
      new ApplicationStage(this, "Staging", {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );

    // 선택적: 프로덕션 환경에 AmplifyStack 배포
    // const prodStage = pipeline.addStage(new ApplicationStage(this, 'Production', {
    //   env: { account: 'PROD_ACCOUNT_ID', region: 'PROD_REGION' }
    // }));
  }
}
